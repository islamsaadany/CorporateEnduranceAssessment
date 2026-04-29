/**
 * Seeds the DB with:
 *   - One super admin (credentials from SEED_SUPER_ADMIN_* env vars)
 *   - One Settings singleton (provider=gemini, no API key — bootstrap banner will show)
 *   - One sample assessment ("Acme Corp") with 2 departments and 5 respondents
 *     · 3 of the 5 have submitted full answers, so the ≥3-respondent guardrail is satisfied
 *     · 1 has started but not submitted (in-progress state)
 *     · 1 has not yet started (fresh code)
 *
 * Run with: `npm run seed`
 *
 * NOTE: this seed uses placeholder question IDs ("1a"..."15b"). The locked
 * question content lives in product-spec/02_questions.md and will move to
 * src/data/questions.ts in Phase 4. The seed only needs the IDs to exist.
 */

import { PrismaClient, AdminRole, AssessmentStatus, AiProvider, Level, TenureBand } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// 30 question ids: 1a, 1b, 2a, 2b, ... 15a, 15b
const QUESTION_IDS: string[] = Array.from({ length: 15 }, (_, i) => i + 1).flatMap((n) => [
  `${n}a`,
  `${n}b`,
])

// Code generator: 6 chars from a clear alphabet (no 0/O/1/I/L)
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
function genCode(): string {
  let out = ''
  for (let i = 0; i < 6; i++) out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  return out
}

// Deterministic-ish answer pattern per respondent so the sample data has
// realistic spread without using a seedable RNG dependency.
function answerFor(respondentIndex: number, questionIndex: number): number {
  const base = 2 + ((respondentIndex * 7 + questionIndex * 3) % 4) // 2..5
  return Math.max(1, Math.min(5, base)) as 1 | 2 | 3 | 4 | 5
}

async function main() {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL || 'superadmin@forefront.example'
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD || 'change-me-on-first-login'
  const name = process.env.SEED_SUPER_ADMIN_NAME || 'Super Admin'

  console.log('▶ Seeding super admin…')
  const passwordHash = await bcrypt.hash(password, 10)
  const superAdmin = await prisma.admin.upsert({
    where: { email },
    update: { role: AdminRole.super_admin, isActive: true, name, passwordHash },
    create: { email, name, passwordHash, role: AdminRole.super_admin, isActive: true },
  })
  console.log(`   ✓ super admin: ${superAdmin.email}`)

  console.log('▶ Seeding Settings singleton…')
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton', aiProvider: AiProvider.gemini, promptVersion: 1 },
  })

  console.log('▶ Seeding sample assessment "Acme Corp"…')
  const deadline = new Date()
  deadline.setDate(deadline.getDate() + 14)

  // Idempotent: drop any prior sample assessment for the same client name.
  const prior = await prisma.assessment.findFirst({ where: { clientName: 'Acme Corp (sample)' } })
  if (prior) {
    await prisma.assessment.delete({ where: { id: prior.id } })
  }

  const assessment = await prisma.assessment.create({
    data: {
      clientName: 'Acme Corp (sample)',
      status: AssessmentStatus.collecting,
      deadline,
      createdById: superAdmin.id,
      departments: { create: [{ name: 'Sales' }, { name: 'Engineering' }] },
    },
    include: { departments: true },
  })
  console.log(`   ✓ assessment: ${assessment.id}`)

  const sales = assessment.departments.find((d) => d.name === 'Sales')!
  const eng = assessment.departments.find((d) => d.name === 'Engineering')!

  const respondents = [
    { code: genCode(), department: sales, level: Level.manager, tenure: TenureBand.y4_7, name: 'Avery R.', submit: true },
    { code: genCode(), department: sales, level: Level.senior_leader, tenure: TenureBand.y8_15, name: 'Blake S.', submit: true },
    { code: genCode(), department: eng, level: Level.executive, tenure: TenureBand.gt_15y, name: 'Casey T.', submit: true },
    { code: genCode(), department: eng, level: Level.team_lead, tenure: TenureBand.y1_3, name: 'Drew V.', submit: false },
    { code: genCode(), department: eng, level: Level.individual_contributor, tenure: TenureBand.lt_1y, name: null, submit: false },
  ]

  for (let i = 0; i < respondents.length; i++) {
    const r = respondents[i]
    const created = await prisma.respondent.create({
      data: {
        assessmentId: assessment.id,
        code: r.code,
        name: r.name ?? undefined,
        departmentId: r.department.id,
        level: r.level,
        tenure: r.tenure,
        startedAt: i < 4 ? new Date() : null, // first 4 have started; last is fresh
        submittedAt: r.submit ? new Date() : null,
      },
    })

    if (r.submit) {
      // Full answer set
      await prisma.response.createMany({
        data: QUESTION_IDS.map((qid, qi) => ({
          respondentId: created.id,
          questionId: qid,
          value: answerFor(i, qi),
        })),
      })
    } else if (i === 3) {
      // In-progress: half the answers
      await prisma.response.createMany({
        data: QUESTION_IDS.slice(0, 14).map((qid, qi) => ({
          respondentId: created.id,
          questionId: qid,
          value: answerFor(i, qi),
        })),
      })
    }

    console.log(`   ✓ respondent ${i + 1}/5: code=${r.code} submitted=${r.submit}`)
  }

  console.log('\nDone. Sample super-admin login:')
  console.log(`  email:    ${email}`)
  console.log(`  password: ${password}`)
  console.log('\nReminder: change SEED_SUPER_ADMIN_PASSWORD before running in any shared environment.\n')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

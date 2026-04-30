/**
 * Seeds the DB with:
 *   - One super admin (credentials from SEED_SUPER_ADMIN_* env vars)
 *   - One Settings singleton (provider=gemini, no API key — bootstrap banner will show)
 *   - One sample assessment ("Acme Corp (sample)") with:
 *       · 1 cohort access code (everyone uses the same code)
 *       · 2 departments (Sales, Engineering)
 *       · maxUses = 8 (the cap)
 *       · 5 sample Respondent rows pre-seeded so the report flow has data
 *           - 3 submitted with full answer sets
 *           - 1 in-progress (28 of 30 answers)
 *           - 1 fresh (started, no answers)
 *
 * Run with: `npm run seed`
 *
 * NOTE: this seed uses placeholder question IDs ("1a"..."15b"). The locked
 * question content lives in product-spec/02_questions.md and will move to
 * src/data/questions.ts in Phase 4.
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

// Deterministic-ish answer generator. Returns a 1..4 rating, or null for
// "I don't know". Roughly 1 in 12 answers is "I don't know" so the sample
// data exercises the missing-answer code paths in scoring and reporting.
function answerFor(respondentIndex: number, questionIndex: number): 1 | 2 | 3 | 4 | null {
  const seed = respondentIndex * 7 + questionIndex * 3
  if (seed % 12 === 0) return null
  const base = 1 + (seed % 4) // 1..4
  return base as 1 | 2 | 3 | 4
}

async function uniqueCode() {
  for (let i = 0; i < 10; i++) {
    const candidate = genCode()
    const taken = await prisma.assessment.findUnique({ where: { code: candidate }, select: { id: true } })
    if (!taken) return candidate
  }
  throw new Error('Could not generate a unique cohort code')
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

  console.log('▶ Seeding sample assessment "Acme Corp (sample)"…')
  const deadline = new Date()
  deadline.setDate(deadline.getDate() + 14)

  // Idempotent: drop any prior sample assessment for the same client name.
  const prior = await prisma.assessment.findFirst({ where: { clientName: 'Acme Corp (sample)' } })
  if (prior) {
    await prisma.assessment.delete({ where: { id: prior.id } })
  }

  const cohortCode = await uniqueCode()
  const assessment = await prisma.assessment.create({
    data: {
      clientName: 'Acme Corp (sample)',
      code: cohortCode,
      maxUses: 8,
      status: AssessmentStatus.collecting,
      deadline,
      createdById: superAdmin.id,
      departments: { create: [{ name: 'Sales' }, { name: 'Engineering' }] },
    },
    include: { departments: true },
  })
  console.log(`   ✓ assessment: ${assessment.id}`)
  console.log(`   ✓ cohort access code: ${cohortCode}`)

  const sales = assessment.departments.find((d) => d.name === 'Sales')!
  const eng = assessment.departments.find((d) => d.name === 'Engineering')!

  const respondents = [
    { department: sales, level: Level.manager,                tenure: TenureBand.y4_7,   name: 'Avery R.',  submit: true  },
    { department: sales, level: Level.senior_leader,          tenure: TenureBand.y8_15,  name: 'Blake S.',  submit: true  },
    { department: eng,   level: Level.senior_leader,          tenure: TenureBand.gt_15y, name: 'Casey T.',  submit: true  },
    { department: eng,   level: Level.team_leader,            tenure: TenureBand.y1_3,   name: 'Drew V.',   submit: false },
    { department: eng,   level: Level.individual_contributor, tenure: TenureBand.lt_1y,  name: 'Eli W.',    submit: false },
  ]

  for (let i = 0; i < respondents.length; i++) {
    const r = respondents[i]
    const created = await prisma.respondent.create({
      data: {
        assessmentId: assessment.id,
        name: r.name,
        departmentId: r.department.id,
        level: r.level,
        tenure: r.tenure,
        demographicsCompletedAt: new Date(),
        startedAt: new Date(),
        submittedAt: r.submit ? new Date() : null,
      },
    })

    if (r.submit) {
      // Full answer set — every question answered (rated or "I don't know")
      await prisma.response.createMany({
        data: QUESTION_IDS.map((qid, qi) => ({
          respondentId: created.id,
          questionId: qid,
          value: answerFor(i, qi), // null = I don't know
        })),
      })
    } else if (i === 3) {
      // In-progress: 14 of 30 questions answered
      await prisma.response.createMany({
        data: QUESTION_IDS.slice(0, 14).map((qid, qi) => ({
          respondentId: created.id,
          questionId: qid,
          value: answerFor(i, qi),
        })),
      })
    }

    console.log(`   ✓ respondent ${i + 1}/5 submitted=${r.submit}`)
  }

  console.log('\nDone. Sample super-admin login:')
  console.log(`  email:    ${email}`)
  console.log(`  password: ${password}`)
  console.log(`\nSample cohort access code (share with respondents): ${cohortCode}`)
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

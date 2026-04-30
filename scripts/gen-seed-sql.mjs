// One-off generator: emits a SQL seed file from the same logic as
// prisma/seed.ts, so the user can paste it into Neon's SQL editor when
// they don't have a local Node environment.
//
// Run with: node scripts/gen-seed-sql.mjs > prisma/sql/001_seed_sample_data.sql
//
// Idempotent: the SQL it emits clears any prior "Acme Corp (sample)"
// assessment, then re-inserts. The super admin row uses ON CONFLICT
// (email) DO UPDATE so re-running is safe.

import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'

// --- Inputs (mirroring SEED_SUPER_ADMIN_* env vars in seed.ts) ---
const SUPER_ADMIN_EMAIL = 'superadmin@forefront.example'
const SUPER_ADMIN_PASSWORD = 'change-me-on-first-login'
const SUPER_ADMIN_NAME = 'Super Admin'

// --- Question IDs: 1a, 1b, 2a, 2b, ..., 15a, 15b ---
const QUESTION_IDS = []
for (let n = 1; n <= 15; n++) {
  QUESTION_IDS.push(`${n}a`, `${n}b`)
}

// --- Code generator (no 0/O/1/I/L) ---
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
function genCode() {
  let out = ''
  for (let i = 0; i < 6; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return out
}

// Same answer generator as seed.ts: 1..4 rating, or null for "I don't know".
function answerFor(respondentIndex, questionIndex) {
  const seed = respondentIndex * 7 + questionIndex * 3
  if (seed % 12 === 0) return null
  return 1 + (seed % 4)
}

const sqlEscape = (s) => s.replace(/'/g, "''")

async function main() {
  const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10)
  const adminId = randomUUID()
  const assessmentId = randomUUID()
  const cohortCode = genCode()
  const salesId = randomUUID()
  const engId = randomUUID()

  const respondents = [
    { id: randomUUID(), departmentId: salesId, level: 'manager',                 tenure: 'y4_7',   name: 'Avery R.', submit: true  },
    { id: randomUUID(), departmentId: salesId, level: 'senior_leader',           tenure: 'y8_15',  name: 'Blake S.', submit: true  },
    { id: randomUUID(), departmentId: engId,   level: 'senior_leader',           tenure: 'gt_15y', name: 'Casey T.', submit: true  },
    { id: randomUUID(), departmentId: engId,   level: 'team_leader',             tenure: 'y1_3',   name: 'Drew V.',  submit: false },
    { id: randomUUID(), departmentId: engId,   level: 'individual_contributor',  tenure: 'lt_1y',  name: 'Eli W.',   submit: false },
  ]

  const out = []
  out.push(`-- Seed sample data for The Endurance Assessment (cohort-code model).`)
  out.push(`-- Run AFTER 000_initial_schema.sql.`)
  out.push(`-- Mirrors prisma/seed.ts. Idempotent for the assessment row; ON CONFLICT for the super admin.`)
  out.push(``)
  out.push(`BEGIN;`)
  out.push(``)

  // --- Super admin (idempotent on email) ---
  out.push(`-- Super admin`)
  out.push(`INSERT INTO "Admin" ("id", "email", "passwordHash", "name", "role", "isActive", "createdAt", "updatedAt")`)
  out.push(`VALUES ('${adminId}', '${SUPER_ADMIN_EMAIL}', '${sqlEscape(passwordHash)}', '${SUPER_ADMIN_NAME}', 'super_admin', TRUE, NOW(), NOW())`)
  out.push(`ON CONFLICT ("email") DO UPDATE SET`)
  out.push(`  "role" = 'super_admin',`)
  out.push(`  "isActive" = TRUE,`)
  out.push(`  "name" = EXCLUDED."name",`)
  out.push(`  "passwordHash" = EXCLUDED."passwordHash",`)
  out.push(`  "updatedAt" = NOW();`)
  out.push(``)

  out.push(`-- Capture the super admin's id (newly inserted or pre-existing).`)
  out.push(`CREATE TEMP TABLE _seed_admin AS SELECT "id" FROM "Admin" WHERE "email" = '${SUPER_ADMIN_EMAIL}';`)
  out.push(``)

  // --- Settings singleton ---
  out.push(`-- Settings singleton`)
  out.push(`INSERT INTO "Settings" ("id", "aiProvider", "promptVersion", "updatedAt")`)
  out.push(`VALUES ('singleton', 'gemini', 1, NOW())`)
  out.push(`ON CONFLICT ("id") DO NOTHING;`)
  out.push(``)

  // --- Sample assessment (idempotent by deleting prior sample) ---
  out.push(`-- Sample assessment "Acme Corp (sample)" — delete prior copy if any (cascades to children)`)
  out.push(`DELETE FROM "Assessment" WHERE "clientName" = 'Acme Corp (sample)';`)
  out.push(``)

  out.push(`INSERT INTO "Assessment" ("id", "clientName", "code", "maxUses", "status", "deadline", "createdById", "createdAt", "updatedAt")`)
  out.push(`SELECT '${assessmentId}', 'Acme Corp (sample)', '${cohortCode}', 8, 'collecting', NOW() + INTERVAL '14 days', _seed_admin."id", NOW(), NOW()`)
  out.push(`FROM _seed_admin;`)
  out.push(``)

  out.push(`-- Departments`)
  out.push(`INSERT INTO "Department" ("id", "assessmentId", "name", "createdAt") VALUES`)
  out.push(`  ('${salesId}', '${assessmentId}', 'Sales',       NOW()),`)
  out.push(`  ('${engId}',   '${assessmentId}', 'Engineering', NOW());`)
  out.push(``)

  // --- Respondents ---
  out.push(`-- Respondents (5 sample rows: 3 submitted, 1 in-progress, 1 fresh-no-answers).`)
  out.push(`-- All have demographicsCompletedAt set so they show up in the admin table.`)
  const respondentRows = respondents.map((r) => {
    const submittedAt = r.submit ? 'NOW()' : 'NULL'
    return `  ('${r.id}', '${assessmentId}', '${sqlEscape(r.name)}', '${r.departmentId}', '${r.level}', '${r.tenure}', NOW(), NOW(), ${submittedAt}, NOW(), NOW())`
  })
  out.push(`INSERT INTO "Respondent" ("id", "assessmentId", "name", "departmentId", "level", "tenure", "demographicsCompletedAt", "startedAt", "submittedAt", "createdAt", "updatedAt") VALUES`)
  out.push(respondentRows.join(',\n') + ';')
  out.push(``)

  // --- Responses ---
  out.push(`-- Responses (submitted respondents have all 30; #4 has 14 of 30; #5 has zero).`)
  out.push(`-- value=NULL means "I don't know" (a deliberate non-answer).`)
  const responseRows = []
  respondents.forEach((r, i) => {
    if (r.submit) {
      QUESTION_IDS.forEach((qid, qi) => {
        responseRows.push(`  ('${randomUUID()}', '${r.id}', '${qid}', ${answerFor(i, qi)}, NOW(), NOW())`)
      })
    } else if (i === 3) {
      QUESTION_IDS.slice(0, 14).forEach((qid, qi) => {
        responseRows.push(`  ('${randomUUID()}', '${r.id}', '${qid}', ${answerFor(i, qi)}, NOW(), NOW())`)
      })
    }
  })
  out.push(`INSERT INTO "Response" ("id", "respondentId", "questionId", "value", "createdAt", "updatedAt") VALUES`)
  out.push(responseRows.join(',\n') + ';')
  out.push(``)

  out.push(`COMMIT;`)
  out.push(``)
  out.push(`-- ────────────────────────────────────────────────────────────────`)
  out.push(`-- Done.`)
  out.push(`--`)
  out.push(`-- Sample super admin login:`)
  out.push(`--   email:    ${SUPER_ADMIN_EMAIL}`)
  out.push(`--   password: ${SUPER_ADMIN_PASSWORD}`)
  out.push(`--`)
  out.push(`-- Sample cohort access code (share with respondents): ${cohortCode}`)
  out.push(`-- ────────────────────────────────────────────────────────────────`)

  console.log(out.join('\n'))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

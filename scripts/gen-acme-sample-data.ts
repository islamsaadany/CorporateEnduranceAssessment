/**
 * Generates prisma/sql/006_acme_sample_data.sql:
 *
 *   - 6 new departments on the existing "Acme Corp (sample)" assessment
 *   - 50 new submitted respondents distributed across all 8 departments,
 *     with realistic variety in level, tenure, and capability ratings
 *   - 30 response rows per respondent (1,500 total)
 *
 * The output SQL is **idempotent**: re-running replaces the same 50
 * respondents and their responses without duplication. UUIDs are
 * derived from a fixed seed so each run produces the same values.
 *
 * Designed to give the report a recognizable shape:
 *   - Critical Gap: Offensive Readiness
 *   - Strong: Risk & Compliance Discipline, Experimentation Muscle,
 *     Leadership Strength Under Pressure
 *   - Needs Work: Adaptive Governance, Learning Discipline,
 *     Strategic Adaptability, Decision Velocity
 *   - Solid: the remaining capabilities
 *
 * Run inside the project root:
 *   npx tsx scripts/gen-acme-sample-data.ts
 */

import { writeFileSync } from 'fs'

// 30 question ids: 1a, 1b, 2a, 2b, …, 15a, 15b
const QUESTION_IDS: string[] = []
for (let n = 1; n <= 15; n++) QUESTION_IDS.push(`${n}a`, `${n}b`)

// Per-capability target team mean (1.00–4.00). Drives the "shape" of the
// report so each band has at least one capability that lands in it.
const CAPABILITY_TARGETS: Record<number, number> = {
  1: 2.4,  // decision_velocity                      — Needs Work
  2: 2.8,  // market_signal_intelligence             — Solid
  3: 2.2,  // adaptive_governance                    — Needs Work
  4: 3.5,  // experimentation_muscle                 — Strong
  5: 2.7,  // delegation_empowerment                 — Solid
  6: 3.4,  // leadership_strength_under_pressure     — Strong
  7: 3.2,  // financial_shock_absorption             — Solid
  8: 2.9,  // operational_continuity                 — Solid
  9: 3.7,  // risk_compliance_discipline             — Strong
  10: 3.0, // trust_collaboration                    — Solid
  11: 2.8, // system_recoverability                  — Solid
  12: 2.6, // culture_of_grit_ownership              — Solid
  13: 2.0, // learning_discipline                    — Needs Work
  14: 2.4, // strategic_adaptability                 — Needs Work
  15: 1.7, // offensive_readiness                    — Critical Gap
}

const NEW_DEPARTMENTS = [
  'Marketing',
  'Operations',
  'Finance',
  'Human Resources',
  'Customer Success',
  'Product',
] as const

// Total respondents per department, summing to 50.
const DEPT_DISTRIBUTION: Record<string, number> = {
  Sales: 7,
  Engineering: 9,
  Marketing: 5,
  Operations: 6,
  Finance: 5,
  'Human Resources': 4,
  'Customer Success': 7,
  Product: 7,
}

const LEVELS = ['individual_contributor', 'team_leader', 'manager', 'senior_leader'] as const
const TENURES = ['lt_1y', 'y1_3', 'y4_7', 'y8_15', 'gt_15y'] as const

const FIRST_NAMES = [
  'Alex', 'Bailey', 'Cameron', 'Dana', 'Ellis', 'Finley', 'Gray', 'Harper', 'Indigo',
  'Jordan', 'Kai', 'Logan', 'Morgan', 'Nico', 'Oakley', 'Parker', 'Quinn', 'Reese',
  'Sage', 'Tate', 'Umi', 'Val', 'Wren', 'Xen', 'Yael', 'Zane', 'Aubrey', 'Brett',
  'Carey', 'Devin', 'Emery', 'Frankie', 'Glenn', 'Hadley', 'Ivy', 'Jamie', 'Kyle',
  'Lou', 'Marlow', 'Noor', 'Ocean', 'Paige', 'Rio', 'Sky', 'Toni', 'Uri', 'Vesper',
  'Wes', 'Zion', 'Ari',
]
const LAST_INITIALS = [
  'A.', 'B.', 'C.', 'D.', 'E.', 'F.', 'G.', 'H.', 'J.', 'K.',
  'L.', 'M.', 'N.', 'P.', 'R.', 'S.', 'T.', 'V.', 'W.', 'Y.',
]

// ─── Deterministic PRNG ───────────────────────────────────────────────
// Single seeded RNG for everything so two runs of this script produce
// byte-identical output (and therefore stable UUIDs).
const SEED = 42
let rngState = SEED
function rand(): number {
  // Linear-congruential generator — good enough for sample-data variety.
  rngState = (rngState * 9301 + 49297) % 233280
  return rngState / 233280
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

// ─── Deterministic UUID v4-ish ────────────────────────────────────────
function makeUuid(): string {
  let hex = ''
  for (let i = 0; i < 32; i++) hex += Math.floor(rand() * 16).toString(16)
  // Set version (4) and variant (8) bits per RFC 4122.
  const v = '4' + hex.slice(13, 16)
  const r = '8' + hex.slice(17, 20)
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    v,
    r,
    hex.slice(20, 32),
  ].join('-')
}

// ─── Build respondent set ─────────────────────────────────────────────
interface Respondent {
  id: string
  name: string
  department: string
  level: typeof LEVELS[number]
  tenure: typeof TENURES[number]
  driftBias: number // -0.4 to +0.4
}

function buildRespondents(): Respondent[] {
  const usedNames = new Set<string>()
  const respondents: Respondent[] = []
  for (const dept of Object.keys(DEPT_DISTRIBUTION)) {
    for (let i = 0; i < DEPT_DISTRIBUTION[dept]; i++) {
      let name: string
      let attempts = 0
      do {
        name = `${pick(FIRST_NAMES)} ${pick(LAST_INITIALS)}`
        attempts++
        if (attempts > 200) throw new Error('Name pool exhausted')
      } while (usedNames.has(name))
      usedNames.add(name)

      respondents.push({
        id: makeUuid(),
        name,
        department: dept,
        level: pick(LEVELS),
        tenure: pick(TENURES),
        driftBias: (rand() - 0.5) * 0.8,
      })
    }
  }
  return respondents
}

// ─── Generate one rating ──────────────────────────────────────────────
function ratingFor(respondent: Respondent, questionId: string): number | null {
  const capNum = parseInt(questionId.match(/^(\d+)/)![1], 10)
  const angle = questionId.endsWith('a') ? 'a' : 'b'

  // Sometimes "I don't know" — exercises the scoring engine's null path.
  if (rand() < 0.07) return null

  const target = CAPABILITY_TARGETS[capNum]
  // Angle bias: 'a' (structure) usually rated slightly lower than 'b' (practice)
  // — gives realistic intra-capability variance per spec 02 § 4.
  const angleBias = angle === 'a' ? -0.1 : 0.1
  // Per-rating noise (uniform −0.5..+0.5)
  const noise = (rand() - 0.5) * 1.0

  const raw = target + respondent.driftBias + angleBias + noise
  return Math.max(1, Math.min(4, Math.round(raw)))
}

// ─── SQL emission ─────────────────────────────────────────────────────
function escapeStr(s: string): string {
  return s.replace(/'/g, "''")
}

function buildSql(): string {
  const respondents = buildRespondents()
  const responses: Array<{ rid: string; qid: string; value: number | null }> = []
  for (const r of respondents) {
    for (const qid of QUESTION_IDS) {
      responses.push({ rid: r.id, qid, value: ratingFor(r, qid) })
    }
  }

  const lines: string[] = []
  const push = (s: string) => lines.push(s)

  push('-- ─── Acme Corp (sample) — 50 submitted respondents ────────────')
  push('--')
  push('-- Adds 6 new departments and 50 submitted respondents (with all 30')
  push('-- responses each = 1,500 response rows) to the existing')
  push('-- "Acme Corp (sample)" assessment so the report page can be')
  push('-- exercised across multiple departments, levels, and tenures.')
  push('--')
  push('-- Bumps maxUses from 8 to 60 to accommodate the new respondents.')
  push('-- Existing 5 seed respondents (Avery, Blake, Casey, Drew, Eli) are')
  push('-- preserved.')
  push('--')
  push('-- IDEMPOTENT: re-running this file replaces the same 50 respondents')
  push('-- and their responses without duplication. Department inserts skip')
  push('-- on (assessmentId, name) conflict.')
  push('--')
  push(`-- Generated by scripts/gen-acme-sample-data.ts (seed=${SEED}).`)
  push('-- Do not edit by hand; regenerate the script and re-run instead.')
  push('')
  push('BEGIN;')
  push('')

  // 1. Bump maxUses
  push('-- 1. Bump maxUses')
  push(`UPDATE "Assessment" SET "maxUses" = 60 WHERE "clientName" = 'Acme Corp (sample)';`)
  push('')

  // 2. Insert new departments (uses pgcrypto's gen_random_uuid; Neon has
  //    pgcrypto enabled by 005_reset_super_admin_password.sql or ships with it).
  push('-- 2. Add 6 new departments (Sales + Engineering already exist from seed)')
  push('CREATE EXTENSION IF NOT EXISTS pgcrypto;')
  push('INSERT INTO "Department" ("id", "assessmentId", "name", "createdAt")')
  push('SELECT gen_random_uuid(), a.id, v.name, NOW()')
  push(`FROM (SELECT id FROM "Assessment" WHERE "clientName" = 'Acme Corp (sample)' LIMIT 1) a`)
  push('CROSS JOIN (VALUES')
  for (let i = 0; i < NEW_DEPARTMENTS.length; i++) {
    const sep = i < NEW_DEPARTMENTS.length - 1 ? ',' : ''
    push(`  ('${escapeStr(NEW_DEPARTMENTS[i])}')${sep}`)
  }
  push(') AS v(name)')
  push('ON CONFLICT ("assessmentId", "name") DO NOTHING;')
  push('')

  // 3. Respondents
  push('-- 3. Insert 50 submitted respondents')
  push('WITH a AS (SELECT id AS aid FROM "Assessment" WHERE "clientName" = \'Acme Corp (sample)\' LIMIT 1),')
  push('     d AS (SELECT "name" AS dname, id AS did FROM "Department" WHERE "assessmentId" = (SELECT aid FROM a))')
  push('INSERT INTO "Respondent" ("id", "assessmentId", "name", "departmentId", "level", "tenure", "demographicsCompletedAt", "startedAt", "submittedAt", "createdAt", "updatedAt")')
  push('SELECT v.rid::uuid, a.aid, v.rname, d.did, v.lvl::"Level", v.tnr::"TenureBand", NOW(), NOW(), NOW(), NOW(), NOW()')
  push('FROM (VALUES')
  for (let i = 0; i < respondents.length; i++) {
    const r = respondents[i]
    const sep = i < respondents.length - 1 ? ',' : ''
    push(`  ('${r.id}', '${escapeStr(r.name)}', '${escapeStr(r.department)}', '${r.level}', '${r.tenure}')${sep}`)
  }
  push(') AS v(rid, rname, dept, lvl, tnr)')
  push('CROSS JOIN a')
  push('JOIN d ON d.dname = v.dept')
  push('ON CONFLICT ("id") DO UPDATE SET')
  push('  "name" = EXCLUDED."name",')
  push('  "departmentId" = EXCLUDED."departmentId",')
  push('  "level" = EXCLUDED."level",')
  push('  "tenure" = EXCLUDED."tenure",')
  push('  "submittedAt" = EXCLUDED."submittedAt",')
  push('  "updatedAt" = NOW();')
  push('')

  // 4. Responses (chunked into multiple INSERTs to keep each statement small)
  push('-- 4. Insert 1,500 response rows (50 respondents × 30 questions)')
  const CHUNK = 250
  for (let start = 0; start < responses.length; start += CHUNK) {
    const chunk = responses.slice(start, start + CHUNK)
    push('INSERT INTO "Response" ("id", "respondentId", "questionId", "value", "createdAt", "updatedAt") VALUES')
    for (let i = 0; i < chunk.length; i++) {
      const r = chunk[i]
      const valLit = r.value === null ? 'NULL' : String(r.value)
      const sep = i < chunk.length - 1 ? ',' : ''
      push(`  (gen_random_uuid(), '${r.rid}'::uuid, '${r.qid}', ${valLit}, NOW(), NOW())${sep}`)
    }
    push('ON CONFLICT ("respondentId", "questionId") DO UPDATE SET')
    push('  "value" = EXCLUDED."value",')
    push('  "updatedAt" = NOW();')
    push('')
  }

  // 5. Verification
  push('-- 5. Verification — should show maxUses=60, 8 departments, ≥53 submitted respondents,')
  push('--    and 1,500 + (existing seed responses) total response rows.')
  push('SELECT')
  push(`  (SELECT "maxUses" FROM "Assessment" WHERE "clientName" = 'Acme Corp (sample)') AS max_uses,`)
  push(`  (SELECT COUNT(*) FROM "Department" WHERE "assessmentId" = (SELECT id FROM "Assessment" WHERE "clientName" = 'Acme Corp (sample)')) AS departments,`)
  push(`  (SELECT COUNT(*) FROM "Respondent" WHERE "assessmentId" = (SELECT id FROM "Assessment" WHERE "clientName" = 'Acme Corp (sample)') AND "submittedAt" IS NOT NULL) AS submitted_respondents,`)
  push(`  (SELECT COUNT(*) FROM "Response" r JOIN "Respondent" rr ON rr.id = r."respondentId" WHERE rr."assessmentId" = (SELECT id FROM "Assessment" WHERE "clientName" = 'Acme Corp (sample)')) AS total_responses;`)
  push('')

  push('COMMIT;')
  push('')

  return lines.join('\n')
}

const sql = buildSql()
writeFileSync('prisma/sql/006_acme_sample_data.sql', sql)
console.log(
  `Generated prisma/sql/006_acme_sample_data.sql (${sql.length.toLocaleString()} bytes, ${sql.split('\n').length.toLocaleString()} lines)`,
)

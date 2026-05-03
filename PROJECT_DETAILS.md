# The Endurance Assessment — Project Details

> Technical reference for engineers and Claude Code sessions.
> Product/content reference lives in `product-spec/`. Working guidelines live in `CLAUDE.md`. Decisions log lives in `Plan & Progress/execution-plan.md`.

**Status:** Phases 0–5 complete. Phase 6 (live numerical report) is next. Built code lives in `src/`, `prisma/`. Several decisions changed during implementation — see the **Decisions log** in `Plan & Progress/execution-plan.md` for the canonical reasoning behind anything that disagrees with an early draft.

> **Heads up for new sessions.** A few things changed from the original plan and are easy to miss:
> 1. **Cohort code, not per-respondent code.** One `Assessment.code` shared by all respondents, plus `Assessment.maxUses` as a hard cap. `Respondent.code` does **not** exist. (Reversal logged 2026-04-29.)
> 2. **1–4 Likert + "I don't know"**, not 1–5. `Response.value` is `Int?` — `NULL` means "I don't know" and is excluded from scoring. (Logged 2026-04-29.)
> 3. **4-tier `Level` enum**, not 5. Values: `individual_contributor`, `team_leader`, `manager`, `senior_leader`. Display labels are slash-joined merged names. (Logged 2026-04-29.)
> 4. **`Respondent.demographicsCompletedAt`** distinguishes "real" respondents from ghost rows (validated-then-bounced). Cap checks + admin UI filter on this column. (Logged 2026-04-29.)
> 5. **No respondent review screen.** Selecting an answer for question 30 auto-submits.
> 6. **Capability names match `product-spec/01`** (Decision Velocity / Market & Signal Intelligence / etc.) — the early draft's names (Sensing / Decisiveness / etc.) are gone.

---

## Technology Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript 5.9+ |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Neon, serverless) |
| ORM | Prisma 5.x |
| Auth (admin) | NextAuth.js v5, email/password credentials provider |
| Auth (respondent) | 6-character access code (no app account) |
| AI | Provider-abstracted: Gemini (default) / Claude / OpenAI. Admin selects in panel; model name hardcoded per provider |
| PDF | `@react-pdf/renderer` (server-side) |
| Scheduled jobs | Vercel Cron (daily closure check at 00:00 UTC — Hobby plan caps at daily crons) |
| Encryption | AES-256-GCM for API keys at rest, master key in `SETTINGS_ENCRYPTION_KEY` env var |
| Hosting | Vercel |
| Email | **None** |

---

## Directory Structure (actual)

Built and on disk. Files marked *(Phase N+)* don't exist yet — the directory layout calls them out so future sessions know where to put them.

```
CorporateEnduranceAssessment/
├── Plan & Progress/
│   ├── execution-plan.md            # Source of truth for alignment + decisions log
│   └── progress.md                  # Live execution tracker
├── product-spec/                    # Product content + behavior (16 files, non-technical)
├── prisma/
│   ├── schema.prisma                # 8 models + 5 enums (see § Schema below)
│   ├── seed.ts                      # Super admin + Settings + sample assessment
│   └── sql/                         # Hand-runnable SQL files for Neon SQL editor
│       ├── README.md
│       ├── 000_initial_schema.sql   # Auto-generated from schema.prisma
│       ├── 001_seed_sample_data.sql # Auto-generated from seed.ts via gen-seed-sql.mjs
│       ├── 002_cohort_codes.sql     # Migration: per-respondent → cohort codes
│       ├── 003_likert_scale.sql     # Migration: 1–5 Likert → 1–4 + "I don't know"
│       ├── 004_levels_and_demographics.sql  # Migration: 4-tier Level + demographicsCompletedAt
│       ├── 005_reset_super_admin_password.sql  # Reusable bcrypt password reset (pgcrypto)
│       └── 006_acme_sample_data.sql # 50 submitted respondents × 8 departments for the Acme Corp (sample) assessment
├── scripts/
│   ├── gen-seed-sql.mjs             # Emits 001_seed_sample_data.sql from seed.ts logic
│   └── gen-acme-sample-data.ts      # Emits 006_acme_sample_data.sql with deterministic personas
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Landing — CTAs to /take and /admin/login
│   │   ├── layout.tsx
│   │   ├── globals.css              # @tailwind base/components/utilities + body bg
│   │   ├── take/                    # Respondent flow (no admin chrome)
│   │   │   ├── layout.tsx           # Minimal frame
│   │   │   ├── page.tsx             # Code entry
│   │   │   ├── code-entry-form.tsx  # Client form, calls /api/respondents/validate
│   │   │   ├── welcome/page.tsx     # Privacy disclosure
│   │   │   ├── demographics/
│   │   │   │   ├── page.tsx
│   │   │   │   └── demographics-form.tsx  # Client; loads via /api/respondents/[id]
│   │   │   ├── question/[n]/
│   │   │   │   ├── page.tsx
│   │   │   │   └── question-card.tsx      # Client; tiles + IDK + Q30 auto-submit
│   │   │   └── done/
│   │   │       ├── page.tsx
│   │   │       └── done-cleanup.tsx       # Clears localStorage tea_respondent_*
│   │   ├── admin/
│   │   │   ├── layout.tsx           # Header nav with super-admin-only links
│   │   │   ├── page.tsx             # Redirects to /admin/dashboard
│   │   │   ├── login/
│   │   │   │   ├── page.tsx
│   │   │   │   └── login-form.tsx   # Client; signIn from next-auth/react
│   │   │   ├── dashboard/page.tsx   # Lists Collecting + Closed assessments
│   │   │   └── assessments/
│   │   │       ├── new/
│   │   │       │   ├── page.tsx
│   │   │       │   └── new-assessment-form.tsx
│   │   │       └── [id]/
│   │   │           ├── page.tsx           # Detail: cohort code card + capacity strip + table; "View report" link
│   │   │           ├── copy-button.tsx
│   │   │           ├── close-button.tsx   # "Close now" with confirm
│   │   │           ├── edit/
│   │   │           │   ├── page.tsx
│   │   │           │   └── edit-assessment-form.tsx
│   │   │           └── results/                          # Phase 6
│   │   │               ├── page.tsx                          # Single-filter report
│   │   │               ├── band-style.ts                     # BandKey → Tailwind class + hex helpers
│   │   │               ├── banners.tsx                       # PreliminaryBanner
│   │   │               ├── lock-card.tsx                     # <3 respondents lock states
│   │   │               ├── summary-section.tsx               # Hero panel (overall + 3 pillars + legend)
│   │   │               ├── capability-profile-section.tsx    # 3 columns × 5 rows; spread/range; "Team is split" badge
│   │   │               ├── focus-areas-section.tsx           # Top-5 weakest with baseline action items
│   │   │               ├── individual-responses-section.tsx  # Table + heatmap (names shown directly in v1)
│   │   │               ├── filter-modal.tsx                  # Multi-select chips + live preview (slice 6.3)
│   │   │               ├── filter-controls.tsx               # Active-chip row + Change-filter button
│   │   │               └── compare/                          # Comparison view (slice 6.4)
│   │   │                   ├── page.tsx                          # Twin filters via aDept/bDept etc.
│   │   │                   ├── comparison-filter-controls.tsx    # Twin pickers reusing FilterModal
│   │   │                   ├── comparison-summary-section.tsx    # Twin hero + delta strip
│   │   │                   ├── comparison-pillar-section.tsx     # Twin progress bars per pillar
│   │   │                   ├── comparison-capability-section.tsx # Twin bars per capability
│   │   │                   └── comparison-focus-areas-section.tsx # Twin top-5 with "Only in A/B" badges
│   │   │   # Phase 7+: activity/, settings/ai/, admins/
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── assessments/
│   │       │   ├── route.ts                  # POST create
│   │       │   └── [id]/
│   │       │       ├── route.ts              # PATCH edit
│   │       │       ├── close/route.ts        # POST manual close
│   │       │       └── results/route.ts      # GET aggregated results JSON (Phase 6 slice 6.1)
│   │       ├── respondents/
│   │       │   ├── validate/route.ts         # POST validate cohort code, create/resume Respondent
│   │       │   └── [id]/
│   │       │       ├── route.ts              # GET full state for take flow
│   │       │       ├── demographics/route.ts # PATCH demographics
│   │       │       ├── responses/route.ts    # PATCH upsert answers
│   │       │       └── submit/route.ts       # POST finalize (sets submittedAt)
│   │       └── cron/closure/route.ts         # Hourly cron — flips deadline-passed assessments to closed
│   ├── lib/
│   │   ├── prisma.ts                # PrismaClient singleton
│   │   ├── auth.ts                  # NextAuth v5 config; module augmentation for session.user.role
│   │   ├── admin-guard.ts           # requireAdmin() / requireSuperAdmin() server helpers
│   │   ├── codes.ts                 # generateUniqueAssessmentCode() — single cohort code per assessment
│   │   ├── audit.ts                 # logAdminAction() / logRespondentLifecycle()
│   │   ├── take-storage.ts          # SSR-safe localStorage helpers for /take
│   │   ├── filters.ts               # ParsedFilter parse/encode + filter signature + Prisma where (Phase 6)
│   │   ├── scoring.ts               # Pure aggregation: per-respondent → team scores + focus areas (Phase 6)
│   │   └── results-service.ts       # loadResults(): single source for the report page + API route (Phase 6)
│   ├── proxy.ts                     # Next 16's renamed middleware — gates /admin/*
│   └── data/
│       ├── types.ts                 # PillarKey, CapabilityKey, ParsedFilter (multi-value), CapabilityResult/PillarResult/AggregatedResults, AiReportOutput, AnswerValue
│       ├── constants.ts             # Pillar/capability metadata, LEVELS (4), TENURE_BANDS (5), BAND_THRESHOLDS (quartiles), LIKERT_VALUES, MIN_RESPONDENTS_FOR_VIEW, BAND_INTERPRETATION, BASELINE_ACTION_ITEMS, PILLAR_VERB_PAIRS
│       └── questions.ts             # 30 verbatim statements + helpers (questionAtPosition, QUESTIONS_BY_ID)
├── public/                          # (.gitkeep — placeholder for Vercel/Next)
├── vercel.json                      # framework: nextjs + crons schedule
├── CLAUDE.md
├── PROJECT_DETAILS.md               # This file
├── REUSABLE_PATTERNS.md
├── ENDURANCE_ASSESSMENT_SPEC.md     # Slim index → product-spec/
└── README.md
```

---

## Database Schema

All tables use Prisma's `@id @default(uuid())` for primary keys unless noted. Timestamps are `createdAt` / `updatedAt` (`@default(now())` / `@updatedAt`).

### Admin

```prisma
model Admin {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  name          String
  role          AdminRole @default(admin)   // admin | super_admin
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdAssessments Assessment[] @relation("CreatedBy")
  auditEntries  AuditLog[]
}

enum AdminRole {
  admin
  super_admin
}
```

**Invariant:** exactly one `super_admin` row exists at any time. Enforced in app logic (cannot demote the last super admin; cannot delete a super admin via the UI).

### Assessment

```prisma
model Assessment {
  id           String           @id @default(uuid())
  clientName   String
  // Cohort code: ONE code per assessment, shared by every respondent.
  // 6 chars over an alphabet that excludes 0/O/1/I/L. Stored uppercased.
  code         String           @unique
  // Hard cap on demographics-completed respondents. Set explicitly by
  // the admin at creation; only changes via the edit page (no auto-grow).
  maxUses      Int
  status       AssessmentStatus @default(collecting) // collecting | closed
  deadline     DateTime
  closedAt     DateTime?
  createdById  String
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
}

enum AssessmentStatus { collecting closed }
```

### Department

```prisma
model Department {
  id           String   @id @default(uuid())
  assessmentId String
  name         String
  createdAt    DateTime @default(now())
  @@unique([assessmentId, name])
}
```

**Rule:** a department row cannot be deleted once any `Respondent` references it (enforced in `PATCH /api/assessments/[id]` — returns 409 with the offending names).

### Respondent

```prisma
model Respondent {
  id           String      @id @default(uuid())
  assessmentId String
  // No per-respondent code — see decisions log "Codes (REVERSAL)" 2026-04-29.
  // Identity: (id, browser localStorage). Cohort code lives on Assessment.
  // The DB column for `name` stays nullable because (a) a respondent row
  // exists between code-validation and demographics-save, and (b) older
  // sample data may have NULLs. The API (Zod) enforces non-empty name
  // when demographics are saved.
  name                    String?
  departmentId            String?
  level                   Level?
  tenure                  TenureBand?
  // Set when demographics are first saved. Distinguishes "real"
  // respondents from ghost rows (validated then bounced). Cap checks +
  // admin UI filter on this column.
  demographicsCompletedAt DateTime?
  startedAt               DateTime?
  submittedAt             DateTime?
  createdAt               DateTime    @default(now())
  updatedAt               DateTime    @updatedAt

  @@index([assessmentId])
  @@index([departmentId])
  @@index([assessmentId, submittedAt])
  @@index([assessmentId, demographicsCompletedAt])
}

// 4 merged tiers — see product-spec/09_demographics.md.
enum Level {
  individual_contributor // "Individual Contributor / Early Career"
  team_leader            // "Team Leader / Supervisor"
  manager                // "Manager / Department Head"
  senior_leader          // "Senior Leader / Executive"
}

enum TenureBand { lt_1y y1_3 y4_7 y8_15 gt_15y }
```

### Response

```prisma
model Response {
  id           String   @id @default(uuid())
  respondentId String
  questionId   String                              // e.g. "1a", "1b", … "15b" — matches src/data/questions.ts
  // 1..4 if rated, NULL if respondent picked "I don't know".
  // Row existence = answered. NULL = explicit non-answer (still counts
  // toward submission completeness, but excluded from scoring).
  value        Int?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([respondentId, questionId])
  @@index([questionId])
}
```

**Constraint:** `value` is `Int?` with a Postgres CHECK `(value IS NULL OR value BETWEEN 1 AND 4)`. Updates only allowed when `Respondent.submittedAt IS NULL` (during collection); admin post-closure edits flow through a separate route in Phase 9.

### Settings

```prisma
model Settings {
  id                   String   @id @default("singleton") // Single row by convention
  aiProvider           AiProvider @default(gemini)
  encryptedApiKeyGemini Bytes?                            // AES-256-GCM ciphertext
  encryptedApiKeyClaude Bytes?
  encryptedApiKeyOpenai Bytes?
  promptVersion        Int      @default(1)
  updatedById          String?
  updatedAt            DateTime @updatedAt
}

enum AiProvider {
  gemini
  claude
  openai
}
```

**Bootstrap:** if no API key for the active provider is saved, the app falls back to the matching env var (`GEMINI_API_KEY` / `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`) and surfaces a persistent banner directing the super admin to save the key in panel.

### GeneratedReport

```prisma
model GeneratedReport {
  id               String   @id @default(uuid())
  assessmentId     String
  assessment       Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  filterSignature  String                          // Canonical sorted query string, e.g. "dept=Sales&level=manager"
  isDraft          Boolean                         // true = generated pre-closure (watermarked)
  promptVersion    Int                             // From Settings at generation time
  provider         AiProvider                      // Which provider produced this
  inputJson        Json                            // Aggregates + anonymized respondents (audit trail)
  outputJson       Json                            // { executiveSummary, focusAreaActions[] }
  generatedById    String
  generatedAt      DateTime @default(now())
  @@unique([assessmentId, filterSignature])        // One cached report per filter; new gen overwrites
}
```

**Cache key:** `(assessmentId, filterSignature)`. **No eviction policy** (unlimited entries per assessment, cleared only when an admin edit invalidates them — see audit log + invalidation flow below).

### AuditLog

```prisma
model AuditLog {
  id            String   @id @default(uuid())
  assessmentId  String?                              // Nullable for global events (e.g. AI config change)
  actorAdminId  String?
  actorAdmin    Admin?   @relation(fields: [actorAdminId], references: [id])
  actorRespondentId String?                          // For respondent lifecycle events
  action        String                               // assessment.create, response.edit, ai.generate, etc.
  metadata      Json                                 // Free-form per action; never stores answer values
  createdAt     DateTime @default(now())
  @@index([assessmentId, createdAt])
}
```

**Logged actions:** `assessment.create`, `assessment.edit`, `assessment.close` (cron and manual), `response.edit` (post-closure), `respondent.demographics_edit`, `ai.generate`, `ai.config_change`, `admin.create`, `admin.deactivate`, `respondent.start`, `respondent.submit`, `report.export_pdf`, `report.show_names`. **Never logs the value of an individual answer** — only that an edit happened.

---

## API Routes

All admin routes are gated by NextAuth session via `src/proxy.ts`. Respondent routes are unauthenticated — knowledge of the cohort code (or the respondent UUID) is the credential. The cron route requires the `CRON_SECRET` Bearer header.

**Status legend:** ✅ implemented · ⏳ planned for the marked phase

### Admin — Assessments
| Status | Method | Path | Purpose |
|---|--------|------|---------|
| ✅ | `POST` | `/api/assessments` | Create. Body: `{ clientName, deadline, departments[], maxUses }`. Generates ONE cohort code via `generateUniqueAssessmentCode()`. No bulk respondent rows. Audit-logs `assessment.create` (without the code in metadata — the code is a credential). |
| ✅ | `PATCH` | `/api/assessments/[id]` | Edit `clientName / deadline / departments / maxUses`. Body: `{ clientName, deadline, departments: { keep: [], add: [] }, maxUses }`. Returns 409 `department_in_use` if removal targets a department that any respondent has chosen. `maxUses` cannot drop below the demographics-completed count. |
| ✅ | `POST` | `/api/assessments/[id]/close` | Manual "Close now" — same DB effect as the cron, but `metadata.trigger = 'manual'` and `actorAdminId` set. 409 `already_closed` if status is already `closed`. |
| ✅ | `GET` | `/api/assessments/[id]/results?dept=…&level=…&tenure=…` | Aggregated numerical results for the active filter. Submitted-only respondents. Returns `{ assessment, filter, counts, lock, aggregates, respondents, availableDepartments, allSubmittedDemos }`. Honors ≥3 guardrail. Underlying logic lives in `src/lib/results-service.ts` and is shared with the page. |
| ⏳ Phase 7 | `POST` / `GET` | `/api/assessments/[id]/report?filter=…` | Generate / fetch AI report. Watermarked draft if pre-closure. Caches into `GeneratedReport`. |
| ⏳ Phase 8 | `POST` | `/api/assessments/[id]/report/pdf?filter=…` | React-PDF render of the filtered view. |
| ⏳ Phase 9 | `GET` | `/api/assessments/[id]/activity` | Audit log entries scoped to this assessment. |

### Respondent (in-flow; unauthenticated)
| Status | Method | Path | Purpose |
|---|--------|------|---------|
| ✅ | `POST` | `/api/respondents/validate` | Validate cohort code (uppercased). 404 invalid · 410 closed · 403 full · 200 with `{ respondentId, assessmentId, clientName, departments, resumed }`. Resume: caller passes their localStorage `respondentId`; if it belongs to the same assessment and isn't submitted, it's reused. Otherwise a new `Respondent` row is created (cap is checked at this point AND at first demographics save). Audit-logs `respondent.start`. |
| ✅ | `GET` | `/api/respondents/[id]` | Full take-flow state: `{ respondent: {…}, assessment: {…}, answersByQuestionId: {…} }`. Used by demographics, question, and review pages. `value === undefined` → not answered; `null` → "I don't know"; `1..4` → rated. |
| ✅ | `PATCH` | `/api/respondents/[id]/demographics` | Body: `{ name, departmentId, level, tenure }`. Name required (Zod min(1)). Cross-checks the department belongs to this assessment. Stamps `demographicsCompletedAt` on first successful save. Re-checks cap on first save. 410 if already submitted or closed. |
| ✅ | `PATCH` | `/api/respondents/[id]/responses` | Body: `{ answers: [{ questionId, value }, …] }`. value = `1..4` rated or `null` "I don't know". Single transaction upsert. 410 if already submitted or closed. Rejects unknown question IDs. |
| ✅ | `POST` | `/api/respondents/[id]/submit` | Demographics must be set; response row count must be ≥ 30. Sets `submittedAt`, audit-logs `respondent.submit`. 410 if already submitted or closed. |

### Auth + Cron
| Status | Method | Path | Purpose |
|---|--------|------|---------|
| ✅ | All | `/api/auth/[...nextauth]` | NextAuth credentials provider handler. |
| ✅ | `POST` (and `GET` alias) | `/api/cron/closure` | Hourly Vercel Cron (`0 * * * *`). Auth: `Authorization: Bearer ${CRON_SECRET}`. Finds `status='collecting' AND deadline <= now`, flips each to closed inside a per-row transaction, audit-logs `assessment.close` with `metadata.trigger = 'cron'`. Idempotent. |

### Phase 7+ (super-admin only) — not yet built
| Status | Method | Path | Purpose |
|---|--------|------|---------|
| ⏳ Phase 7 | `GET` / `PATCH` | `/api/settings/ai` | Provider + AES-256 encrypted API key. |
| ⏳ Phase 7 | `POST` | `/api/settings/ai/test` | Round-trip test prompt. |
| ⏳ Phase 7 | `POST` / `GET` | `/api/assessments/[id]/report?<filter signature>` | Generate / fetch AI report. Watermarked draft pre-closure. Caches into `GeneratedReport` keyed by `(assessmentId, filterSignature)`. |
| ⏳ Phase 8 | `POST` | `/api/assessments/[id]/report/pdf?<filter signature>` | React-PDF render of the filtered view. |
| ⏳ Phase 9 | `GET` | `/api/assessments/[id]/activity` | Audit log entries scoped to this assessment. |
| ⏳ Phase 9 | `PATCH` | `/api/respondents/[id]/answers` | Admin post-closure edit; triggers cache invalidation. |
| ⏳ Phase 10 | `GET` / `POST` / `PATCH` | `/api/admins` | List / create / deactivate admins. |

---

## Server-side Modules

The product/content rules these modules implement live in `product-spec/`. The summaries below are about the **code shape**, not the rules.

### `src/lib/codes.ts` ✅
```ts
export function generateCode(): string                          // 6 chars, alphabet excludes 0/O/1/I/L
export async function generateUniqueAssessmentCode(): Promise<string>  // retries up to 10× against unique Assessment.code index
```
**Cohort-code model:** one code per assessment, shared by all respondents. There is no per-respondent generator anymore.

### `src/lib/audit.ts` ✅
```ts
export type AdminAction = 'assessment.create' | 'assessment.edit' | 'assessment.close' | …
export type RespondentAction = 'respondent.start' | 'respondent.submit'
export async function logAdminAction({ actorAdminId, assessmentId?, action, metadata? }): Promise<void>
export async function logRespondentLifecycle({ respondentId, assessmentId, action, metadata? }): Promise<void>
```
Metadata is `Prisma.InputJsonValue`. Append-only. **Never logs the value of an individual answer** — only that something happened. The cron close route writes `metadata.trigger = 'cron'` (no actorAdminId); the manual close route writes `metadata.trigger = 'manual'` with the actor.

### `src/lib/auth.ts` ✅
NextAuth v5 credentials provider. JWT session strategy. Module augmentation adds `id` + `role: AdminRole` to both `Session.user` and `@auth/core/jwt`'s `JWT`. The `authorized` callback gates `/admin/*` (except `/admin/login`).

### `src/lib/admin-guard.ts` ✅
```ts
export async function requireAdmin(): Promise<{ id, email, name, role }>     // 401 → redirect /admin/login
export async function requireSuperAdmin(): Promise<…>                          // non-super → redirect /admin/dashboard
```

### `src/proxy.ts` ✅
Next 16's renamed middleware. Matcher `['/admin/:path*', '/api/admin/:path*']`. Redirects unauthed visitors to `/admin/login?callbackUrl=…`; bounces already-authed visitors away from the login page back to `/admin/dashboard`.

### `src/lib/take-storage.ts` ✅
SSR-safe localStorage helpers. Storage key shape: `tea_respondent_<UPPERCASED_ASSESSMENT_CODE>` → respondentId.
```ts
saveRespondentId(code, respondentId)
loadRespondentId(code): string | null
clearRespondentId(code)
findInFlightRespondentId(): string | null   // walks localStorage, returns first tea_respondent_* match
clearAllRespondentIds()
```

### `src/lib/scoring.ts` ✅
Pure functions, no DB access. The two-stage shape (per-respondent first, then team rollup) keeps "I don't know" handling honest: a respondent who picks IDK on both angles of a capability simply has no value for that capability and contributes nothing to that capability's team mean.
```ts
export function computeIndividualScores(
  rows: ScoringInputRow[],     // { respondentId, questionId, value: 1..4 | null }
  respondentIds: string[],     // include respondents with all-IDK so they count toward sampleSize
): Map<string, IndividualScores>

export function aggregateTeam(
  individuals: Map<string, IndividualScores>,
  sampleSize: number,
): AggregatedResults
```
- **NULL handling:** `value === null` ("I don't know") is excluded from every mean. A capability with <3 rated answers across the filter is marked `insufficient: true` (per-capability anonymity floor).
- **Team overall:** mean of *individual overall scores* — not the mean of the 3 team-pillar scores. They diverge when "I don't know" is unevenly distributed across pillars; the per-individual form is the rigorous one (spec 03 § 3.3).
- **Focus areas:** bottom 5 by score; tie-break spread descending, then alphabetical by display label. Insufficient capabilities are excluded from the ranking.
- **CapabilityResult** carries `score / spread / min / max / ratedCount / insufficient / band` so the report UI doesn't need to derive any of them.

### `src/lib/filters.ts` ✅
```ts
export function parseFilterFromSearchParams(sp: URLSearchParams, prefix?: string): ParsedFilter
export function filterSignature(f: ParsedFilter): string         // unprefixed canonical form, "company_wide" for empty — used as cache key
export function filterToQueryString(f: ParsedFilter, prefix?: string): string  // empty for company-wide; prefix='a' produces aDept/aLevel/aTenure for the comparison view
export function filterDescription(f: ParsedFilter): string       // "Sales department, Manager level, 4–7y tenure"
export function isCompanyWide(f: ParsedFilter): boolean
export function prismaWhereForFilter(f: ParsedFilter): Prisma.RespondentWhereInput
```
- **`ParsedFilter` is multi-value** per dimension (`departments: string[]`, `levels: Level[]`, `tenures: TenureBand[]`); empty array on a dimension means "all" (spec 06 § 1).
- **Filter signature** is the same canonical string used as the URL param, the cache key in `generated_reports`, and the PDF filename suffix. No SHA hashing — readability matters.
- **Lenient parser:** invalid level/tenure values are silently dropped (spec 06 § 9). Department names pass through verbatim; unknown departments return 0 rows from the DB query.

### `src/lib/results-service.ts` ✅
The single source for "fetch + aggregate the report data." Called by both `GET /api/assessments/[id]/results` and the server-rendered results page so they can never disagree.
```ts
export async function loadResults(assessmentId: string, filter: ParsedFilter): Promise<ResultsBundle | null>
```
Returns `{ assessment, filter, counts, lock, aggregates, respondents, availableDepartments, allSubmittedDemos }`. Only respondents with `submittedAt IS NOT NULL` count toward aggregates and the floor. `availableDepartments` and `allSubmittedDemos` are present on every return path (including the lock-card path) so the filter modal can render chips and compute live preview counts even when the current filtered view is locked. Names are included on the `respondents` rows; the AI prompt builder in Phase 7 must strip them before any LLM call (spec 11 § 5).

### `src/lib/crypto.ts` ⏳ Phase 7
AES-256-GCM. `encrypt(plaintext: string): Buffer` and `decrypt(buf: Buffer): string`. Master key from `SETTINGS_ENCRYPTION_KEY`. Used only for `Settings.encryptedApiKey*` columns.

### `src/lib/ai/` ⏳ Phase 7
Provider abstraction:
```ts
// src/lib/ai/index.ts
export interface AiProvider {
  name: 'gemini' | 'claude' | 'openai'
  generateReport(input: AiReportInput): Promise<AiReportOutput>
  testConnection(): Promise<{ ok: boolean; error?: string }>
}
export function selectProvider(settings: Settings): AiProvider
```
- `prompt.ts` builds the **provider-neutral** system + user prompt. See `product-spec/14_ai_prompts.md`.
- `gemini.ts` / `claude.ts` / `openai.ts` adapt to each SDK.
- `cache.ts` reads/writes `GeneratedReport` keyed by `(assessmentId, filterSignature)`. Generation **always** overwrites prior cache for that filter.

### `src/lib/pdf-template.tsx` ⏳ Phase 8
React-PDF template. Page-break rules: each pillar starts a new page, no orphan headers, tables don't split mid-row.

---

## Cache Invalidation Flow

When an admin edits an answer or demographic post-closure:
1. `PATCH /api/respondents/[id]/{answers,demographics}` returns a 200 with `{ requiresConfirmation: true, affectedReports: N }` if any cached `GeneratedReport` exists for the assessment.
2. Client shows the warning modal with the count.
3. On confirm, the route is re-called with `?confirmInvalidation=true`. The handler:
   - Applies the edit
   - Deletes all `GeneratedReport` rows for the assessment
   - Writes an `audit_log` entry (`response.edit` or `respondent.demographics_edit`) with the count of invalidated reports in metadata
4. Subsequent report fetches return 404 (cache miss) and the UI offers "Generate".

**Prompt-version invalidation** is separate: when `Settings.promptVersion` is bumped, existing reports are kept but treated as stale. Fetching by `(assessmentId, filterSignature)` returns the row with a `staleVersion: true` flag; the UI shows "Regenerate to use the latest prompt".

---

## Cross-references to `product-spec/`

The technical reference above intentionally omits product/content rules. Use the spec files as the source of truth for behavior:

| Topic | Spec file |
|-------|-----------|
| What the product is, who uses it | `product-spec/00_overview.md` |
| Pillar / capability framework | `product-spec/01_pillars_and_capabilities.md` |
| The 30 statements (locked content) | `product-spec/02_questions.md` |
| Scoring math + bands + tie-break | `product-spec/03_scoring_and_bands.md` |
| Recommendations / focus area copy | `product-spec/04_recommendations.md` |
| Report sections and layout | `product-spec/05_report_structure.md` |
| Filters + segments + comparison view | `product-spec/06_report_filters_and_segments.md` |
| Admin workflows | `product-spec/07_admin_workflows.md` |
| Respondent workflows | `product-spec/08_respondent_workflows.md` |
| Demographics fields + lists | `product-spec/09_demographics.md` |
| Code generation + distribution | `product-spec/10_code_distribution.md` |
| Anonymity rules + ≥3 guardrail | `product-spec/11_anonymity_and_privacy.md` |
| Visual design language | `product-spec/12_design_language.md` |
| Glossary | `product-spec/13_glossary.md` |
| AI prompts (system + user) | `product-spec/14_ai_prompts.md` |
| Report generation + caching rules | `product-spec/15_report_generation_and_caching.md` |

**Rule:** if a behavior is described in `product-spec/`, do not re-describe it in this file. Reference the spec file. If the spec is wrong, fix the spec — this file follows the spec, not the other way around.

---

## Build Commands

```bash
npm run dev          # Next.js dev server on :3000
npm run build        # Full production build (requires POSTGRES_URL)
npm run start        # Run the production build
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript check only (no DB needed)

npx prisma db push        # Apply schema to DB without a migration (dev)
npx prisma migrate deploy # Run migrations (production)
npx prisma studio         # DB GUI
npx prisma generate       # Regenerate client (postinstall hook also runs this)

npm run seed         # Run prisma/seed.ts — creates super admin + sample assessment
```

---

## Env Vars Quick Reference

See `CLAUDE.md → Configuration` for the authoritative list. In short:
- `POSTGRES_URL`, `DATABASE_URL_UNPOOLED`, `NEXTAUTH_SECRET`, `SETTINGS_ENCRYPTION_KEY`, `CRON_SECRET` — required (on Vercel, `NEXTAUTH_URL` auto-detects from `VERCEL_URL`)
- `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` — optional bootstrap fallbacks
- `RESEND_API_KEY` — **not used.** No emails.

---

*Last Updated: 2026-04-29*


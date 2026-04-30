# The Endurance Assessment — Project Details

> Technical reference for engineers and Claude Code sessions.
> Product/content reference lives in `product-spec/`. Working guidelines live in `CLAUDE.md`. Decisions log lives in `Plan & Progress/execution-plan.md`.

**Status:** Phase 0 — Documentation. No application code exists yet. The schema, routes, and structure below describe the **target state** for Phase 1 onwards.

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
| Scheduled jobs | Vercel Cron (hourly closure check) |
| Encryption | AES-256-GCM for API keys at rest, master key in `SETTINGS_ENCRYPTION_KEY` env var |
| Hosting | Vercel |
| Email | **None** |

---

## Directory Structure (target state)

```
CorporateEnduranceAssessment/
├── Plan & Progress/
│   ├── execution-plan.md            # Single source of truth for product alignment
│   └── progress.md                  # Live execution tracker
├── product-spec/                    # Product content + behavior (16 files, non-technical)
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                      # Super admin + sample assessment with sample responses
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Landing
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── take/                    # Respondent flow
│   │   │   ├── page.tsx             # Code entry
│   │   │   ├── welcome/page.tsx
│   │   │   ├── demographics/page.tsx
│   │   │   ├── question/[n]/page.tsx
│   │   │   ├── review/page.tsx
│   │   │   └── done/page.tsx
│   │   ├── admin/
│   │   │   ├── login/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── assessments/
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx     # Detail (status table)
│   │   │   │       ├── results/page.tsx
│   │   │   │       └── activity/page.tsx
│   │   │   ├── settings/ai/page.tsx # Super admin only
│   │   │   └── admins/page.tsx      # Super admin only
│   │   └── api/
│   │       ├── auth/[...nextauth]/  # NextAuth handler
│   │       ├── assessments/
│   │       ├── respondents/
│   │       ├── ai/
│   │       └── cron/closure/
│   ├── lib/
│   │   ├── prisma.ts                # Prisma client singleton
│   │   ├── auth.ts                  # NextAuth config + role helpers
│   │   ├── scoring.ts               # Pillar/capability/spread aggregation, focus-area selection
│   │   ├── filters.ts               # Filter signature + ≥3-respondent guardrail
│   │   ├── codes.ts                 # 6-char alphanumeric generator (no 0/O/1/I/L), collision check
│   │   ├── crypto.ts                # AES-256-GCM encrypt/decrypt
│   │   ├── audit.ts                 # Append-only audit log helper
│   │   ├── ai/
│   │   │   ├── index.ts             # Provider abstraction
│   │   │   ├── gemini.ts
│   │   │   ├── claude.ts
│   │   │   ├── openai.ts
│   │   │   ├── prompt.ts            # System + user prompt builders (provider-neutral)
│   │   │   └── cache.ts             # DB-backed cache helpers
│   │   └── pdf-template.tsx         # React-PDF template
│   ├── components/                  # Shared React components (admin + respondent)
│   └── data/
│       ├── types.ts
│       ├── constants.ts             # Pillar/capability metadata, LEVELS, TENURE_BANDS, BAND_THRESHOLDS
│       └── questions.ts             # 30 statements with (pillar, capability, angle) mapping
├── ui-versions/                     # Snapshots before UI edits (rollback log)
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
  id           String   @id @default(uuid())
  clientName   String                              // Free text, e.g. "Acme Corp"
  status       AssessmentStatus @default(collecting) // collecting | closed
  deadline     DateTime                            // Hourly cron flips to closed past this
  closedAt     DateTime?
  createdById  String
  createdBy    Admin    @relation("CreatedBy", fields: [createdById], references: [id])
  departments  Department[]
  respondents  Respondent[]
  generatedReports GeneratedReport[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum AssessmentStatus {
  collecting
  closed
}
```

### Department

```prisma
model Department {
  id           String   @id @default(uuid())
  assessmentId String
  assessment   Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  name         String                              // e.g. "Sales"
  createdAt    DateTime @default(now())
  respondents  Respondent[]
  @@unique([assessmentId, name])
}
```

**Rule:** a department row cannot be deleted once any `Respondent` references it. Enforced in the admin "remove department" endpoint.

### Respondent

```prisma
model Respondent {
  id              String   @id @default(uuid())
  assessmentId    String
  assessment      Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  code            String   @unique                 // 6-char alphanumeric, no 0/O/1/I/L
  name            String?                          // Optional, set during demographics step
  departmentId    String?
  department      Department? @relation(fields: [departmentId], references: [id])
  level           Level?
  tenure          TenureBand?
  startedAt       DateTime?                        // Set on first /take/welcome view
  submittedAt     DateTime?                        // Set on /take/done; locks editing
  responses       Response[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum Level {
  executive
  senior_leader
  manager
  team_lead
  individual_contributor
}

enum TenureBand {
  lt_1y
  y1_3
  y4_7
  y8_15
  gt_15y
}
```

### Response

```prisma
model Response {
  id            String   @id @default(uuid())
  respondentId  String
  respondent    Respondent @relation(fields: [respondentId], references: [id], onDelete: Cascade)
  questionId    String                              // e.g. "1a", "1b", ..., "15b" — matches src/data/questions.ts
  value         Int                                 // 1–5 Likert
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@unique([respondentId, questionId])
}
```

**Constraint:** `value` is application-validated to 1–5. Updates only allowed when `Respondent.submittedAt IS NULL` (during collection) or by an admin via the post-closure edit endpoint.

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

All admin routes are gated by NextAuth session + role check. Respondent routes are gated by code (and, where applicable, by `Respondent.submittedAt IS NULL`). Cron routes require the `CRON_SECRET` header.

### Admin — Assessments
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/assessments` | Create assessment (clientName, deadline, departments[], respondentCount). Generates respondent rows + 6-char codes. |
| `GET` | `/api/assessments` | List assessments visible to the caller (all admins see all). |
| `GET` | `/api/assessments/[id]` | Detail: assessment + respondents (status only). |
| `PATCH` | `/api/assessments/[id]` | Edit deadline, add a department, close manually. |
| `POST` | `/api/assessments/[id]/respondents` | Append additional respondents (still during collection). |
| `GET` | `/api/assessments/[id]/results?filter=…` | Aggregated numerical results for the active filter. Honors `≥3` guardrail. |
| `POST` | `/api/assessments/[id]/report?filter=…` | Generate AI report for the active filter. Watermarked draft if pre-closure. Caches into `GeneratedReport`. |
| `GET` | `/api/assessments/[id]/report?filter=…` | Fetch cached AI report (cache miss → 404, client offers "Generate"). |
| `POST` | `/api/assessments/[id]/report/pdf?filter=…` | Render PDF for the active filtered view (uses cached AI output). |
| `GET` | `/api/assessments/[id]/activity` | Audit log entries scoped to this assessment. |

### Admin — Respondents (post-closure edit only)
| Method | Path | Purpose |
|--------|------|---------|
| `PATCH` | `/api/respondents/[id]/answers` | Edit individual answers post-closure. Triggers cache invalidation for the assessment (with warning). Audit-logged. |
| `PATCH` | `/api/respondents/[id]/demographics` | Edit demographics post-closure. Same invalidation + audit behavior. |

### Admin — Settings + Admins (super admin only)
| Method | Path | Purpose |
|--------|------|---------|
| `GET` / `PATCH` | `/api/settings/ai` | Read / update active provider + per-provider API keys (encrypted at rest). |
| `POST` | `/api/settings/ai/test` | Round-trip a tiny test prompt against the configured provider; returns ok/error. |
| `GET` / `POST` | `/api/admins` | List / create regular admins. |
| `PATCH` | `/api/admins/[id]` | Deactivate admin. (Cannot deactivate the last super admin.) |

### Respondent
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/respondents/validate` | Validate code → returns minimal session payload + assessment status. Rate-limited (5/min/IP). |
| `POST` | `/api/respondents/[id]/start` | Sets `startedAt`, logs `respondent.start`. |
| `PATCH` | `/api/respondents/[id]/demographics` *(in-flow)* | Save demographics during the respondent flow. Distinct route from admin edit; only allowed when `submittedAt IS NULL`. |
| `PATCH` | `/api/respondents/[id]/responses` | Upsert one or more answers. Only when `submittedAt IS NULL` and assessment is `collecting`. |
| `POST` | `/api/respondents/[id]/submit` | Finalize: sets `submittedAt`, logs `respondent.submit`. Subsequent calls return 410. |

### Auth + Cron
| Method | Path | Purpose |
|--------|------|---------|
| All | `/api/auth/[...nextauth]` | NextAuth credentials provider handler. |
| `POST` | `/api/cron/closure` | Hourly cron. Flips `collecting → closed` on assessments past deadline. Requires `CRON_SECRET` header. |

---

## Server-side Modules

The product/content rules these modules implement live in `product-spec/`. The summaries below are about the **code shape**, not the rules.

### `src/lib/scoring.ts`
Pure functions, no DB access. Inputs are typed arrays of `{ respondentId, questionId, value }` plus the active filter; outputs are aggregates the API route serializes to JSON.

```ts
export function aggregateForFilter(
  responses: Response[],
  respondents: Respondent[],
  filter: ParsedFilter
): {
  sampleSize: number
  overall: number
  pillars:    Record<PillarKey, number>
  capabilities: Record<CapabilityKey, { score: number; spread: number }>
  focusAreas: CapabilityKey[]   // top-5 weakest, see product-spec/03 for tie-break rule
  band:       Record<string, BandKey>
}
```

**Rule reference:** see `product-spec/03_scoring_and_bands.md` for the math, band thresholds, and tie-break rule. **Do not** re-document those rules here — change the spec and the implementation together.

### `src/lib/filters.ts`
```ts
export function parseFilter(qs: URLSearchParams): ParsedFilter
export function filterSignature(f: ParsedFilter): string  // canonical sorted string used as cache key
export function applyFilter(respondents: Respondent[], f: ParsedFilter): Respondent[]
export function meetsAnonymityGuardrail(filtered: Respondent[]): boolean  // length >= 3
```

The `≥3` guardrail is enforced **in this module** and re-checked in every route that returns data. See `product-spec/11_anonymity_and_privacy.md`.

### `src/lib/codes.ts`
6-character alphanumeric, alphabet excludes `0 / O / 1 / I / L`. `generateCode()` retries on collision against the `Respondent.code @unique` index. Bulk generation for assessment creation pulls a batch and inserts inside a single transaction.

### `src/lib/crypto.ts`
AES-256-GCM. `encrypt(plaintext: string): Buffer` and `decrypt(buf: Buffer): string`. Master key read from `SETTINGS_ENCRYPTION_KEY` (base64-encoded 32 bytes). Used only for `Settings.encryptedApiKey*` columns.

### `src/lib/audit.ts`
```ts
export async function logAdminAction(actorAdminId, assessmentId, action, metadata?)
export async function logRespondentLifecycle(respondentId, action: 'start'|'submit')
```
Append-only. Never accepts an answer value as metadata.

### `src/lib/ai/`
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

- `prompt.ts` builds the **provider-neutral** system + user prompt from aggregates + anonymized respondents (letter labels, no names). See `product-spec/14_ai_prompts.md` for prompt content.
- `gemini.ts` / `claude.ts` / `openai.ts` adapt that prompt to each SDK and parse the response back into `AiReportOutput`.
- `cache.ts` reads/writes `GeneratedReport` keyed by `(assessmentId, filterSignature)`. Generation **always** writes (overwrites prior cache for that filter). See `product-spec/15_report_generation_and_caching.md`.

### `src/lib/pdf-template.tsx`
React-PDF template. Page-break rules: each pillar starts a new page, no orphan headers, tables don't split mid-row. Renders the currently filtered view; filter summary is in the page header.

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


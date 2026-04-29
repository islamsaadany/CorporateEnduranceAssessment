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

*Schema continues — API routes, scoring math, and AI integration in the sections below.*

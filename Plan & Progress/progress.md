# Execution Progress — The Endurance Assessment

> Live tracker of build progress, recent changes, and active blockers.
> Update this file in real-time as work moves through phases defined in `execution-plan.md`.

**Current phase:** Phase 5 — Closure cron + status logic **(landed; awaits live Vercel verification)**
**Last updated:** 2026-04-29
**Maintained by:** Whoever is actively working on the project (human or Claude Code session)

---

## 1. Current status

**Phase 0 complete.** All four root documents are rewritten:
- `CLAUDE.md` — Endurance Assessment working guidelines (working-guidelines section preserved verbatim from reference; project context, stack, env vars, patterns, framework summary all rewritten).
- `PROJECT_DETAILS.md` — technical reference: stack, target directory layout, full Prisma schema for 8 tables, API route table, server-side module shapes, cache invalidation flow, build commands. Cross-references `product-spec/` for product behavior.
- `REUSABLE_PATTERNS.md` — applicability table added near the top mapping each of the 15 reference patterns to apply / partial / drop, plus list of new patterns specific to this project. Original 1,201 lines of pattern content untouched.
- `ENDURANCE_ASSESSMENT_SPEC.md` — replaced with a 53-line index pointing at `product-spec/`.

The `(1)` / `(5)` upload duplicates have been removed.

**In progress:** Phase 1 scaffold landed — Next.js 16 + Tailwind config, Prisma schema (8 tables matching `PROJECT_DETAILS.md`), `src/lib/prisma.ts`, shared `types.ts` + `constants.ts`, minimal `app/layout.tsx` + landing page, `prisma/seed.ts` (super admin + sample assessment with 5 respondents, 3 submitted), `.env.example`, `.gitignore`, README setup section.

**DB workflow (decided 2026-04-29):** the user has access to the Neon SQL editor only — no local terminal. Hand-runnable SQL files live in `prisma/sql/` (`000_initial_schema.sql` + `001_seed_sample_data.sql`) and are kept in sync with `prisma/schema.prisma` and `prisma/seed.ts` by the Claude session. When schema or seed changes, the session regenerates the SQL files and tells the user exactly which to paste into Neon. The `npm run db:*` scripts remain available for any future user with a local terminal.

**Awaiting:** User to paste `prisma/sql/000_initial_schema.sql` then `prisma/sql/001_seed_sample_data.sql` into the Neon SQL editor to apply the schema and seed data. Once confirmed (super admin + sample assessment present), Phase 2 (admin auth + dashboard) begins.

---

## 2. Phase checklist (rolled up from execution-plan.md)

### Phase 0 — Documentation
- [x] Alignment captured in `execution-plan.md`
- [x] `progress.md` skeleton created
- [x] `product-spec/` folder authored (16 files)
- [x] User review of `product-spec/` complete (merged via PR #1)
- [x] `CLAUDE.md` rewritten
- [x] `PROJECT_DETAILS.md` rewritten
- [x] `REUSABLE_PATTERNS.md` updated with applicability notes
- [x] Original `ENDURANCE_ASSESSMENT_SPEC.md` replaced with index

### Phase 1 — Foundation
- [x] Next.js 16 + Tailwind project scaffold
- [x] Prisma schema (admins, assessments, respondents, responses, departments, settings, audit_log, generated_reports)
- [ ] Neon DB connected, schema pushed *(awaits user — paste `prisma/sql/000_initial_schema.sql` then `prisma/sql/001_seed_sample_data.sql` into Neon SQL editor)*
- [x] Seed script: super admin + sample assessment

### Phase 2 — Admin auth + dashboard
- [x] NextAuth email/password (credentials provider, JWT session, bcrypt verification)
- [x] `/admin/login` and session handling
- [x] `/admin/dashboard` (active + closed assessments)
- [x] Role gating (super_admin vs. admin) — header nav exposes super-admin links only to super admins; `requireSuperAdmin()` server-side guard for protected pages
- [ ] Live Vercel verification: log in with seeded super admin → land on dashboard → see "Acme Corp (sample)" → sign out → log in again *(awaits user)*

### Phase 3 — Assessment lifecycle (admin side)
- [x] `/admin/assessments/new` form with departments, deadline, respondents
- [x] 6-char code generation per respondent (collision-checked)
- [x] Codes visible/copyable in admin UI (per-row Copy + "Copy all codes")
- [x] `/admin/assessments/[id]` detail page with status table
- [ ] Live Vercel verification: create a new assessment → land on detail page → see N codes → copy one → counts (not started / in progress / submitted) match seeded data *(awaits user)*

### Phase 4 — Respondent flow (happy path)
- [x] `/take` code entry
- [x] `/take/welcome` with privacy disclosure
- [x] `/take/demographics` (department / level / tenure / optional name)
- [x] `/take/question/[1..30]` Typeform-style flow
- [x] `/take/review` and `/take/done`
- [x] localStorage progress persistence + server-side answer save
- [ ] Live Vercel verification: enter cohort code → welcome → demographics → 30 questions (try 1–4 + "I don't know") → review → submit → see "Submitted" → admin dashboard reflects new submitted respondent *(awaits user)*

### Phase 5 — Closure cron + status logic
- [x] Hourly Vercel Cron flips status when deadline passes
- [x] Respondent submission blocked post-closure (410)
- [x] Manual "Close now" admin button (bonus — for testing without waiting on the cron)
- [ ] Live Vercel verification: edit an assessment to a past deadline → wait for hourly cron OR press "Close now" → assessment shows Closed → entering the cohort code as a respondent yields "This assessment has closed" *(awaits user)*

### Phase 6 — Numerical report (live)
- [ ] `/admin/assessments/[id]/results` with all 4 sections
- [ ] "Preliminary — N of M" banner during collection
- [ ] ≥3 respondent guardrail
- [ ] Filter UI (department / level / tenure / compound)
- [ ] Comparison view (two-filter side-by-side, quantitative only)

### Phase 7 — AI integration
- [ ] Settings table with AES-256 encrypted API keys
- [ ] `/admin/settings/ai` page (super admin only)
- [ ] Provider abstraction (`src/lib/ai/*`)
- [ ] AI report endpoint with caching
- [ ] "Generate report" button (draft vs. final)
- [ ] Watermark on draft reports

### Phase 8 — PDF export
- [ ] React-PDF template
- [ ] Page-break rules (no orphan headers, no split tables, pillar-per-page)
- [ ] Page numbers + footer
- [ ] Filter summary header

### Phase 9 — Edit + audit
- [ ] Post-closure admin edit flow
- [ ] Cache invalidation warning modal
- [ ] Audit log table + "Activity" tab

### Phase 10 — Admin management
- [ ] "Admins" tab visible to super admin only
- [ ] Add / deactivate admins
- [ ] Super admin invariant (cannot remove)

### Phase 11 — Polish
- [ ] 404 / 403 / 410 pages
- [ ] Loading + empty states
- [ ] Mobile respondent layout
- [ ] Rate limiting on code validation
- [ ] Accessibility pass

### Phase 12 — Handoff
- [ ] README with setup instructions
- [ ] Vercel preview URL
- [ ] Seeded super admin credentials
- [ ] Sample closed assessment with realistic data

---

## 3. Recent changes

Most recent entries at the top. Limit to 15 entries; archive older entries to a quarterly section if needed.

| Date | Phase | Change |
|------|-------|--------|
| 2026-04-29 | 5 | Phase 5 landed: `POST /api/cron/closure` (Bearer-auth via CRON_SECRET; finds collecting assessments past deadline; per-assessment $transaction sets status=closed + closedAt + writes assessment.close audit entry with metadata={trigger:'cron'}; idempotent; force-dynamic; GET=POST alias for manual curl testing). vercel.json adds `crons: [{path:'/api/cron/closure', schedule:'0 * * * *'}]`. Also `POST /api/assessments/[id]/close` for the manual close path (Bearer-not-needed, NextAuth session check; trigger:'manual'; 409 if already closed). New `CloseButton` client component on the admin detail page renders only while status='collecting' (with a confirm step before firing). Existing 410 guards in respondent routes (validate / demographics / responses / submit) already block post-closure activity. Build clean (23 routes; +/api/cron/closure, +/api/assessments/[id]/close). |
| 2026-04-29 | 3 | **Cohort code reversal + edit page + form UX** (per user feedback): switched from per-respondent codes to one cohort code per assessment with `maxUses` hard cap. Schema: `Assessment.code` (unique) + `Assessment.maxUses` added; `Respondent.code` dropped. New `prisma/sql/002_cohort_codes.sql` migrates the live DB in place (idempotent). 000 + 001 SQL regenerated. `POST /api/assessments` now creates ONE assessment + ONE code, no bulk respondent rows. New `PATCH /api/assessments/[id]` for editing client name + deadline + departments + maxUses, with rules: department in use cannot be removed (409), maxUses cannot drop below current respondent count. New `/admin/assessments/[id]/edit` page wraps the rules in UI (in-use departments shown locked). Detail page now shows the single cohort code with copy + capacity strip (Started / In progress / Submitted / Remaining). Form Enter-key fix: pressing Enter inside a department row appends a new row + focuses it (does nothing if current row is empty), and never submits the form. Decisions log gets a 2026-04-29 reversal entry. Build clean (10 routes). |
| 2026-04-29 | 3 | Phase 3 landed: `src/lib/codes.ts` (6-char generator over 31-char alphabet excluding 0/O/1/I/L, batch collision-checked against the unique `Respondent.code` index, retries up to 5 times); `src/lib/audit.ts` (`logAdminAction` + `logRespondentLifecycle` with typed action enums and JSON-safe metadata); `POST /api/assessments` (Zod validation, future-deadline check, dept dedup, transactional create wired to `assessment.create` audit log); `/admin/assessments/new` server page + `NewAssessmentForm` client (client name, future deadline, dynamic department list, respondent count 3–100); `/admin/assessments/[id]` detail page (status pill, totals strip not-started/in-progress/submitted, departments chips, respondent table with code + name + dept + level + tenure + status, per-row + bulk "Copy all codes" client buttons). Build clean (8 routes). |
| 2026-04-29 | 2 | Phase 2 landed: NextAuth v5 credentials provider with bcrypt + Zod; JWT session augmented with `id` + `role`; `proxy.ts` (Next 16's renamed middleware) gates `/admin/*` for unauthed users and bounces authed users away from `/admin/login`; `src/lib/admin-guard.ts` provides `requireAdmin()` / `requireSuperAdmin()` server-side helpers; `/admin/login` page (server component + client form using `signIn` from `next-auth/react`); `/admin/layout.tsx` with header nav (super-admin links visible only to super admins) + sign-out form action; `/admin/dashboard` listing collecting + closed assessments grouped by status. Verified with `npx tsc --noEmit` and `npm run build` (6 routes). |
| 2026-04-29 | 1 | DB workflow split into two surfaces: `npm run db:*` for users with a terminal, hand-runnable SQL files in `prisma/sql/` for users with only the Neon SQL editor. Generated `000_initial_schema.sql` (via `prisma migrate diff`) and `001_seed_sample_data.sql` (via `scripts/gen-seed-sql.mjs`). Documented in CLAUDE.md, README, and `prisma/sql/README.md`. |
| 2026-04-29 | 1 | Phase 1 scaffold landed: package.json (Next 16 / React 19 / Prisma 5 / NextAuth v5 / Tailwind 3), tsconfig, next.config.mjs, tailwind.config.ts, postcss.config.mjs, .eslintrc, .gitignore, .env.example. |
| 2026-04-29 | 1 | Prisma schema written for 8 tables (`Admin`, `Assessment`, `Department`, `Respondent`, `Response`, `Settings`, `GeneratedReport`, `AuditLog`) plus 5 enums. Mirrors `PROJECT_DETAILS.md`. |
| 2026-04-29 | 1 | `src/lib/prisma.ts`, `src/data/types.ts`, `src/data/constants.ts` (pillar/capability/band/level/tenure metadata, ≥3 guardrail constant). |
| 2026-04-29 | 1 | App skeleton: `src/app/layout.tsx`, `globals.css`, minimal landing `page.tsx` with "I have an access code" + "Admin login" CTAs. |
| 2026-04-29 | 1 | `prisma/seed.ts`: 1 super admin + Settings singleton + 1 sample assessment with 2 departments and 5 respondents (3 submitted → satisfies ≥3 guardrail). |
| 2026-04-29 | 1 | README rewritten with full local setup instructions. |
| 2026-04-29 | 0 | `ENDURANCE_ASSESSMENT_SPEC.md` replaced with 53-line index pointing at `product-spec/`. `(1)`/`(5)` upload duplicates removed. **Phase 0 complete.** |
| 2026-04-29 | 0 | `REUSABLE_PATTERNS.md` updated with per-pattern applicability table for The Endurance Assessment. |
| 2026-04-29 | 0 | `PROJECT_DETAILS.md` rewritten: 8-table Prisma schema, API routes, module shapes, cache invalidation flow, cross-refs to `product-spec/`. |
| 2026-04-29 | 0 | `CLAUDE.md` rewritten for The Endurance Assessment (working-guidelines section preserved verbatim). |
| 2026-04-28 | 0 | `progress.md` skeleton created. |
| 2026-04-28 | 0 | `execution-plan.md` written, capturing 25+ alignment decisions from initial product discussion. |
| 2026-04-28 | 0 | `Plan & Progress/` and `product-spec/` folders created. |

---

## 4. Active blockers

None blocking the build.

### Deferred items (revisit before any production deploy)

- **Rotate the Neon `neondb_owner` password.** A connection string with the live password was pasted into a chat transcript on 2026-04-29 and should be considered compromised. User explicitly chose to defer rotation to keep momentum. Action: reset the role password in Neon Console → Roles → `neondb_owner`, then update `POSTGRES_URL` and `DATABASE_URL_UNPOOLED` in Vercel env vars (and `.env.local` if/when used). **This must happen before any non-local data is in the DB.**
- **Rotate the three secrets generated in chat.** On 2026-04-29 the values for `NEXTAUTH_SECRET`, `SETTINGS_ENCRYPTION_KEY`, and `CRON_SECRET` were generated in this transcript and pasted by the user into Vercel env vars. They must be considered exposed. Action: regenerate (`openssl rand -base64 32` for each) and update Vercel env vars, then redeploy. After rotation, no AI-provider keys will work that were encrypted under the old `SETTINGS_ENCRYPTION_KEY` — re-save them in the admin panel.

> When something blocks progress, add an entry here describing: what's blocked, why, what unblocks it, who needs to act. Remove when resolved.

---

## 5. Notes for the next session

If you're a Claude Code session picking this up:

1. **Read `execution-plan.md` first.** It contains every alignment decision made with the user.
2. **Read `product-spec/` files relevant to your current phase.** Each file is self-contained.
3. **Read `CLAUDE.md`** for working guidelines (alignment-before-action, change review protocol, UI version tracking).
4. **Update this file** as you work — mark completed checkboxes, log changes in section 3, surface blockers in section 4.
5. **Never silently change a decision** captured in `execution-plan.md`. If something needs to change, raise it with the user first.

---

*End of progress tracker.*

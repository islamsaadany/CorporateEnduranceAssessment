# Execution Progress — The Endurance Assessment

> Live tracker of build progress, recent changes, and active blockers.
> Update this file in real-time as work moves through phases defined in `execution-plan.md`.

**Current phase:** Phase 5 complete · ready to merge to `main` · **Phase 6 (live numerical report) is next**
**Last updated:** 2026-04-29
**Maintained by:** Whoever is actively working on the project (human or Claude Code session)

---

## 1. Current status

**Phases 0–5 complete and pushed.** The branch is being merged to `main`.

What's built and live on Vercel:
- **Documentation foundation** — `Plan & Progress/`, `product-spec/` (16 files), `CLAUDE.md`, `PROJECT_DETAILS.md`, `REUSABLE_PATTERNS.md`, `ENDURANCE_ASSESSMENT_SPEC.md` (slim index).
- **App scaffold** — Next.js 16 (App Router) + React 19 + TypeScript 5.9 + Tailwind 3 + Prisma 5 on Neon Postgres + NextAuth v5. Landing page + admin chrome.
- **Admin auth + dashboard** — Email/password login, JWT session augmented with role, `proxy.ts` (Next 16's renamed middleware) gating `/admin/*`, role-aware nav, sign-out form action, dashboard listing collecting + closed assessments.
- **Assessment lifecycle (admin)** — Create form (clientName, deadline, dynamic departments, maxUses), detail page with cohort-code card + capacity strip + respondent table (filtered to demographics-completed, status pill Started/Submitted, Date column), edit page (clientName, deadline, departments add/remove with in-use protection, maxUses with floor), manual "Close now" with confirm.
- **Respondent flow** — `/take` code entry → `/take/welcome` privacy disclosure → `/take/demographics` (name + dept + level + tenure required) → `/take/question/[1..30]` (Typeform-style, 1–4 + "I don't know" tiles, keyboard 1–4/0, Q30 auto-submits with explicit Submitting state, Back navigation between) → `/take/done`. localStorage resumes the in-flight session per browser.
- **Closure cron + manual close** — `/api/cron/closure` (Bearer-auth, **daily at 00:00 UTC** per `vercel.json` — Vercel Hobby plan only allows daily crons) flips collecting assessments past their deadline → closed, audited as `trigger:'cron'`. Manual close routes through `/api/assessments/[id]/close` with `trigger:'manual'`. All four respondent routes 410 on closed. Trade-off: there's now up to a 24h window where a past-deadline assessment still shows status='collecting' and accepts submissions; the manual close button covers any case where this matters.

**DB workflow:** the user has access only to the Neon SQL editor (no local terminal). Hand-runnable SQL files live in `prisma/sql/` and are kept in sync by the Claude session whenever the schema or seed changes. The user has applied `000` + `001` (initial), `002` (cohort codes), `003` (Likert), `004` (levels + demographicsCompletedAt). 5 SQL files are tracked in `prisma/sql/` for future fresh installs and reproducibility.

**Branch:** `claude/continue-claude-docs-NyBFb`. Ready to merge to `main`. New session should branch from main.

**Next session starts at Phase 6** — the live numerical report (`/admin/assessments/[id]/results`): aggregated pillar/capability scores, focus areas, anonymized respondent table, "Preliminary — N of M responded" banner during collection, ≥3 anonymity guardrail, filter UI (department/level/tenure/compound), comparison view (two-filter side-by-side, quantitative only).

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

### Phase 1 — Foundation ✅
- [x] Next.js 16 + Tailwind project scaffold
- [x] Prisma schema (8 tables: Admin, Assessment, Department, Respondent, Response, Settings, GeneratedReport, AuditLog)
- [x] Neon DB connected, schema pushed (via `prisma/sql/000` + `001` paste-into-Neon)
- [x] Seed script: super admin + sample assessment

### Phase 2 — Admin auth + dashboard ✅
- [x] NextAuth email/password (credentials provider, JWT session, bcrypt verification)
- [x] `/admin/login` and session handling
- [x] `/admin/dashboard` (active + closed assessments)
- [x] Role gating (super_admin vs. admin) — header nav exposes super-admin links only to super admins; `requireSuperAdmin()` server-side guard for protected pages
- [x] Live verified

### Phase 3 — Assessment lifecycle (admin side) ✅
- [x] `/admin/assessments/new` form (clientName, deadline, dynamic departments, maxUses)
- [x] **One cohort code per assessment** (reversed from per-respondent, see decisions log)
- [x] Cohort code visible/copyable on the detail page
- [x] `/admin/assessments/[id]` detail page (status, capacity strip, departments, respondent table)
- [x] `/admin/assessments/[id]/edit` page (clientName, deadline, departments add/remove with in-use protection, maxUses with floor)
- [x] Manual "Close now" button with confirm
- [x] Live verified

### Phase 4 — Respondent flow (happy path) ✅
- [x] `/take` code entry (case-insensitive)
- [x] `/take/welcome` with privacy disclosure
- [x] `/take/demographics` (name **required**, department dropdown, 4-tier Level, banded TenureBand)
- [x] `/take/question/[1..30]` Typeform-style flow with 1–4 tiles + "I don't know" + keyboard shortcuts
- [x] **No review screen** — Q30 auto-submits with explicit Submitting state to prevent double-click
- [x] `/take/done` with localStorage cleanup
- [x] localStorage resume per browser via `tea_respondent_<UPPERCASED_CODE>`
- [x] Live verified

### Phase 5 — Closure cron + status logic ✅
- [x] Hourly Vercel Cron flips status when deadline passes (`vercel.json` + `/api/cron/closure`)
- [x] Respondent submission blocked post-closure (410 on validate / demographics / responses / submit)
- [x] Manual "Close now" admin button (audit-logged with `trigger:'manual'`)
- [x] Live verified

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
- **Deadline-vs-status drift (small).** The closure cron runs daily (Vercel Hobby plan limit). Between an assessment's deadline passing and the next cron run, the DB still has `status='collecting'`, so the four respondent routes (validate / demographics / responses / submit) accept activity even though the deadline is past. **Mitigations available today:** admin can press "Close now" any time; cap (`maxUses`) bounds the worst case. **Possible follow-up:** add a `deadline > now` check alongside `status !== 'closed'` in those four routes, so the deadline becomes a hard cutoff regardless of cron timing. Tracked here in case the wider window matters in practice. Phase 11 (polish) would be a natural place.

> When something blocks progress, add an entry here describing: what's blocked, why, what unblocks it, who needs to act. Remove when resolved.

---

## 5. Notes for the next session

If you're a Claude Code session picking this up:

1. **Read `execution-plan.md` first.** It contains every alignment decision made with the user, including reversals (cohort code, 1–4 Likert, 4-tier Level, capability-name drift fix).
2. **Read `CLAUDE.md`** — the "Important Patterns" section captures the actual built behavior, not the early-draft plan.
3. **Read the relevant `product-spec/` files** — `product-spec/02_questions.md` + `03_scoring_and_bands.md` + `09_demographics.md` are the canonical product rules. If they disagree with code, the spec wins.
4. **Read `PROJECT_DETAILS.md` § Database Schema and § API Routes** — actual schema and endpoints (✅ implemented vs. ⏳ planned).
5. **DB workflow:** the user has Neon SQL editor only — no local terminal. When you change `prisma/schema.prisma` or `prisma/seed.ts`, regenerate `prisma/sql/000_initial_schema.sql` (via `npx prisma migrate diff`) and `001_seed_sample_data.sql` (via `node scripts/gen-seed-sql.mjs`). For non-fresh databases, write a numbered diff migration (`005_*.sql`, `006_*.sql`, …) — see `prisma/sql/README.md`. Never attempt `prisma db push` directly; tell the user which file(s) to paste into Neon.
6. **Sandbox build verification:** before committing, run `npx tsc --noEmit` and `POSTGRES_URL=... DATABASE_URL_UNPOOLED=... NEXTAUTH_SECRET=... SETTINGS_ENCRYPTION_KEY=... CRON_SECRET=... npm run build` (placeholders are fine — the build doesn't connect, it just needs the env vars to exist).
7. **Update this file** as you work — mark completed checkboxes, log changes in section 3, surface blockers in section 4.
8. **Never silently change a decision** captured in `execution-plan.md`. If something needs to change, raise it with the user first. Multiple reversals already happened in this session — appending a new decisions-log row noting the reversal is mandatory.

### What's next (Phase 6 — Live numerical report)

The build sequence in `execution-plan.md` lists Phase 6 as `/admin/assessments/[id]/results` with all 4 sections + ≥3 guardrail + filter UI + comparison view. New files needed (none of which exist yet):

- `src/lib/scoring.ts` — pure aggregation (NULL-safe means; per-capability ≥3 floor)
- `src/lib/filters.ts` — `parseFilter`, `filterSignature`, `applyFilter`, `meetsAnonymityGuardrail`
- `src/app/admin/assessments/[id]/results/page.tsx` — the results page itself
- `src/app/api/assessments/[id]/results/route.ts` — server endpoint returning aggregates JSON
- Plus filter/comparison UI components

The 30 questions are already in `src/data/questions.ts`. Sample data (5 respondents, 3 submitted, 12 NULL "I don't know" answers sprinkled in) is already in the DB.

---

*End of progress tracker.*

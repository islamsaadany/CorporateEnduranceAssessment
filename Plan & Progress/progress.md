# Execution Progress — The Endurance Assessment

> Live tracker of build progress, recent changes, and active blockers.
> Update this file in real-time as work moves through phases defined in `execution-plan.md`.

**Current phase:** Phase 1 — Foundation **(scaffold landed)**
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
- [ ] NextAuth email/password
- [ ] `/admin/login` and session handling
- [ ] `/admin/dashboard` (active + closed assessments)
- [ ] Role gating (super_admin vs. admin)

### Phase 3 — Assessment lifecycle (admin side)
- [ ] `/admin/assessments/new` form with departments, deadline, respondents
- [ ] 6-char code generation per respondent (collision-checked)
- [ ] Codes visible/copyable in admin UI
- [ ] `/admin/assessments/[id]` detail page with status table

### Phase 4 — Respondent flow (happy path)
- [ ] `/take` code entry
- [ ] `/take/welcome` with privacy disclosure
- [ ] `/take/demographics` (department / level / tenure / optional name)
- [ ] `/take/question/[1..30]` Typeform-style flow
- [ ] `/take/review` and `/take/done`
- [ ] localStorage progress persistence + server-side answer save

### Phase 5 — Closure cron + status logic
- [ ] Hourly Vercel Cron flips status when deadline passes
- [ ] Respondent submission blocked post-closure (410)

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

- **Rotate the Neon `neondb_owner` password.** A connection string with the live password was pasted into a chat transcript on 2026-04-29 and should be considered compromised. User explicitly chose to defer rotation to keep momentum. Action: reset the role password in Neon Console → Roles → `neondb_owner`, then update `DATABASE_URL` in `.env.local` (and Vercel env vars when deployed). **This must happen before any non-local data is in the DB.**

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

# Execution Plan — The Endurance Assessment

> Single source of truth for product alignment, technical decisions, and build sequencing.
> Refer back to this file at the start of any session before making changes.

**Product:** The Endurance Assessment (web app for Forefront Consulting)
**Status:** Pre-build — alignment complete, ready for product-spec review
**Plan version:** 0.1 (initial alignment)
**Last updated:** 2026-04-28

---

## 1. What this product is

A team-based diagnostic that measures an organization's endurance across three pillars — **Agility**, **Toughness**, **Resilience** — by aggregating responses from a group of senior leaders into an Organizational Endurance Profile.

A Forefront consultant (admin) creates an assessment for a client, generates per-respondent access codes, distributes them manually, monitors responses during the collection window, and after closure generates an AI-assisted report (with quantitative aggregation visible at any time, AI narrative locked until closure unless explicitly drafted early).

The product is **organizational**, **anonymous in aggregate**, **deadline-driven**, and produces **multi-variant filtered reports** suitable for boardroom presentation.

---

## 2. Decisions log

Each entry: date, area, decision, why.

| Date | Area | Decision |
|------|------|----------|
| 2026-04-28 | Stack | Next.js 16 (App Router) + TypeScript + Tailwind + Prisma + Neon Postgres + NextAuth + Vercel Cron + `@react-pdf/renderer`. Carries over from reference Strategic Thinking Profile project; Tailwind chosen over inline themes for speed. |
| 2026-04-28 | Auth | Single super admin (first/seeded, role permanent in v1) + multiple regular admins. Super admin only manages other admins + AI configuration. |
| 2026-04-28 | Email | **No emails sent by the application, ever.** Codes distributed manually by the admin (visible/copyable in admin UI). Drops Resend dependency, reminder-email cron, all email templates from original spec section 8. |
| 2026-04-28 | Codes | 6-character alphanumeric per-respondent (excludes `0/O/1/I/L`). One code = one respondent, not a cohort code. |
| 2026-04-28 | Demographics | Collected after code validation, before question 1. Fields: Name (optional) · Department (admin-defined list per assessment) · Level (fixed list) · Tenure (banded). No gender, no region. |
| 2026-04-28 | Department list | Admin defines the department list when creating the assessment. Can add new departments anytime during collection. Cannot remove a department once any respondent has used it. |
| 2026-04-28 | Level list | Fixed across all assessments: Executive / Senior Leader / Manager / Team Lead / Individual Contributor. |
| 2026-04-28 | Tenure bands | <1y / 1–3y / 4–7y / 8–15y / 15+y. |
| 2026-04-28 | Scoring | 30 statements (locked content, 3 pillars × 5 capabilities × 2 angles), 1–5 Likert. Capability score = mean of 2 angles. Pillar score = mean of 5 capability scores. Overall = mean of 3 pillar scores. Spread = max − min within capability across respondents. |
| 2026-04-28 | Bands | Critical Gap (1.00–1.99) · Needs Work (2.00–2.99) · Solid (3.00–3.99) · Strong (4.00–5.00). Applied uniformly to all score levels. |
| 2026-04-28 | Focus areas | Top-5 weakest capabilities. Tie-break: spread descending, then alphabetical. Recomputed per active filter. |
| 2026-04-28 | Drop from reference | Archetypes, role-adjusted thresholds, tabbed guided flow, question shuffling, single-page phase model, all email features, all AI narrative reuse (we'll write a fresh prompt for this product). |
| 2026-04-28 | Numerical report | Available **anytime** during collection, with banner: *"Preliminary — N of M responded"*. Overrides original spec section 7.3. |
| 2026-04-28 | AI report | Generatable anytime. Pre-closure = clearly watermarked draft based on partial responses. Post-closure = final. Each generation overwrites the cache for that filter. |
| 2026-04-28 | AI provider | Admin-configurable in the panel. Provider options: Gemini, Claude, OpenAI. Admin supplies API key + provider selection only — model name is hardcoded per provider. Bootstrap: env-var fallback with persistent banner directing super admin to save in panel. Default starting provider: Google Gemini. |
| 2026-04-28 | AI input | Aggregated scores + spread + top-5 weakest capabilities + filter applied + sample size + **anonymized individual responses** with demographics labeled by letter (e.g., "Respondent A: Sales · Manager · 4–7y"). Names never sent to LLM. |
| 2026-04-28 | AI output | Executive summary paragraph + AI-adapted action items for top-5 focus areas. Full narrative report deferred to v2. |
| 2026-04-28 | Filtering | By department / level / tenure + compound filters (e.g., Sales × Manager × 4–7y). All filters recompute pillar/capability/spread/focus areas. AI report regenerates on demand per filter. |
| 2026-04-28 | Comparison view | v1: side-by-side two-filter comparison, **quantitative only** (no twin AI narratives). |
| 2026-04-28 | Anonymity | ≥3 respondents required for any view (company-wide AND filtered). Below 3, view replaced by lock message. |
| 2026-04-28 | Cache | Unlimited cached generated reports per assessment (no eviction). Cache key = `(assessment_id, filter_signature)`. Invalidated by any respondent answer/demographic edit (with admin warning). |
| 2026-04-28 | Edit window | Admins can edit individual respondent answers + demographics **post-closure only**. Edits invalidate cached AI reports for that assessment (with warning modal). All edits captured in audit log. |
| 2026-04-28 | PDF | "Standard polish": page numbers, no orphaned headings, tables don't split mid-row, each pillar starts a new page. Rendering: AI → JSON → React-PDF. Exports the currently active filtered view, labeled with the filter at the top. |
| 2026-04-28 | Audit log | Logs admin actions (create, edit, delete, generate, config changes, admin-management) AND respondent submission lifecycle events (started, submitted) — never individual answer values. Surfaced as "Activity" tab on the assessment detail page. |
| 2026-04-28 | Privacy disclosure | Welcome screen line: *"Your responses are anonymized and aggregated. The team report uses AI assistance to interpret patterns."* |
| 2026-04-28 | Question order | Fixed order across all respondents, grouped by pillar (Agility 1a–5b → Toughness 6a–10b → Resilience 11a–15b). |
| 2026-04-28 | Reference docs | Carry over working-guidelines section of `CLAUDE.md` verbatim. Rewrite project-specific sections. Keep `REUSABLE_PATTERNS.md` portable, add applicability notes. Replace original `ENDURANCE_ASSESSMENT_SPEC.md` with index pointing to `product-spec/` folder. |
| 2026-04-29 | Codes (REVERSAL) | Reversed 2026-04-28 "one code per respondent" decision. New model: **one cohort code per assessment**, every respondent uses the same code, `Assessment.maxUses` enforces a hard cap that the admin sets explicitly at creation (does not auto-grow). Why: distribution friction with the per-respondent model — admin has to send N different codes to N people. Trade-offs accepted: lose the "who hasn't responded yet" view; lose ability to revoke an individual code; same person could submit twice from different browsers. Mitigations: reports already require ≥3 respondents, so single-person duplicate skew is bounded; localStorage continues an in-flight Respondent within the same browser. Schema: `Assessment.code` (unique) + `Assessment.maxUses` added; `Respondent.code` dropped. Migration in `prisma/sql/002_cohort_codes.sql`. |
| 2026-04-29 | Capabilities (drift fix) | Fixed a documentation drift discovered during Phase 4 prep. The original Phase 0 rewrite of `CLAUDE.md` and `src/data/constants.ts` used capability names from an early execution-plan draft (Sensing / Decisiveness / Reconfiguration / Learning Velocity / External Orientation, etc.) that did not match `product-spec/01_pillars_and_capabilities.md` and `product-spec/02_questions.md` (Decision Velocity / Market & Signal Intelligence / Adaptive Governance / Experimentation Muscle / Delegation & Empowerment, etc.). The product-spec set was the user-reviewed, merged version (PR #1). Realigned code + CLAUDE.md to match product-spec exactly. No DB migration required — capability names are not stored in the DB; only `questionId` text values like "1a" are. The `CapabilityKey` TypeScript union changed values, so any downstream code using the old keys would have been a compile error (none existed at the time of fix). |
| 2026-04-29 | Likert scale | Switched from a 1–5 Likert (with "3 = Neutral") to a **1–4 Likert + "I don't know"**. Reason: pilot use of 5-point scales for organizational diagnostics shows central-tendency bias — respondents cluster on 3 to avoid taking a position, flattening the report. Forcing a lean (with an explicit "I don't know" escape hatch for genuine uncertainty) produces sharper findings. Decisions: (1) "I don't know" is stored as `Response.value = NULL`; row existence still means "answered". (2) Scoring excludes NULLs from every mean — capability score is mean of rated answers; a respondent with both angles "I don't know" doesn't contribute to that capability. (3) Per-capability anonymity floor: a capability is shown only if ≥3 respondents rated it (else "Insufficient data"). (4) Headline ≥3-respondent guardrail counts SUBMITTED respondents regardless of how many "I don't know"s they picked. (5) Submission completeness: all 30 questions must have an answer (1–4 OR "I don't know") before submit. (6) Bands re-cut to even quartiles over 1.00–4.00: Critical 1.00–1.74 / Needs 1.75–2.49 / Solid 2.50–3.24 / Strong 3.25–4.00. Migration: `prisma/sql/003_likert_scale.sql` makes `Response.value` nullable, clamps any legacy 5s to 4, adds a CHECK (value IS NULL OR value BETWEEN 1 AND 4). product-spec/02 + 03 updated; constants + types + seed regenerated. |
| 2026-04-29 | Levels + demographics + take-flow UX | Five small changes after Phase 4 live-testing, batched together because they share files: (1) **Levels collapsed from 5 to 4** merged tiers — Individual Contributor / Early Career, Team Leader / Supervisor, Manager / Department Head, Senior Leader / Executive. The merged labels match the original methodology reference. Migration `prisma/sql/004_levels_and_demographics.sql` recreates the Postgres enum and remaps existing rows (executive→senior_leader, team_lead→team_leader). (2) **Likert tiles single-row** — four tiles in one horizontal row on desktop, 2×2 grid below 480px. (3) **Skip review screen** — selecting an answer for question 30 auto-submits and lands on `/take/done`. The `/take/review` page is deleted. Mid-flow Back navigation still allows edits before Q30. Trade-off accepted: once Q30 is selected, no take-back; admin post-closure edit is the recovery path. (4) **"Started" semantics + name required** — added `Respondent.demographicsCompletedAt` timestamp. The admin table + cap check now filter on `demographicsCompletedAt IS NOT NULL`, so ghost rows from "validated-then-bounced" respondents don't appear in the table or burn a cap slot. Name is now required at the API layer (DB column stays nullable to preserve existing data; Zod enforces non-empty). (5) **Admin detail table columns**: dropped "Started" date column, added "Submitted" date column; status pill is now binary (Started / Submitted) rather than three-state. product-spec/09 updated. |

---

## 3. Tech stack (final)

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.9+ |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Neon, serverless) |
| ORM | Prisma 5.x |
| Auth (admin) | NextAuth.js v5, email/password credentials provider |
| Auth (respondent) | 6-char access code (no app account) |
| AI provider abstraction | Gemini default · Claude · OpenAI — selectable in admin panel |
| PDF | `@react-pdf/renderer` (server-side) |
| Scheduled jobs | Vercel Cron (hourly closure check) |
| Hosting | Vercel |
| Encryption (API keys at rest) | AES-256, master key in env var |
| Email | **None** |

---

## 4. Folder layout (target state)

```
CorporateEnduranceAssessment/
├── Plan & Progress/
│   ├── execution-plan.md            # This file
│   └── progress.md                  # Live execution tracker
├── product-spec/                    # Product content + behavior (non-technical)
│   ├── 00_overview.md
│   ├── 01_pillars_and_capabilities.md
│   ├── 02_questions.md
│   ├── 03_scoring_and_bands.md
│   ├── 04_recommendations.md
│   ├── 05_report_structure.md
│   ├── 06_report_filters_and_segments.md
│   ├── 07_admin_workflows.md
│   ├── 08_respondent_workflows.md
│   ├── 09_demographics.md
│   ├── 10_code_distribution.md
│   ├── 11_anonymity_and_privacy.md
│   ├── 12_design_language.md
│   ├── 13_glossary.md
│   ├── 14_ai_prompts.md
│   └── 15_report_generation_and_caching.md
├── CLAUDE.md                        # (to be rewritten)
├── PROJECT_DETAILS.md               # (to be rewritten — technical only)
├── REUSABLE_PATTERNS.md             # (to be lightly updated with applicability notes)
├── ENDURANCE_ASSESSMENT_SPEC.md     # (to be replaced with slim index → product-spec/)
└── README.md
```

---

## 5. Build sequence (phased)

Each phase ends with a working, testable slice. After each phase, run `npx tsc --noEmit` and `npm run build`.

### Phase 0 — Documentation (current phase)
- [x] Alignment captured in this file
- [ ] `product-spec/` folder authored
- [ ] `Plan & Progress/progress.md` skeleton ready
- [ ] User reviews `product-spec/` and approves
- [ ] `CLAUDE.md` rewritten
- [ ] `PROJECT_DETAILS.md` rewritten
- [ ] `REUSABLE_PATTERNS.md` updated with applicability notes
- [ ] Original `ENDURANCE_ASSESSMENT_SPEC.md` replaced with index file

### Phase 1 — Foundation
- Next.js 16 + Tailwind project scaffold
- Prisma schema (admins, assessments, respondents, responses, departments, settings, audit_log, generated_reports)
- Neon DB connected, schema pushed
- Seed script: super admin user + sample assessment with sample responses for testing

### Phase 2 — Admin auth + dashboard
- NextAuth email/password
- `/admin/login` and session handling
- `/admin/dashboard` listing active + closed assessments
- Admin role gating (super_admin vs. admin)

### Phase 3 — Assessment lifecycle (admin side)
- `/admin/assessments/new` — form with departments, deadline, respondent count
- 6-char code generation per respondent (collision-checked)
- Admin sees codes per respondent, can copy
- `/admin/assessments/[id]` detail page with respondent status table

### Phase 4 — Respondent flow (happy path)
- `/take` code entry
- `/take/welcome` with privacy disclosure
- `/take/demographics` (department / level / tenure / optional name)
- `/take/question/[1..30]` Typeform-style flow
- `/take/review` and `/take/done` confirmation
- localStorage progress persistence + server-side answer save

### Phase 5 — Closure cron + status logic
- Hourly Vercel Cron job flips `status: collecting → closed` past deadline
- Respondent attempts to submit post-closure → 410 response

### Phase 6 — Numerical report (live)
- `/admin/assessments/[id]/results` with Summary + Capability Profile + Focus Areas + Anonymized Individuals tabs
- "Preliminary — N of M" banner during collection
- ≥3 respondent guardrail
- Filter UI: department / level / tenure (single + compound)
- Comparison view (two-filter side-by-side, quantitative only)

### Phase 7 — AI integration
- Settings table with provider config + AES-256 encryption for API keys
- `/admin/settings/ai` page (super admin only): provider picker, API key, test connection
- Provider abstraction layer (`src/lib/ai/{gemini,claude,openai}.ts`)
- AI report generation endpoint with caching
- "Generate report" button on results page (draft vs. final logic)
- Watermark on draft reports

### Phase 8 — PDF export
- React-PDF template matching report sections
- Page-break rules: each pillar starts new page, no orphaned headers, tables don't split
- Page numbers + footer
- Filter summary header

### Phase 9 — Edit + audit
- Post-closure admin edit flow for respondent answers + demographics
- Cache invalidation with warning modal
- Audit log table + "Activity" tab on assessment detail

### Phase 10 — Admin management
- Super admin's "Admins" tab: list, add, deactivate
- Single super admin invariant (cannot remove the super admin)

### Phase 11 — Polish
- 404 / 403 / 410 pages
- Loading states, empty states
- Mobile layout for respondent flow (admin desktop-only OK)
- Rate limiting on code validation (5/min/IP)
- Accessibility pass (keyboard nav, ARIA, contrast)

### Phase 12 — Handoff
- README with setup instructions
- Vercel preview URL
- Seeded super admin credentials for client review
- Sample closed assessment with realistic data for results-page demo

---

## 6. Out of scope (v1)

Explicit list to prevent scope creep:

- ❌ **All emails** (no invitation, no reminder, no closure notification, no PDF email)
- ❌ Reminder/notification system of any kind
- ❌ AI-generated full narrative report (only summary + action items in v1; full narrative is v2)
- ❌ AI-generated comparison view narratives (v1 comparison is quantitative only)
- ❌ Self-service team-leader-initiated assessments
- ❌ Multi-tenant scoping per admin (all admins see all assessments)
- ❌ Custom branding per client
- ❌ Arabic language support
- ❌ SSO / Google login
- ❌ Password reset flow (manual DB intervention in v1)
- ❌ Respondent ability to view results
- ❌ Benchmarking across clients
- ❌ Historical comparison (assessment over time)
- ❌ Export to PowerPoint
- ❌ Eviction policy on cached reports (unlimited)
- ❌ Super admin role transfer mechanism (manual DB intervention if needed)
- ❌ Editing respondent answers during collection (post-closure only)
- ❌ In-app analytics tracking, third-party telemetry
- ❌ Cookies beyond session auth

---

## 7. Open questions

None at the time of this writing. Add new ones here as they arise during execution; resolve them with the user before implementing.

---

## 8. How to use this file

- **At session start:** Read this file fully before doing anything else.
- **Before any change:** Cross-reference the decisions log. If your change conflicts with a decision, surface it to the user before proceeding.
- **When a new decision is made:** Add a row to section 2 with date, area, decision.
- **When a phase completes:** Update section 5 checkboxes; mirror in `progress.md`.
- **When something is added to or removed from scope:** Update section 6.
- **Never edit retroactively** — if a decision is reversed, append a new row noting the reversal and reason rather than overwriting the original.

---

## 9. Linked documents

- `progress.md` — live execution tracker (this file's complement)
- `product-spec/` — what the product does, what it says, what it shows (non-technical)
- `CLAUDE.md` — Claude Code working guidelines (post-rewrite)
- `PROJECT_DETAILS.md` — technical reference (schema, routes, stack details, post-rewrite)
- `REUSABLE_PATTERNS.md` — portable patterns from the Strategic Thinking Profile project, with applicability notes added

---

*End of execution plan.*

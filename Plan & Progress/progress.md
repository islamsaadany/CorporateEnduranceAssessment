# Execution Progress — The Endurance Assessment

> Live tracker of build progress, recent changes, and active blockers.
> Update this file in real-time as work moves through phases defined in `execution-plan.md`.

**Current phase:** Phase 7 complete · Phase 6.5 (report polish) next
**Last updated:** 2026-05-03
**Maintained by:** Whoever is actively working on the project (human or Claude Code session)

---

## 1. Current status

**Phases 0–6 complete and pushed.** The branch is being merged to `main`.

What's built and live on Vercel:
- **Documentation foundation** — `Plan & Progress/`, `product-spec/` (16 files), `CLAUDE.md`, `PROJECT_DETAILS.md`, `REUSABLE_PATTERNS.md`, `ENDURANCE_ASSESSMENT_SPEC.md` (slim index).
- **App scaffold** — Next.js 16 (App Router) + React 19 + TypeScript 5.9 + Tailwind 3 + Prisma 5 on Neon Postgres + NextAuth v5. Landing page + admin chrome.
- **Admin auth + dashboard** — Email/password login, JWT session augmented with role, `proxy.ts` (Next 16's renamed middleware) gating `/admin/*`, role-aware nav, sign-out form action, dashboard listing collecting + closed assessments.
- **Assessment lifecycle (admin)** — Create form, detail page with cohort-code card + capacity strip + respondent table, edit page, manual "Close now" with confirm. Detail page now also has **View report** + **Compare segments** entry points.
- **Respondent flow** — `/take` code entry → `/take/welcome` → `/take/demographics` → `/take/question/[1..30]` → `/take/done`. localStorage resumes the in-flight session per browser.
- **Closure cron + manual close** — `/api/cron/closure` (Bearer-auth, **daily at 00:00 UTC** per Vercel Hobby) flips collecting assessments past their deadline → closed, audited as `trigger:'cron'`.
- **Live numerical report (Phase 6)** — `/admin/assessments/[id]/results` renders the four-section report (Summary hero with overall score + pillar breakdown + band legend, 3-column Capability Profile with spread / "Team is split" badges / Insufficient-data handling, Top-5 Focus Areas with baseline action items, Individual Responses table + capability heatmap). The pure scoring engine in `src/lib/scoring.ts` and the canonical filter signature in `src/lib/filters.ts` are shared with the JSON API at `/api/assessments/[id]/results` and with the comparison view, so the report page, the API, the (future) AI generation endpoint, and the (future) PDF export will never disagree on what "the numbers" are.
- **Filter UI (slice 6.3)** — `/admin/assessments/[id]/results` page header has a `Filter:` chip row + "Change filter" button. The modal has multi-select chips for Department / Level / Tenure with a live preview ("matches N respondents (anonymity floor met ✓)") that turns red below 3. URL is the source of truth (`?dept=Sales,Engineering&level=manager&tenure=y4_7`), so views are shareable and refresh-safe.
- **Comparison view (slice 6.4)** — `/admin/assessments/[id]/results/compare` shows two filters side-by-side (`?aDept=…&bDept=…`). Twin filter pickers reuse the same modal scoped per side. Hero / Pillar / Capability / Focus Areas sections render twin layouts; focus areas show "Only in A" / "Only in B" badges where the top-5 lists diverge. Quantitative only (no AI narrative comparison, no per-respondent table, no PDF export — spec 06 § 6.3).

**DB workflow:** the user has access only to the Neon SQL editor (no local terminal — see `CLAUDE.md` § 1d). Hand-runnable SQL files live in `prisma/sql/` and are kept in sync by the Claude session. Files applied: `000`–`004` plus `005_reset_super_admin_password.sql` (bcrypt-via-pgcrypto template, reusable for any admin password reset) and `006_acme_sample_data.sql` (50 submitted respondents × 8 departments seeded into Acme Corp (sample) so the report page exercises across realistic data variety).

**Branch:** `claude/continue-session-ZFhaK`. Ready to merge to `main`. New session should branch from main.

**Next session starts at Phase 7** — AI integration: `Settings` model is already in the schema; super-admin-only `/admin/settings/ai` page with provider dropdown + AES-256-GCM encrypted API-key column + connection test; `src/lib/ai/{index,prompt,gemini,claude,openai,cache}.ts` with provider abstraction; `POST /api/assessments/[id]/report?<filter signature>` to generate + cache; "Generate AI report" button in the report header (with watermarked draft pre-closure per spec 14). **Names must be stripped before any LLM call** (spec 11 § 5).

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

### Phase 6 — Numerical report (live) ✅
**Slicing:** 6.1 aggregation engine + JSON API → 6.2 results page → 6.3 filter UI → 6.4 comparison view. Each slice gates on `npx tsc --noEmit` + `npm run build`.

- [x] **6.1** — Aggregation engine + results JSON API
  - [x] Multi-value `ParsedFilter` (departments / levels / tenures); extended `AggregatedResults` with `ratedCount` + `insufficient` per capability and per-pillar `PillarResult`
  - [x] `src/lib/filters.ts` — URL parse, canonical query-string signature (`dept=A,B&level=manager`, sorted), human-readable description, Prisma `where` fragment
  - [x] `src/lib/scoring.ts` — pure aggregation; per-respondent → team math per `03_scoring_and_bands.md` § 2/§ 3 (team overall = mean of individual overalls); top-5 focus areas with spread-desc → alphabetical tie-break
  - [x] `GET /api/assessments/[id]/results` — submitted-only respondents, ≥3 floor lock, anonymized respondent rows
  - [x] Sanity-checked against the worked example in `03_scoring_and_bands.md` § 8: Overall 2.95, Agility 2.58, Toughness 3.82, Resilience 2.46, focus areas in spec rank order
- [x] **6.2** — Results page server-rendered at `/admin/assessments/[id]/results` (no filter UI yet)
  - [x] `src/lib/results-service.ts` — single source of truth used by both the page and the API route
  - [x] Section 1 hero (overall score + 3 pillar breakdown + band legend, dark-blue panel + ochre eyebrow)
  - [x] Section 2 Capability Profile (3 columns × 5 rows, sorted strongest-first per pillar; "Insufficient data" + spread/range when >1.0; "Team is split" badge when spread >1.5)
  - [x] Section 3 Focus Areas (top-5 ranked cards with baseline action items from `04_recommendations.md` § 3 — `BASELINE_ACTION_ITEMS` in `src/data/constants.ts`)
  - [x] Section 4 Individual Responses (table + capability heatmap; **names shown directly in v1** — anonymization with letter labels + reveal toggle deferred to a later phase by user direction; filed for follow-up)
  - [x] Banner stack: filter banner + Preliminary banner during collection (Draft AI banner lands in Phase 7)
  - [x] Lock card with three messages (no respondents / below floor / filter mismatch); applies to company-wide and filter views
  - [x] Spec/code drift caught + fixed: `CapabilityResult` extended with `min`/`max` so the report can render "Range: 1.5 – 3.5" per spec 05 § 4.1 instead of just spread
  - [x] Tailwind config extended with brand palette per spec 12 § 1 (`brand-dark-blue`, `brand-ochre`, etc) + Georgia serif font; existing `ink/canvas/band` tokens kept intact for other admin pages
  - [x] "View report" link added to assessment detail page
- [x] **6.3** — Filter UI (multi-select modal + active-chip row + URL-state)
  - [x] `loadResults` extended with `availableDepartments` (admin-defined list, even with 0 respondents) and `allSubmittedDemos` (per-respondent department/level/tenure, no names) so the modal can render every selectable value and compute live preview counts in the browser without extra round-trips
  - [x] `filterToQueryString` helper in `src/lib/filters.ts` — same canonical form as `filterSignature`, but empty string for company-wide so URLs don't carry a stray `?company_wide`
  - [x] `filter-modal.tsx` (client) — three multi-select chip sections with Select-all/Clear; live preview "matches N respondents (anonymity floor met ✓)" turning red below 3; Apply enabled only on change; Cancel + Esc + backdrop close; "Clear all filters" link in footer; Apply allowed below floor (admin sees the lock card on the next page) per Q4
  - [x] `filter-controls.tsx` (client) — chip row showing the active filter (`Sales × Manager × 4–7y · 14 respondents`) with × on each chip to drop a single value; "Change filter" button opens the modal; URL is the source of truth (`router.push` round-trips through the server)
  - [x] Page wired — old standalone `FilterBanner` removed; `FilterControls` replaces it above the Preliminary banner
  - [x] Type-check + production build green
- [x] **6.4** — Comparison view (`/admin/assessments/[id]/results/compare`)
  - [x] URL shape: prefixed query keys (`aDept=…&aLevel=…&bDept=…`) per Q1/A. `parseFilterFromSearchParams` and `filterToQueryString` both take an optional `prefix` argument; the comparison page passes `'a'` / `'b'`, the single-filter page leaves it default
  - [x] Two `loadResults` calls in parallel (one per side); each side independently checked against the ≥3 floor — when one is locked, that column shows a "Locked" placeholder and the other still renders (spec 06 § 6.2)
  - [x] Twin sections: Summary (twin overall + single-line "A leads by 0.40" delta per Q3/B), Pillar Breakdown (twin progress bars per pillar with per-pillar Δ), Capability Profile (twin bars per capability in canonical order, no spread sort), Focus Areas (twin top-5 lists with "Only in A" / "Only in B" badges for unique-to-one-side capabilities)
  - [x] Twin filter pickers reuse the existing `FilterModal`, scoped per side via `openSide` state
  - [x] "Exit comparison" link returns to `/results?<filter A>` per Q5 / spec 06 § 6.4
  - [x] "Compare segments" button on the main results page header per Q4
  - [x] No AI narrative comparison, no per-respondent table, no PDF export — quantitative only in v1 (spec 06 § 6.3)
  - [x] Type-check + production build green; new route `/admin/assessments/[id]/results/compare` registered

### Phase 7 — AI integration
**Slicing:** 7.1 crypto + settings backbone → 7.2 provider abstraction + prompt builder → 7.3 report generation endpoint + UI button → 7.4 validation + retries + audit.

- [x] **7.1** — Crypto + settings backbone
  - [x] `src/lib/crypto.ts` — AES-256-GCM `encryptSecret()` / `decryptSecret()` / `lastFourOf()` over the `SETTINGS_ENCRYPTION_KEY` master (base64-decoded to 32 bytes); wire format `iv(12) || authTag(16) || ciphertext`
  - [x] `GET /api/settings/ai` — super-admin-only; returns `{ provider, providers: {gemini|claude|openai: {hasKey, source: 'db'|'env'|'none', lastFour, envVarName}}, updatedAt, updatedBy }`. Lazily creates the Settings singleton row.
  - [x] `PATCH /api/settings/ai` — super-admin-only; body `{ provider?, apiKeyProvider?, apiKey? }`. Encrypts the supplied key into the matching column. Audit-logs `ai.config_change` (no key value or tail in metadata).
  - [x] `POST /api/settings/ai/test` — super-admin-only; body `{ provider, apiKey? }`. Resolves key in priority `supplied → db → env`. Hits each provider's list-models endpoint (Gemini `/v1beta/models?key=`, Anthropic `/v1/models` with `x-api-key` + `anthropic-version: 2023-06-01`, OpenAI `/v1/models` with Bearer) — auth-only validation, no token cost. 8s timeout. Humanised error messages for 401/403/429/5xx.
  - [x] `/admin/settings/ai` page — super-admin-gated. Provider dropdown, masked API key input per selected provider, "Saved key ending in ••••XXXX" line with source pill (Saved / Env fallback / Not configured), bootstrap banner when active provider's key comes from env. Test connection + Save buttons. "Last updated by {name} on {date}" footer.
  - [x] Layout nav: pre-existing super-admin "AI settings" link (added in Phase 2) now resolves; no layout change needed.
  - [x] Type-check + production build green; new routes `/admin/settings/ai`, `/api/settings/ai`, `/api/settings/ai/test` registered.
  - [x] **Verified live (happy path 2026-05-03):** super admin pasted a real API key → "Test connection" returned green → Save persisted the encrypted key → page refreshed with "Saved" pill + last-4 chars. Remaining manual checks **deferred** to slice 7.5 (see § 6 "Deferred manual tests" below) so we can keep momentum on 7.2.
  - [x] **Slice 7.2 will refactor the inline provider HTTP calls into the abstraction at `src/lib/ai/`.**
- [x] **7.2** — Provider abstraction + prompt builder
  - [x] `src/lib/ai/types.ts` — `Provider`, `GenerateReportInput`, `RespondentForPrompt`, Zod `aiResponseSchema`, `ProviderAdapter` contract.
  - [x] `src/lib/ai/strip-names.ts` — single chokepoint that converts `RespondentForPrompt[]` (with names) into `AnonymizedRespondent[]` (letter-labeled, no `name` field). Imported by `prompt.ts` only.
  - [x] `src/lib/ai/prompt.ts` — `buildPrompt(input)` returns `{ system, user, expectedActionItemKeys, anonymizedRespondents }`. System prompt is spec-14 § 2 verbatim; user prompt formats team scores, focus areas with baseline action items from `BASELINE_ACTION_ITEMS`, and letter-labeled individuals.
  - [x] `src/lib/ai/{gemini,claude,openai}.ts` — per-provider adapters using official SDKs (`@google/genai`, `@anthropic-ai/sdk`, `openai`). JSON mode where supported (Gemini `responseMimeType: 'application/json'`, OpenAI `response_format: { type: 'json_object' }`, Claude relies on prompt + post-parse). Hardcoded models per spec 14 § 8 (`gemini-2.5-flash`, `claude-haiku-4-5`, `gpt-4.1-mini`). Each exposes `generate()` + `testConnection()` + `modelName`.
  - [x] `src/lib/ai/cache.ts` — `readCachedReport` / `writeCachedReport` (upsert) / `invalidateCachesForAssessment` (placeholder for Phase 9).
  - [x] `src/lib/ai/index.ts` — orchestration. `resolveActiveProvider()` (DB → env fallback), `testConnection(provider, suppliedApiKey?)` with `supplied → db → env` priority, `generateReport(input)` end-to-end resolve → build prompt → provider call → JSON.parse → Zod schema validation → map LLM action_items (keyed by capability labels) back to `CapabilityKey`-keyed `AiReportOutput`. Typed errors `AiConfigError` (`no_key_configured`/`decryption_failed`) and `AiGenerationError` (`provider_call_failed`/`json_parse_failed`/`schema_mismatch`).
  - [x] **Q4/A**: `inputSnapshot` stored in cache contains the *stripped* (letter-labeled) respondent payload, never the pre-strip.
  - [x] **Q3/A**: cache writes happen in slice 7.3's endpoint — `generateReport()` is pure (input → output).
  - [x] Refactored `/api/settings/ai/test/route.ts` to call `testConnection()` from the abstraction. External response shape unchanged from slice 7.1.
  - [x] Added 3 SDK dependencies to `package.json`.
  - [x] Type-check + production build green (28 routes; no new routes).
  - [x] **Verified live (2026-05-03):** super admin clicked Test on saved Gemini key → green "Connected with saved key", confirming the abstraction is correctly resolving the DB-saved encrypted key through `gemini.ts`.
- [ ] **7.3** — Report generation endpoint + UI button
  - [ ] `POST /api/assessments/[id]/report?<filter>` — generate (draft if collecting, final if closed); writes to `GeneratedReport` cache
  - [ ] `GET /api/assessments/[id]/report?<filter>` — fetch cached
  - [ ] "Generate AI report" button on results-page header
  - [ ] Executive summary panel + AI-adapted action items rendered into the existing Focus Areas section
  - [ ] Draft watermark when `assessment.status === 'collecting'`
- [x] **7.4** — Validators + retry + fallback
  - [x] `src/lib/ai/validate.ts` — spec 14 § 4 rules. Hard fails (shape mismatch, missing focus-area keys, wrong action count, first-person address, multiple numeric refs) trigger one retry with augmented prompt. Soft fixes (truncation, em-dash → period, emoji/exclamation strip, single-numeric sentence strip) applied in place + reported via `softFixes[]`.
  - [x] `src/lib/ai/fallback.ts` — static baseline summary keyed by overall band per spec 14 § 5.1, with sample-size disclaimer prepend.
  - [x] `generateReport()` returns discriminated outcome (`'success' | 'fallback'`); on fallback the route DOES NOT cache (spec 14 § 5) and audits both `ai.generation_failed` + `ai.fallback_used`.
  - [x] Audit metadata for `ai.generate` includes `attempts` and `softFixes` per Q1/A.
  - [x] Button label "Generating… (up to 30s)" per Q2/A. Fallback card includes a "Retry AI generation" button per Q3/B.
  - [x] **Prompt v2 rewrite (2026-05-03):** executive_summary changed from a paragraph to an array of 3–5 correlation bullets; action items ≤40 words and required to cite a data signal; baseline reframed as "FOR REFERENCE ONLY". Spec 14 bumped to v0.2.
  - [x] **Iteration after first v2 test:**
    - Dropped over-strict `missing_signal_citation` hard fail (was rejecting valid output)
    - Tolerate label whitespace + case in `action_items` keys
    - Surface `attemptReasons` + `attemptDetails` in the fallback card so failures are debuggable from the UI (no Neon SQL needed)
    - Loading UX: animated SVG spinner inline with the button label + 4-row pulsing skeleton replacing the body during generation
    - `tryParseJsonProgressive()` — multi-strategy JSON extractor (raw → trim → fence-strip → comment-strip → outermost-braces → trailing-comma-strip)
    - Cleaned the prompt's JSON example so it's syntactically valid (moved `// ...` hints out of the JSON block)
    - Gemini: `thinkingConfig: { thinkingBudget: 0 }` (thinking was eating output tokens + wall-clock; not needed for our short structured output), maxOutputTokens 2000 → 4000, timeout 30s → 60s
  - [x] **Verified live (2026-05-03):** Regenerate produces v2 correlation bullets cleanly; AI-adapted action items render under baseline in each Focus Areas card.
  - [x] Type-check + production build green.

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
| 2026-05-03 | 7.1 | **Phase 7.1 landed (Crypto + settings backbone).** New `src/lib/crypto.ts` provides AES-256-GCM encrypt/decrypt + `lastFourOf` over the `SETTINGS_ENCRYPTION_KEY` master (base64 → 32 bytes; wire format `iv(12) ‖ authTag(16) ‖ ciphertext`). New super-admin-only routes: `GET /api/settings/ai` (returns provider + per-provider source/lastFour with env-fallback), `PATCH /api/settings/ai` (writes encrypted key into the matching column, audit-logs `ai.config_change` without any key tail in metadata), `POST /api/settings/ai/test` (resolves key in `supplied → db → env` priority, pings each provider's list-models endpoint — Gemini `/v1beta/models?key=`, Anthropic `/v1/models` with `x-api-key`+`anthropic-version`, OpenAI `/v1/models` with Bearer — 8s timeout, humanised 401/403/429/5xx messaging). New `/admin/settings/ai` page wires it up: provider dropdown, masked API key input scoped to the selected provider, source pill (Saved / Env fallback / Not configured), persistent bootstrap banner when the active provider is reading from env, "Last updated by …" footer. The pre-existing super-admin "AI settings" nav link (added in Phase 2) now resolves. Inline per-provider HTTP calls in `/api/settings/ai/test` are deliberately temporary — slice 7.2 will lift them into the `src/lib/ai/` abstraction. Type-check + production build green (28 routes; +/admin/settings/ai, +/api/settings/ai, +/api/settings/ai/test). |
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

### What's next (Phase 7 — AI integration)

The build sequence in `execution-plan.md` lists Phase 7 as the AI-generated narrative + cache. None of the AI files exist yet; the `Settings` and `GeneratedReport` Prisma models are already in the schema. New files needed:

- `src/lib/crypto.ts` — AES-256-GCM `encrypt(plaintext)` / `decrypt(buf)`; master key from `SETTINGS_ENCRYPTION_KEY`
- `src/lib/ai/index.ts` — provider abstraction (`selectProvider(settings): AiProvider` with `generateReport()` + `testConnection()`)
- `src/lib/ai/prompt.ts` — provider-neutral system + user prompt builder per `product-spec/14_ai_prompts.md`
- `src/lib/ai/{gemini,claude,openai}.ts` — per-provider SDK adapters
- `src/lib/ai/cache.ts` — read/write `GeneratedReport` keyed by `(assessmentId, filterSignature)` (the same signature already used by Phase 6's filter URL)
- `src/app/api/settings/ai/route.ts` — GET/PATCH for provider + encrypted API key
- `src/app/api/settings/ai/test/route.ts` — round-trip test prompt
- `src/app/api/assessments/[id]/report/route.ts` — POST generate / GET fetch with watermarked-draft handling
- `src/app/admin/settings/ai/page.tsx` — super-admin only
- "Generate AI report" button on the report page header

**Critical Phase 7 checks:**
- **Names must be stripped from the LLM input** — see spec 11 § 5 and the comment on `RespondentRow.name` in `src/lib/results-service.ts`. The current API surface returns names; the AI prompt builder is responsible for stripping them.
- **Cache key alignment** — `filterSignature(filter)` from `src/lib/filters.ts` is already the agreed key. Don't invent a new signature scheme; reuse the function.
- **Bump `Settings.promptVersion`** when changing the prompt builder. Cached reports older than the new version should be treated as cache misses (do not silently invalidate without the user's say-so per `CLAUDE.md` "After Making Changes to AI Prompts").

---

---

## 6. Deferred manual tests

Things we explicitly chose to defer rather than block a slice on. Each one is tractable in a few minutes once we want to come back to it. **Re-run after the deferred work to confirm nothing regressed.**

### 6.1 — Slice 7.1 verification (deferred 2026-05-03)
The happy path was verified live (paste key → Test → green → Save → "Saved" pill with last-4 chars). The rest of the verification matrix is parked here:

- [ ] **Empty-state screen** — visit `/admin/settings/ai` with no `ADMIN_API_KEY*` env vars set and no DB key saved: every provider should show the grey "Not configured" pill with body text *"No key configured yet for {Provider}"*.
- [ ] **Env-var bootstrap path** — set one of `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` in Vercel without saving via the UI: that provider should show the yellow "Env fallback" pill with body line *"Bootstrap key from env var ending in ••••XXXX (GEMINI_API_KEY)"*, and the persistent amber bootstrap banner should appear at the top of the page.
- [ ] **Save flips bootstrap → DB** — with bootstrap active, paste a key into the field and Save: pill should flip from yellow "Env fallback" to green "Saved" and the bootstrap banner should disappear after refresh.
- [ ] **Test with empty input + saved key** — after saving, click Test with the field empty: should return *"✓ Connected with saved key."*
- [ ] **Wrong key error** — paste a deliberately invalid key, click Test: should show a red message like *"Authentication failed — the API key was rejected."* (or similar 401/403 humanised error).
- [ ] **Save still works after a failed test** — Test is informational, not a gate; Save should succeed even if the previous Test failed.
- [ ] **Provider switch preserves other keys** — save Gemini key, switch dropdown to Claude, save a Claude key, switch back to Gemini: the Gemini key should still be there (independent columns).
- [ ] **Permission gating** — log out and visit `/admin/settings/ai` directly: should bounce to login. (If a non-super admin exists) regular admin visiting the URL should be redirected to `/admin/dashboard`.
- [ ] **Audit trail** — after a save, an `ai.config_change` row exists in `AuditLog` with metadata `{ providerChanged, keyChangedFor }` and **never** a key value or its tail. Verify in Neon SQL editor: `SELECT * FROM "AuditLog" WHERE action='ai.config_change' ORDER BY "createdAt" DESC LIMIT 5;`

---

*End of progress tracker.*

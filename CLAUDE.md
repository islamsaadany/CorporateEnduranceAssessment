# Claude Code Instructions for The Endurance Assessment

> This file is automatically read by Claude Code at the start of each session.
> It contains project-specific instructions, guidelines, and configuration.

---

## Working Guidelines

### 1. CRITICAL: Never Act Without Alignment
- **NEVER implement features or make significant changes without explicit user confirmation**
- **When user says "let's align first" — STOP and discuss before any implementation**
- **Always present the plan/structure and wait for confirmation before coding**
- **If uncertain about requirements, ASK — do not assume**
- **This rule is NON-NEGOTIABLE**

### 1b. CRITICAL: Align Before Every Fix or Change
- **Before implementing ANY fix or change, explain what you plan to do in simple non-technical words**
- **Wait for the user to confirm before writing any code**
- **If there are multiple approaches, present them as options with a clear recommendation**
- **Never redesign, restyle, or restructure anything that wasn't explicitly asked for**
- **Stick to exactly what was requested — no extra "improvements" or visual changes**
- **If a fix requires touching something the user didn't mention, flag it and ask first**
- **This applies to every single fix, no matter how small**

### 1c. CRITICAL: UI Changes Require Explicit Approval
- **NEVER change any UI design, layout, styling, or visual element without explicit user approval**
- **This includes: colors, borders, spacing, card designs, labels, icons, section order, font sizes — EVERYTHING visual**
- **If a bug fix or feature requires a UI change, describe the visual change separately and get approval**
- **When restoring a design, match the original EXACTLY — do not "improve" or "modernize" it**
- **After ANY UI change, save a snapshot of the changed file to `ui-versions/` folder (see UI Version Tracking below)**
- **This rule exists because previous sessions have accidentally reverted agreed-upon designs**

### 2. Think Before Acting
- **Don't follow commands blindly** — Always analyze requests and challenge if something seems incorrect or could cause issues
- **Align before action** — If there's any ambiguity or potential risk, discuss with the user before proceeding
- **Consider implications** — Think through the downstream effects of any change before implementing

### 3. Quality Assurance
- **Always test the build before proceeding** — Run `npm run build` or `npx tsc --noEmit` to verify no TypeScript errors
- **Fix type errors across the outcome** — Don't leave TypeScript errors unresolved
- **Test implications of changes** — Ensure changes don't break existing functionality
- **Verify before committing** — Check that all modified files are working correctly

### 3b. Engineering Preferences (Overrides Defaults)
These preferences override Claude Code's default behavior:
- **DRY: Flag repetition aggressively** — If logic is repeated 3+ times, extract it. If repeated twice, flag it to the user as a candidate for extraction. Do not silently leave duplication.
- **Edge cases: Handle more, not fewer** — Err on the side of covering edge cases (nulls, empty states, unexpected input, boundary conditions). Thoughtfulness over speed. This takes priority over "keep it minimal."
- **Aim for "engineered enough"** — Not under-engineered (fragile, hacky, no error handling) and not over-engineered (premature abstraction, unnecessary complexity, features nobody asked for). When in doubt, ask.
- **Explicit over clever** — Prefer readable, obvious code over compact/clever solutions.

### 4. Git Workflow
- **CRITICAL: Only 2 branches in active use:**
  1. `main` — Production/stable branch
  2. Session-coded branch (e.g., `claude/<task>-<sessionId>`) — Development branch
- **NO separate "development" branch** — Use the session-coded branch for all development
- **Development** — All work should be committed to the session-coded branch (the one you're on when session starts)
- **Merge to main** — When work is complete and verified, merge to main and push
- **Use the provided GitHub token** for pushing (see Configuration section below)
- **Commit with descriptive messages** — Explain what and why, not just what changed
- **Clean up stale branches** — Delete old session branches that are no longer needed

### 5. Communication
- **Be proactive about potential issues** — Flag concerns before they become problems
- **Explain reasoning** — When suggesting changes, explain the rationale
- **Ask clarifying questions** — Better to ask than to assume incorrectly

### 6. Change Review Protocol (Plan Mode)
When entering Plan Mode for a feature or significant change, start by asking the user:

> **BIG CHANGE or SMALL CHANGE?**
> - **BIG CHANGE:** Work through review interactively, one section at a time, with up to 4 top issues per section.
> - **SMALL CHANGE:** Work through review interactively, but limit to 1 key issue per section.

Then review the change through these 4 lenses **in order**, pausing for user feedback after each:

#### Lens 1: Architecture
- Component boundaries and responsibility separation
- Data flow between client/server/API/database (Next.js App Router patterns)
- Prisma query patterns and database access (watch for N+1 queries)
- API route design and security (auth, data validation at boundaries, server-side scoring)

#### Lens 2: Code Quality
- Code organization and module structure
- Repeated logic that should be extracted (but only if used 3+ times — avoid premature abstraction)
- Error handling gaps and missing edge cases (call these out explicitly)
- Technical debt being introduced or resolved

#### Lens 3: Testing & Verification
- Does `npx tsc --noEmit` pass?
- Does `npm run build` succeed?
- Are there edge cases in the logic that could break silently?
- For data-driven features: does it handle empty states, nulls, and unexpected input?

#### Lens 4: Performance
- Database query efficiency (Prisma includes, selects, unnecessary fetches)
- Component re-render concerns (large state objects, missing memoization)
- Bundle size impact (large imports, client-side vs server-side boundaries)
- Caching opportunities (DB-backed AI cache, repeated API calls, static reference data)

#### Presenting Issues
For each issue found:
- **Number issues** (1, 2, 3...) and **letter the options** (A, B, C...)
- Always include a "Do nothing" option where reasonable
- For each option: state the effort, risk, and maintenance impact in one line
- **Put the recommended option first** and mark it "(Recommended)"
- Use AskUserQuestion with clearly labeled issue numbers and option letters so the user can respond unambiguously

**Example format:**
```
Issue 1: Component X fetches data on every render
  A) Add useMemo + dependency array (Recommended) — Low effort, no risk
  B) Move fetch to server component — Medium effort, requires restructure
  C) Do nothing — No effort, but will cause lag on large datasets
```

**CRITICAL:** This protocol supplements, not replaces, the alignment rules in sections 1–1c. The review happens *before* any code is written.

---

## Project Context

### What This App Is
A web-based **team diagnostic** that measures an organization's endurance across three pillars — **Agility**, **Toughness**, **Resilience** — by aggregating responses from a group of senior leaders (5 capabilities × 2 angles × 3 pillars = 30 statements, 1–5 Likert) into an Organizational Endurance Profile. A Forefront consultant (admin) creates an assessment for a client, generates per-respondent codes, distributes them manually, monitors responses during the collection window, and after closure generates an AI-assisted report (quantitative aggregation visible at any time; AI narrative locked until closure unless explicitly drafted as watermarked early). Built by **Forefront Consulting**.

The product is **organizational** (not individual), **anonymous in aggregate** (≥3 respondents required for any view), **deadline-driven**, and produces **multi-variant filtered reports** suitable for boardroom presentation.

### Technology Stack
- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript 5.9
- **Database:** PostgreSQL (Neon, serverless) + Prisma 5.x
- **Auth (admin):** NextAuth.js v5, email/password credentials provider
- **Auth (respondent):** 6-character access code (no app account)
- **AI:** Provider-abstracted — Gemini (default) / Claude / OpenAI. Admin selects provider + supplies API key in admin panel; model name hardcoded per provider. Bootstrap fallback via env var with banner.
- **PDF:** `@react-pdf/renderer` (server-side rendering)
- **Styling:** **Tailwind CSS** (chosen over inline themes from the reference project for speed)
- **Scheduled jobs:** Vercel Cron (hourly closure check)
- **Encryption:** AES-256 for API keys at rest, master key in env var
- **Email:** **None.** No invitation, no reminder, no closure notification. Codes distributed manually by the admin.
- **Deployment:** Vercel

### Repository
- **GitHub:** `islamsaadany/CorporateEnduranceAssessment`
- **Production URL:** Vercel-hosted (set in Vercel dashboard)

### Key Directories (target state)
```
CorporateEnduranceAssessment/
  Plan & Progress/
    execution-plan.md              # Source of truth for product alignment + decisions log
    progress.md                    # Live execution tracker
  product-spec/                    # What the product does/says/shows (non-technical, 16 files)
  src/
    app/
      page.tsx                     # Landing
      layout.tsx                   # Root layout
      globals.css
      take/                        # Respondent flow (code entry → demographics → questions → done)
      admin/                       # Admin app
        login/
        dashboard/
        assessments/[id]/          # Detail + results + activity
        assessments/new/
        settings/ai/               # Super admin only
        admins/                    # Super admin only
      api/
        assessments/               # CRUD + /[id]/respondents + /[id]/results + /[id]/report
        respondents/               # /validate + /[id]/answers + /[id]/demographics
        cron/closure/              # Hourly Vercel Cron
        ai/test-connection/        # Super admin only
    lib/
      prisma.ts                    # Prisma client singleton
      auth.ts                      # NextAuth config
      scoring.ts                   # Pillar/capability/spread aggregation, focus-area selection
      filters.ts                   # Filter signature + ≥3-respondent guardrail
      crypto.ts                    # AES-256 encrypt/decrypt for API keys at rest
      ai/
        index.ts                   # Provider abstraction (selectProvider)
        gemini.ts
        claude.ts
        openai.ts
        prompt.ts                  # System + user prompt builders
        cache.ts                   # DB-backed report cache (assessment_id, filter_signature)
      pdf-template.tsx             # React-PDF report template
    data/
      types.ts                     # Shared TypeScript types
      constants.ts                 # Pillar/capability content, level list, tenure bands, bands thresholds
      questions.ts                 # 30 statements (locked content), pillar/capability/angle mapping
  prisma/
    schema.prisma                  # admins, assessments, respondents, responses, departments, settings, audit_log, generated_reports
    seed.ts                        # Super admin + sample assessment
  ui-versions/                     # Snapshots of UI files before edits (rollback log)
```

**Authoring status:** the codebase is in **Phase 0 — Documentation**. No `src/`, `prisma/`, or `package.json` exist yet. The layout above is the target after Phase 1.

### Important Patterns (project-specific)
- **30-statement locked content** — Question text, pillar mapping, capability mapping, and "angle A vs angle B" are fixed and live in `src/data/questions.ts`. They are **not** admin-editable in v1. Order is fixed across all respondents (Agility 1a–5b → Toughness 6a–10b → Resilience 11a–15b).
- **Server-side scoring** — Pillar / capability / spread / focus-area math runs in `src/lib/scoring.ts` on the server. Raw individual answers never need to leave the server for the numerical report; only aggregates and the anonymized respondent table are sent to the client.
- **≥3-respondent anonymity guardrail** — Any view (company-wide or filtered) with fewer than 3 respondents is replaced by a lock message. Enforced in `src/lib/filters.ts` and respected by every results-page component **and** the AI generation endpoint.
- **DB-backed AI report cache** — `generated_reports` table keyed by `(assessment_id, filter_signature)`. Unlimited entries (no eviction). Invalidated when an admin edits any answer or demographic for that assessment (with warning modal). New generations overwrite the cache for that filter.
- **Watermarked draft vs. final AI report** — Pre-closure generation is allowed but rendered with a "Preliminary draft" watermark on screen and on the PDF. Post-closure is "Final". Both are cached the same way.
- **No emails, ever** — There is no Resend, no email templates, no reminder cron. Codes are distributed manually by the admin (visible/copyable in the admin UI).
- **Provider-agnostic AI** — `src/lib/ai/index.ts` selects the configured provider (Gemini / Claude / OpenAI) at request time. The system prompt + user prompt builder live in `src/lib/ai/prompt.ts` and are provider-neutral. API keys are AES-256 encrypted in `settings`.
- **Names never sent to LLM** — The AI input includes anonymized individual responses with demographics labeled by letter (e.g., "Respondent A: Sales · Manager · 4–7y"). Optional respondent names are stored but stripped before any LLM call.
- **Live numerical report** — The numerical report is available **anytime** during collection with a "Preliminary — N of M responded" banner. Closure does not change the numerical view; it only flips status and unlocks the un-watermarked AI report.
- **Filter signature** — A canonical, sorted serialization of the active filter (e.g., `dept=Sales&level=Manager&tenure=4-7y`) used as the cache key, the URL param, and the PDF filename suffix. Generated by `src/lib/filters.ts`.
- **Refresh protection (respondent)** — `localStorage["tea_progress_<respondentId>"]` stores question index + answers in progress. Final submission writes to the server; localStorage is cleared on `/take/done`.

---

## Configuration

### GitHub Token for Auto-Push
The GitHub token is stored in `.claude-token` (gitignored) for security.

**Setup:** Create a `.claude-token` file in the project root containing only the token.

**Usage:** When pushing to GitHub, Claude Code will read the token and configure:
```bash
TOKEN=$(cat .claude-token)
git remote set-url origin https://${TOKEN}@github.com/islamsaadany/CorporateEnduranceAssessment.git
```

### Database Credentials for Local Development
Database credentials are stored in `.env.local` (gitignored) for security.

**Setup:** Create a `.env.local` file in the project root with your Neon credentials. Template lives in `.env.example`.

**Required env vars:**
| Variable | Purpose |
|----------|---------|
| `POSTGRES_URL` | Neon pooled connection string (used at runtime) — Vercel's Neon integration sets this automatically |
| `DATABASE_URL_UNPOOLED` | Neon direct connection string (used for migrations / `prisma db push`) — Vercel's Neon integration sets this automatically |
| `NEXTAUTH_SECRET` | NextAuth session signing secret (any random 32+ char string) |
| `NEXTAUTH_URL` | Public app URL (only needed locally; on Vercel, NextAuth v5 auto-detects from `VERCEL_URL`) |
| `SETTINGS_ENCRYPTION_KEY` | 32-byte AES-256 master key (base64) used to encrypt admin-supplied AI provider API keys at rest in `settings` |
| `GEMINI_API_KEY` *(optional bootstrap)* | Used as a fallback when no provider is configured in the admin panel. Surfaces a persistent banner asking the super admin to save in panel. |
| `OPENAI_API_KEY` *(optional bootstrap)* | Same fallback role for OpenAI. |
| `ANTHROPIC_API_KEY` *(optional bootstrap)* | Same fallback role for Claude. |
| `CRON_SECRET` | Header secret required by `/api/cron/closure` (Vercel Cron sends this automatically once configured). |

**Note:** There is no `RESEND_API_KEY`, no email-related env, and no `ADMIN_KEY`. Admin auth is full NextAuth email/password.

**Get credentials from:**
- Neon Console: https://console.neon.tech → Your Project → Connection Details
- Or copy from Vercel: Project Settings → Environment Variables
- Gemini: https://aistudio.google.com/app/apikey
- OpenAI: https://platform.openai.com/api-keys
- Claude: https://console.anthropic.com/settings/keys

**Usage:** Claude Code sessions **do not** have `DATABASE_URL` and **cannot** push schema changes themselves. There are two surfaces for DB operations; pick based on what the user has access to.

### Option A — user has a local terminal
Tell them to run one of these `npm run` scripts:

| When | Command for the user to run |
|------|-----------------------------|
| Schema changed; preserve existing data | `npm run db:push` |
| Schema changed; want fresh seed data | `npm run db:reset` *(destructive — confirm with user first)* |
| Just need to re-seed (no schema change) | `npm run seed` |
| Want to inspect rows | `npm run db:studio` |
| Regenerate Prisma client only | `npm run db:generate` |

### Option B — user only has the Neon SQL editor
Some users have **no local terminal** — they can only paste SQL into Neon's SQL editor. For them, the canonical surface is the hand-runnable files in `prisma/sql/`. Whenever you change `prisma/schema.prisma` or `prisma/seed.ts`:

1. Regenerate `prisma/sql/000_initial_schema.sql` with:
   ```bash
   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/sql/000_initial_schema.sql
   ```
   For follow-up schema changes, generate a `00N_<description>.sql` file containing **only the diff** from the previous schema state (use `--from-schema-datasource` or `--from-schema-datamodel` against the prior file).

2. Regenerate `prisma/sql/001_seed_sample_data.sql` if seed logic changed:
   ```bash
   node scripts/gen-seed-sql.mjs > prisma/sql/001_seed_sample_data.sql
   ```

3. Commit the regenerated SQL **alongside** the Prisma changes in the same commit. The two must always agree.

4. Tell the user **exactly** which numbered file(s) to paste into Neon's SQL editor, in order.

**Never** attempt `npx prisma db push` against the user's DB — it requires credentials we don't have. **Never** ask the user to paste their `DATABASE_URL` into chat. The `prisma/sql/` files and the `npm run db:*` scripts are the **only** two acceptable handoff surfaces.

### Build Commands
```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Full production build (requires DB connection)
npm run start        # Run production build locally
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript check only (no DB needed)
```

---

## Common Tasks

### UI Version Tracking (MANDATORY)
When making ANY UI change to a component file:
1. **Before editing**, copy the current file to `ui-versions/<component-name>/<YYYY-MM-DD>_<short-description>.tsx`
2. **After editing**, the new version is the live file — the snapshot in `ui-versions/` is the rollback point
3. This allows reverting to any previous UI design when sessions lose context
4. **Folder structure example:**
   ```
   ui-versions/
     page/
       2026-04-01_pre-tabbed-flow.tsx
       2026-04-15_tabbed-results.tsx
     admin/
       2026-04-10_pre-column-filters.tsx
   ```

### Before Committing
1. Run `npx tsc --noEmit` to check for TypeScript errors
2. Review all changed files
3. Ensure no sensitive data is being committed (`.env.local`, `.claude-token`, anything with API keys)
4. If a UI file changed, confirm the snapshot was saved in `ui-versions/`

### After Making Changes to Assessment Content
Assessment content (the 30 statements, pillar/capability mapping, band thresholds, level list, tenure bands) is **locked in code** — there is no admin editing in v1. It lives in:
1. **`src/data/questions.ts`** — the 30 statements with `(pillar, capability, angle)` mapping
2. **`src/data/constants.ts`** — pillar/capability metadata (display labels, ordering), `LEVELS`, `TENURE_BANDS`, `BAND_THRESHOLDS` (Critical Gap / Needs Work / Solid / Strong)
3. **`product-spec/02_questions.md`** and **`product-spec/03_scoring_and_bands.md`** — human-readable source of truth for the same content

**If you change any of the above, all three must move together.** A drift between code and `product-spec/` is a documentation bug; report it to the user before silently realigning.

### After Making Changes to AI Prompts
1. Update the system + user prompt builders in `src/lib/ai/prompt.ts`
2. Mirror the change in **`product-spec/14_ai_prompts.md`** (this file is the human-readable source of truth that the user reviews)
3. If the prompt or response shape changes, update the JSON schema validator in `src/lib/ai/index.ts` so all three providers stay aligned
4. **Decide on cache invalidation:** existing entries in `generated_reports` are still keyed by `(assessment_id, filter_signature)` and will continue to be returned. If the prompt change is meaningful, bump a `prompt_version` column and treat older versions as a cache miss — do NOT silently invalidate without telling the user

### Before Merging to Main (MANDATORY)
1. **Update `PROJECT_DETAILS.md`** — Document any new features, API endpoints, schema changes, or significant behavior changes
2. **Update `REUSABLE_PATTERNS.md`** — If a new reusable mechanism was introduced (theme token, hook pattern, integration pattern), add it
3. **Update this `CLAUDE.md`** — If any new patterns, rules, or workflows were established
4. **Verify all documentation is current** — Future sessions read these files to bootstrap context

### Periodic Alignment Check (Proactive)
**When:** Before merging to main, or when user requests, or when changing any content surface.

**What to compare:**
1. **`src/data/constants.ts`** — code-level source of truth
2. **Database rows** — Prisma `BandDescription`, `ArchetypeDescription`, `StrategicLeverage`, `IntegrationInsight`, `Scenario`, `ScenarioOption`
3. **PDF template** — `src/lib/pdf-template.tsx` (uses constants for fallback)
4. **`Reference_Files/`** — methodology and content spec documents

**Process:**
1. Read the constants and DB rows side by side
2. Compare with what's documented in Reference_Files
3. **Report discrepancies to user** with: what differs, where it differs, recommendation for alignment
4. **Wait for user direction** before making changes

**CRITICAL:** Do NOT auto-fix discrepancies. Always align with user first on how to resolve.

---

## Current Framework Summary

### Three Pillars × Five Capabilities × Two Angles = 30 statements
| Pillar | Capabilities (5 each) |
|--------|------------------------|
| **Agility** | Sensing · Decisiveness · Reconfiguration · Learning Velocity · External Orientation |
| **Toughness** | Operational Discipline · Risk Posture · Conviction · Cost & Capital Stewardship · Accountability |
| **Resilience** | Recovery · Wellbeing · Continuity · Adaptive Capacity · Trust |

Each capability has **two statements** (angle A, angle B). 1–5 Likert. Full content lives in `product-spec/01_pillars_and_capabilities.md` and `product-spec/02_questions.md`.

### Scoring (server-side)
- **Capability score** = mean of its 2 angle answers (per respondent)
- **Pillar score** = mean of its 5 capability scores
- **Overall endurance** = mean of the 3 pillar scores
- **Spread** = max − min of a capability across respondents (within the active filter)
- All means re-aggregate across respondents within the **currently applied filter** (none / department / level / tenure / compound)

### Bands (uniform across all score levels)
| Band | Range |
|------|-------|
| Critical Gap | 1.00 – 1.99 |
| Needs Work | 2.00 – 2.99 |
| Solid | 3.00 – 3.99 |
| Strong | 4.00 – 5.00 |

### Focus Areas
**Top 5 weakest capabilities** under the active filter. Tie-break: **higher spread first, then alphabetical**. Recomputed per filter. The AI report is given the filter's focus areas, not a global list.

### Anonymity Rule
Any view (company-wide or filtered) with **fewer than 3 respondents** is replaced by a lock message. This applies to: numerical report views, AI report generation, comparison view, and PDF export. Defined in `src/lib/filters.ts`.

### Demographics (collected per respondent, after code validation, before Q1)
| Field | Values |
|-------|--------|
| Name | Optional, free text |
| Department | Admin-defined per assessment (can add new during collection; cannot remove once used) |
| Level | Fixed: Executive / Senior Leader / Manager / Team Lead / Individual Contributor |
| Tenure | Banded: <1y / 1–3y / 4–7y / 8–15y / 15+y |

### Report Structure (results page)
1. **Summary** — Overall + 3 pillar scores with bands; "Preliminary — N of M responded" banner during collection
2. **Capability Profile** — All 15 capabilities with score + spread, grouped by pillar
3. **Focus Areas** — Top-5 weakest capabilities with AI-adapted action items (post-AI-generation only)
4. **Anonymized Individuals** — Per-respondent rows: letter label, demographics, capability scores. Names hidden by default; revealed only if the admin clicks "show names" (audit-logged)

### Comparison View
Two filters side-by-side, **quantitative only** (no twin AI narratives in v1). Both views must independently satisfy the ≥3 guardrail.

### Cache Key
`(assessment_id, filter_signature)`. Unlimited entries. Invalidated by any answer or demographic edit (post-closure only) for that assessment, with a warning modal.

---

*Last Updated: 2026-04-28*

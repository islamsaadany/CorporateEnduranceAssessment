# Claude Code Instructions for Strategic Thinking Profile

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
A web-based assessment that measures **five dimensions of strategic thinking** (Liedtka, 1998) through 15 scenario questions and produces a personalized profile, archetype, AI-generated narrative, strategic leverage guidance, and a downloadable PDF report. Built by **Forefront Consulting**.

### Technology Stack
- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript 5.9
- **Database:** PostgreSQL (Neon, serverless) + Prisma 5.22
- **AI:** Google Gemini 2.5 Flash (`@google/generative-ai`)
- **PDF:** `@react-pdf/renderer` (server-side rendering)
- **Charts:** Recharts (radar, pie, bar)
- **Email:** Resend
- **Styling:** **Inline styles via theme tokens** — no Tailwind, no CSS-in-JS library. Theme tokens live in `src/data/constants.ts → THEMES`.
- **Deployment:** Vercel

### Repository
- **GitHub:** `islamsaadany/strategic_thinking_profile`
- **Production URL:** Vercel-hosted (set in Vercel dashboard)

### Key Directories
```
src/
  app/
    page.tsx                       # Single-page assessment + results UI
    layout.tsx                     # Root layout
    globals.css                    # Global resets + font imports + keyframes
    icon.svg
    admin/page.tsx                 # Admin panel (5 tabs)
    report/[sessionId]/page.tsx    # Public per-session report
    team-report/[codeId]/page.tsx  # Public team aggregate report
    api/
      assessment/                  # POST/GET/PATCH + /score + /email-report + /[id]
      access-codes/                # CRUD + /validate
      scenarios/                   # Admin (with scores) + /public (without)
      band-descriptions/           # Tier 2
      archetypes/                  # Tier 2
      strategic-leverage/          # Tier 3
      integration-insights/        # Tier 3
      profile-dynamics/            # AI narrative (cached in DB)
      team-dynamics/               # Team-level AI/aggregation
      report/[sessionId]/          # Public report data
      team-report/[codeId]/        # Public team data
  data/
    types.ts                       # All TypeScript types
    constants.ts                   # Themes, components, scenarios fallback, archetypes, leverage, action plans
  lib/
    prisma.ts                      # Prisma client singleton
    utils.ts                       # genUUID, getBand, getArchetype, getIntegrationInsight
    profile-dynamics.ts            # Gemini system prompt + user-prompt builder + validator
    team-dynamics.ts               # Team aggregation + analysis
    pdf-template.tsx               # React-PDF report template
prisma/
  schema.prisma                    # 9 models
  seed-tier3.sql                   # Seed data for Tier 3 guidance tables
sql/                               # Ad-hoc migration scripts
ui-versions/                       # Snapshots of UI files before edits (rollback log)
Reference_Files/                   # Methodology + content specs (source of truth for assessment content)
Old_Files/                         # Archived earlier specs
Arabic_Plan_Files/                 # Arabic localization planning
mockups/                           # HTML mockups
```

### Important Patterns (project-specific)
- **Hard-coded fallbacks alongside DB content** — `src/data/constants.ts` holds the canonical content for scenarios, archetypes, band descriptions, leverage, and action plans. The DB stores editable copies (Tier 2/3) that override the constants when present. Always keep both aligned.
- **Three content tiers**:
  - Tier 1 (raw scoring) — `Scenario`, `ScenarioOption`, `AssessmentSession`, `AssessmentResponse`
  - Tier 2 (interpretation) — `BandDescription`, `ArchetypeDescription`
  - Tier 3 (guidance) — `StrategicLeverage`, `IntegrationInsight`, plus `TIER_ACTION_PLANS` (still hardcoded)
- **Server-side scoring** — Individual per-scenario scores **never leave the server**. `/api/assessment/score` calculates and saves; client only receives aggregated component averages.
- **DB-backed AI cache** — Profile Dynamics narrative is cached on `AssessmentSession.profileDynamics`. Re-fetches return the cached version; new generations only happen once per session.
- **Role-adjusted thresholds** — What counts as a "strength" depends on `demographics.role`. See `ROLE_STRENGTH_THRESHOLD` in `src/data/constants.ts`.
- **5-tab guided results flow** — Tabs unlock sequentially on first visit, then permanently unlock via `localStorage["stp_guided_complete"]`.
- **Refresh protection** — `localStorage["stp_results"]` stores aggregated scores + sessionId only (no individual responses).

---

## Configuration

### GitHub Token for Auto-Push
The GitHub token is stored in `.claude-token` (gitignored) for security.

**Setup:** Create a `.claude-token` file in the project root containing only the token.

**Usage:** When pushing to GitHub, Claude Code will read the token and configure:
```bash
TOKEN=$(cat .claude-token)
git remote set-url origin https://${TOKEN}@github.com/islamsaadany/strategic_thinking_profile.git
```

### Database Credentials for Local Development
Database credentials are stored in `.env.local` (gitignored) for security.

**Setup:** Create a `.env.local` file in the project root with your Neon credentials. Template lives in `.env.example`.

**Required env vars:**
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `ADMIN_KEY` | Secret key for admin panel access (any string) |
| `RESEND_API_KEY` | Resend API key for emailed PDF reports |
| `GEMINI_API_KEY` | Google Gemini API key for Profile Dynamics |

**Get credentials from:**
- Neon Console: https://console.neon.tech → Your Project → Connection Details
- Or copy from Vercel: Project Settings → Environment Variables
- Resend: https://resend.com/api-keys
- Gemini: https://aistudio.google.com/app/apikey

**Usage:** Claude Code can run database operations:
```bash
npx prisma db push         # Sync schema to database
npx prisma migrate deploy  # Run migrations (production)
npx prisma studio          # Open database GUI
npx prisma generate        # Regenerate Prisma client (also runs on postinstall)
```

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
The canonical assessment content lives in two places that must stay aligned:
1. **`src/data/constants.ts`** — `SCENARIOS`, `BAND_DESC`, `BALANCED_ARCHETYPE`, `SPIKED_ARCHETYPES`, `PAIRED_ARCHETYPES`, `STRATEGIC_LEVERAGE`, `TIER_ACTION_PLANS`, `INTEGRATION_INSIGHTS`
2. **Database** — `Scenario`/`ScenarioOption`, `BandDescription`, `ArchetypeDescription`, `StrategicLeverage`, `IntegrationInsight`

**The DB content overrides the constants when present.** If you change the constants, also update the DB rows (or vice versa). Otherwise the assessment page (which prefers DB) and the PDF (which falls back to constants) will diverge.

### After Making Changes to AI Prompts (Profile Dynamics)
1. Update the system prompt in `src/lib/profile-dynamics.ts` (`PROFILE_DYNAMICS_SYSTEM_PROMPT`)
2. If the prompt structure changes (new sections, new fields), update `validateProfileDynamicsResponse` so validation matches
3. Consider whether existing cached narratives in DB (`AssessmentSession.profileDynamics`) should be invalidated — the cache is per-session, so old narratives stay until the session is deleted

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

### Five Dimensions (Liedtka)
| Key | Label | Core Question |
|-----|-------|---------------|
| `systems` | Systems Thinking | Do you see the whole, or just your part? |
| `intent` | Strategic Intent | Do you have a clear north star that channels your energy? |
| `time` | Thinking in Time | Do you connect past patterns to future possibilities? |
| `hypothesis` | Hypothesis-Driven Thinking | Do you generate and test ideas systematically? |
| `opportunism` | Intelligent Opportunism | Can you stay focused AND remain open to the unexpected? |

### Scoring
- 15 scenarios × 4 options × 1–4 score
- Component score = average of 3 scenario scores per dimension
- Overall = mean of 5 component scores
- Bands: Functional (1.0–1.7), Analytical (1.8–2.7), Strategic (2.8–3.3), Integrative (3.4–4.0)

### Archetype Classification (3-step rule, checked in order)
1. **Balanced** (spread ≤ 1.0) → The Generalist
2. **Spiked** (top component ≥ 1.0 above 2nd) → 5 archetypes (Weaver / Torchbearer / Tracer / Investigator / Spotter)
3. **Paired** (everything else) → 10 archetypes (Architect, Navigator, Engineer, Ranger, Pilot, Pioneer, Visionary, Analyst, Scout, Pragmatist)

### Role-Adjusted Strength Thresholds
| Role Tier | Threshold |
|-----------|-----------|
| Individual Contributor / Early Career | ≥ 2.1 |
| Team Leader / Supervisor | ≥ 2.4 |
| Manager / Department Head | ≥ 2.8 |
| Senior Leader / Executive | ≥ 3.0 |

Defined in `src/data/constants.ts` as `ROLE_STRENGTH_THRESHOLD`. Used by:
- Results tabs (Strengths / Growth)
- Profile Dynamics prompt (strength/growth components)
- Team Dynamics aggregation
- PDF report

### Results Tab Structure
1. **The Foundation** — Five dimensions explained, core questions
2. **Your Scores** — Bands explainer, radar chart, component score cards (sorted desc), integration insight
3. **Your Profile** — Archetype + AI-generated Profile Dynamics narrative
4. **Your Strengths** — Strategic leverage for role-adjusted strengths
5. **Your Growth** — Tier-adapted action plan for role-adjusted growth areas

---

*Last Updated: 2026-04-28*

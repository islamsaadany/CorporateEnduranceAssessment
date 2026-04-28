# Strategic Thinking Profile — Project Details

> A web-based assessment tool that measures five dimensions of strategic thinking based on Jeanne Liedtka's Strategic Thinking Framework, designed and built by Forefront Consulting.

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React | 19.2.4 |
| Language | TypeScript | 5.9.3 |
| Database | PostgreSQL (Neon) | — |
| ORM | Prisma | 5.22.0 |
| PDF Generation | @react-pdf/renderer | 4.3.2 |
| Charts | Recharts | 3.7.0 |
| Email | Resend | 6.9.2 |
| AI | Google Gemini 2.5 Flash | via `@google/generative-ai` 0.24.1 |
| Deployment | Vercel | — |

---

## Directory Structure

```
Strategic_Thinking_profile/
├── prisma/
│   ├── schema.prisma              # Database schema (9 models)
│   └── seed-tier3.sql             # Seed data for Tier 3 guidance tables
├── sql/                           # Ad-hoc migration / cleanup SQL scripts
├── src/
│   ├── app/
│   │   ├── page.tsx               # Main assessment + results UI (with access code entry)
│   │   ├── layout.tsx             # Root layout (fonts, metadata)
│   │   ├── globals.css            # Global styles + font imports + keyframes
│   │   ├── icon.svg               # Favicon
│   │   ├── admin/page.tsx         # Admin panel (5 tabs)
│   │   ├── report/[sessionId]/page.tsx       # Public per-session shareable report
│   │   ├── team-report/[codeId]/page.tsx     # Public team-aggregate report
│   │   └── api/
│   │       ├── access-codes/
│   │       │   ├── route.ts       # POST (create) / GET (list all codes)
│   │       │   ├── [id]/route.ts  # PATCH (toggle active or edit) / GET (per-code analytics)
│   │       │   └── validate/route.ts          # POST (validate code — public endpoint)
│   │       ├── assessment/
│   │       │   ├── route.ts       # POST (legacy save) / GET (list) / PATCH (update email)
│   │       │   ├── [id]/route.ts  # GET / DELETE single assessment
│   │       │   ├── score/route.ts             # POST (score + save server-side, returns aggregates only)
│   │       │   └── email-report/route.ts      # POST (generate + email PDF via Resend)
│   │       ├── scenarios/
│   │       │   ├── route.ts       # GET admin (full scenarios w/ scores), DELETE/POST/PATCH for content edits
│   │       │   └── public/route.ts            # GET public (no scores)
│   │       ├── band-descriptions/route.ts     # GET (Tier 2 — band descriptions)
│   │       ├── archetypes/route.ts            # GET (Tier 2 — archetype descriptions)
│   │       ├── strategic-leverage/route.ts    # GET (Tier 3 — leverage blocks)
│   │       ├── integration-insights/route.ts  # GET (Tier 3 — strongest×weakest insights)
│   │       ├── profile-dynamics/route.ts      # POST (AI narrative via Gemini, DB-cached)
│   │       ├── team-dynamics/route.ts         # POST (team-level analysis)
│   │       ├── report/[sessionId]/route.ts    # GET (public per-session report data, no PII)
│   │       └── team-report/[codeId]/route.ts  # GET (public aggregate team data)
│   ├── data/
│   │   ├── types.ts               # TypeScript interfaces
│   │   └── constants.ts           # All static content, themes, scenarios, archetypes
│   └── lib/
│       ├── prisma.ts              # Prisma client singleton
│       ├── pdf-template.tsx       # React-PDF report template
│       ├── profile-dynamics.ts    # AI profile dynamics prompt, builder, validation
│       ├── team-dynamics.ts       # Team aggregation + analysis logic
│       └── utils.ts               # Band calc, archetype logic, UUID
├── ui-versions/                   # Snapshots of UI files before edits (rollback log)
├── Reference_Files/               # Methodology + content specs (source of truth)
├── Old_Files/                     # Archived earlier specs
├── Arabic_Plan_Files/             # Arabic localization planning
├── mockups/                       # HTML mockups
├── .env.example                   # Environment variable template
├── vercel.json                    # Vercel deployment config
├── CLAUDE.md                      # Claude Code session instructions
├── PROJECT_DETAILS.md             # This file
├── PROJECT_PROGRESS.md            # Session-by-session change log
├── REUSABLE_PATTERNS.md           # Reusable mechanisms and bootstrap guide for new projects
└── package.json                   # Dependencies and scripts
```

---

## Assessment Framework

### The Five Dimensions (Liedtka)

| # | Dimension | Core Question |
|---|-----------|---------------|
| 1 | Systems Thinking | Do you see the whole, or just your part? |
| 2 | Strategic Intent | Do you have a clear north star that channels your energy? |
| 3 | Thinking in Time | Do you connect past patterns to future possibilities? |
| 4 | Hypothesis-Driven Thinking | Do you generate and test ideas systematically? |
| 5 | Intelligent Opportunism | Can you stay focused AND remain open to the unexpected? |

### Scoring

- **15 scenarios** (3 per dimension), each with 4 options (A–D)
- Each option maps to a score: 1 (Functional), 2 (Analytical), 3 (Strategic), 4 (Integrative)
- Component score = average of its 3 scenario scores
- Overall average = mean of all 5 component scores
- Scale: 1.0–4.0

### Scoring Bands

| Band | Range | Meaning |
|------|-------|---------|
| Integrative | 3.4–4.0 | Instinctive, embedded capability |
| Strategic | 2.8–3.3 | Strong capability with refinement potential |
| Analytical | 1.8–2.7 | Sound reasoning but room for strategic depth |
| Functional | 1.0–1.7 | Task-focused with clear growth opportunity |

### Archetypes (16)

Assigned based on profile **shape** (not total score). Classification follows three steps, checked in order:

| Step | Rule | Result |
|------|------|--------|
| 1. Balanced | Max minus min ≤ 1.0 | The Balanced Thinker (1 archetype) |
| 2. Spiked | Top component ≥ 1.0 above second highest | Named by dominant component (5 archetypes) |
| 3. Paired | Everything else (gap < 1.0, spread > 1.0) | Named by top two components (10 archetypes) |

**Spiked Archetypes:** The Weaver (Systems), The Torchbearer (Intent), The Tracer (Time), The Investigator (Hypothesis), The Spotter (Opportunism)

**Paired Archetypes:** The Architect (Systems+Intent), The Navigator (Systems+Time), The Engineer (Systems+Hypothesis), The Ranger (Systems+Opportunism), The Pilot (Intent+Time), The Pioneer (Intent+Hypothesis), The Visionary (Intent+Opportunism), The Analyst (Time+Hypothesis), The Scout (Time+Opportunism), The Pragmatist (Hypothesis+Opportunism)

### Role-Adjusted Strength/Growth Thresholds

What counts as a "strength" vs "growth area" depends on the respondent's role level. Dimensions at or above the threshold appear in the Strengths tab; below appear in the Growth tab. Minimum 1 item guaranteed on each tab.

| Role Tier | Strength Threshold |
|-----------|--------------------|
| Individual Contributor / Early Career | ≥ 2.1 |
| Team Leader / Supervisor | ≥ 2.4 |
| Manager / Department Head | ≥ 2.8 |
| Senior Leader / Executive | ≥ 3.0 |

The floor of 2.1 corresponds to the Practitioner leverage band — below 2.1, the leverage content shifts to a "developing" fallback rather than a "deploy your strength" framing.

Defined in `src/data/constants.ts` as `ROLE_STRENGTH_THRESHOLD`.

---

## Database Schema

**Provider:** PostgreSQL (Neon, connection-pooled)

### AccessCode

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| code | String | Unique, the actual code value |
| description | String | Internal label (not shown to users) |
| maxUses | Int | Maximum allowed uses |
| currentUses | Int | Counter, default 0 |
| expiresAt | DateTime? | Optional expiry date |
| isActive | Boolean | Manual toggle, default true |
| createdAt | DateTime | Auto |
| sessions | Relation | One-to-many → AssessmentSession |

Indexes: `code`, `isActive`

### AssessmentSession

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| createdAt | DateTime | Auto |
| completedAt | DateTime | Auto |
| name | String? | Optional |
| email | String? | Optional |
| role | String | Required |
| industry | String | Required |
| companySize | String | Required |
| experience | String | Required |
| gender | String? | Optional |
| domain | String | Functional domain (default `""`) |
| accessCodeId | String? | FK → AccessCode (nullable) |
| systemsScore | Float | 1.0–4.0 |
| intentScore | Float | 1.0–4.0 |
| timeScore | Float | 1.0–4.0 |
| hypothesisScore | Float | 1.0–4.0 |
| opportunismScore | Float | 1.0–4.0 |
| archetype | String | One of 16 archetypes (1 balanced, 5 spiked, 10 paired) |
| overallAverage | Float | Mean of 5 scores |
| reportDownloaded | Boolean | Default false |
| profileDynamics | String? | Cached AI-generated narrative (DB cache) |
| responses | Relation | One-to-many → AssessmentResponse |

Indexes: `createdAt`, `email`, `archetype`, `accessCodeId`

### AssessmentResponse

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| sessionId | String | FK → AssessmentSession |
| scenarioId | Int | 1–15 |
| selectedOptionId | String | A, B, C, or D |
| score | Int | 1–4 |

Unique constraint: `(sessionId, scenarioId)`

### Scenario

| Field | Type | Notes |
|-------|------|-------|
| id | Int | Primary key (1–15, fixed) |
| component | String | systems, intent, time, hypothesis, opportunism |
| situation | String | Scenario context paragraph |
| prompt | String | Question prompt (may be empty) |
| sortOrder | Int | Display order |
| options | Relation | One-to-many → ScenarioOption |

Indexes: `component`

### ScenarioOption

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| scenarioId | Int | FK → Scenario |
| optionId | String | A, B, C, or D |
| text | String | Option text |
| score | Int | 1–4 (kept server-side; never returned to public clients) |
| sortOrder | Int | Display order |

Unique constraint: `(scenarioId, optionId)` · Indexes: `scenarioId`

### BandDescription (Tier 2)

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| component | String | systems, intent, time, hypothesis, opportunism |
| band | String | Functional / Analytical / Strategic / Integrative |
| description | String | Band-level narrative for the component |
| sortOrder | Int | Display order |

Unique constraint: `(component, band)` · Indexes: `component`

### ArchetypeDescription (Tier 2)

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | String | Unique — e.g. "The Architect" |
| description | String | Identity narrative |
| sortOrder | Int | Display order |

> Note: The legacy `ActionPlan` table was removed; tier-adapted action plans are now hardcoded in `src/data/constants.ts → TIER_ACTION_PLANS`. Run `sql/005_drop_action_plan_table.sql` to clean up.

### StrategicLeverage

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| component | String | systems, intent, time, hypothesis, opportunism |
| band | String | integrative, practitioner, analytical |
| whatGivesYou | String? | Null for analytical band |
| whereToDeploy | String? | Null for analytical band |
| riskOfOveruse | String? | Null for analytical band |
| fallback | String? | Only for analytical band |
| sortOrder | Int | Display order |

Unique constraint: `(component, band)`
Indexes: `component`

### IntegrationInsight

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| fromComponent | String | Strongest component (e.g. "systems") |
| toComponent | String | Weakest component (e.g. "intent") |
| insight | String | The integration insight text |
| sortOrder | Int | Display order |

Unique constraint: `(fromComponent, toComponent)`
Indexes: `fromComponent`

---

## API Routes

### Assessment

#### POST `/api/assessment/score`
Calculate scores server-side and save assessment to DB in one call. Individual per-scenario scores never leave the server.

**Body:** `{ answers: Record<number, string>, sessionId?, demographics?, accessCodeId? }`
- `answers`: key = question index (0-14), value = selected option id ("A","B","C","D")
- If `sessionId` is provided, saves the assessment + individual responses to DB and increments access code counter
**Returns:** `{ scores }` — only aggregated component averages (systems, intent, time, hypothesis, opportunism)

#### POST `/api/assessment`
Legacy endpoint — save a completed assessment to the database. Also increments the access code usage counter if `accessCodeId` is provided.

**Body:** `{ sessionId, scores, email?, name?, demographics, archetype, responses[], accessCodeId? }`
**Returns:** `{ id }`

#### PATCH `/api/assessment`
Update email/name on an existing assessment session.

**Body:** `{ sessionId, email?, name? }`
**Returns:** `{ id }`

#### GET `/api/assessment?key=ADMIN_KEY`
List all assessments (admin only).

**Returns:** Array of assessment objects including all demographics (role, industry, companySize, experience, gender), scores, archetype, and metadata.

#### GET `/api/assessment/[id]?key=ADMIN_KEY`
Fetch a single assessment with all responses.

**Returns:** Full assessment object with responses.

#### POST `/api/assessment/email-report`
Generate PDF and email it to the user via Resend.

**Body:** `{ email, name, scores }`
**Returns:** `{ success: true }`

### Access Codes

#### POST `/api/access-codes?key=ADMIN_KEY`
Create a new access code (admin only).

**Body:** `{ code?, description, maxUses, expiresAt? }`
- `code` is optional — if omitted, a random 8-character code (format `XXXX-XXXX`) is auto-generated
**Returns:** The created AccessCode object

#### GET `/api/access-codes?key=ADMIN_KEY`
List all access codes with session counts (admin only).

**Returns:** Array of AccessCode objects with `_count.sessions`

#### PATCH `/api/access-codes/[id]?key=ADMIN_KEY`
Toggle a code active/inactive (admin only).

**Body:** `{ isActive: boolean }`
**Returns:** Updated AccessCode object

#### GET `/api/access-codes/[id]?key=ADMIN_KEY`
Per-code analytics with all linked sessions (admin only).

**Returns:** AccessCode object with full `sessions[]` array (each session includes demographics, scores, archetype)

#### POST `/api/access-codes/validate`
Validate an access code (public endpoint, used by intro screen).

**Body:** `{ code: string }`
**Returns:** `{ valid: true, accessCodeId }` or `{ valid: false, error: "..." }`
Checks: existence, active status, expiry, usage limit

### Tier 1 Content (Scoring)

#### GET `/api/scenarios/public`
Fetch all 15 scenarios for the assessment UI. **Scores are stripped** so they never reach the client.

**Returns:** `{ scenarios: [{ id, component, situation, prompt, options: [{ id, text }] }] }`

#### GET `/api/scenarios?key=ADMIN_KEY`
Admin: fetch all scenarios including option scores.

#### POST / PATCH / DELETE `/api/scenarios?key=ADMIN_KEY`
Admin: create, edit, or delete scenarios and their options.

### Tier 2 Content (Interpretation Layer)

#### GET `/api/band-descriptions`
Fetch all band descriptions (public, 20 rows = 5 components × 4 bands).

**Returns:** `Record<component, Record<bandLabel, description>>`

#### GET `/api/archetypes`
Fetch all archetype identity descriptions (public, 16 rows).

**Returns:** `Record<archetypeName, description>`

### Tier 3 Content (Guidance Layer)

#### GET `/api/strategic-leverage`
Fetch all strategic leverage blocks (public, 15 rows = 5 components × 3 bands).

**Returns:** `Record<component, { integrative: { whatGivesYou, whereToDeploy, riskOfOveruse }, practitioner: { whatGivesYou, whereToDeploy, riskOfOveruse }, analytical: { fallback } }>`

#### GET `/api/integration-insights`
Fetch all integration insights (public, 20 rows = strongest × weakest pairs).

**Returns:** `Record<"from-to", insight>` — Key format: `"systems-intent"` (strongest-weakest)

### Profile Dynamics

#### POST `/api/profile-dynamics`
Generate an AI-powered profile narrative using Google Gemini. Cached per session in the database.

**Body:** `{ sessionId, scores, archetype: { name, description }, bandDescriptions, strengthComponents?, growthComponents?, demographics? }`
- `strengthComponents`: Role-adjusted list of component keys classified as strengths (e.g., `["systems", "intent", "time"]`)
- `growthComponents`: Role-adjusted list of component keys classified as growth areas (e.g., `["hypothesis", "opportunism"]`)
- `demographics`: Optional `{ role, industry, companySize, experience }` for demographic adaptation
**Returns:** `{ narrative, fromCache, isFallback, errorDetail? }`

The AI prompt generates four sections: How You Enter Problems, Where Your Combination Creates Advantage, The Pattern You May Not See, Your Development Edge. The strength/growth component lists are role-adjusted using the same `ROLE_STRENGTH_THRESHOLD` thresholds used by the results tabs.

**Caching:** First successful generation is saved to `AssessmentSession.profileDynamics`. Subsequent calls for the same `sessionId` return the cached narrative (`fromCache: true`). Fallbacks are NOT cached, so a transient Gemini failure won't poison the cache.

**Retry:** On Gemini failure or validation failure, retries once after a 2s delay. After two failed attempts, returns a generic fallback string.

**Validation:** Response must contain at least 3 of the 4 required section headers (case-insensitive), at least 4 sentences, no numeric score leaks (regex `\b\d\.\d\b`). Em dashes are replaced with periods server-side.

### Public Reports

#### GET `/api/report/[sessionId]`
Public per-session report data — no email, demographics, or per-question responses returned. Used by `/report/[sessionId]` page (shareable link).

**Returns:** `{ session: { id, name, role, scores, archetype, profileDynamics, createdAt } }`

#### GET `/api/team-report/[codeId]`
Public team-aggregate data for a given access code. Used by `/team-report/[codeId]` page.

**Returns:** Access code metadata + array of all completed sessions linked to the code (each with name, role, scores, archetype). Errors with 404 if no sessions are completed.

#### POST `/api/team-dynamics`
Generate team-level analysis (collective strengths, gaps, diversity score, member-level strength/gap breakdown).

**Body:** `{ members: TeamMember[] }`
**Returns:** `TeamAnalysis` (see `src/lib/team-dynamics.ts`)

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Main assessment: access code entry → demographics form → 15 scenarios → results page |
| `/admin` | Password-protected admin panel with 5 tabs: Dashboard, Submissions, Analytics, Access Codes, Scenarios (+ Tier 2 content editing) |
| `/report/[sessionId]` | Public shareable per-session report (no PII) |
| `/team-report/[codeId]` | Public team-aggregate report for a given access code |

---

## Admin Panel (`/admin`)

Password-protected with `ADMIN_KEY`. Four tabs:

### Dashboard Tab
- **Stat cards:** Total assessments, this month, this week, avg overall score
- **Top Archetype card:** Most common archetype with count and percentage
- **Per-dimension avg cards:** Average score for each of the 5 dimensions
- **Archetype Distribution:** Pie chart of all archetypes
- **Band Distribution:** Bar chart of Functional / Analytical / Strategic / Integrative counts
- **Average Dimension Profile:** Radar chart of population-level dimension averages

### People Tab
- **Search bar:** Filter by name, email, role, industry, or archetype
- **Sortable table:** Click any column header to sort asc/desc. Columns: Name, Email, Role, Industry, Archetype, Avg, Sys, Int, Time, Hyp, Opp, Date
- **Detail view:** Click any row to see full profile: all demographics, archetype card, dimension score bars with band labels, spider chart

### Analytics Tab
- **Dimension selector:** Toggle between Role, Industry, Company Size, Experience, Gender, Archetype
- **Respondent count chart:** Horizontal bar chart of group sizes
- **Average score chart:** Horizontal bar chart of avg overall score per group
- **Dimension breakdown chart:** Grouped horizontal bar chart showing all 5 dimension averages per group
- **Summary table:** Tabular view of all analytics data

### Access Codes Tab
- **Code management table:** All codes listed with code value, description, uses (used/max), status badge (Active/Expired/Exhausted/Inactive), expiry date, created date, action buttons
- **Create code form:** Custom or auto-generated code, internal description, max uses, optional expiry date
- **Activate/Deactivate toggle:** Manually enable or disable any code independent of expiry
- **Per-code analytics detail view** (click code or "Analytics" button):
  - Header cards: code value + description, total uses, avg overall score, status
  - Group Average Profile: radar chart of dimension averages for all users of this code
  - Band Distribution: bar chart of Functional/Analytical/Strategic/Integrative for the group
  - Dimension average stat cards for each of the 5 dimensions
  - People table: full list of users who used the code with all scores and demographics

Uses Recharts for all charts (PieChart, BarChart, RadarChart). Light theme with navy + ochre accents.

---

## Results Page — Tabbed Report View

The results page uses a **5-tab guided experience** with progressive navigation. Users must visit tabs in order on first visit (first-time guided flow), after which all tabs unlock permanently (via localStorage).

### Tab Structure

| # | Tab | ID | Content |
|---|-----|-----|---------|
| 1 | The Foundation | `foundation` | Five dimensions explained (what each measures), plus core questions |
| 2 | Your Scores | `scores` | Scoring bands (How to Read Your Scores), radar chart, component score cards (sorted descending), integration insight |
| 3 | Your Profile | `profile` | Archetype name + description, AI-generated profile dynamics |
| 4 | Your Strengths | `strengths` | Strategic leverage for role-adjusted strengths (dynamic count) with deployment guidance by band |
| 5 | Your Growth | `growth` | Development plans for role-adjusted growth areas (dynamic count) with mindset shift, practice, and tool |

### "Why This Archetype" Paragraph

The Profile tab (Tab 3) displays a dynamically generated paragraph explaining why the respondent received their specific archetype. The paragraph is **hardcoded logic** (not AI-generated) and varies by profile shape:

- **Balanced:** Explains the even spread, references band range of highest/lowest, notes development lies in depth not blind spots
- **Spiked:** Names the dominant lens, describes how other dimensions cluster, identifies the default strategic orientation
- **Paired:** Names the two leading dimensions, their band levels, and uses a unique interaction phrase describing what the pair produces together (10 distinct phrases, one per component pair)

All score references use band labels (Functional/Analytical/Strategic/Integrative), never numeric scores. Implementation: `buildWhyArchetype()` in `src/app/page.tsx`. Spec: `Reference_Files/Why_This_Archetype_Spec_v1.0_2026-03-30`.

### Report UX Features

- **Collapsible "How to Read This Report"** — Sits above the tab bar, expanded by default, lists all 5 sections with descriptions. Has a "Got it" dismiss button and chevron toggle. Re-expands on page refresh (no localStorage persistence).
- **Sticky tab bar** — Fixes to top of viewport when user scrolls past it. Uses IntersectionObserver for detection, compact padding when sticky, blurred backdrop.
- **Floating scoring key** — Only appears on Scores tab (Tab 2) when the expanded scoring bands section scrolls out of view. Shows 4 scoring bands as compact pills; hover/tap expands with full description. Offsets below sticky tab bar when both are visible.
- **Scroll-to-top on tab change** — Page smoothly scrolls to the top of the results section when switching tabs.
- **First-visit guided flow** — Tabs unlock sequentially on first visit; "Next" button at bottom of each tab. All tabs unlock permanently once Tab 5 is reached.
- **Nav footer** — Previous/Next buttons at bottom of each tab with email report link.
- **Email report** — Users can email themselves a PDF report from any tab.

---

## PDF Report Sections (same order as web)

1. Header (brand, title, name, date)
2. Archetype
3. Scores Summary (inline)
4. Disclaimer
5. Scoring Bands
6. Component Scores (with bars)
7. Integration Insight
8. Strategic Leverage (role-adjusted strengths)
9. Development Plan (role-adjusted growth areas)
10. Footer
11. Annex

---

## Theme System

Two complete themes (dark and light) with 30+ color tokens each, toggled via a sun/moon button. Themes are defined in `src/data/constants.ts` under `THEMES`. All styling is inline (no Tailwind utility classes).

**Fonts:**
- Playfair Display (serif) — headings
- DM Sans (sans-serif) — UI and labels
- Source Serif 4 (serif) — body content

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `ADMIN_KEY` | Yes | Secret key for admin panel access |
| `RESEND_API_KEY` | Yes | Resend API key for email delivery |
| `GEMINI_API_KEY` | Yes | Google Gemini API key for Profile Dynamics narrative generation |

Template: `.env.example`

---

## Build Commands

```bash
npm run dev        # Start development server
npm run build      # Full production build (requires DB)
npx tsc --noEmit   # TypeScript check only (no DB needed)
npx prisma db push # Sync schema to database
npx prisma studio  # Open database GUI
```

---

## Deployment

- **Platform:** Vercel
- **Database:** Neon PostgreSQL (serverless)
- **Email:** Resend
- **AI:** Google Gemini 2.5 Flash
- **Config:** `vercel.json` (framework: nextjs)
- **Env vars:** Set in Vercel dashboard (DATABASE_URL, ADMIN_KEY, RESEND_API_KEY, GEMINI_API_KEY)

---

## Access Code System

### User Flow
1. User lands on intro screen and sees the access code input field
2. User enters a code and clicks "Begin Assessment" (or presses Enter)
3. Code is validated against the database (checks: exists, active, not expired, not exhausted)
4. If valid → proceeds to demographics → assessment → results (code is linked to session on save)
5. If invalid → inline error message displayed, user can retry

### Code Properties
- **Code value:** Custom (admin types) or auto-generated (random `XXXX-XXXX` format)
- **Description:** Internal label for admin to identify the group (not shown to users)
- **Max uses:** Admin-defined limit (e.g., 1 for single-use, 50 for a team)
- **Expiry date:** Optional, code stops working after this date
- **Active toggle:** Manual on/off switch independent of expiry

### Code Statuses
| Status | Condition |
|--------|-----------|
| Active | `isActive=true`, not expired, actual session count < maxUses |
| Expired | `expiresAt` is in the past |
| Exhausted | Actual linked session count >= maxUses (uses `_count.sessions`, not `currentUses` counter) |
| Inactive | `isActive=false` (manually deactivated) |

**Note:** Status is determined by counting actual linked sessions (`_count.sessions`) rather than the `currentUses` counter field. This prevents drift between the counter and reality.

---

---

## Security Notes

- **Server-side scoring** — Individual per-scenario scores are never returned to the client. The browser only ever receives the 5 aggregated component averages. See `/api/assessment/score`.
- **Public scenario endpoint strips scores** — `/api/scenarios/public` excludes the `score` field on each option so the scoring model can't be reverse-engineered from DevTools.
- **Admin endpoints require key in query string** — `?key=ADMIN_KEY` is checked server-side. Rotate `ADMIN_KEY` if leaked.
- **Access code validation is rate-unlimited** — Consider Vercel/Cloudflare rate limits at the platform layer if abuse becomes a concern.

---

*Last updated: 2026-04-28*

# Reusable Patterns & Bootstrap Guide

> A portable catalog of the building blocks behind Strategic Thinking Profile, abstracted from its specific assessment content. Use this to start a new diagnostic / scored-questionnaire / report-generating app from the same skeleton.
>
> **This copy lives in the Endurance Assessment repo.** See the [Applicability to The Endurance Assessment](#applicability-to-the-endurance-assessment) section below for a per-pattern note on what carries over, what changes, and what to drop entirely for this product.

---

## Table of Contents

0. [Applicability to The Endurance Assessment](#applicability-to-the-endurance-assessment) *(this project)*
1. [What's reusable here (and what isn't)](#whats-reusable-here-and-what-isnt)
2. [Bootstrapping a new project](#bootstrapping-a-new-project)
3. [Theme system (dual-mode, token-based, no Tailwind)](#1-theme-system)
4. [Three-tier content model](#2-three-tier-content-model)
5. [Server-side scoring (anti-leak)](#3-server-side-scoring)
6. [Role-adjusted thresholds](#4-role-adjusted-thresholds)
7. [Archetype / classification engine](#5-archetype-classification-engine)
8. [AI narrative with DB cache + retry + validator](#6-ai-narrative-with-db-cache)
9. [Tabbed guided-flow with sequential unlock](#7-tabbed-guided-flow)
10. [Sticky tab bar + floating context key (IntersectionObserver)](#8-sticky-tab-bar--floating-key)
11. [Access-code gating system](#9-access-code-gating-system)
12. [PDF generation + email delivery](#10-pdf-generation--email)
13. [Admin panel skeleton](#11-admin-panel-skeleton)
14. [Team / cohort aggregation](#12-team-aggregation)
15. [Public shareable per-session report](#13-public-shareable-report)
16. [Refresh protection via localStorage](#14-refresh-protection)
17. [Smaller patterns](#15-smaller-patterns)

---

## Applicability to The Endurance Assessment

This patterns catalog was extracted from the Strategic Thinking Profile (an **individual** scored assessment with archetypes and per-session AI narrative). The Endurance Assessment is **organizational**, **anonymous-in-aggregate**, **deadline-driven**, and uses **multi-variant filtered reports** with provider-abstracted AI. Several patterns carry over unchanged, several need reshaping, and a few should not be carried over at all.

Use this table when reaching for a pattern. Match the pattern to the product, not the other way around.

| # | Pattern | Status here | Note |
|---|---------|-------------|------|
| 1 | Theme system (inline tokens, no Tailwind) | **Drop** | This project uses **Tailwind CSS** by decision (see `Plan & Progress/execution-plan.md`). Keep the *idea* of design tokens (centralized colors/spacing) but express them as Tailwind theme extensions, not the THEMES object pattern below. |
| 2 | Three-tier content model (raw / interpretation / guidance) | **Partial** | We have **only Tier 1** (questions + scoring) plus the AI-generated narrative. Bands are simple thresholds (no Tier 2 description editing). No archetypes → no Tier 2 archetype rows. No per-tier "leverage" / "action plan" content tables → action items come from the LLM. |
| 3 | Server-side scoring (anti-leak) | **Apply** | Carry over the principle: aggregate on the server, never ship raw individual answers to the client unless the admin opens the "Anonymized Individuals" view (which is gated by ≥3 respondents and audit-logged). See `src/lib/scoring.ts` in `PROJECT_DETAILS.md`. |
| 4 | Role-adjusted thresholds | **Drop** | Bands are uniform (Critical Gap / Needs Work / Solid / Strong) across all levels. The "Level" demographic is used for **filtering**, not for adjusting thresholds. |
| 5 | Archetype / classification engine | **Drop** | No archetypes in this product. The equivalent narrative output is the AI executive summary + focus-area action items. |
| 6 | AI narrative with DB cache + retry + validator | **Apply (reshaped)** | Cache is **per `(assessmentId, filterSignature)`**, not per session. Multiple cached entries per assessment (one per filter). Validator should accept the new JSON shape (`executiveSummary`, `focusAreaActions[]`). Add: provider abstraction so the same code paths work for Gemini / Claude / OpenAI. See `src/lib/ai/`. |
| 7 | Tabbed guided flow (sequential unlock) | **Drop** | Respondent flow is Typeform-style (one question per screen, linear). Admin results page uses normal tabs (no sequential unlock). |
| 8 | Sticky tab bar + floating key (IntersectionObserver) | **Optional** | Useful on the long admin results page; lift directly if/when needed. Not required for v1. |
| 9 | Access-code gating system | **Apply (reshaped)** | One code = **one respondent**, not a cohort code. 6-char alphanumeric, alphabet excludes `0/O/1/I/L`. Codes are distributed manually (no email). See `src/lib/codes.ts`. |
| 10 | PDF generation + email delivery | **Partial** | PDF: keep — React-PDF template, page-break rules, filter summary header. Email: **drop entirely.** No Resend dependency, no email templates. |
| 11 | Admin panel skeleton (auth-by-key) | **Drop the auth shape** | NextAuth credentials provider replaces single-key auth. Two roles: `admin` and `super_admin` (with super-admin-only routes for `/settings/ai` and `/admins`). The sortable/filterable table primitives are still useful — keep those. |
| 12 | Team / cohort aggregation | **Apply (reshaped)** | This is the *core* of this product, not an add-on. Aggregation runs in `src/lib/scoring.ts` and respects the active filter. There is no "individual report" mode — aggregation is the only mode. |
| 13 | Public shareable per-session report | **Drop** | Respondents do not see results. Only authenticated admins access reports. No public share links. |
| 14 | Refresh protection via localStorage | **Apply (reshaped)** | Used during the respondent flow only (`localStorage["tea_progress_<respondentId>"]` keeps question index + in-progress answers). Cleared on submit. The admin results page is server-rendered; no localStorage protection needed there. |
| 15 | Smaller patterns | **Apply selectively** | Most are still useful (Prisma client singleton, `genUUID`, hooks for outside-click, etc.). Skip anything keyed to the dropped patterns above. |

**Also dropped from the reference project:**
- Forefront's **Strategic Thinking** brand palette / Playfair Display heading font are not the source of truth here. Visual design language for The Endurance Assessment lives in `product-spec/12_design_language.md`.
- The 15-scenario bank, 16-archetype taxonomy, role-adjusted thresholds, Profile Dynamics prompt, action-plan/leverage copy, and integration insights are all **content** belonging to the other product.

**Also new for this project (not in the reference patterns):**
- **Provider abstraction for AI** (Gemini / Claude / OpenAI behind one interface) — see `src/lib/ai/index.ts`.
- **AES-256 encryption of admin-supplied API keys at rest** — see `src/lib/crypto.ts`.
- **Hourly Vercel Cron closure check** flipping `collecting → closed` past deadline.
- **Filter signature** as a canonical cache key, used for both DB lookups and PDF filenames.
- **≥3-respondent anonymity guardrail** enforced at the filter layer.

When in doubt, the rule is: **if a pattern below contradicts a decision in `Plan & Progress/execution-plan.md`, the decisions log wins.** Update this table if a new pattern is introduced or a current one is reshaped during the build.

---

## What's reusable here (and what isn't)

**Reusable mechanisms** (this guide):
- The dual-theme inline-style token system
- The 3-tier content model (raw → interpretation → guidance)
- Server-side scoring with anti-leak guarantees
- Role-adjusted threshold pattern
- Shape-based classification (archetype) engine
- AI narrative integration with DB caching + retry + structural validation
- Tabbed guided-flow with progressive unlock + localStorage persistence
- Sticky/floating UI elements via IntersectionObserver
- Access-code authentication and analytics
- React-PDF report generation + Resend email delivery
- Admin panel skeleton (auth-by-key, sortable/filterable tables, per-cohort analytics)
- Team aggregation (collective strengths/gaps, diversity score)
- Public per-session/per-cohort shareable links

**Domain-specific** (do NOT carry over verbatim):
- The five Liedtka dimensions (`systems`, `intent`, `time`, `hypothesis`, `opportunism`)
- The 16-archetype taxonomy (Generalist + 5 spiked + 10 paired)
- The 15 scenario bank
- The strategic-thinking band labels (Functional / Analytical / Strategic / Integrative)
- The Profile Dynamics system prompt content
- The action-plan and leverage copy
- Forefront Consulting branding (gold accent palette, Playfair Display heading font)

When forking, replace the domain-specific content but keep the *shape* of the data structures.

---

## Bootstrapping a new project

### Day-0 prerequisites

| Tool | Why |
|------|-----|
| Node 20+ | Next.js 16 requires it |
| `npm` (or `pnpm`/`yarn`) | Package manager |
| Neon account | Free serverless Postgres tier is sufficient to start |
| Vercel account | Free deployment tier |
| Resend account | Free tier sends ~100 emails/day, enough for early testing |
| Google AI Studio account | Free Gemini API key |
| GitHub account + repo | For deployment hooks and Claude Code branch workflow |

### Step 1 — Create the Next.js project

```bash
npx create-next-app@latest my-diagnostic \
  --typescript --app --src-dir --no-tailwind --no-eslint --no-import-alias
cd my-diagnostic
```

Then add the dependencies that match this project:

```bash
npm install @prisma/client @react-pdf/renderer recharts resend @google/generative-ai
npm install --save-dev prisma @types/node
```

Add the `postinstall` script to `package.json` so Prisma re-generates after `npm install`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate"
  }
}
```

### Step 2 — Folder skeleton

Create these directories on day 1, even if some are empty:

```
my-diagnostic/
├── prisma/
│   └── schema.prisma
├── sql/                         # Ad-hoc DB migrations / seeds
├── src/
│   ├── app/
│   │   ├── page.tsx             # Single-page assessment + results
│   │   ├── layout.tsx
│   │   ├── globals.css          # Resets + font imports + keyframes
│   │   ├── icon.svg
│   │   ├── admin/page.tsx
│   │   ├── report/[sessionId]/page.tsx
│   │   ├── team-report/[codeId]/page.tsx
│   │   └── api/
│   │       ├── access-codes/{route.ts,[id]/route.ts,validate/route.ts}
│   │       ├── assessment/{route.ts,[id]/route.ts,score/route.ts,email-report/route.ts}
│   │       ├── scenarios/{route.ts,public/route.ts}
│   │       ├── band-descriptions/route.ts
│   │       ├── archetypes/route.ts
│   │       ├── strategic-leverage/route.ts
│   │       ├── integration-insights/route.ts
│   │       ├── profile-dynamics/route.ts
│   │       ├── team-dynamics/route.ts
│   │       ├── report/[sessionId]/route.ts
│   │       └── team-report/[codeId]/route.ts
│   ├── data/
│   │   ├── types.ts             # Domain types (rename to your dimensions)
│   │   └── constants.ts         # THEMES, BANDS, COMPONENTS, SCENARIOS, etc.
│   └── lib/
│       ├── prisma.ts
│       ├── utils.ts
│       ├── profile-dynamics.ts  # AI prompt + validator
│       ├── team-dynamics.ts
│       └── pdf-template.tsx
├── ui-versions/                 # Manual snapshots before UI edits
├── Reference_Files/             # Methodology / content specs
├── .env.example
├── .env.local                   # gitignored
├── .gitignore
├── vercel.json                  # { "framework": "nextjs" }
├── CLAUDE.md
├── PROJECT_DETAILS.md
├── PROJECT_PROGRESS.md
└── REUSABLE_PATTERNS.md
```

### Step 3 — Environment variables

Create `.env.example`:

```bash
DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"
ADMIN_KEY="any-secret-string-you-pick"
RESEND_API_KEY="re_xxx"
GEMINI_API_KEY="your-gemini-key"
```

Copy to `.env.local` and fill in real values. Add both `.env.local` and `.claude-token` to `.gitignore`.

### Step 4 — Prisma schema starter

`prisma/schema.prisma` (rename component keys + bands to your domain):

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

model AccessCode {
  id          String    @id @default(uuid())
  code        String    @unique
  description String
  maxUses     Int
  currentUses Int       @default(0)
  expiresAt   DateTime?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  sessions    AssessmentSession[]
  @@index([code])
  @@index([isActive])
}

model AssessmentSession {
  id              String   @id @default(uuid())
  createdAt       DateTime @default(now())
  completedAt     DateTime @default(now())
  name            String?
  email           String?
  // Demographics — adjust to your domain
  role            String
  industry        String
  companySize     String
  experience      String
  // Per-component aggregate scores — rename to your dimensions
  dimensionAScore Float
  dimensionBScore Float
  // ... one Float per dimension
  archetype       String
  overallAverage  Float
  accessCodeId    String?
  accessCode      AccessCode? @relation(fields: [accessCodeId], references: [id])
  // AI narrative cache
  narrative       String?
  responses       AssessmentResponse[]
  @@index([createdAt])
  @@index([archetype])
  @@index([accessCodeId])
}

model Scenario {
  id        Int     @id
  component String
  situation String
  prompt    String
  sortOrder Int     @default(0)
  options   ScenarioOption[]
  @@index([component])
}

model ScenarioOption {
  id         String @id @default(uuid())
  scenarioId Int
  optionId   String         // A, B, C, D
  text       String
  score      Int            // never returned to public client
  sortOrder  Int    @default(0)
  scenario   Scenario @relation(fields: [scenarioId], references: [id], onDelete: Cascade)
  @@unique([scenarioId, optionId])
  @@index([scenarioId])
}

model AssessmentResponse {
  id               String @id @default(uuid())
  sessionId        String
  scenarioId       Int
  selectedOptionId String
  score            Int
  session          AssessmentSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  @@unique([sessionId, scenarioId])
  @@index([sessionId])
}

// Tier 2 — interpretation
model BandDescription {
  id          String @id @default(uuid())
  component   String
  band        String
  description String
  sortOrder   Int    @default(0)
  @@unique([component, band])
}

model ArchetypeDescription {
  id          String @id @default(uuid())
  name        String @unique
  description String
  sortOrder   Int    @default(0)
}

// Tier 3 — guidance (optional, depending on your domain)
model StrategicLeverage {
  id            String  @id @default(uuid())
  component     String
  band          String
  whatGivesYou  String?
  whereToDeploy String?
  riskOfOveruse String?
  fallback      String?
  sortOrder     Int     @default(0)
  @@unique([component, band])
}

model IntegrationInsight {
  id            String @id @default(uuid())
  fromComponent String
  toComponent   String
  insight       String
  sortOrder     Int    @default(0)
  @@unique([fromComponent, toComponent])
}
```

Then:
```bash
npx prisma db push       # Sync schema to Neon
npx prisma generate      # Regenerate Prisma client
```

### Step 5 — What to strip from the source project when copying

If you copy this repo wholesale and rename, here's the strip list:

| Strip | Replace with |
|-------|--------------|
| `src/data/constants.ts` content (themes can stay, dimension/scenario/archetype data must change) | Your dimension keys, your scoring bands, your scenarios, your archetypes |
| `src/lib/profile-dynamics.ts` system prompt | Your domain's narrative prompt |
| `src/lib/pdf-template.tsx` copy and gold/cream palette | Your brand palette and section labels |
| `Reference_Files/` content | Your methodology + content spec docs |
| `Old_Files/` and `Arabic_Plan_Files/` | Delete (project-specific archives) |
| `mockups/` | Delete or replace |
| `ui-versions/` | Delete (start fresh) |
| `README.md`, `CLAUDE.md`, `PROJECT_DETAILS.md` | Rewrite for your project |
| GitHub repo URL in `CLAUDE.md` | Your repo |
| Forefront Consulting brand strings | Your brand |

Keep verbatim:
- `src/lib/prisma.ts` (singleton pattern)
- `src/lib/utils.ts` (`genUUID`, `getBand` — generic helpers; archetype logic needs your taxonomy)
- The `THEMES` token *structure* in `constants.ts` (replace the actual color values)
- All API route shapes (`/api/assessment/score`, access-code routes, scenarios endpoints, profile-dynamics retry pattern, etc.)
- The tabbed-flow + sticky-bar logic in `page.tsx`
- The Prisma schema *shape* (rename fields, keep relations and indexes)

### Day-1 checklist

- [ ] Repo created, `.env.local` filled in, `.gitignore` includes `.env*` and `.claude-token`
- [ ] `npm install` succeeds, `npx prisma db push` succeeds
- [ ] `npm run dev` boots and `/` renders
- [ ] `npx tsc --noEmit` passes
- [ ] `CLAUDE.md` rewritten for the new project (working guidelines kept verbatim)
- [ ] Initial empty Reference_Files added
- [ ] First commit made on `main` and pushed to GitHub
- [ ] Vercel project linked to GitHub repo and env vars set in Vercel dashboard
- [ ] First production deploy succeeds (no DB-dependent features yet — they need seed data)

---

## 1. Theme system

**Purpose:** Dual mode (dark/light) without Tailwind or a CSS-in-JS library. All styling is inline via a `t.<token>` reference. Toggle is a single state setter.

**Files:** `src/data/types.ts` (`ThemeColors` interface), `src/data/constants.ts` (`THEMES`, `BAND_COLORS`).

**Shape:**

```ts
// types.ts
export interface ThemeColors {
  bg: string; glow: string;
  text: string; textSoft: string; textMuted: string; textFaint: string; textGhost: string;
  gold: string; goldLight: string; goldMuted: string; goldGradient: string;
  btnGradient: string; btnText: string;
  cardBg: string; cardHover: string; cardBorder: string; cardBorderHover: string;
  selectedBg: string; selectedBorder: string;
  barBg: string;
  headerBg: string; headerBorder: string;
  accentBg: string; accentBorder: string;
  disabledText: string; disabledBg: string;
  chartGrid: string; chartTick: string; chartTickR: string;
  radarFill: string;
  toggleBg: string; toggleBorder: string; toggleIcon: string;
  chipBg: string;
  inputBg: string; inputBorder: string; inputText: string; inputFocus: string;
  successBg: string; successBorder: string; successText: string;
}
```

**Usage:**

```tsx
const [theme, setTheme] = useState<"dark" | "light">("light");
const t = THEMES[theme];

<div style={{ background: t.bg, color: t.text, border: `1px solid ${t.cardBorder}` }} />
```

**How to adapt:**
1. Keep the `ThemeColors` interface verbatim — it covers every UI surface this project hit.
2. Replace the gold/navy palette in both `dark` and `light` themes with your brand colors. The token *names* don't need to literally describe gold — `gold` becomes "primary accent" in your head.
3. `BAND_COLORS` is for chart segments. Keep the structure (one color per band per theme).

**Gotchas:**
- Recharts components don't accept `style={t.x}` — pass the color value directly to `stroke`, `fill`, etc.
- Hover states use `onMouseEnter` / `onMouseLeave` to swap inline styles. There's no `:hover` pseudo-class with inline styles.
- If you switch to Tailwind later, generate Tailwind class strings from these tokens rather than rebuilding the color system.

---

## 2. Three-tier content model

**Purpose:** Separate raw scoring data from interpretation copy from guidance copy. Lets non-engineers edit interpretation/guidance via admin UI without redeploys, while keeping the scoring logic safe in code.

**The tiers:**

| Tier | What | Where |
|------|------|-------|
| Tier 1 — Raw scoring | Scenarios, options, scores, responses | `Scenario`, `ScenarioOption`, `AssessmentSession`, `AssessmentResponse` |
| Tier 2 — Interpretation | What a band/archetype *means* | `BandDescription`, `ArchetypeDescription` |
| Tier 3 — Guidance | What to *do* about the result | `StrategicLeverage`, `IntegrationInsight`, hardcoded `TIER_ACTION_PLANS` |

**Hard-coded fallback alongside DB content:** `src/data/constants.ts` keeps a complete copy of all interpretation and guidance content. The DB rows override constants when present. This means:
- The PDF generator can run even without DB content
- A fresh deploy works on day 1 before any seeding
- Admin edits take effect immediately without losing the canonical copy

**API route pattern:**

```ts
// /api/band-descriptions/route.ts
export async function GET() {
  const rows = await prisma.bandDescription.findMany({ orderBy: { sortOrder: "asc" } });
  const result: Record<string, Record<string, string>> = {};
  for (const r of rows) {
    if (!result[r.component]) result[r.component] = {};
    result[r.component][r.band] = r.description;
  }
  return NextResponse.json(result);
}
```

**Client merge:**

```ts
const bandDesc = dbBandDescs?.[component]?.[bandLabel] ?? getBandDesc(component, bandLabel);
```

**Adapt:** Drop tiers you don't need (e.g. if you don't ship guidance, skip Tier 3 entirely). The pattern is the same regardless of tier count.

---

## 3. Server-side scoring

**Purpose:** Prevent users from reverse-engineering the scoring model via DevTools. Individual per-question scores never reach the browser; only the 5 (or N) aggregated component averages do.

**Files:** `src/app/api/assessment/score/route.ts`, `src/app/api/scenarios/public/route.ts`.

**Two enforcement points:**

1. **Public scenarios endpoint strips scores:**

```ts
// /api/scenarios/public/route.ts
const scenarios = await prisma.scenario.findMany({
  include: { options: { select: { id: true, optionId: true, text: true, sortOrder: true } } },
});
// `score` field never selected, never returned
```

2. **Score endpoint takes answers, returns aggregates:**

```ts
// /api/assessment/score/route.ts — POST
// Body: { answers: Record<questionIndex, optionId>, sessionId?, demographics?, accessCodeId? }
// Server fetches scenarios + options (with scores), looks up the score for each answer,
// computes per-component averages, saves session + responses to DB if sessionId is provided,
// returns ONLY the aggregated averages.
return NextResponse.json({ scores }); // { systems: 3.0, intent: 2.7, ... }
```

**Save and increment in the same transaction:**

```ts
if (sessionId) {
  await prisma.assessmentSession.create({ data: { id: sessionId, /* demographics, scores */, responses: { create: responses } } });
  if (accessCodeId) await prisma.accessCode.update({ where: { id: accessCodeId }, data: { currentUses: { increment: 1 } } });
}
```

**Gotchas:**
- Don't accidentally re-expose scores via the admin endpoint without a `?key=` check.
- The scoring endpoint is the *only* place that should write `AssessmentSession` rows for completed assessments. Don't have multiple write paths or you'll drift.
- localStorage on the client should hold only the aggregated scores + sessionId — never individual responses.

---

## 4. Role-adjusted thresholds

**Purpose:** "Strength" and "growth area" should mean different things at different career stages. A 2.5 means something different for an IC than for an Executive.

**File:** `src/data/constants.ts`.

```ts
export const ROLE_STRENGTH_THRESHOLD: Record<string, number> = {
  "Individual Contributor / Early Career": 2.1,
  "Team Leader / Supervisor": 2.4,
  "Manager / Department Head": 2.8,
  "Senior Leader / Executive": 3.0,
};
```

**Three-step strength/growth split with min-1 guarantee:**

```ts
const threshold = ROLE_STRENGTH_THRESHOLD[role] ?? 2.8;
const sortedDesc = COMPONENTS.map((c) => ({ ...c, score: scores[c.key] })).sort((a, b) => b.score - a.score);
const sortedAsc = [...sortedDesc].reverse();

const strengthsByThreshold = sortedDesc.filter((c) => c.score >= threshold);
const growthByThreshold = sortedAsc.filter((c) => c.score < threshold);

let strengths = strengthsByThreshold;
let growth = growthByThreshold;

// Guarantee at least one strength and one growth area
if (strengths.length === 0) {
  strengths = [sortedDesc[0]];
  growth = growthByThreshold.filter((c) => c.key !== sortedDesc[0].key);
} else if (growth.length === 0) {
  growth = [sortedAsc[0]];
  strengths = strengthsByThreshold.filter((c) => c.key !== sortedAsc[0].key);
}
```

**Why min-1:** A user who scores 4.0 on everything still benefits from one growth area (and vice versa). Empty result lists also break downstream UI.

**Adapt:** Pick thresholds that map to your bands. The key insight is that the threshold should sit at or above the boundary of the second band (here, 2.1 corresponds to the start of the "Practitioner" leverage band).

---

## 5. Archetype classification engine

**Purpose:** Turn an N-dimensional score profile into a single named identity. Use *shape*, not magnitude — two users with the same average can land in different archetypes.

**File:** `src/lib/utils.ts → getArchetype(scores)`.

**Three-step rule (checked in order):**

```ts
const sorted = entries.sort((a, b) => b[1] - a[1]); // [[key, score], ...]
const max = sorted[0][1];
const min = sorted[sorted.length - 1][1];
const spread = max - min;

// Step 1 — Balanced: spread ≤ 1.0 → single "balanced" archetype
if (spread <= 1.0) return BALANCED_ARCHETYPE;

// Step 2 — Spiked: top component ≥ 1.0 above 2nd → archetype keyed by dominant component
const topKey = sorted[0][0];
const secondScore = sorted[1][1];
if (max - secondScore >= 1.0) return SPIKED_ARCHETYPES[topKey];

// Step 3 — Paired: everything else → archetype keyed by sorted pair of top 2 components
const secondKey = sorted[1][0];
const pairKey = [topKey, secondKey].sort().join("-");
return PAIRED_ARCHETYPES[pairKey] || BALANCED_ARCHETYPE;
```

**Counts:** With 5 components, this produces 1 + 5 + 10 = 16 archetypes (the 10 pairs are `C(5,2)`).

**Adapt:**
- For 4 dimensions: 1 + 4 + 6 = 11 archetypes
- For 6 dimensions: 1 + 6 + 15 = 22 archetypes
- Adjust the `1.0` thresholds based on your scale (this codebase uses a 1–4 scale). For a 1–5 scale, try `1.25`. For a 1–7 scale, try `1.75`.

**Always sort the pair key alphabetically** — otherwise `intent-systems` and `systems-intent` would be different keys for the same pair.

**Why this archetype paragraph:** Hard-coded shape-based logic in `buildWhyArchetype()` (`src/app/page.tsx`) explains *why* the user got their archetype using band labels, not numeric scores. This avoids leaking the scoring model in user-facing copy.

---

## 6. AI narrative with DB cache

**Purpose:** Generate a personalized narrative from the user's scores using an LLM, cache it per session so it never regenerates, and degrade gracefully on API failures.

**Files:** `src/lib/profile-dynamics.ts`, `src/app/api/profile-dynamics/route.ts`. DB column: `AssessmentSession.profileDynamics` (`String?`).

**Architecture:**

```
client → POST /api/profile-dynamics { sessionId, scores, archetype, bandDescriptions, strengthComponents, growthComponents, demographics }
  ↓
  1. Look up session.profileDynamics in DB
     → if present: return { narrative, fromCache: true, isFallback: false }  // FAST PATH
  2. Build user prompt via buildProfileDynamicsUserPrompt(input)
  3. Call Gemini with PROFILE_DYNAMICS_SYSTEM_PROMPT as systemInstruction
  4. validateProfileDynamicsResponse(text)
     - check minimum sentence count
     - check at least 3 of 4 required section headers
     - strip em dashes (→ replace with `. `)
     - strip sentences containing numeric scores (regex `\b\d\.\d\b`)
  5. If invalid OR Gemini threw: wait 2s, retry once
  6. If both attempts fail: return PROFILE_DYNAMICS_FALLBACK with isFallback: true
  7. If valid (real narrative): persist to session.profileDynamics, then return
     // Fallbacks are NOT cached — transient errors don't poison future calls
```

**Gemini call:**

```ts
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: PROFILE_DYNAMICS_SYSTEM_PROMPT,
  generationConfig: { temperature: 0.3, maxOutputTokens: 3000 },
});
const result = await model.generateContent(userPrompt);
return result.response.text();
```

**Validator structure (worth copying verbatim):**

```ts
const REQUIRED_HEADER_PHRASES = ["How You Enter Problems", "Where Your Combination...", ...];
const NUMERIC_SCORE_PATTERN = /\b\d\.\d\b|\bscor(?:ed|ing)\s+\d/gi;
const EM_DASH = /—/g;

export function validate(text: string): { valid: boolean; cleaned: string; reason?: string } {
  if (!text?.trim()) return { valid: false, cleaned: "", reason: "Empty" };
  const sentences = text.split(/\.\s/).filter((s) => s.trim().length > 10);
  if (sentences.length < 4) return { valid: false, cleaned: text, reason: "Too few sentences" };
  const headers = REQUIRED_HEADER_PHRASES.filter((h) => text.toLowerCase().includes(h.toLowerCase()));
  if (headers.length < 3) return { valid: false, cleaned: text, reason: "Missing headers" };
  let cleaned = text.replace(EM_DASH, ". ");
  if (NUMERIC_SCORE_PATTERN.test(cleaned)) {
    cleaned = cleaned.replace(/[^.]*\b\d\.\d\b[^.]*/g, "").replace(/\s{2,}/g, " ").trim();
  }
  return { valid: true, cleaned };
}
```

**Why this works:**
- **DB cache** beats in-memory cache because Vercel functions are stateless. The session row IS the cache.
- **Validation** catches LLM drift (em dashes, numeric leaks, missing structure) before users see it.
- **Retry once with 2s delay** handles transient rate limits and bad generations without compounding the wait.
- **Don't cache fallbacks** — a single bad day from the LLM provider would otherwise lock users into the generic copy forever.

**Adapt:**
- Switch model providers by changing `getGemini()` and the `callX()` function. The validator and cache logic don't change.
- Tune `temperature` per use case (0.3 here keeps output structurally consistent; higher temperatures need stricter validation).
- Add new validation rules as you discover the model's failure modes — log invalid outputs to a table to find patterns.

**Building a structured user prompt:**

```ts
const lines: string[] = ["Generate a narrative for this respondent.", "", "SCORES:"];
for (const cb of componentBands) lines.push(`- ${cb.label}: ${cb.band} band`);
lines.push("", `RANKING (highest to lowest): ${ranked.map((r) => r.label).join(", ")}`);
lines.push("", `ARCHETYPE: ${archetype.name}`, archetype.description);
lines.push("", `STRENGTH COMPONENTS (role-adjusted): ${strengthBands.join(", ")}`);
lines.push(`GROWTH COMPONENTS (role-adjusted): ${growthBands.join(", ")}`);
lines.push("", "BAND DESCRIPTIONS ALREADY SHOWN TO RESPONDENT:");
for (const cb of componentBands) lines.push(`${cb.label} — ${cb.band}: ${bandDescriptions[cb.key]}`);
return lines.join("\n");
```

This is more reliable than f-strings. Easier to add/remove sections, and renders deterministically.

---

## 7. Tabbed guided flow

**Purpose:** Walk first-time users through a multi-section result page sequentially (Tab 1 → 2 → 3 → 4 → 5), then unlock free navigation forever once they've seen all of it.

**File:** `src/app/page.tsx`. Storage key: `localStorage["stp_guided_complete"]`.

**State:**

```ts
const [activeTab, setActiveTab] = useState(0);
const [maxVisited, setMaxVisited] = useState(0);
const [guidedComplete, setGuidedComplete] = useState(false);
const [tabFadeIn, setTabFadeIn] = useState(true);
```

**Restore on mount:**

```ts
useEffect(() => {
  try {
    if (localStorage.getItem(LS_GUIDED_KEY) === "true") setGuidedComplete(true);
  } catch { /* localStorage unavailable */ }
}, []);
```

**Navigation guard + persistence:**

```ts
const goToTab = useCallback((idx: number) => {
  // Allow tabs that are previously visited OR the immediate next tab in the guided sequence
  if (guidedComplete || idx <= maxVisited + 1) {
    setTabFadeIn(false);
    setTimeout(() => {
      setActiveTab(idx);
      if (idx > maxVisited) setMaxVisited(idx);
      // Mark guided complete when reaching the last tab for the first time
      if (idx === LAST_TAB_INDEX && !guidedComplete) {
        setGuidedComplete(true);
        try { localStorage.setItem(LS_GUIDED_KEY, "true"); } catch {}
      }
      setTabFadeIn(true);
      // Smooth scroll to top of the tab bar (not the page header)
      tabBarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  }
}, [guidedComplete, maxVisited]);
```

**Tab definitions:**

```ts
const TABS = [
  { id: "foundation", label: "The Foundation", short: "Foundation", subtitle: "..." },
  { id: "scores", label: "Your Scores", short: "Scores", subtitle: "..." },
  { id: "profile", label: "Your Profile", short: "Profile", subtitle: "..." },
  { id: "strengths", label: "Your Strengths", short: "Strengths", subtitle: "..." },
  { id: "growth", label: "Your Growth", short: "Growth", subtitle: "..." },
] as const;
```

**Locked-tab UI:** Tabs at index `> maxVisited + 1` render with reduced opacity and `cursor: not-allowed`. The next-in-sequence tab is enabled and highlighted ("Next →" button at bottom of current tab also calls `goToTab(activeTab + 1)`).

**Fade transition:** `tabFadeIn` toggles, content has `opacity: tabFadeIn ? 1 : 0; transition: opacity 0.2s`. The 200ms timeout in `goToTab` matches the fade duration.

**Adapt:** Change tab count and content. The unlock logic is generic.

---

## 8. Sticky tab bar + floating key

**Purpose:** As the user scrolls, keep the tab navigation visible at the top of the viewport, and surface a compact "scoring key" reference when the in-page expanded version is no longer visible.

**File:** `src/app/page.tsx`. Uses `IntersectionObserver`.

**Sticky tab bar:**

```ts
const tabBarRef = useRef<HTMLDivElement>(null);
const [stickyTabBar, setStickyTabBar] = useState(false);

useEffect(() => {
  const el = tabBarRef.current;
  if (!el) return;
  const observer = new IntersectionObserver(
    ([entry]) => setStickyTabBar(!entry.isIntersecting),
    { threshold: 0, rootMargin: "0px" }
  );
  observer.observe(el);
  return () => observer.disconnect();
}, [phase]);
```

When `stickyTabBar` is true, render a `position: fixed; top: 0` clone of the tab bar with a blurred backdrop:

```tsx
{stickyTabBar && (
  <div style={{
    position: "fixed", top: 0, left: 0, right: 0,
    background: t.headerBg,
    borderBottom: `1px solid ${t.headerBorder}`,
    backdropFilter: "blur(12px)",
    zIndex: 50,
    padding: "12px 16px", // compact padding when sticky
  }}>
    {/* compact tab buttons */}
  </div>
)}
```

**Floating scoring key:** Same pattern but observes the `scoringBandsRef` (the in-page expanded bands section). Only renders on the relevant tab:

```ts
useEffect(() => {
  const el = scoringBandsRef.current;
  if (!el) return;
  const observer = new IntersectionObserver(
    ([entry]) => setShowFloatingKey(!entry.isIntersecting),
    { threshold: 0, rootMargin: "-60px 0px 0px 0px" } // accounts for sticky header
  );
  observer.observe(el);
  return () => observer.disconnect();
}, [activeTab]);
```

**The `rootMargin: "-60px 0px 0px 0px"`** is critical — without it, the floating key would show behind the sticky bar. Adjust to the height of your sticky header.

**Adapt:** Any time you have an in-page reference (legend, key, summary) that benefits from staying accessible while scrolling, use this pattern. Don't use `position: sticky` — it doesn't compose well with multiple sticky regions.

---

## 9. Access-code gating system

**Purpose:** Issue codes to clients/cohorts so you can attribute completed assessments to a group, set usage caps, and serve aggregate team reports.

**Files:**
- Validation: `src/app/api/access-codes/validate/route.ts` (public)
- CRUD: `src/app/api/access-codes/route.ts` and `[id]/route.ts` (admin-key gated)
- Schema: `AccessCode` model

**Code properties:**
- `code` — unique string. Auto-generated `XXXX-XXXX` (8 chars, A-Z + 0-9) if admin doesn't provide one.
- `description` — internal label (not shown to users).
- `maxUses` — admin-defined cap (1 for single-use, 50 for a team, etc).
- `expiresAt` — optional `DateTime`.
- `isActive` — manual toggle independent of expiry.

**Validation flow (4 checks in order):**

```ts
const code = await prisma.accessCode.findUnique({
  where: { code: input.trim().toUpperCase() },
  include: { _count: { select: { sessions: true } } },
});
if (!code) return { valid: false, error: "Invalid access code." };
if (!code.isActive) return { valid: false, error: "This access code has been deactivated." };
if (code.expiresAt && new Date() > code.expiresAt) return { valid: false, error: "This access code has expired." };
if (code._count.sessions >= code.maxUses) return { valid: false, error: "This access code has reached its usage limit." };
return { valid: true, accessCodeId: code.id };
```

**Critical:** Use `_count.sessions` (actual completed-session count via the Prisma relation), NOT the `currentUses` integer counter. The counter can drift if a save fails after increment, or if sessions are deleted from admin. The `_count` is the source of truth.

**Always uppercase** the input on validation: `code.trim().toUpperCase()`. Codes are case-insensitive for users.

**Linking:** `accessCodeId` lives on `AssessmentSession`. The save in `/api/assessment/score` is the only place it gets set:

```ts
await prisma.assessmentSession.create({ data: { /* ... */, accessCodeId: accessCodeId || null } });
if (accessCodeId) await prisma.accessCode.update({ where: { id: accessCodeId }, data: { currentUses: { increment: 1 } } });
```

**Adapt:** This is generic — works for any flow that needs cohort/group attribution. If you don't need usage caps, skip the `maxUses` check. If you don't need expiry, skip that check.

---

## 10. PDF generation + email

**Purpose:** Generate a polished PDF from session data on-demand (server-side) and email it to the user.

**Files:** `src/lib/pdf-template.tsx` (template), `src/app/api/assessment/email-report/route.ts` (delivery).

**Stack:**
- `@react-pdf/renderer` — declarative React-style PDF rendering. Uses its own `<Document>`, `<Page>`, `<View>`, `<Text>` components and a `StyleSheet.create()` API (NOT inline styles like the web app).
- `Resend` — email provider with attachment support.

**Server-side render:**

```ts
import { renderToBuffer } from "@react-pdf/renderer";
import { Resend } from "resend";

const buffer = await renderToBuffer(
  <StrategicThinkingReport scores={scores} archetype={archetype} /* ... */ />
);

await getResend().emails.send({
  from: "reports@yourdomain.com",
  to: email,
  subject: "Your Strategic Thinking Profile",
  html: "<p>Your report is attached.</p>",
  attachments: [{ filename: "report.pdf", content: buffer }],
});
```

**Important: PDF styles ≠ web styles.** React-PDF uses a separate `StyleSheet.create()` API. Define your PDF palette as constants at the top of `pdf-template.tsx` (gold, textDark, textMid, border, bgLight, accentBg). Don't try to share the web theme tokens — many CSS properties (`linear-gradient`, `backdropFilter`, etc.) are unsupported in PDF.

**Pull DB content with constants fallback:**

```ts
let dbBandDescs: Record<string, Record<string, string>> | undefined;
try {
  const rows = await prisma.bandDescription.findMany();
  if (rows.length > 0) {
    dbBandDescs = {};
    for (const r of rows) {
      if (!dbBandDescs[r.component]) dbBandDescs[r.component] = {};
      dbBandDescs[r.component][r.band] = r.description;
    }
  }
} catch { /* fall back to constants */ }
```

The PDF template is given both the DB map and constants — it picks DB if present, constants otherwise.

**Adapt:**
- Replace `<StrategicThinkingReport>` with your own template.
- Brand fonts: React-PDF supports custom fonts via `Font.register()`, but they must be loaded server-side. The default `Helvetica` family works without setup.
- `from:` address must be on a verified domain in Resend (otherwise sandbox to your own email).

---

## 11. Admin panel skeleton

**Purpose:** Single password-protected `/admin` route with multiple tabs covering CRUD, analytics, and content editing.

**File:** `src/app/admin/page.tsx`.

**Auth:** `?key=ADMIN_KEY` query string. The page asks for the key, stores it in state (NOT localStorage — keep it in-memory for the session), and includes it on every API call.

```tsx
const [key, setKey] = useState("");
const [authed, setAuthed] = useState(false);

const tryAuth = async () => {
  const res = await fetch(`/api/assessment?key=${encodeURIComponent(key)}`);
  if (res.ok) setAuthed(true);
  else setError("Invalid key");
};
```

**Tabs:**

```ts
type Tab = "dashboard" | "submissions" | "analytics" | "codes" | "scenarios";
const [tab, setTab] = useState<Tab>("dashboard");
```

**Sortable table pattern:**

```ts
const [sortKey, setSortKey] = useState<SortKey>("createdAt");
const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

const sorted = useMemo(() => {
  const out = [...rows];
  out.sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    return (sortDir === "asc" ? 1 : -1) * (av > bv ? 1 : av < bv ? -1 : 0);
  });
  return out;
}, [rows, sortKey, sortDir]);

// onClick handler: same key → flip direction; new key → reset to "desc"
```

**Column filters and hidden columns** are stored in component state (`Record<string, string>` for filters, `Set<string>` for hidden). No persistence — admins reset on refresh.

**Charts:** Recharts (`PieChart`, `BarChart`, `RadarChart`, `ResponsiveContainer`). Theme colors are passed as props (admin uses light theme only).

**Per-cohort detail view:** Click a code or row → fetch detail via `/api/access-codes/[id]?key=...` → render in a modal/inline panel with radar + bar charts of just that cohort's data.

**Adapt:** Admin panels are heavy components — copy the structure (auth flow, tab state, sortable table) and adjust the data shapes for your domain.

---

## 12. Team aggregation

**Purpose:** Roll up individual sessions linked to one access code into a team-level view: collective strengths, gaps, member-by-member strength/gap matrix, diversity score.

**Files:** `src/lib/team-dynamics.ts` (pure logic), `src/app/api/team-dynamics/route.ts` (API), `src/app/team-report/[codeId]/page.tsx` (UI), `src/app/api/team-report/[codeId]/route.ts` (data fetch).

**Core types:**

```ts
export interface TeamMember {
  name: string;
  role: string;
  scores: Scores;
  archetype: string;
}

export interface TeamAnalysis {
  teamAverages: Scores;
  collectiveStrengths: ComponentKey[];
  collectiveGaps: ComponentKey[];
  diversityScore: number;        // 0-1, higher = more variation across team
  diversityLabel: string;        // "Convergent" / "Mixed" / "Divergent"
  memberStrengthGap: { name: string; role: string; strengths: ComponentKey[]; gaps: ComponentKey[] }[];
}
```

**Aggregation:**

```ts
const teamAverages: Scores = {
  systems: +(members.reduce((s, m) => s + m.scores.systems, 0) / count).toFixed(1),
  // ... per dimension
};
```

**Per-member role-adjusted strengths** use the same `ROLE_STRENGTH_THRESHOLD` map as individual results, with the same min-1 guarantee.

**Diversity score:** A simple variance-based measure. Higher variance across members on the same dimension = more cognitive diversity.

**Public team report:** `/team-report/[codeId]` is a public URL — anyone with the link can view the aggregate. **Do not** include individual emails or per-question responses in the team-report data fetch:

```ts
// /api/team-report/[codeId]/route.ts — only safe fields are selected
sessions: {
  select: {
    id: true, name: true, role: true, industry: true, companySize: true,
    systemsScore: true, intentScore: true, /* ... scores */,
    overallAverage: true, archetype: true, completedAt: true,
    // NOT: email, individual responses, profileDynamics
  },
}
```

**Adapt:** Generic — works for any cohort-attribution scheme. If your "team" notion is different (department, customer, region), the dimension keys change but the aggregation shape is identical.

---

## 13. Public shareable report

**Purpose:** Give individual users a stable URL they can share that renders their report without re-entering data, but without exposing PII.

**Files:** `src/app/report/[sessionId]/page.tsx`, `src/app/api/report/[sessionId]/route.ts`.

**Key principle:** The `/report/[sessionId]` API endpoint returns only the data needed to render — no email, no demographics beyond role, no individual question responses. The session ID is the auth token (UUIDs are unguessable).

```ts
const session = await prisma.assessmentSession.findUnique({
  where: { id: sessionId },
  select: {
    id: true, name: true, role: true,
    systemsScore: true, intentScore: true, /* ... */,
    overallAverage: true, archetype: true,
    profileDynamics: true,
    createdAt: true,
  },
});
```

**No `email` selected, no `responses` relation included.**

**Adapt:** Same pattern works for any "shareable result" — the trick is the server endpoint, not the page. Always define a separate select list rather than relying on Prisma's full default — it's too easy to accidentally leak fields when the schema grows.

---

## 14. Refresh protection

**Purpose:** If the user refreshes mid-results-view, restore their report from localStorage so they don't have to re-enter answers.

**File:** `src/app/page.tsx`. Storage key: `localStorage["stp_results"]`.

**Save (after server scoring):**

```ts
try {
  localStorage.setItem(LS_KEY, JSON.stringify({
    sessionId,           // UUID — server has the full record
    scores: data.scores, // aggregated only — never individual responses
    demographics: demo,  // for role-adjusted thresholds on re-render
    savedAt: Date.now(),
  }));
} catch { /* localStorage unavailable, nothing else to do */ }
```

**Restore (on mount):**

```ts
useEffect(() => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.scores && parsed.demographics) {
        setScores(parsed.scores);
        setDemo(parsed.demographics);
        setPhase("results");
      } else {
        localStorage.removeItem(LS_KEY);
      }
    }
  } catch {
    localStorage.removeItem(LS_KEY);
  }
}, []);
```

**Critical:** Store ONLY aggregated scores. Storing individual per-question responses would let users reverse-engineer the scoring rubric — defeats the server-side scoring guarantee.

**Adapt:** Generic. The same pattern works for any single-page-app flow with refresh-survivable state.

---

## 15. Smaller patterns

### 15.1 — Prisma client singleton

```ts
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

This avoids the "too many connections" problem when Next.js dev hot-reloads.

### 15.2 — Phase-based single-page app

Instead of multiple routes, use one `/` page with a `phase` state:

```ts
const [phase, setPhase] = useState<"intro" | "demographics" | "assessment" | "results">("intro");
```

Each phase renders entirely different content. Transitions use a fade helper:

```ts
const tr = useCallback((cb: () => void) => {
  setFadeIn(false);
  setTimeout(() => { cb(); setFadeIn(true); window.scrollTo({ top: 0, behavior: "smooth" }); }, 300);
}, []);
```

### 15.3 — Shuffle answer options to prevent position bias

```ts
useEffect(() => {
  const a = [...options];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  setShuffled(a);
}, [options]);
```

Fisher-Yates per scenario render. Keys (A/B/C/D) stay attached so the score lookup works regardless of display order.

### 15.4 — Custom dropdown (avoiding native `<select>` styling pain)

`SelectField` in `src/app/page.tsx` is a click-to-open custom dropdown that respects the theme tokens. The native `<select>` element is hard to style consistently across browsers; a custom one with `useRef` + outside-click detection is more code but visually predictable.

### 15.5 — Auto-generated codes

```ts
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // exclude 0/O, 1/I/L for readability
  const part = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${part(4)}-${part(4)}`;
}
```

Use the same character set for any human-typed identifier.

### 15.6 — Fonts loaded via Google Fonts in `globals.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');
```

Single `@import` at the top of `globals.css`. No `<link>` tag in `layout.tsx` needed. `display=swap` prevents FOIT.

### 15.7 — `genUUID` helper (for client-generated session IDs)

```ts
export function genUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
```

Used to create a session ID on the client *before* the assessment starts, so the same ID can be passed to `/api/assessment/score` for the DB write. Avoids `crypto.randomUUID()` for older-browser compatibility.

### 15.8 — `vercel.json` minimum config

```json
{ "framework": "nextjs" }
```

That's it. Everything else is auto-detected from `package.json`.

### 15.9 — `.gitignore` essentials

```
node_modules
.next
.env*
!.env.example
.claude-token
.DS_Store
```

The `!.env.example` exception is critical so the template stays in the repo.

---

## Order of operations when forking

If you're starting a new diagnostic from this codebase, here's the recommended sequence:

1. **Bootstrap** (Day 1 — see [Bootstrapping a new project](#bootstrapping-a-new-project))
2. **Theme** — Replace the gold/navy palette with your brand. Don't change token names.
3. **Domain types** — Replace `ComponentKey`, `BandLabel`, archetype taxonomy in `types.ts`.
4. **Constants** — Replace `COMPONENTS`, `BANDS`, `BAND_DESC`, archetype maps, action plans, leverage in `constants.ts`. Keep `ROLE_STRENGTH_THRESHOLD` shape but pick your own thresholds.
5. **Scenarios** — Write your scenario bank (15 in this project, can be any number ≥ N×3 where N is dimension count). Seed via SQL or Prisma seed script.
6. **Scoring API** — `/api/assessment/score` mostly works as-is once schema fields match.
7. **AI prompt** — Replace `PROFILE_DYNAMICS_SYSTEM_PROMPT`. Update `REQUIRED_HEADER_PHRASES` to match your prompt's expected sections.
8. **Tabs** — Replace tab labels and content in `page.tsx`. Logic stays.
9. **PDF template** — Replace section copy and palette in `pdf-template.tsx`.
10. **Admin** — Adjust column lists and analytics dimensions for your demographic schema.
11. **Reference Files** — Add your methodology + content specs.

After each step: `npx tsc --noEmit && npm run build` to catch drift.

---

## When something doesn't apply

Not every diagnostic needs every pattern. Skip cleanly:

- **No team reports?** Drop `team-dynamics.ts`, `/api/team-dynamics`, `/team-report/[codeId]`. Keep access codes as simple gating.
- **No AI narrative?** Drop `profile-dynamics.ts`, `/api/profile-dynamics`, the cache column. Replace with hardcoded paragraph templates.
- **No PDF?** Drop `pdf-template.tsx`, `/api/assessment/email-report`, the Resend dep. Email a link to the public report instead.
- **No access codes?** Drop the `AccessCode` model, the validate endpoint, the intro screen. Open the assessment to all visitors.
- **Single theme?** Drop `theme` state and `THEMES.dark`/`light` split. Use one set of tokens.

The patterns are designed to be removable — they don't depend on each other except via the data shapes (Scores, ComponentKey, BandLabel).

---

*Last updated: 2026-04-28*


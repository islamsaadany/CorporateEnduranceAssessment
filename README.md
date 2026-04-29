# The Endurance Assessment

A web-based **team diagnostic** that measures an organization's endurance across three pillars — **Agility**, **Toughness**, **Resilience** — by aggregating responses from a group of senior leaders into an Organizational Endurance Profile. Built by **Forefront Consulting**.

---

## Documentation

The product and engineering docs live at the repo root and in two folders:

| File / folder | What's in it |
|---|---|
| [`Plan & Progress/execution-plan.md`](./Plan%20%26%20Progress/execution-plan.md) | Single source of truth for product alignment + decisions log + build sequence |
| [`Plan & Progress/progress.md`](./Plan%20%26%20Progress/progress.md) | Live execution tracker (current phase, recent changes, blockers) |
| [`product-spec/`](./product-spec) | What the product does, says, and shows (16 files, non-technical) |
| [`CLAUDE.md`](./CLAUDE.md) | Working guidelines for any Claude Code session on this repo |
| [`PROJECT_DETAILS.md`](./PROJECT_DETAILS.md) | Technical reference: stack, target layout, Prisma schema, API routes, module shapes |
| [`REUSABLE_PATTERNS.md`](./REUSABLE_PATTERNS.md) | Patterns carried over from the reference project, with applicability notes |
| [`ENDURANCE_ASSESSMENT_SPEC.md`](./ENDURANCE_ASSESSMENT_SPEC.md) | Index pointing at `product-spec/` (the original monolithic spec was migrated into the folder) |

**If you are a Claude Code session picking this up, read `CLAUDE.md` first, then `Plan & Progress/execution-plan.md`, then the `product-spec/` files relevant to your phase.**

---

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript 5.9+ · Tailwind CSS · Prisma 5 · PostgreSQL (Neon) · NextAuth.js v5 · `@react-pdf/renderer` · Vercel + Vercel Cron · provider-abstracted AI (Gemini default / Claude / OpenAI).

**No emails are sent by the application, ever.** Codes are distributed manually by the admin.

---

## Local setup

### 1. Install
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```

Fill in:
- `DATABASE_URL` — your Neon connection string
- `NEXTAUTH_SECRET` — 32+ random bytes (`openssl rand -base64 32`)
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev
- `SETTINGS_ENCRYPTION_KEY` — 32 bytes base64 (`openssl rand -base64 32`)
- `CRON_SECRET` — any random string (the hourly closure cron uses this)
- `SEED_SUPER_ADMIN_*` — initial super admin credentials for the seed script
- `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` — optional bootstrap fallbacks

There is **no** `RESEND_API_KEY` and **no** `ADMIN_KEY`. Admin auth is full NextAuth email/password.

### 3. Push schema to the database
```bash
npx prisma db push
```

### 4. Seed
Creates one super admin, one Settings singleton, and one sample assessment with 5 respondents (3 submitted → enough to satisfy the ≥3 anonymity guardrail).

```bash
npm run seed
```

### 5. Run
```bash
npm run dev
```

The landing page is at http://localhost:3000.

---

## Build / verify

```bash
npm run build        # full production build (requires DATABASE_URL)
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript only (no DB needed)
npx prisma studio    # DB GUI
```

---

## Status

**Phase 1 — Foundation** is in progress. See [`Plan & Progress/progress.md`](./Plan%20%26%20Progress/progress.md) for current state and `execution-plan.md` for the full phased roadmap.

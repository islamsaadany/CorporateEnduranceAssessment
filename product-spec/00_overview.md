# 00 — Product Overview

**Version:** 0.1
**Last updated:** 2026-04-28

---

## What this product is

The Endurance Assessment is a web-based diagnostic tool that measures an organization's endurance across three pillars — **Agility**, **Toughness**, and **Resilience** — by aggregating responses from a team of senior leaders into an Organizational Endurance Profile.

It is built **for Forefront Consulting** and used during client engagements where a senior consultant administers the assessment to a client's leadership team.

---

## Who uses it

| Role | What they do |
|------|--------------|
| **Super admin** | The first/seeded admin. Has all admin powers plus: manages other admins, configures the AI provider. One per deployment. |
| **Admin (Forefront consultant)** | Creates assessments for clients, generates and distributes per-respondent codes manually, monitors response rates, generates and exports reports. |
| **Respondent (client executive or senior leader)** | Receives a 6-character access code from the consultant, takes a 30-statement assessment about their organization, submits. Does **not** see results. |

Public visitors see only the landing page and the code-entry page — there is no respondent self-signup.

---

## The shape of an engagement

1. A Forefront consultant (admin) creates a new assessment for a client organization, defining the deadline and the list of departments respondents can choose from.
2. The admin specifies how many respondents will take it; the system generates one unique 6-character code per respondent slot.
3. The admin **manually distributes** the codes to respondents (Slack, email outside the app, in person, etc.). The application sends no email.
4. Each respondent visits the app, enters their code, fills in a brief demographics form (department / level / tenure / optional name), and answers 30 statements one at a time on a 1–5 Likert scale.
5. Throughout the collection window, the admin can view the **numerical report live** with a "Preliminary — N of M responded" banner.
6. The admin can request the **AI-assisted report** at any time. Pre-closure generations are clearly labeled as drafts; post-closure regeneration overwrites the draft as final.
7. At the deadline, the system automatically closes the assessment. No further responses are accepted.
8. The admin can apply filters (department, level, tenure, or compound) to view segment-specific reports — subject to a ≥3 respondents anonymity floor.
9. The admin can export any filtered view as a PDF for client delivery.

---

## Core design principles

1. **Organizational, not personal.** Every question asks about the organization, not the respondent's feelings or behavior. Framing is reinforced on the welcome screen and on every question page.
2. **Anonymous in aggregate.** Individual respondents are never named in results. Even segment views require ≥3 respondents to display. Names, when collected, never leave the database — they are not sent to AI providers and not shown to admins in the results view.
3. **Deadline-driven.** Assessments close automatically at a set date/time. Admins can extend the deadline but cannot manually close — except by forcing closure to generate the final AI report (which moves the deadline to "now" with a confirmation modal).
4. **Spread is a finding.** Disagreement among respondents on the same capability is a meaningful signal. The product surfaces spread visibly — high spread on a capability often matters more than its average score.
5. **Multi-variant reporting.** The default report is company-wide. From there, admins can slice by department, level, tenure, or any combination. Each filtered view recomputes scores, spread, focus areas, and AI-generated recommendations.
6. **Consulting-grade output.** The default visual presentation should be presentable in a client boardroom without further formatting. PDFs respect page breaks, never orphan section titles, and lead each pillar on a fresh page.
7. **Cache-aware AI.** AI-generated content is generated on demand, cached by `(assessment, filter)` combination, and only regenerated when the admin explicitly asks or when underlying data changes (with warning).
8. **No emails.** The application sends no email of any kind. Codes are distributed manually; closure is announced by the admin checking the dashboard.

---

## The 3 + 15 + 30 model

These are not placeholders. They are the locked content of the product.

- **3 pillars** — Agility, Toughness, Resilience
- **15 capabilities** — 5 per pillar
- **30 questions** — 2 per capability (one Structure question, one Practice question)

Detailed in `01_pillars_and_capabilities.md` and `02_questions.md`.

---

## What is *not* in v1

See `Plan & Progress/execution-plan.md` section 6 for the full out-of-scope list. Highlights:

- No emails of any kind sent by the app.
- No respondent-facing results — respondents see only a confirmation after submission.
- No AI-generated full narrative report (only executive summary + adapted action items in v1).
- No comparison of two AI narratives (comparison view is quantitative only).
- No multi-tenant scoping per admin (all admins see all assessments).
- No password reset flow (manual DB intervention if needed).
- No historical comparison or benchmarking.

---

## How this folder is organized

| File | What it covers |
|------|----------------|
| `00_overview.md` | This file — the elevator pitch |
| `01_pillars_and_capabilities.md` | The 3 pillars, 15 capabilities, definitions |
| `02_questions.md` | The 30 statements (locked verbatim content) + Likert scale |
| `03_scoring_and_bands.md` | Scoring math, interpretation bands, spread, focus area ranking |
| `04_recommendations.md` | The action items per capability + how AI adapts them per filter |
| `05_report_structure.md` | What the report looks like — sections, ordering, content |
| `06_report_filters_and_segments.md` | Filtering rules, comparison view, anonymity guardrails |
| `07_admin_workflows.md` | Admin flows: create, monitor, edit, view, export, manage admins |
| `08_respondent_workflows.md` | Respondent flow: code entry → demographics → questions → submit |
| `09_demographics.md` | What's collected, how it's used in reporting |
| `10_code_distribution.md` | Code generation, format, manual distribution by admin |
| `11_anonymity_and_privacy.md` | Privacy rules, what admins see vs. don't, AI data handling |
| `12_design_language.md` | Colors, typography, tone of voice, micro-copy principles |
| `13_glossary.md` | Definitions of terms used across all files |
| `14_ai_prompts.md` | System + user prompts for AI report generation |
| `15_report_generation_and_caching.md` | When and how reports generate, cache behavior, lifecycle |

Refinement happens at the file level — change a single file, bump its version, leave the rest alone.

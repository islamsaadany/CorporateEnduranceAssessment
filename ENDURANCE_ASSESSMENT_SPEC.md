# Endurance Assessment — Specification Index

> The original `ENDURANCE_ASSESSMENT_SPEC.md` was a single monolithic file. As of 2026-04-28 the spec has been split into a structured `product-spec/` folder, one file per topic, so each section can evolve and be reviewed independently.
>
> **This file is now an index.** It points at the source of truth for each topic. Open a section directly in `product-spec/`.

---

## Where to find what

| Topic | File |
|-------|------|
| What the product is, who uses it, the shape of an engagement | [`product-spec/00_overview.md`](./product-spec/00_overview.md) |
| The 3 pillars (Agility / Toughness / Resilience) and their 5 capabilities each | [`product-spec/01_pillars_and_capabilities.md`](./product-spec/01_pillars_and_capabilities.md) |
| The 30 statements (locked content, with pillar / capability / angle mapping) | [`product-spec/02_questions.md`](./product-spec/02_questions.md) |
| Scoring math, band thresholds, focus-area selection, tie-break rule | [`product-spec/03_scoring_and_bands.md`](./product-spec/03_scoring_and_bands.md) |
| Recommendation copy and focus-area framing | [`product-spec/04_recommendations.md`](./product-spec/04_recommendations.md) |
| Report sections, layout, draft vs. final watermarks, "Preliminary" banner | [`product-spec/05_report_structure.md`](./product-spec/05_report_structure.md) |
| Filtering (department / level / tenure / compound) and the comparison view | [`product-spec/06_report_filters_and_segments.md`](./product-spec/06_report_filters_and_segments.md) |
| Admin workflows: create, monitor, edit (post-closure), generate, export | [`product-spec/07_admin_workflows.md`](./product-spec/07_admin_workflows.md) |
| Respondent flow: code entry → welcome → demographics → 30 questions → review → done | [`product-spec/08_respondent_workflows.md`](./product-spec/08_respondent_workflows.md) |
| Demographics fields (Name optional · Department · Level · Tenure) and value lists | [`product-spec/09_demographics.md`](./product-spec/09_demographics.md) |
| 6-character code generation, manual distribution, no-email policy | [`product-spec/10_code_distribution.md`](./product-spec/10_code_distribution.md) |
| Anonymity rules and the ≥3-respondent guardrail | [`product-spec/11_anonymity_and_privacy.md`](./product-spec/11_anonymity_and_privacy.md) |
| Visual design language (typography, color, spacing, charts, components) | [`product-spec/12_design_language.md`](./product-spec/12_design_language.md) |
| Glossary of all product terms | [`product-spec/13_glossary.md`](./product-spec/13_glossary.md) |
| AI prompts (system + user prompt structure, provider-neutral) | [`product-spec/14_ai_prompts.md`](./product-spec/14_ai_prompts.md) |
| Report generation flow, caching, invalidation, prompt-version handling | [`product-spec/15_report_generation_and_caching.md`](./product-spec/15_report_generation_and_caching.md) |

---

## Related project documents

| File | Purpose |
|------|---------|
| [`Plan & Progress/execution-plan.md`](./Plan%20%26%20Progress/execution-plan.md) | Single source of truth for product alignment + decisions log + build sequence |
| [`Plan & Progress/progress.md`](./Plan%20%26%20Progress/progress.md) | Live execution tracker (phases, recent changes, blockers) |
| [`CLAUDE.md`](./CLAUDE.md) | Working guidelines for any Claude Code session on this repo |
| [`PROJECT_DETAILS.md`](./PROJECT_DETAILS.md) | Technical reference: stack, target layout, Prisma schema, API routes, module shapes |
| [`REUSABLE_PATTERNS.md`](./REUSABLE_PATTERNS.md) | Patterns carried over from the reference project, with applicability notes for this project |

---

## How to use these docs

- **Starting a new session?** Read `Plan & Progress/execution-plan.md` first, then `CLAUDE.md`, then the `product-spec/` files relevant to your phase.
- **Implementing a feature?** Find the matching `product-spec/` file for the rules, and `PROJECT_DETAILS.md` for where the code lives. Don't re-document product rules in code comments or in `PROJECT_DETAILS.md`.
- **Made a product decision?** Add a row to the decisions log in `execution-plan.md`. Update the relevant `product-spec/` file. Mirror the change in the implementation if applicable.
- **Made a technical decision?** Update `PROJECT_DETAILS.md` and `REUSABLE_PATTERNS.md` if a new pattern was introduced.

---

*The original monolithic spec previously lived in this file. It has been migrated section-by-section into `product-spec/`. If any topic seems missing from the table above, check `product-spec/` directly — the folder is the source of truth, not this index.*

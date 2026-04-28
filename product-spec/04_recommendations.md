# 04 — Recommendations

**Version:** 0.1
**Last updated:** 2026-04-28

---

> How action items are produced and shown in the Focus Areas section of the report. The product uses a hybrid approach: a curated baseline action list per capability + AI adaptation per filter, with the baseline as deterministic fallback when AI is unavailable.

---

## 1. Two-layer model

| Layer | Source | When used |
|-------|--------|-----------|
| **Baseline action items** | Hardcoded in `src/data/constants.ts` (see section 3 below) | Always available. Used directly when AI is disabled or unavailable. Used as the input/inspiration for AI adaptation. |
| **AI-adapted action items** | LLM-generated based on filter context | Used when admin clicks "Generate AI report". Cached per `(assessment, filter)`. Replaces baseline in the report when present. |

**Why hybrid:** the baseline guarantees the report always works, even with no API key configured. The AI layer adapts the same baseline ideas to the specific filter context (e.g., "for Sales Managers specifically, decision velocity..."), producing more targeted recommendations without losing methodology grounding.

---

## 2. When recommendations appear

In the **Focus Areas section** of the report (see `05_report_structure.md` section 9.3). Each of the top-5 weakest capabilities gets two action items as bullet points beneath the capability header.

The same Focus Areas section, with the same top-5 list, drives both the on-screen view and the PDF export.

---

## 3. Baseline action items (hardcoded)

These are the canonical, methodology-validated action items for each of the 15 capabilities. They are paste-verbatim into code and used as fallback or as input to AI adaptation.

```json
{
  "Decision Velocity": [
    "Publish a decision-rights matrix clarifying who decides what across the top 20 recurring decisions.",
    "Cut one layer of approval from standard operating decisions within the next quarter."
  ],
  "Market & Signal Intelligence": [
    "Stand up an early-warning dashboard tracking customer, competitor, and regulatory signals.",
    "Assign a rotating 'signal owner' on the executive team responsible for weekly synthesis."
  ],
  "Adaptive Governance": [
    "Introduce an explicit exceptions process for policy deviations with senior sponsor approval.",
    "Move to rolling 90-day budget reviews with reallocation authority, replacing annual cycles."
  ],
  "Experimentation Muscle": [
    "Install a disciplined pilot process with clear success criteria and fast kill decisions.",
    "Create a small 'experiments budget' ring-fenced from core operations for rapid tests."
  ],
  "Delegation & Empowerment": [
    "Define the specific decisions that must be pushed to the frontline and publish the boundaries.",
    "Coach senior leaders to stop pre-approving decisions their direct reports own."
  ],
  "Leadership Strength Under Pressure": [
    "Build a successor plan for every critical role with named second-line leaders and development paths.",
    "Run a crisis-leadership simulation annually with the top team to rehearse behaviors under stress."
  ],
  "Financial Shock Absorption": [
    "Define explicit liquidity buffers and minimum cash reserves sized for realistic shock scenarios.",
    "Run quarterly financial stress tests against severe but plausible adverse conditions."
  ],
  "Operational Continuity": [
    "Map critical processes, identify single points of failure, and establish backup suppliers/paths.",
    "Test business continuity plans at least once a year — live, not just tabletop."
  ],
  "Risk & Compliance Discipline": [
    "Unify risk, legal, and compliance ownership under integrated governance with clear accountability.",
    "Shift posture from reactive to proactive: identify emerging risks before they materialize."
  ],
  "Trust & Collaboration": [
    "Invest in cross-functional operating rhythms and joint goals that reward collaboration.",
    "Address political behaviors visibly — signal that silos cost the team, especially under pressure."
  ],
  "System Recoverability": [
    "Document and test disaster recovery for all critical systems — aim for measurable recovery time.",
    "Move toward modular architectures that allow partial system restoration during disruption."
  ],
  "Culture of Grit & Ownership": [
    "Reinforce accountability by making ownership visible; reward pushing through difficulty.",
    "Address escalation patterns: coach leaders who escalate too early or abdicate ownership."
  ],
  "Learning Discipline": [
    "Institute structured after-action reviews for every project exceeding a defined impact threshold.",
    "Create a quarterly 'lessons forum' where cross-functional learnings are captured and actioned."
  ],
  "Strategic Adaptability": [
    "Formalize scenario planning into the strategy cycle — at least three plausible futures annually.",
    "Build faster resource reallocation mechanisms that don't require full annual budget cycles."
  ],
  "Offensive Readiness": [
    "Define a growth thesis that specifies where the organization will invest when conditions stabilize.",
    "Pre-build investment playbooks with activation criteria, owners, and timelines."
  ]
}
```

**Editing rules:**
- These can be refined over time — they're product copy, not methodology
- Each capability has exactly **2** items in v1; AI adaptation also returns 2 per capability
- Length guidance: each item is one sentence, ideally < 25 words, plain English, action-oriented (verb-first when natural)
- No emoji, no exclamation marks, no jargon

---

## 4. AI adaptation

When the admin generates an AI report, the AI is given the baseline above plus filter context, and produces an adapted version per focus-area capability. See `14_ai_prompts.md` for the prompt details.

### 4.1 What "adapted" means

Adapted action items differ from baseline in three ways:

1. **Filter-aware framing.** "For Sales Managers specifically, decision velocity..."
2. **Sample-size acknowledgment.** When N is small (3–5 respondents), tone becomes more probing/exploratory; with larger N, more declarative.
3. **Spread sensitivity.** When spread on a focus-area capability is high, the AI is told to acknowledge disagreement: "Your team is split on whether decision rights are clear — surface the divergent views before publishing the matrix."

### 4.2 What stays the same

- Number of items per capability: always 2
- The set of focus-area capabilities (top-5 from numerical aggregation)
- Tone: serious, executive, action-oriented
- Length: ~25 words per item, ~50 words per capability

### 4.3 When adaptation is rejected

If AI returns content that violates the constraints in `14_ai_prompts.md` (e.g., references numeric scores, returns < 2 items per capability, exceeds length, contains hallucinated organization-specific facts), the system retries once and falls back to the baseline if the second attempt also fails. The fallback is **not cached** — a transient API failure should not lock the assessment into baseline forever.

---

## 5. Where action items appear

| Surface | Source | Notes |
|---------|--------|-------|
| Focus Areas section of on-screen report | AI if cached, else baseline | The "Generate AI report" button explicitly switches the source |
| PDF export | Whatever was used at PDF render time | If admin generates AI report and then immediately exports, PDF uses AI version |
| Admin Activity log | The action of generating is logged | Individual item content is not logged — only the event "AI report generated for filter X" |
| Comparison view (two filters side-by-side) | **Quantitative only in v1** — comparison view does not include AI-adapted action items | This is a deliberate v1 simplification |

---

## 6. Caching

AI-adapted recommendations are cached as part of the full AI report payload. See `15_report_generation_and_caching.md` for full lifecycle. Key points:

- Cache key: `(assessment_id, filter_signature)`
- Each generation **overwrites** the previous cache entry for the same key
- Cache invalidates when respondent answers or demographics are edited (with admin warning before edit proceeds)
- Cache does **not** invalidate when the baseline action items in code are edited — admin must explicitly regenerate

---

## 7. Editing the baseline

The baseline action items in section 3 are product copy and can be refined over time. Process for editing:

1. Edit the JSON in `src/data/constants.ts` (or wherever it ends up living per implementation).
2. Bump this file's version (section header above) and add a changelog entry below.
3. Note: changes do **not** trigger cache invalidation. Existing cached AI reports will continue using their previous AI-adapted text. To propagate the new baseline, the admin must regenerate.

---

## 8. v2 candidates

Tracked here for future refinement:

- **Capability-level depth:** expand from 2 items per capability to 3, with the third item being a "leading indicator to monitor" (a metric, not an action).
- **Industry-adapted baselines.** Variants for financial services, healthcare, public sector.
- **Recommended sequencing.** Order the 5 focus-area capabilities by recommended action sequence (e.g., "fix decision rights before pushing experimentation"), not just by score ascending.
- **Cross-capability synthesis paragraph.** A 2–3 sentence paragraph that ties the focus areas together as a coherent strategic priority. Currently each focus area stands alone.

---

## 9. Glossary cross-reference

For terminology used here, see `13_glossary.md`:
- Focus areas, AI report, Cached report, Filter signature

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 2026-04-28 | Initial extraction. Baseline items copied verbatim from `ENDURANCE_ASSESSMENT_SPEC.md` v1.0 section 9.3. Added the AI-adaptation layer and hybrid model. |

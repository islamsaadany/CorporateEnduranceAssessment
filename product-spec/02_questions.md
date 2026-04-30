# 02 — The 30 Questions

**Version:** 0.1
**Last updated:** 2026-04-28

---

> Locked content. The 30 statements below are the final agreed wording. **Do not rewrite them.** Paste verbatim into code/database. Refinement requires a methodology revision.

---

## 1. Question schema

Each question has the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Short identifier — `Na` (Structure) or `Nb` (Practice) where N is 1–15 |
| `pillar` | enum | `Agility` / `Toughness` / `Resilience` |
| `capability` | string | One of the 15 capability names (see `01_pillars_and_capabilities.md`) |
| `angle` | enum | `Structure` (does the mechanism exist?) or `Practice` (does it work?) |
| `text` | string | The exact statement the respondent rates 1–5 |

---

## 2. The 30 statements (verbatim)

```json
[
  { "id": "1a", "pillar": "Agility", "capability": "Decision Velocity", "angle": "Structure",
    "text": "Our organization has clearly defined decision rights, so people know who decides what without having to escalate." },
  { "id": "1b", "pillar": "Agility", "capability": "Decision Velocity", "angle": "Practice",
    "text": "Key strategic decisions are made and acted upon within days or weeks, not months." },

  { "id": "2a", "pillar": "Agility", "capability": "Market & Signal Intelligence", "angle": "Structure",
    "text": "We have active mechanisms to detect early signals of change in our markets, customers, competitors, and technology." },
  { "id": "2b", "pillar": "Agility", "capability": "Market & Signal Intelligence", "angle": "Practice",
    "text": "Insights from our sensing activities consistently translate into timely decisions and adjustments." },

  { "id": "3a", "pillar": "Agility", "capability": "Adaptive Governance", "angle": "Structure",
    "text": "Our policies and governance frameworks allow for exceptions and fast adjustments when circumstances demand it." },
  { "id": "3b", "pillar": "Agility", "capability": "Adaptive Governance", "angle": "Practice",
    "text": "When external conditions change, we are able to revise strategies and budgets without getting stuck in bureaucracy." },

  { "id": "4a", "pillar": "Agility", "capability": "Experimentation Muscle", "angle": "Structure",
    "text": "We have a disciplined process for running small, fast experiments before committing to large investments." },
  { "id": "4b", "pillar": "Agility", "capability": "Experimentation Muscle", "angle": "Practice",
    "text": "Our organization learns from failed experiments without punishing the people who ran them." },

  { "id": "5a", "pillar": "Agility", "capability": "Delegation & Empowerment", "angle": "Structure",
    "text": "Decision-making authority is pushed down to the people closest to the action, within clear boundaries." },
  { "id": "5b", "pillar": "Agility", "capability": "Delegation & Empowerment", "angle": "Practice",
    "text": "Frontline leaders and teams feel trusted to make real decisions without constant approval from above." },

  { "id": "6a", "pillar": "Toughness", "capability": "Leadership Strength Under Pressure", "angle": "Structure",
    "text": "We have identified and actively developed strong second-line leaders and successors for every critical role." },
  { "id": "6b", "pillar": "Toughness", "capability": "Leadership Strength Under Pressure", "angle": "Practice",
    "text": "In past crises, our senior leaders have remained calm, visible, and honest in their communication." },

  { "id": "7a", "pillar": "Toughness", "capability": "Financial Shock Absorption", "angle": "Structure",
    "text": "We maintain cash buffers, liquidity reserves, and contingency budgets sized for realistic shock scenarios." },
  { "id": "7b", "pillar": "Toughness", "capability": "Financial Shock Absorption", "angle": "Practice",
    "text": "Our finance function regularly stress-tests the business against severe but plausible financial shocks." },

  { "id": "8a", "pillar": "Toughness", "capability": "Operational Continuity", "angle": "Structure",
    "text": "We have backup suppliers, alternative operational paths, and continuity plans for our most critical processes." },
  { "id": "8b", "pillar": "Toughness", "capability": "Operational Continuity", "angle": "Practice",
    "text": "Our continuity plans are tested regularly — not just documented — and would work if activated today." },

  { "id": "9a", "pillar": "Toughness", "capability": "Risk & Compliance Discipline", "angle": "Structure",
    "text": "Risk, legal, and compliance matters have clear ownership and integrated governance across the organization." },
  { "id": "9b", "pillar": "Toughness", "capability": "Risk & Compliance Discipline", "angle": "Practice",
    "text": "We identify and address emerging risks proactively, rather than reacting to problems after they materialize." },

  { "id": "10a", "pillar": "Toughness", "capability": "Trust & Collaboration", "angle": "Structure",
    "text": "Our cross-functional teams have the relationships and operating rhythms to collaborate effectively under pressure." },
  { "id": "10b", "pillar": "Toughness", "capability": "Trust & Collaboration", "angle": "Practice",
    "text": "When things go wrong, our teams pull together rather than retreating into silos or internal politics." },

  { "id": "11a", "pillar": "Resilience", "capability": "System Recoverability", "angle": "Structure",
    "text": "We have documented and tested business continuity and disaster recovery plans covering our critical systems." },
  { "id": "11b", "pillar": "Resilience", "capability": "System Recoverability", "angle": "Practice",
    "text": "When systems or processes break, we restore them quickly and without lasting damage to operations." },

  { "id": "12a", "pillar": "Resilience", "capability": "Culture of Grit & Ownership", "angle": "Structure",
    "text": "Accountability is clearly assigned and accepted in our organization — people own their outcomes, good or bad." },
  { "id": "12b", "pillar": "Resilience", "capability": "Culture of Grit & Ownership", "angle": "Practice",
    "text": "Our people push through setbacks and difficulty rather than escalating early or disengaging." },

  { "id": "13a", "pillar": "Resilience", "capability": "Learning Discipline", "angle": "Structure",
    "text": "We have structured rituals — such as post-mortems and after-action reviews — for capturing lessons from pressure events." },
  { "id": "13b", "pillar": "Resilience", "capability": "Learning Discipline", "angle": "Practice",
    "text": "Lessons from past events measurably change how we operate; we don't repeat the same mistakes." },

  { "id": "14a", "pillar": "Resilience", "capability": "Strategic Adaptability", "angle": "Structure",
    "text": "We conduct regular scenario planning and strategy reviews that prepare us for multiple possible futures." },
  { "id": "14b", "pillar": "Resilience", "capability": "Strategic Adaptability", "angle": "Practice",
    "text": "When conditions change, we are able to reallocate resources and redesign our strategy quickly and decisively." },

  { "id": "15a", "pillar": "Resilience", "capability": "Offensive Readiness", "angle": "Structure",
    "text": "We have a defined growth thesis and investment playbooks ready to activate when conditions allow." },
  { "id": "15b", "pillar": "Resilience", "capability": "Offensive Readiness", "angle": "Practice",
    "text": "After stabilizing from a shock, our organization has historically returned to offense and growth quickly." }
]
```

---

## 3. The 4-point Likert scale + "I don't know"

Every question is rated on a 4-point scale. **There is deliberately no neutral midpoint** — the scale forces a lean toward "true" or "not true" of the organization. Respondents who genuinely lack information to answer pick **"I don't know"** instead.

| Score | Label | Meaning |
|-------|-------|---------|
| **1** | Strongly Disagree | This is clearly not true of our organization. |
| **2** | Disagree | This is only partly or occasionally true. |
| **3** | Agree | Mostly true of our organization. |
| **4** | Strongly Agree | Clearly and consistently true of our organization. |
| — | **I don't know** | The respondent does not have visibility into this practice and cannot rate it honestly. |

**All 30 questions must be answered to complete the assessment.** A valid answer is one of {1, 2, 3, 4, "I don't know"}. Respondents cannot leave a question blank.

**Scoring effect of "I don't know":**
- A capability score for one respondent is the mean of their **rated** answers (1–4) for that capability. "I don't know" answers are excluded from the mean.
- If a respondent picked "I don't know" for both questions in a capability, that capability has no contribution from that respondent.
- The aggregated capability score across respondents is the mean of every available rated answer (some respondents may not contribute to that capability at all — see `03_scoring_and_bands.md`).
- "I don't know" answers do **not** affect the ≥3-respondent anonymity guardrail. A respondent who completed the assessment counts as one full respondent regardless of how many "I don't know"s they picked.

**Why no neutral:** in pilot use of 5-point scales for organizational diagnostics, respondents cluster around 3 ("Neutral") to avoid taking a position. That central-tendency bias flattens the report. Forcing a lean (with an explicit "I don't know" escape hatch for genuine uncertainty) produces sharper, more useful findings.

---

## 4. Question presentation rules

### Order
Fixed order across all respondents: 1a, 1b, 2a, 2b, … 15a, 15b. Grouped by pillar (Agility 1–5b → Toughness 6–10b → Resilience 11–15b).

> **Why fixed:** ensures comparability across respondents and across time. The Structure→Practice pairing is preserved (always adjacent), which respondents may find natural — they answer "do we have it?" before "does it work?".

### Per-question UI surface
- Progress bar: "Question 7 of 30"
- Capability eyebrow: e.g., `AGILITY · DECISION VELOCITY` (in `ochre`, ALL CAPS)
- Statement: large Georgia serif — visual center of screen
- Four tappable Likert tiles: `1 · Strongly Disagree`, `2 · Disagree`, `3 · Agree`, `4 · Strongly Agree`
- A separate, visually distinct **"I don't know"** option below the scale (so it doesn't compete for clicks with the 1–4 tiles, and respondents read past the tiles before reaching for it)
- Selecting any answer auto-advances to the next question after a 300ms transition
- "Back" button to return to the previous question
- Keyboard: arrow keys move between tiles, number keys 1–4 select, `0` selects "I don't know", Enter advances

See `08_respondent_workflows.md` for the full screen flow.

---

## 5. Framing reinforcement

The product is built on the principle that respondents rate **the organization, not themselves**. To prevent drift toward self-assessment:

1. The welcome screen explicitly frames the assessment: *"You are rating the organization — not yourself. Every question asks about how your organization operates today."*
2. Every question statement begins with a collective subject ("Our organization", "We", "Decision-making authority", etc.) — never "I" or "you".
3. The Likert labels are framed as truth claims about the organization ("This is clearly not true of our organization") — not feelings ("I feel strongly that…").

If the wording of any statement ever drifts away from the organizational frame in a refinement, escalate to methodology review before publishing.

---

## 6. Why these specific 30

This rationale should not appear in the user-facing UI but is useful for methodology defense:

- **Each capability has exactly 2 questions.** Fewer makes the score statistically fragile; more inflates time-on-task without adding information.
- **One Structure + one Practice per capability.** Captures the most analytically valuable axis at the lowest cost.
- **Plain English, organizational subject.** Survey items use everyday vocabulary that translates across industries (no "ROI", no acronyms).
- **Active voice with positive framing.** A "5 = Strongly Agree" always means the *good* side. No reverse-coded items — they confuse respondents and complicate scoring.

---

## 7. Future revisions (v2 candidates)

These are not in v1 but are tracked here for future refinement work:

- **Structure–Practice gap surfacing.** Highlight in the report when |Structure score − Practice score| > 1.0 for a given capability — this is itself a finding (e.g., "We have it on paper but it doesn't work").
- **Industry-adapted statements.** Possible variants for highly regulated industries (e.g., financial services), public sector, etc.
- **Localized translations.** Arabic, French. Currently English only.
- **Confidence rating per question.** Optional second-axis ("How confident are you in this rating?") to surface uncertainty alongside the score.

Refinement of any of the above triggers a methodology revision.

---

## 8. Glossary cross-reference

For terminology used here, see `13_glossary.md`:
- Likert scale, Structure, Practice

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 2026-04-28 | Initial extraction from `ENDURANCE_ASSESSMENT_SPEC.md` v1.0. |

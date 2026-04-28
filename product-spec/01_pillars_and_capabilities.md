# 01 — Pillars and Capabilities

**Version:** 0.1
**Last updated:** 2026-04-28

---

> The locked conceptual model of the assessment. The 3 pillars and 15 capabilities are not placeholders; they are the agreed taxonomy and should not be changed without a methodology revision and a coordinated update to questions, scoring, recommendations, and report copy.

---

## 1. The three pillars

The Endurance model rests on a single sentence: *the ability to **sense and move**, **absorb and hold**, **recover and renew**.* Each verb pair is a pillar.

| Pillar | Verb | Definition | The Test |
|--------|------|------------|----------|
| **Agility** | Sense and move | The ability to detect change early and respond with speed and judgment. | *"Did we see it coming and move in time?"* |
| **Toughness** | Absorb and hold | The ability to withstand shocks without breaking or losing control. | *"When it hit, did we stay standing?"* |
| **Resilience** | Recover and renew | The ability to rebuild, reconfigure, and emerge stronger after disruption. | *"Did we come back — and come back stronger?"* |

**Visual hierarchy:** Always show pillar name + verb together in the UI. The verb is what makes the pillar memorable.

**Order:** Agility → Toughness → Resilience. This is the temporal sequence of how organizations encounter disruption (sense before impact, hold during impact, recover after impact). Maintain this order in all UI surfaces, copy, and reports.

---

## 2. The 15 capabilities

Five per pillar. Each capability is a measurable sub-dimension. Capability names are the canonical labels — use them verbatim in UI, copy, and reports.

### Agility (5 capabilities)

| # | Capability | Definition |
|---|------------|------------|
| 1 | **Decision Velocity** | Clear decision rights and reduced escalation layers. Decisions are made and acted on in days/weeks, not months. |
| 2 | **Market & Signal Intelligence** | Real-time sensing of customers, competitors, regulatory environment. Insights translate to action. |
| 3 | **Adaptive Governance** | Flexible policies, scenario-based decision-making, fast revision when circumstances change. |
| 4 | **Experimentation Muscle** | Disciplined small/fast experiments before large investments. Failure tolerated, learning extracted. |
| 5 | **Delegation & Empowerment** | Decision authority pushed to the frontline within clear boundaries. Trust to act. |

### Toughness (5 capabilities)

| # | Capability | Definition |
|---|------------|------------|
| 6 | **Leadership Strength Under Pressure** | Second-line depth and successor planning, plus calm visible leadership behavior in crisis. |
| 7 | **Financial Shock Absorption** | Liquidity buffers, contingency budgets, regular stress-testing against severe scenarios. |
| 8 | **Operational Continuity** | Backup suppliers, alternative paths, tested business continuity / disaster recovery plans. |
| 9 | **Risk & Compliance Discipline** | Integrated governance of risk, legal, compliance — proactive identification of emerging risks. |
| 10 | **Trust & Collaboration** | Cross-functional teams that hold together under pressure rather than retreating into silos. |

### Resilience (5 capabilities)

| # | Capability | Definition |
|---|------------|------------|
| 11 | **System Recoverability** | Documented, tested DR/BCM plans for critical systems. Modular architectures that allow partial restoration. |
| 12 | **Culture of Grit & Ownership** | Accountability without blame. Pride in pushing through setbacks. |
| 13 | **Learning Discipline** | Structured post-mortems / after-action reviews. Lessons measurably change how the organization operates. |
| 14 | **Strategic Adaptability** | Scenario planning depth. Resource reallocation that doesn't wait for the annual cycle. |
| 15 | **Offensive Readiness** | Defined growth thesis and pre-built investment playbooks ready to activate when conditions stabilize. |

---

## 3. The Structure–Practice axis

Every capability is measured by exactly **two** statements:
- One **Structure** statement asks whether the mechanism *exists* (policy, system, defined role, designed process).
- One **Practice** statement asks whether the mechanism *actually works* in lived experience.

This pairing is intentional and analytically valuable:

| Pattern | Interpretation |
|---------|----------------|
| Structure high, Practice high | Capability is institutionalized and functioning. |
| Structure high, Practice low | Box-checked but not lived. The mechanism exists on paper but fails in execution. |
| Structure low, Practice high | Informal strength — the team makes it work despite no formal scaffolding. Fragile if key people leave. |
| Structure low, Practice low | Capability is genuinely absent. |

**The capability score** is the average of the Structure and Practice ratings — but the spread between them is itself a finding. The report should surface notable Structure–Practice gaps when they exceed 1.0 on the Likert scale.

> **v1 scope note:** v1 reports the capability score (mean of S and P) and pillar/overall aggregates. The Structure–Practice delta is mentioned in `02_questions.md` as a v2 candidate for explicit highlighting in the report. For v1, it can be observed in the anonymized individuals tab where the two question rows sit adjacent.

---

## 4. Naming and ordering rules

- **Capability names** are written exactly as listed above. Capitalize the same way (`Decision Velocity`, not `Decision velocity` or `DECISION VELOCITY` except in eyebrows).
- **Capability ordering** within a pillar follows the numeric ID (1 → 5 within Agility, etc.). Default sort in the report is **by team score descending** within each pillar, but the canonical reference order is the numeric one.
- **Pillar ordering** is always Agility → Toughness → Resilience.

---

## 5. Why this taxonomy

Briefly, for grounding:

- **Three pillars, not five or seven.** Three is the smallest set that captures the temporal arc of disruption (before / during / after) without collapsing distinct capabilities. Boards remember three, not seven.
- **Five capabilities per pillar.** The minimum for face-validity in each pillar without inflating the assessment beyond manageable length. 5 × 3 × 2 = 30 questions, the upper bound for ~12-minute completion.
- **Two questions per capability.** The Structure–Practice pairing gives one analytically interesting finding per capability without doubling the time burden.

This rationale should not appear in the user-facing UI but is useful when refining methodology or defending design choices in client conversations.

---

## 6. Glossary cross-reference

For terminology used here, see `13_glossary.md`:
- Pillar, Capability, Structure, Practice, Spread, Likert scale, Score band

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 2026-04-28 | Initial extraction from `ENDURANCE_ASSESSMENT_SPEC.md` v1.0. |

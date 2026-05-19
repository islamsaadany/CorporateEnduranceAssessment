# 01 — Pillars and Capabilities (V2)

**Version:** 0.2
**Last updated:** 2026-05-19

---

> The locked conceptual model of the assessment under the V2 framework. The 3 pillars and 21 capabilities are not placeholders; they are the agreed taxonomy and should not be changed without a methodology revision and a coordinated update to questions, scoring, recommendations, and report copy. The v0.1 file (`01_pillars_and_capabilities.md`, 15 capabilities) is preserved alongside for historical reference.

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

## 2. The 21 capabilities

Seven per pillar. Each capability is a measurable sub-dimension. Capability names are the canonical labels — use them verbatim in UI, copy, and reports.

### Agility (7 capabilities)

| # | Capability | Definition |
|---|------------|------------|
| 1 | **Decision Velocity** | Clear decision rights and reduced escalation layers. Decisions are made and acted on in days/weeks, not months. |
| 2 | **Market & Signal Intelligence** | Real-time sensing of customers, competitors, regulatory environment. Insights translate to action. |
| 3 | **Adaptive Governance** | Flexible policies, scenario-based decision-making, fast revision when circumstances change. |
| 4 | **Experimentation Muscle** | Disciplined small/fast experiments before large investments. Failure tolerated, learning extracted. |
| 5 | **Delegation & Empowerment** | Decision authority pushed to the frontline within clear boundaries. Trust to act. |
| 6 | **Digital & Data Fluency** | Data, analytics, AI, and digital tools available across the business — and used fluently in everyday decisions and execution, not just reports. |
| 7 | **Strategic Renewal & Scenario Planning** | Regular scenario planning and the ability to redesign strategy and reallocate resources at the long-cycle level when conditions shift fundamentally — not just tactical adjustment. |

### Toughness (7 capabilities)

| # | Capability | Definition |
|---|------------|------------|
| 8 | **Crisis Leadership** | A defined approach for communication and decision-making in crises — plus calm, visible, honest behavior from senior leaders when crises actually hit. |
| 9 | **Bench Depth & Succession** | Identified and actively developed second-line leaders / successors for every critical role; continuity of momentum when leaders depart unexpectedly. |
| 10 | **Financial Shock Absorption** | Liquidity buffers, contingency budgets, regular stress-testing against severe scenarios. |
| 11 | **Operational Continuity** | Backup suppliers, alternative paths, tested business continuity / disaster recovery plans. |
| 12 | **Risk & Compliance Discipline** | Integrated governance of risk, legal, compliance — proactive identification of emerging risks. |
| 13 | **Trust & Collaboration** | Cross-functional teams that hold together under pressure rather than retreating into silos. |
| 14 | **Cyber & Technology Resilience** | Defined controls, response playbooks, and impact tolerances that keep critical services running through cyber attacks and major technology disruption. |

### Resilience (7 capabilities)

| # | Capability | Definition |
|---|------------|------------|
| 15 | **System Recoverability** | Documented, tested DR/BCM plans for critical systems. Modular architectures that allow partial restoration. |
| 16 | **Culture of Grit & Ownership** | Accountability without blame. Pride in pushing through setbacks. |
| 17 | **Learning Discipline** | Structured post-mortems / after-action reviews. Lessons measurably change how the organization operates. |
| 18 | **Offensive Readiness** | Defined growth thesis and pre-built investment playbooks ready to activate when conditions stabilize. |
| 19 | **Reputation & Stakeholder Trust Recovery** | Defined approaches for communicating with customers, employees, regulators, and the public after disruption — and demonstrable restoration of stakeholder trust through accountable action and visible change. |
| 20 | **Vision Clarity & Forward Mandate** | A clear post-disruption forward direction with defined priorities, owners, and milestones — and leadership able to rally the organization around a renewed direction within weeks. |
| 21 | **Workforce Recovery & Re-engagement** | Defined approaches and tools to assess workforce capacity and engagement after major disruption, and a demonstrated ability to rebuild capacity and re-engage people. |

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

> **v1 scope note:** v1 reports the capability score (mean of S and P) and pillar/overall aggregates. The Structure–Practice delta is mentioned in `02_questions - V2.md` as a v3 candidate for explicit highlighting in the report. For v1, it can be observed in the anonymized individuals tab where the two question rows sit adjacent.

---

## 4. Naming and ordering rules

- **Capability names** are written exactly as listed above. Capitalize the same way (`Decision Velocity`, not `Decision velocity` or `DECISION VELOCITY` except in eyebrows).
- **Capability ordering** within a pillar follows the numeric ID (1 → 7 within Agility, 8 → 14 within Toughness, 15 → 21 within Resilience). Default sort in the report is **by team score descending** within each pillar, but the canonical reference order is the numeric one.
- **Pillar ordering** is always Agility → Toughness → Resilience.

---

## 5. Why this taxonomy

Briefly, for grounding:

- **Three pillars, not five or seven.** Three is the smallest set that captures the temporal arc of disruption (before / during / after) without collapsing distinct capabilities. Boards remember three, not seven.
- **Seven capabilities per pillar.** Up from 5 in v0.1. The V2 framework adds: Digital & Data Fluency and Strategic Renewal & Scenario Planning (Agility); Cyber & Technology Resilience (Toughness, plus splitting Leadership Strength Under Pressure into Crisis Leadership and Bench Depth & Succession); Reputation & Stakeholder Trust Recovery, Vision Clarity & Forward Mandate, and Workforce Recovery & Re-engagement (Resilience, replacing the moved Strategic Renewal capability). Seven gives each pillar full coverage of its temporal stage without inflating completion time beyond the ~14–18 minute target.
- **Two questions per capability.** The Structure–Practice pairing gives one analytically interesting finding per capability without doubling the time burden.
- **3 × 7 × 2 = 42 questions.** A balanced architecture: each pillar gets equal weight, each capability gets equal weight inside its pillar, each capability gets exactly one Structure + one Practice probe.

This rationale should not appear in the user-facing UI but is useful when refining methodology or defending design choices in client conversations.

---

## 6. Glossary cross-reference

For terminology used here, see `13_glossary.md`:
- Pillar, Capability, Structure, Practice, Spread, Likert scale, Score band

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 0.2 | 2026-05-19 | **V2 framework — 21 capabilities, 7 per pillar (was 15 / 5).** Added: Digital & Data Fluency, Strategic Renewal & Scenario Planning (Agility — Strategic Adaptability moved here from Resilience and reworded); Crisis Leadership + Bench Depth & Succession (Toughness — split from v0.1's Leadership Strength Under Pressure); Cyber & Technology Resilience (Toughness); Reputation & Stakeholder Trust Recovery, Vision Clarity & Forward Mandate, Workforce Recovery & Re-engagement (Resilience). Renumbered question IDs in new canonical order (Agility 1–7, Toughness 8–14, Resilience 15–21). § 5 rationale updated to 3 × 7 × 2 = 42. |
| 0.1 | 2026-04-28 | Initial extraction from `ENDURANCE_ASSESSMENT_SPEC.md` v1.0 (15 capabilities / 30 statements). |

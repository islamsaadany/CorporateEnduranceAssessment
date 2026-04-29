# 03 — Scoring and Bands

**Version:** 0.1
**Last updated:** 2026-04-28

---

> The scoring math, interpretation bands, and ranking rules used to produce results. All math is deterministic and computed server-side. Individual per-question ratings never leave the server beyond the respondent's own session.

---

## 1. Score range

All score values fall on the range **1.00 to 5.00**, expressed to **2 decimal places** in display. Internally they are stored as floats; rounding happens at the display boundary, not in computation.

---

## 2. Individual scoring (per respondent)

For a single respondent who has answered all 30 questions:

### 2.1 Capability score
Mean of the two questions that map to that capability.

```
capability_score = (rating_a + rating_b) / 2
```

Example: a respondent who rates `1a = 4` and `1b = 3` has a Decision Velocity score of `3.50`.

### 2.2 Pillar score
Mean of the five capability scores within that pillar.

```
pillar_score = mean(capability_scores in pillar)
```

### 2.3 Overall endurance score
Mean of the three pillar scores.

```
overall_score = mean(pillar_scores)
```

> Equivalent to mean(capability_scores) since each pillar has the same number of capabilities, but compute it from pillar scores so the math chain is explicit and auditable.

---

## 3. Team aggregation

For N respondents who have all completed:

### 3.1 Team capability score
Mean of all N respondents' capability scores for that capability.

```
team_capability_score = mean(individual_capability_scores across N respondents)
```

### 3.2 Team pillar score
Mean of all N respondents' pillar scores for that pillar.

```
team_pillar_score = mean(individual_pillar_scores across N respondents)
```

### 3.3 Team overall endurance score
Mean of all N respondents' overall scores.

```
team_overall_score = mean(individual_overall_scores across N respondents)
```

### 3.4 Spread (per capability)

```
min  = min(individual_capability_scores)
max  = max(individual_capability_scores)
spread = max − min
```

**High spread on a capability is a finding.** Surface visibly in results when `spread > 1.0`. The report shows the range explicitly: *"Range: 1.5 – 3.5"*.

---

## 4. Filtering

When a filter is active (department, level, tenure, or compound), all aggregations above are computed over the **filtered subset only**. Each filter view is essentially a fresh aggregation over the matching respondents.

**Anonymity floor:** if the filtered subset has fewer than 3 respondents, the view is locked with a privacy message. See `06_report_filters_and_segments.md` and `11_anonymity_and_privacy.md`.

---

## 5. Interpretation bands

Applied uniformly to any score (overall, pillar, or capability):

| Band | Range | Color (token) | Color (hex) | Meaning |
|------|-------|---------------|-------------|---------|
| **Critical Gap** | 1.00 – 1.99 | `red-critical` | `#C0392B` | Immediate priority; actively damaging |
| **Needs Work** | 2.00 – 2.99 | `orange-gap` | `#E67E22` | Address within the current strategic cycle |
| **Solid** | 3.00 – 3.99 | `ochre` | `#D4A24C` | Generally sound, refine where useful |
| **Strong** | 4.00 – 5.00 | `green-solid` | `#27AE60` | Organizational strength, leverage this |

### Band assignment

```pseudocode
function getBand(score):
  if score < 2.00:  return "Critical Gap"
  if score < 3.00:  return "Needs Work"
  if score < 4.00:  return "Solid"
  return "Strong"
```

The band applies to whatever score is being displayed: a 3.45 capability score is "Solid"; a 1.80 pillar score is "Critical Gap".

### Interpretation strings (auto-shown on the hero panel based on the team overall score)

| Band | String |
|------|--------|
| Critical Gap | *"The organization is in a fragile position and needs urgent intervention across multiple pillars."* |
| Needs Work | *"The organization has real gaps that threaten endurance. Investment is needed."* |
| Solid | *"The organization is generally sound, with specific gaps to address."* |
| Strong | *"The organization is in a position of strength — maintain and leverage."* |

These strings are static — not AI-generated. They appear on the report's hero panel based on the (filtered) team overall score.

---

## 6. Focus areas (top 5 weakest capabilities)

After scoring, the report highlights the **5 weakest capabilities** as focus areas. These anchor the action items section (`04_recommendations.md`).

### 6.1 Selection

```pseudocode
focus_areas = sort_ascending(team_capability_scores)[0..5]   # lowest 5 first
```

### 6.2 Tie-breaking

If two capabilities have identical team scores:

1. **First tie-break:** spread descending (higher disagreement = higher priority).
2. **Second tie-break:** alphabetical by capability name.

The same tie-breaking rules apply within filtered views — focus areas always recompute against the active filter.

### 6.3 Display

Focus areas are displayed in rank order (rank 01 = weakest). Each row shows:

- Rank numeral (01–05) in `ochre`, large
- Capability name + pillar tag
- Team score + band (color-coded)
- Spread, when > 1.0 ("Range: 1.5 – 3.5")
- Two action items (see `04_recommendations.md`)

---

## 7. Computation timing

| When | What's computed |
|------|-----------------|
| **On every results page load** | Numerical aggregations (pillar, capability, spread, focus areas) — fast and cached at request scope |
| **On filter change** | Numerical aggregations recomputed against the new filtered subset |
| **On admin "Generate AI report" click** | Numerical aggregations + AI prompt construction + LLM call + cache write |
| **On respondent submit** | Individual scores computed server-side, stored in `responses` table; aggregates not pre-computed |
| **On respondent answer (per question)** | Individual rating saved to `responses` table; no aggregation yet |

Aggregations are **always recomputed** from raw responses; they are not denormalized into separate aggregate tables. This keeps the DB schema simple and avoids drift between raw and computed values.

---

## 8. Worked example (sample data)

Used for testing the results page. Five respondents (A–E), with the following individual scores:

| Capability | A | B | C | D | E | **Team mean** | **Spread** | **Band** |
|------------|---|---|---|---|---|---------------|------------|----------|
| Decision Velocity | 1.5 | 2.5 | 1.5 | 2.0 | 2.5 | 2.00 | 1.0 | Needs Work |
| Market & Signal Intelligence | 2.0 | 3.0 | 2.5 | 2.5 | 2.5 | 2.50 | 1.0 | Needs Work |
| Adaptive Governance | 1.5 | 2.0 | 2.0 | 2.5 | 2.0 | 2.00 | 1.0 | Needs Work |
| Experimentation Muscle | 3.0 | 3.5 | 3.5 | 3.0 | 3.5 | 3.30 | 0.5 | Solid |
| Delegation & Empowerment | 3.0 | 3.5 | 3.0 | 3.0 | 3.5 | 3.20 | 0.5 | Solid |
| Leadership Strength Under Pressure | 4.0 | 4.0 | 3.5 | 4.0 | 4.5 | 4.00 | 1.0 | Strong |
| Financial Shock Absorption | 4.0 | 3.5 | 4.0 | 4.0 | 4.0 | 3.90 | 0.5 | Solid |
| Operational Continuity | 3.5 | 4.0 | 3.5 | 4.0 | 3.5 | 3.70 | 0.5 | Solid |
| Risk & Compliance Discipline | 4.5 | 4.0 | 4.0 | 4.5 | 4.0 | 4.20 | 0.5 | Strong |
| Trust & Collaboration | 3.5 | 4.0 | 3.5 | 3.5 | 4.0 | 3.70 | 0.5 | Solid |
| System Recoverability | 3.5 | 3.0 | 3.0 | 3.5 | 3.0 | 3.20 | 0.5 | Solid |
| Culture of Grit & Ownership | 2.5 | 3.0 | 3.0 | 2.5 | 3.0 | 2.80 | 0.5 | Needs Work |
| Learning Discipline | 1.5 | 2.5 | 2.0 | 2.0 | 2.0 | 2.00 | 1.0 | Needs Work |
| Strategic Adaptability | 2.5 | 3.0 | 2.5 | 3.0 | 3.0 | 2.80 | 0.5 | Needs Work |
| Offensive Readiness | 1.0 | 1.5 | 2.0 | 1.5 | 1.5 | 1.50 | 1.0 | Critical Gap |

### Pillar means
- **Agility:** 2.60 (Needs Work)
- **Toughness:** 3.90 (Solid)
- **Resilience:** 2.60 (Needs Work)
- **Overall:** 3.03 (Solid)

### Top-5 focus areas
1. Offensive Readiness — 1.50 (Critical Gap)
2. Decision Velocity — 2.00 (Needs Work) — tied with two others below; spread = 1.0 → ranks first by name alphabetical secondary tie-break
3. Adaptive Governance — 2.00 (Needs Work)
4. Learning Discipline — 2.00 (Needs Work)
5. Market & Signal Intelligence — 2.50 (Needs Work)

This sample profile is the canonical seed data for development testing. See `Plan & Progress/execution-plan.md` Phase 1.

---

## 9. Edge cases

| Case | Behavior |
|------|----------|
| 0 respondents | Report locked with "Awaiting first response" message. |
| 1–2 respondents | Report locked with "≥3 respondents required to display anonymously." |
| Filtered subset has 0–2 respondents | Filter view replaced with lock message; admin can clear filter to return to company-wide. |
| Two capabilities tied by score and spread | Alphabetical secondary tie-break (capability name, A→Z). |
| All capability scores identical | Ranking still produced via alphabetical fallback; report still meaningful via pillar context. |
| Respondent submits with all `5`s | Valid — produces overall score 5.00, banded "Strong". No anti-acquiescence detection in v1. |

---

## 10. Glossary cross-reference

For terminology used here, see `13_glossary.md`:
- Score, Score band, Spread, Focus areas, Filter signature, Anonymity floor

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 2026-04-28 | Initial extraction from `ENDURANCE_ASSESSMENT_SPEC.md` v1.0. |

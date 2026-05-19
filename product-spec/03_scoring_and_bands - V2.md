# 03 — Scoring and Bands (V2)

**Version:** 0.3
**Last updated:** 2026-05-19

---

> The scoring math, interpretation bands, and ranking rules used to produce results under the V2 (42-question / 21-capability) framework. All math is deterministic and computed server-side. Individual per-question ratings never leave the server beyond the respondent's own session. The v0.2 file (`03_scoring_and_bands.md`, written for the 30-question framework) is preserved alongside for historical reference; everything in this file supersedes it where the two disagree.

---

## 1. Score range

All score values fall on the range **1.00 to 4.00**, expressed to **2 decimal places** in display. Internally they are stored as floats; rounding happens at the display boundary, not in computation.

The underlying Likert is 4-point with no neutral midpoint (`1 = Strongly Disagree` … `4 = Strongly Agree`). Respondents who lack visibility into a practice pick **"I don't know"** instead of guessing — these answers are stored but **excluded from every score computation below**. See `02_questions - V2.md` § 3.

---

## 2. Individual scoring (per respondent)

For a single respondent who has completed the assessment (every question has a valid answer of either 1–4 or "I don't know"):

### 2.1 Capability score
Mean of the **rated** answers (1–4) for the two questions that map to that capability.

- If both angles were rated: `capability_score = (rating_a + rating_b) / 2`
- If only one angle was rated and the other was "I don't know": `capability_score = the single rating`
- If both angles were "I don't know": **the capability has no score** for that respondent (they don't contribute to that capability's team aggregation).

Example: a respondent who rates `1a = 3` and `1b = 4` has a Decision Velocity score of `3.50`. A respondent who rates `1a = 3` and picks "I don't know" for `1b` has a Decision Velocity score of `3.00`. A respondent who picked "I don't know" for both has no Decision Velocity score.

### 2.2 Pillar score
Mean of the **available** capability scores within that pillar (skipping any capability where the respondent picked "I don't know" for both angles).

```
pillar_score = mean(capability_scores in pillar that have a value)
```

Each pillar holds 7 capabilities under V2 (up from 5 in v0.1), so a pillar score is the mean of up to 7 individual capability values.

If every capability in a pillar has no score for this respondent (an extreme edge case), the respondent has no pillar score and contributes nothing to the team aggregation for that pillar.

### 2.3 Overall endurance score
Mean of the **available** pillar scores.

```
overall_score = mean(pillar_scores that have a value)
```

> Why mean-of-pillars rather than mean-of-capabilities: when "I don't know" answers are unevenly distributed across pillars, mean-of-pillars keeps each pillar weighted equally, preventing one well-answered pillar from dominating because it had more rated questions. The asymmetry argument is even stronger under V2 (7 capabilities per pillar) than under v0.1 (5).

---

## 3. Team aggregation

For N respondents who have all completed (where N ≥ 3, the anonymity floor):

### 3.1 Team capability score
Mean of the available individual capability scores. Respondents who picked "I don't know" for both angles of this capability are excluded from this capability's team mean — but they still count toward the headline N.

```
team_capability_score = mean(individual_capability_scores that have a value)
```

Display: alongside the team capability score, the report shows how many respondents contributed (e.g., *"3 of 5 rated this capability"*) so the reader knows when a capability is sparsely answered.

If **fewer than 3 respondents** rated a capability (i.e., 3+ picked "I don't know" for both its angles), display **"Insufficient data — fewer than 3 respondents rated this capability"** instead of a score. This is a per-capability extension of the ≥3 anonymity floor: a single rated answer in a capability would be effectively identifiable.

### 3.2 Team pillar score
Mean of the available individual pillar scores.

```
team_pillar_score = mean(individual_pillar_scores that have a value)
```

### 3.3 Team overall endurance score
Mean of the available individual overall scores.

```
team_overall_score = mean(individual_overall_scores that have a value)
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

Bands cut the 1.00–4.00 range into four equal quartiles of 0.75 each.

| Band | Range | Color (token) | Color (hex) | Meaning |
|------|-------|---------------|-------------|---------|
| **Critical Gap** | 1.00 – 1.74 | `red-critical` | `#C0392B` | Immediate priority; actively damaging |
| **Needs Work** | 1.75 – 2.49 | `orange-gap` | `#E67E22` | Address within the current strategic cycle |
| **Solid** | 2.50 – 3.24 | `ochre` | `#D4A24C` | Generally sound, refine where useful |
| **Strong** | 3.25 – 4.00 | `green-solid` | `#27AE60` | Organizational strength, leverage this |

### Band assignment

```pseudocode
function getBand(score):
  if score < 1.75:  return "Critical Gap"
  if score < 2.50:  return "Needs Work"
  if score < 3.25:  return "Solid"
  return "Strong"
```

The band applies to whatever score is being displayed: a 2.85 capability score is "Solid"; a 1.60 pillar score is "Critical Gap".

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

After scoring, the report highlights the **5 weakest capabilities** as focus areas. These anchor the action items section (`04_recommendations - V2.md`).

> **Why still top-5 under V2.** The pool of capabilities grew from 15 to 21, but the focus-area count stays at 5 — the report is most action-oriented when it picks fewer levers, not more. We may revisit this in a future revision (e.g., top-7 to keep 5:21 ≈ 24% parity with 5:15 ≈ 33%), but v1 of V2 stays at 5.

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
- Two action items (see `04_recommendations - V2.md`)

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

The v0.2 file held a worked example for the 15-capability framework. Under V2 the equivalent example would tabulate 21 capabilities × N respondents — too large to inline usefully. The deterministic sample seed in `scripts/gen-acme-sample-data.ts` is the canonical worked example for V2: 50 respondents × 42 statements with per-capability target means tuned so each band lands at least once. See `006_acme_sample_data.sql` for the rendered output.

For arithmetic illustration only — the same formulas as the v0.2 example apply unchanged, just over 21 capabilities instead of 15 and 7-per-pillar instead of 5-per-pillar.

---

## 9. Edge cases

| Case | Behavior |
|------|----------|
| 0 respondents | Report locked with "Awaiting first response" message. |
| 1–2 respondents | Report locked with "≥3 respondents required to display anonymously." |
| Filtered subset has 0–2 respondents | Filter view replaced with lock message; admin can clear filter to return to company-wide. |
| Two capabilities tied by score and spread | Alphabetical secondary tie-break (capability name, A→Z). |
| All capability scores identical | Ranking still produced via alphabetical fallback; report still meaningful via pillar context. |
| Respondent submits with all `4`s | Valid — produces overall score 4.00, banded "Strong". No anti-acquiescence detection in v1. |
| Respondent submits with all `1`s | Valid — produces overall score 1.00, banded "Critical Gap". |
| Respondent picks "I don't know" for every question | Their row has no capability, pillar, or overall score; they don't contribute to any team aggregation, but they still count toward total submitted respondents and the headline N. |

---

## 10. Glossary cross-reference

For terminology used here, see `13_glossary.md`:
- Score, Score band, Spread, Focus areas, Filter signature, Anonymity floor

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 0.3 | 2026-05-19 | **V2 framework alignment.** Capability count 15 → 21, statement count 30 → 42, capabilities-per-pillar 5 → 7. Formulas unchanged. Replaced the 30-question § 8 worked example with a pointer to the V2 sample data generator. § 6 adds a note explaining why focus-area count stays at 5 under the larger capability pool. |
| 0.2 | 2026-04-30 | Drift fix — § 8 worked example was from the 1–5 era (capability cells > 4.00, Resilience pillar mean inconsistent with row sums). Rebuilt the example with realistic 1–4 values, added a per-respondent pillar/overall table for traceability, and recomputed the top-5 focus areas under the documented tie-break rules. § 9 edge case "all 5s" replaced with "all 4s" / "all 1s" / "all I don't know" to match the 1–4 Likert. |
| 0.1 | 2026-04-28 | Initial extraction from `ENDURANCE_ASSESSMENT_SPEC.md` v1.0. |

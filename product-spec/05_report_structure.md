# 05 — Report Structure

**Version:** 0.1
**Last updated:** 2026-04-28

---

> The on-screen and PDF report layout. Sections, ordering, content, and visual treatment. The report is the most important surface of the product — designed to be presentable in a client boardroom without further formatting.

---

## 1. Two layers, one report

| Layer | Source | When visible |
|-------|--------|--------------|
| **Numerical** | Computed deterministically from raw responses | Anytime — during collection (with "Preliminary" banner) and after closure |
| **AI-generated** | LLM call, cached per filter | Only when admin explicitly clicks "Generate AI report"; pre-closure generations are watermarked drafts |

Both layers share the same report skeleton — the AI-generated content fills in the `Executive Summary` panel and the action items beneath each Focus Area. When AI content is absent (never generated, or fallback), the numerical layer stands alone with static interpretation strings and baseline action items.

See `15_report_generation_and_caching.md` for the generation lifecycle.

---

## 2. Banners and headers

The report page has up to three banners stacked at the top, in this order:

### 2.1 Filter banner (always present)
Shows the active filter context. Examples:

- *"Company-wide — all departments, all levels, all tenures (47 respondents)"*
- *"Sales department · Manager level · 4–7y tenure (8 respondents)"*

Includes a "Clear filter" link when a filter is active, and a "Change filter" button that opens the filter UI.

### 2.2 Preliminary banner (during collection only)

When the assessment status is `collecting`:

> ⚠ *"Preliminary — based on 7 of 10 expected respondents. Final results lock at the deadline (Apr 30, 11:59 PM)."*

Background: light orange tint (`#FFF4E6`), text in `dark-blue`, no animation.

Hidden after closure.

### 2.3 Draft AI banner (when AI report exists but assessment is still collecting)

When a cached AI report exists for the current filter AND the assessment is still `collecting`:

> ✎ *"This AI report is a draft generated on Apr 24, 14:32, before the assessment closed. Regenerate after closure for final."*

Includes a "Regenerate" button (after closure only). Background: light grey-soft, text in `grey-text`.

Hidden when no AI report exists, or when assessment is closed and the cached report is final.

---

## 3. Section 1 — Summary (hero)

Full-width panel, dark blue background (`#0B2545`), white text. The first thing the admin sees.

### 3.1 Layout (desktop, two columns)

**Left column (hero score):**
- Eyebrow: `TEAM ENDURANCE SCORE` in `ochre`, ALL CAPS, letter-spaced
- Large numeral (~90px Georgia bold): the team overall score to 2 decimal places — e.g., `3.03`
- Subtle `/ 5.00` underneath in 24px
- Band label in `ochre`: `SOLID` (or whatever band)
- One-line interpretation:
  - From AI executive summary (when AI report cached for this filter), OR
  - Static band-keyed string from `03_scoring_and_bands.md` section 5 (when no AI)

**Right column (pillar breakdown):**

Three rows, one per pillar (in order Agility → Toughness → Resilience):

- Pillar name in white, 18px bold
- Verb pair underneath in 13px ochre: *"Sense and move"* / *"Absorb and hold"* / *"Recover and renew"*
- Team score numeral (e.g., `2.60`) in 36px Georgia, color-coded by band
- Band label small caps, color-coded
- Horizontal progress bar — track in `dark-blue-soft`, fill colored by band, width = `score / 5`

### 3.2 Bottom of section — band legend

Four-band horizontal legend strip:
- `Critical Gap (1.00–1.99)` — red dot, label
- `Needs Work (2.00–2.99)` — orange dot, label
- `Solid (3.00–3.99)` — ochre dot, label
- `Strong (4.00–5.00)` — green dot, label

### 3.3 Mobile layout

Hero score stacks above pillar breakdown. Legend strip wraps if necessary.

---

## 4. Section 2 — Capability Profile

Three columns side by side, one per pillar (mobile: stacked vertically).

### 4.1 Per-column layout

**Header panel** (compact, `dark-blue` background):
- Pillar name in white
- Verb pair in `ochre`, smaller
- Pillar-level team score
- Pillar band label

**5 capability rows** within each column:
- Each capability row has:
  - Small horizontal score bar (10px tall, color by band, width by score/5)
  - Capability name (16px sans, `dark-blue`)
  - Score numeral (1 decimal place — e.g., `2.0`) on the right
  - **Spread indicator**: when spread > 1.0, a subtle text below the row reads `Range: 1.5 – 3.5` in `grey-text`, 12px italic. Optionally a small "team is split" badge in `ochre-soft` for high spread (> 1.5).

### 4.2 Ordering within each pillar column

By default: **highest team score first** (strongest at top, weakest at bottom). This visually surfaces what's working and what isn't.

> Future variant (v2): admin can toggle ordering to show by spread descending — useful when divergence is the lead finding.

---

## 5. Section 3 — Focus Areas

The most action-oriented section. A ranked list of 5 rows.

### 5.1 Per-row layout

- **Rank numeral** (`01` through `05`): large `ochre` Georgia bold, ~48px
- **Capability name** + small pillar tag eyebrow: `RESILIENCE · OFFENSIVE READINESS`
- **Team score + band**, color-coded
- **Spread indicator** (when > 1.0): small text *"Team is split — range 1.0 to 2.5"*
- **Two action items** (numbered 1 and 2):
  - From AI-adapted action items (when cached)
  - From baseline action items in `04_recommendations.md` (otherwise)

### 5.2 Visual treatment

Each focus area row sits in a card with:
- Top accent strip in `ochre` (4px tall, full-width)
- White background, subtle shadow
- Generous internal padding (24px desktop, 16px mobile)
- Rank numeral on the left, content on the right (mobile: rank above content)

### 5.3 Empty state

If fewer than 5 capabilities exist (will not happen in v1 — there are always 15), or the data is incomplete, show whatever capabilities exist with appropriate ranks.

---

## 6. Section 4 — Anonymized Individual Responses (drawer or tab)

A separate **tab** or expandable drawer on the report page (default collapsed). Reveals a per-respondent matrix without identifying names.

### 6.1 Per-respondent row

| Letter | Department | Level | Tenure | Overall band | Agility band | Toughness band | Resilience band |
|--------|------------|-------|--------|--------------|--------------|----------------|-----------------|
| A | Sales | Manager | 4–7y | Solid | Needs Work | Solid | Solid |
| B | Engineering | Senior Leader | 8–15y | Strong | Strong | Strong | Solid |
| ... | | | | | | | |

### 6.2 Capability matrix (15 capabilities × N respondents)

Below the per-respondent row table: a heatmap where each cell shows the band color (no numeric value). Rows = capabilities (in canonical order), columns = anonymized respondents (letters).

This view helps the admin spot:
- Outliers (one respondent diverging on many capabilities)
- Pattern of agreement (where the team is unanimous)
- Pattern of disagreement (where the team is split)

### 6.3 Privacy

- Letters never persist across page reloads — they are assigned at render time
- No way to map letter back to identity from this view
- The anonymity floor (≥3) still applies — if filter narrows to <3 respondents, the entire results page is locked, including this tab

See `11_anonymity_and_privacy.md` for full privacy rules.

---

## 7. Action buttons (header right)

Persistent action buttons in the top-right of the results page:

- **Generate AI report** (or **Regenerate** when cached version exists for current filter)
  - Pre-closure: tooltip says *"Will be generated as a draft. Regenerate after closure for final."*
  - Post-closure: standard generation
- **Export PDF** — exports the currently active filtered view; uses cached AI content if present, baseline otherwise
- **Change filter** — opens filter modal/sidebar
- **Compare segments** — opens the comparison view (two filters side-by-side, quantitative only)
- **Activity log** — opens the audit log drawer for this assessment

### 7.1 Edit-mode controls (post-closure only)

When assessment status is `closed`:

- **Edit responses** — opens editable view for individual respondents (post-closure only — see `07_admin_workflows.md`)

---

## 8. PDF rendering

The PDF mirrors the on-screen report sections in the same order. Polish level **standard**:

- Page numbers at the bottom right (`Page 3 of 8`)
- Footer on every page: *"Forefront Consulting · The Corporate Endurance Model · [Client Name]"*
- Filter banner reproduced at top of page 1
- Each pillar's column from Section 2 starts on a new page (3 pillar pages)
- No section header orphans — if a header would land within 80pt of the page bottom, it pushes to the next page
- Tables (anonymized individuals matrix) never split mid-row
- Cover page in v1: simple title block — *"The Endurance Assessment / [Client Name] / [Filter applied] / [Date]"*

See `15_report_generation_and_caching.md` for PDF generation lifecycle.

---

## 9. Comparison view (two-filter)

A separate page or modal that renders **two** filter contexts side-by-side. Quantitative only (no AI narrative comparison in v1).

### 9.1 Layout

- Top: two filter pickers (left and right), with names — e.g., *"Sales vs. Engineering"*
- Both must satisfy the ≥3 anonymity floor independently; if either side has <3 respondents, that side is locked
- Sections rendered as twin columns:
  - Hero score (twin numerals side-by-side, with delta indicator: `+0.4` or `−0.2`)
  - Pillar breakdown (twin progress bars per pillar, color-coded)
  - Capability profile (twin score bars per capability, color-coded)
  - Focus areas (twin lists; if a capability is in one side's top-5 but not the other's, indicate which side it appears in)
- **No comparison AI narrative or comparison action items** — those are v2

### 9.2 Use cases

- "Sales vs. Engineering"
- "Managers vs. ICs"
- "New hires (<1y) vs. Long-tenured (15+y)"

---

## 10. State combinations

| Status | AI report cached? | Banner stack |
|--------|-------------------|--------------|
| Collecting | None | Filter banner + Preliminary banner |
| Collecting | Cached (draft) | Filter banner + Preliminary banner + Draft AI banner |
| Closed | None | Filter banner only |
| Closed | Cached (final) | Filter banner only |

---

## 11. Loading and error states

- **Loading aggregations:** subtle pulse on score numerals (~1s typical for unfiltered, longer for compound filters)
- **Loading AI generation:** "Generate" button changes to "Generating…" with a pulse effect; ETA hint *"This usually takes 10–20 seconds"*
- **AI generation failed:** in-place error message *"Could not generate the AI report. Showing baseline content. [Retry]"* — falls back to baseline; admin can retry manually
- **Filter resolves to <3 respondents:** the report area replaces with a centered lock card: *"Too few respondents (2) to display this segment anonymously. Adjust the filter or return to company-wide view."* with a "Clear filter" button
- **No respondents at all:** *"Awaiting first response."* with the deadline shown

---

## 12. Glossary cross-reference

For terminology used here, see `13_glossary.md`:
- Numerical report, AI report, Filter, Compound filter, Anonymity floor, Anonymized individual, Watermark, Draft, Final

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 2026-04-28 | Initial extraction from `ENDURANCE_ASSESSMENT_SPEC.md` v1.0 section 9, expanded with banner stack, comparison view, AI cache states, edit-mode controls. |

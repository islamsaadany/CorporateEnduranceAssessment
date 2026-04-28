# 06 — Report Filters and Segments

**Version:** 0.1
**Last updated:** 2026-04-28

---

> Multi-variant filtering is the core differentiator of the report. The default is company-wide; from there, the admin slices the data by department, level, tenure, or any combination — with all aggregations recomputed on the fly and AI reports generated/cached per filter.

---

## 1. Filter dimensions

| Dimension | Source | Values |
|-----------|--------|--------|
| **Department** | Admin-defined per assessment | Whatever list the admin entered when creating the assessment (editable during collection) |
| **Level** | Fixed across all assessments | Executive, Senior Leader, Manager, Team Lead, Individual Contributor |
| **Tenure** | Fixed across all assessments | <1y, 1–3y, 4–7y, 8–15y, 15+y |

A filter selection on any dimension is **multi-select** — admin can pick one or more values. Empty selection on a dimension = "all" (no filtering on that dimension).

---

## 2. Filter signature

A deterministic representation of an active filter, used as a cache key for AI reports.

### 2.1 Construction

```
filter_signature = sha256_hex(json_stable_stringify({
  departments: sorted(["Sales", "Engineering"]) || [],
  levels:      sorted(["Manager"]) || [],
  tenures:     sorted(["4-7y", "8-15y"]) || []
}))
```

`json_stable_stringify` ensures keys appear in a fixed order. Sorting array values eliminates ordering variability ("Sales,Engineering" hashes the same as "Engineering,Sales").

### 2.2 Special signatures

| Filter state | Signature |
|--------------|-----------|
| No filter active (company-wide) | hash of `{ departments: [], levels: [], tenures: [] }` — typically referred to as `"company_wide"` |
| Single department | hash of `{ departments: ["Sales"], levels: [], tenures: [] }` |
| Compound | hash of `{ departments: ["Sales"], levels: ["Manager"], tenures: ["4-7y"] }` |

### 2.3 Why hash

Two reasons:
1. **Cache key safety:** raw filter dicts could include user-typed department names with quirks; hashes are uniform length and safe in DB indexes.
2. **Versioning:** if the filter schema changes (new dimensions added in v2), bumping a `filter_schema_version` prefix invalidates all old caches without DB migration.

---

## 3. Anonymity floor

**Every view requires ≥3 respondents** in the filtered subset to display. Below 3, the report area is replaced with a lock card.

### 3.1 What counts as a respondent

A respondent counts toward the floor when they have **completed and submitted** the assessment. In-progress respondents do not count.

### 3.2 Floor enforcement

| Filtered subset size | Behavior |
|----------------------|----------|
| 0 | *"No respondents match this filter."* with "Clear filter" button |
| 1–2 | *"Too few respondents ({N}) to display this segment anonymously. Adjust filter or return to company-wide view."* with "Clear filter" button |
| ≥3 | Report renders normally |

### 3.3 What's locked

When the floor is not met, **everything** is locked: hero summary, capability profile, focus areas, anonymized individuals tab. The admin sees only the lock card and the filter UI.

### 3.4 Company-wide floor

The same ≥3 floor applies company-wide. Below 3 total submitted respondents, even the unfiltered view is locked. Banner: *"Awaiting more responses (currently {N} of {total}). Results lock until at least 3 respondents submit."*

### 3.5 Why not ≥5

≥3 is the practical floor for "you cannot infer one person's answer from the aggregate." ≥5 would be more conservative, but in this product respondents are typically 5–20 senior leaders — too many segments would be permanently locked at ≥5. Three is the agreed v1 setting; can be raised in v2 if privacy requirements change.

---

## 4. Filter UI

### 4.1 Filter modal (or sidebar — implementation choice)

Triggered by the "Change filter" button in the report header.

Layout:
- **Department** section: multi-select chips for each admin-defined department + "Select all" / "Clear" links
- **Level** section: multi-select chips for the 5 fixed levels
- **Tenure** section: multi-select chips for the 5 fixed bands
- **Live preview**: at the bottom of the modal, before applying, show *"This filter matches 8 respondents (anonymity floor met ✓)"* or *"This filter matches 2 respondents (below floor — view will be locked)"*
- "Apply" button (disabled when no change), "Cancel" button, "Clear all filters" link

### 4.2 Active filter indicator

When a filter is active, the report header shows the filter description in a chip-style row: `Sales × Manager × 4–7y` with a small ✕ on each chip to remove that part of the filter.

Clicking the description text or the "Change filter" button reopens the modal.

### 4.3 Quick filter saves (v2 candidate)

Saving a named filter (e.g., "Sales Leadership" = Sales × Manager+Senior Leader) is **not in v1**. v1 admins re-apply filters from scratch each time.

---

## 5. Filter behavior on report sections

| Section | How filter applies |
|---------|---------------------|
| Hero summary | All scores recomputed against filtered subset; band & interpretation string update |
| Pillar breakdown | All three pillar scores recomputed |
| Capability profile | All 15 capability scores + spread recomputed |
| Focus areas | Recomputed — top-5 weakest of the **filtered** capability scores |
| Anonymized individuals | Only respondents matching the filter are listed |
| AI executive summary + action items | Cached per filter signature; regenerates on demand |

**Crucial:** the focus areas of a filtered view will often differ from company-wide. A capability that's strong company-wide may be a top focus area for "ICs only" or for "Engineering only." This is a feature, not a bug — it's the whole point of multi-variant reporting.

---

## 6. Comparison view

Side-by-side comparison of two filtered views. v1 = quantitative only.

### 6.1 Trigger

"Compare segments" button in the report header.

### 6.2 Layout

- Two filter pickers at the top, labeled "A" and "B"
- Each picker is the same multi-select UI as section 4.1
- Each filter independently checked against the anonymity floor
- If either filter has <3 respondents, that side shows the lock card; the other side still renders
- All quantitative sections render twice (left = A, right = B):
  - Hero scores with **delta indicator** between them (e.g., `Δ +0.4` in green = A is higher; `Δ −0.2` in orange = A is lower)
  - Pillar breakdown twin progress bars (overlaid or stacked depending on screen width)
  - Capability profile twin score bars per capability — same canonical capability order on both sides for direct visual comparison
  - Focus areas: two ranked lists side-by-side; capabilities that appear in one side's top-5 but not the other's are visually marked

### 6.3 What's NOT in comparison view (v1)

- AI executive summary comparison
- Adapted action items per side
- Spread comparison (could be added in v2 — for now, spread shows on each side independently)
- PDF export of comparison view (stretch v1 if straightforward; otherwise v2)

### 6.4 Closing the comparison

"Exit comparison" returns to the single-filter report view. Filter A becomes the active filter on the regular report.

---

## 7. Compound filter examples

Examples to ground UI decisions and AI prompt construction:

| Filter | filter_description (sent to AI) |
|--------|---------------------------------|
| No filter | "Company-wide (all departments, all levels, all tenures)" |
| `Sales` | "Sales department, all levels and tenures" |
| `Sales`, `Manager` | "Sales department, Manager level, all tenures" |
| `Sales`, `Engineering`, `Manager`, `Senior Leader`, `4–7y` | "Sales or Engineering department, Manager or Senior Leader level, 4–7y tenure" |
| `Manager` | "Manager level, all departments and tenures" |
| `15+y` | "15+ years tenure, all departments and levels" |

---

## 8. Filter persistence

| State | Persistence |
|-------|-------------|
| Active filter on the report page | URL query string (e.g., `?dept=Sales,Engineering&level=Manager`) — shareable, survives refresh |
| Filter in comparison view | URL query string with `compareA=...&compareB=...` |
| Saved named filters | **Not in v1** |

URL persistence makes filter views shareable internally between admins ("Hey, look at this Sales × Manager view: [link]") without requiring a save mechanism.

---

## 9. Edge cases

| Case | Behavior |
|------|----------|
| Admin removes a department from the assessment-level list while a filter using it is active | Filter URL still resolves; if respondents tagged with that department exist, they still appear (department list edits are about future respondents, not retroactive) |
| Admin filters by a department that has no respondents | Locked with "0 respondents match" |
| Admin filters by a level that doesn't exist | Should be impossible from UI (only valid levels selectable); if URL is hand-crafted with an invalid level, treat as no filter on that dimension |
| Compound filter results in 3 respondents exactly | Renders, but the AI prompt's sample-size disclaimer kicks in (see `14_ai_prompts.md`) |
| Admin generates AI report at filter A, then changes filter to B | B has no cached AI report — admin sees baseline + can click "Generate AI report" to make one for B |
| Cached AI report exists for filter X, but filter X's underlying respondent data has changed (admin edited a respondent) | Cache invalidates with admin warning before edit (see `15_report_generation_and_caching.md`) |

---

## 10. Glossary cross-reference

For terminology used here, see `13_glossary.md`:
- Filter, Compound filter, Filter signature, Comparison view, Anonymity floor, Cached report

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 2026-04-28 | Initial. Defines filter dimensions, signature scheme, anonymity floor (≥3), filter UI, comparison view (quantitative only in v1), and persistence via URL query string. |

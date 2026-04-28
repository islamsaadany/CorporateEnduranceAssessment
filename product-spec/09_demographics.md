# 09 — Demographics

**Version:** 0.1
**Last updated:** 2026-04-28

---

> What's collected from the respondent, when, and how it's used. Demographics power the multi-variant filtering and AI report context, but never re-identify individuals in the report.

---

## 1. Fields collected

Collected on `/take/demographics` after code validation, before question 1.

| Field | Required? | Type | Values |
|-------|-----------|------|--------|
| **Full name** | Optional | Text input | Free-text, max ~200 chars |
| **Department** | Required | Dropdown | Admin-defined per assessment (see section 2) |
| **Level** | Required | Dropdown | Fixed list of 5 (see section 3) |
| **Years at the organization** (tenure) | Required | Dropdown | Fixed banded list of 5 (see section 4) |

No other demographics are collected in v1. Specifically excluded:
- ❌ Gender
- ❌ Age
- ❌ Region / location
- ❌ Race / ethnicity
- ❌ Salary band

---

## 2. Department

### 2.1 Source

The department list is **defined per assessment** by the admin at creation time. Different clients may have different department structures (Sales, Engineering, Operations, Finance, Marketing… or Underwriting, Claims, Actuarial, Brokerage…).

### 2.2 Editing during collection

The admin can:
- **Add** a new department anytime (extends the dropdown for new respondents starting after the addition)
- **Remove** a department only if **no respondent has used it yet**. UI shows usage count: "Sales (used by 4 respondents — cannot remove)" vs. "Tech (unused — Remove)"
- **Rename** a department: not in v1 (could create confusion across already-submitted respondents). v2 candidate.

### 2.3 Editing post-closure

After closure, the admin can edit any individual respondent's department (per `07_admin_workflows.md` Flow E — post-closure edit). This invalidates cached AI reports with warning.

### 2.4 Display

The dropdown values are displayed exactly as the admin entered them — no normalization, no case adjustment beyond removing trailing/leading whitespace. Respect the admin's casing ("Tech" vs. "Technology" is a meaningful choice).

### 2.5 Storage

Stored in a `departments` table linked to the assessment, with a unique constraint on `(assessment_id, name)`. Each respondent's department selection is stored as `respondents.department_id` (foreign key).

---

## 3. Level

### 3.1 Fixed list (canonical order)

1. **Executive** — C-suite, board members, top-of-house roles
2. **Senior Leader** — VP, SVP, divisional heads, senior directors
3. **Manager** — Department managers, team managers, mid-level leaders
4. **Team Lead** — First-line leaders, supervisors, team coordinators
5. **Individual Contributor** — IC roles without direct reports

### 3.2 Why fixed

Cross-assessment comparability. If different clients used different level taxonomies, benchmarking and comparison across engagements would be impossible. The 5 chosen represent the standard organizational tier model.

### 3.3 Storage

Stored as an enum string on `respondents.level`. Validated server-side against the enum.

### 3.4 Display

In dropdown and report UI, displayed exactly as the canonical names. No abbreviations ("IC" is not used — always "Individual Contributor").

---

## 4. Tenure

### 4.1 Fixed banded list

1. **Less than 1 year** — `<1y`
2. **1–3 years** — `1-3y`
3. **4–7 years** — `4-7y`
4. **8–15 years** — `8-15y`
5. **15 years or more** — `15+y`

### 4.2 Why bands instead of integer years

- **Privacy:** "I've been here 11 years" combined with a small department could uniquely identify someone. Bands aggregate for anonymity.
- **Cognitive ease:** respondents pick a band quickly without needing to recall exact start date.
- **Analytical sufficiency:** band-level resolution is enough for "new hires vs. long-tenured" segmentation; precise integer years would not change the report meaningfully.

### 4.3 Storage

Stored as an enum string on `respondents.tenure_band`. Validated server-side.

### 4.4 Display

In dropdown: full label *"Less than 1 year"*, *"1–3 years"*, etc. In compact UI elements (filter chips, anonymized rows): short form `<1y`, `1–3y`, etc.

---

## 5. Optional name

### 5.1 Why optional

Some respondents may want their name on file for the admin's reference (so the admin knows they completed). Others may prefer not to provide it. The product respects both.

### 5.2 What's done with the name

- **Stored** in `respondents.full_name` (nullable)
- **Visible to admin** in the codes table on the assessment detail page (so admin can correlate with their own records)
- **Visible to admin** in the post-closure edit drawer (when editing a respondent's data — admin needs to know who they're editing)
- **NOT visible** in the results page — anonymized individuals are labeled by letter
- **NOT sent to AI** — the LLM only ever sees letters + demographics
- **NOT exported in PDF** — the PDF shows only anonymized data

### 5.3 What if multiple respondents enter the same name?

No constraint. Two "John Smith" respondents are valid; they'll have different codes and be treated as distinct rows. The admin can disambiguate from their own records.

### 5.4 What if a name is left blank and admin needs to know?

Admin checks the codes table — status, demographics, and timestamps usually narrow it down. If admin needs absolute identity certainty, they should track the code↔person mapping in their own records (since codes are anonymous slots, this responsibility lies outside the app).

---

## 6. How demographics flow through the product

### 6.1 In the respondent flow

1. Respondent enters code → demographics screen (per `08_respondent_workflows.md` section 4)
2. Submits demographics → status transitions from `Not Started` to `In Progress`
3. Demographics are immutable from the respondent's side — they cannot return to demographics from later question screens

### 6.2 In the admin codes table

Demographics appear as columns alongside each code row, populated as soon as the respondent completes the demographics step.

### 6.3 In the report (filtering)

Department, Level, Tenure are the three filter dimensions (see `06_report_filters_and_segments.md`). Filter UI is built directly from the demographics taxonomy.

### 6.4 In the report (anonymized individuals)

Each respondent appears as a row labeled by letter (Respondent A, B, C…) with their demographics shown — but never their name.

### 6.5 In the AI prompt

The LLM receives demographics labeled by letter for each respondent. See `14_ai_prompts.md` section 7 for the exact privacy contract.

---

## 7. Editing demographics post-closure

The admin can edit any respondent's demographics post-closure via the edit drawer (per `07_admin_workflows.md` Flow E):

- Department (must be a value from the assessment's department list)
- Level (must be one of the 5 fixed levels)
- Tenure (must be one of the 5 fixed bands)
- Name (free-text, optional)

Each edit:
- Triggers a warning modal noting that cached AI reports will be invalidated (with count of affected reports)
- Captures old/new values in audit log
- Marks all cached AI reports for the assessment as stale (with stale-warning banner on the results page until regenerated)

---

## 8. Privacy posture

- Names, when provided, never leave the database. They are not in the report, not in PDF exports, not sent to AI.
- Demographics (department/level/tenure) are sent to AI labeled by letter — no link back to any individual identity.
- The anonymity floor (≥3) ensures no segment is small enough that one person's demographics could re-identify them.
- Full data-handling contract is in `11_anonymity_and_privacy.md`.

---

## 9. v2 candidates

- **Optional industry / function override** — allowing respondent to specify their function within the assessment context (when "department" doesn't capture the right axis)
- **Tenure as integer with banding at display** — collect integer years (or pick from a year list), band only at display/filter time. Privacy implications must be considered.
- **Custom demographic fields per assessment** — admin defines additional fields (e.g., "Region", "Business Unit") with their own type. Big change.
- **Department renaming** — currently not allowed during collection.

---

## 10. Glossary cross-reference

For terminology used here, see `13_glossary.md`:
- Demographics, Anonymity floor, Anonymized individual

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 2026-04-28 | Initial. Defines four fields (name optional, department admin-defined, level fixed 5, tenure banded 5), excluded fields (gender / age / region), editing rules (during collection vs. post-closure), and how demographics flow into filtering and AI. |

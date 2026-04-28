# 13 — Glossary

**Version:** 0.1
**Last updated:** 2026-04-28

---

> Definitions of terms used consistently across all product-spec files. When a new term is coined or a definition changes, update it here first, then propagate to other files.

---

## Methodology terms

**Endurance.** The umbrella construct measured by the product. An organization's compound ability to sense and move (Agility), absorb and hold (Toughness), and recover and renew (Resilience). Made up of three pillars.

**Pillar.** One of the three top-level dimensions of endurance. Agility, Toughness, or Resilience.

**Capability.** One of the 15 sub-dimensions, 5 per pillar. Each capability is measured by exactly two statements.

**Structure (question angle).** A statement that asks whether the *mechanism* exists — policy, system, role definition, designed process. Example: *"Our organization has clearly defined decision rights..."*

**Practice (question angle).** A statement that asks whether the mechanism *actually works* in lived experience. Example: *"Key strategic decisions are made and acted upon within days or weeks..."*

The Structure–Practice pairing is intentional: a high Structure score with a low Practice score means "we have it on paper but it doesn't work"; the inverse means "it works informally but isn't institutionalized."

**Likert scale.** The 5-point response scale used for every question: 1 (Strongly Disagree), 2 (Disagree), 3 (Neutral), 4 (Agree), 5 (Strongly Agree). No "N/A" or skip option exists.

**Score band.** One of four interpretation bands applied uniformly to any score (overall, pillar, or capability):
- **Critical Gap** (1.00–1.99) — red
- **Needs Work** (2.00–2.99) — orange
- **Solid** (3.00–3.99) — ochre
- **Strong** (4.00–5.00) — green

**Spread.** The range (max − min) of individual respondent scores within a single capability. High spread means the team disagrees about that capability — itself a finding.

**Focus areas.** The top-5 weakest capabilities at the team level, used to anchor the action items section of the report. Recomputed per active filter.

---

## Product / role terms

**Assessment.** A single instance of the diagnostic for a given client organization. Has a status (collecting / closed / archived), a deadline, a list of allowed departments, and a set of respondents.

**Respondent.** An individual who has been issued an access code and may take the assessment. One respondent = one access code = one set of responses.

**Admin.** A Forefront consultant with login access to the application. Can create and manage assessments.

**Super admin.** The single privileged admin (the first/seeded admin). Has all admin powers plus the ability to manage other admins and configure the AI provider. Role is permanent in v1 — manual DB intervention required to transfer.

**Access code.** A 6-character alphanumeric string (excluding `0`, `O`, `1`, `I`, `L`) that authenticates one respondent for one assessment. One code per respondent — never shared or reused.

**Collection window.** The time period between assessment creation and deadline during which respondents can submit. After the deadline, the assessment auto-closes.

**Closure.** The transition from `collecting` to `closed` status. Triggered automatically by the deadline cron, or manually by an admin requesting AI report generation before the deadline (with confirmation).

---

## Reporting terms

**Numerical report.** The quantitative aggregation view: pillar scores, capability scores, spread, focus areas, anonymized individual responses. Available **anytime** during collection (with "Preliminary" banner) and after closure.

**AI report.** The AI-generated content layer: an executive summary paragraph plus AI-adapted action items for the top-5 focus areas. Generatable anytime; pre-closure generations are watermarked as drafts.

**Filter.** A query applied to a results view that restricts the dataset to respondents matching certain criteria — by department, level, tenure, or a combination. The default view is unfiltered (company-wide).

**Compound filter.** Two or more filter dimensions applied together (e.g., Sales × Manager × 4–7y).

**Filter signature.** A deterministic stringified hash of the active filter dictionary. Used as a cache key. Two requests with identical filter combinations resolve to the same signature.

**Comparison view.** A v1 feature that renders two filtered views side-by-side, quantitative-only. Used when an admin wants to compare two segments (e.g., "Sales vs. Operations" or "Managers vs. ICs").

**Cached report.** A previously-generated AI report stored in the database, keyed by `(assessment_id, filter_signature)`. When a request comes in for the same combination, the cached version is returned. Each generation overwrites the previous cached entry for that combination.

**Watermark.** Visual indicator (text + styling) that the report was generated before the assessment closed. Includes a sample-size note ("Based on N of M respondents").

---

## Privacy / anonymity terms

**Anonymity floor.** The minimum number of respondents (≥3) required for any view to render. Below this, the view is replaced with a lock message. Applies to company-wide and filtered views alike.

**Anonymized individual.** A row in the per-respondent results table representing one respondent without their name — labeled by letter (Respondent A, B, C…) and demographic columns. Even letters never re-identify across views — assignment is consistent within a single results page render but not persistent.

**Audit log.** Chronological record of admin and respondent lifecycle events. Includes admin actions (create, edit, delete, generate, config change, admin management) and respondent submission events (started, submitted). Does **not** log individual answer values.

**Privacy disclosure.** The line shown on the respondent welcome screen: *"Your responses are anonymized and aggregated. The team report uses AI assistance to interpret patterns."*

---

## Technical-adjacent terms surfacing in product copy

**Draft.** A status applied to AI reports generated before assessment closure. Visually marked, sample-size disclaimer included, regenerable to "final" after closure.

**Final.** A status applied to AI reports generated after assessment closure. Replaces any pre-existing draft for the same filter signature.

**Bootstrap (AI provider).** The state where AI provider configuration has not yet been saved by the super admin to the database. The application falls back to environment variable values, with a banner directing the super admin to save settings.

**Test connection.** A button on the AI settings page that sends a tiny ping to the configured provider with the saved API key. Returns OK if reachable + authorized; error message otherwise.

---

## Disambiguation notes

- **"Score"** without qualifier means a numerical value 1.00–5.00. Always 2 decimal places in display.
- **"Rating"** is what a respondent gives a single statement (1–5).
- **"Response"** is one respondent's complete submission (30 ratings).
- **"Result"** is anything the admin sees on the results page — numerical or AI.
- **"Report"** is a generated artifact (AI-generated content + PDF export). Not the same as "result."
- **"Assessment"** refers to the engagement instance (one per client). **"Diagnostic"** is sometimes used as a synonym in user-facing copy but the canonical term is "assessment."

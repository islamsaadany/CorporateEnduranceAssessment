# 15 — Report Generation and Caching

**Version:** 0.1
**Last updated:** 2026-04-28

---

> The lifecycle of an AI-generated report — when it can be generated, how it's cached, when it invalidates, and how it interacts with PDF export. The goal: predictable behavior, no wasted API tokens, no stale content shown without warning.

---

## 1. Report generation states

| State | Meaning |
|-------|---------|
| **Not generated** | No cached report exists for this `(assessment, filter)` combination. The report shows numerical data only with static interpretation strings + baseline action items. |
| **Draft** | A cached report exists, but it was generated while assessment status was `collecting`. Visually watermarked. |
| **Final** | A cached report exists, and it was generated after assessment closure (status = `closed` at generation time). |
| **Stale** | A previously-cached report exists, but underlying respondent data has changed since generation. Shown with a warning banner; admin must explicitly regenerate to update. |

---

## 2. When can the admin generate?

**Anytime** — including during collection. The "Generate AI report" button is always enabled (provided AI is configured).

| Assessment status at click | Outcome |
|----------------------------|---------|
| `collecting` | Generates a **draft**. Watermark applied. Sample-size disclaimer in the AI executive summary. |
| `closed` (no prior cache for this filter) | Generates a **final**. |
| `closed` (prior **draft** cached for this filter) | Generates a **final**, **overwrites** the draft. |
| `closed` (prior **final** cached for this filter) | "Regenerate" — generates a new **final**, overwrites the previous one. Confirmation modal shown. |

**No "close-to-generate" prompt.** The earlier design considered forcing closure when AI was generated pre-deadline; this was simplified — drafts are valid output, and closure happens automatically at the deadline.

---

## 3. Cache structure

### 3.1 Schema (conceptual)

```
generated_reports
  id                  uuid PK
  assessment_id       uuid FK → assessments
  filter_signature    text       -- sha256 hash of filter dict
  filter_description  text       -- human-readable, for debug + display
  status_at_generation enum      -- 'collecting' or 'closed'
  ai_provider         text       -- 'gemini', 'claude', 'openai' at time of generation
  ai_model            text       -- specific model name used
  payload_json        jsonb      -- the full {executive_summary, action_items} object
  baseline_used       boolean    -- true if AI failed and baseline fallback was used
  generated_by_admin  uuid FK → admins
  generated_at        timestamptz
  invalidated_at      timestamptz?  -- set when underlying data changes; UI shows stale warning until regenerate

  unique(assessment_id, filter_signature, invalidated_at IS NULL)
  -- only one *active* cache row per (assessment, filter)
  -- old invalidated rows are kept for audit but not served
```

### 3.2 Why JSON blob, not relational

The AI payload is a small object (~1–2 KB) and rendered as-is. Decomposing it into per-action-item rows would invite drift between schema versions of the prompt — keep it opaque.

### 3.3 Why keep invalidated rows

For traceability — admins can see in the audit log "AI report regenerated at Apr 25 14:32 (previous version generated Apr 24 09:15 invalidated by edit to Respondent C)." The previous payload is preserved for transparency.

---

## 4. Generation flow

```
1. Admin clicks "Generate AI report" on results page
2. Server validates:
   - AI provider configured (or env-var fallback present)
   - Filter has ≥3 respondents (otherwise button is disabled)
3. Server compiles inputs:
   - Aggregated scores per pillar/capability for filter (band names only)
   - Spread per capability
   - Top-5 focus areas
   - Anonymized individuals with demographics + per-capability bands
   - Filter description string
   - Sample size (filtered N / total N)
   - Baseline action items for the focus-area capabilities
4. Server invokes AI provider via abstraction layer:
   - Gemini / Claude / OpenAI based on settings
   - System prompt + user prompt from `14_ai_prompts.md`
   - JSON-formatted output requested where supported
5. Validation per `14_ai_prompts.md` section 4
6. On success:
   - Mark any previous cache row for this (assessment, filter) as invalidated
   - Insert new cache row with status_at_generation, payload, provider/model
   - Audit log: `event_type: "ai_report_generated"` with filter signature, status, draft/final
   - Return to client; UI re-renders with new content
7. On failure (after retry):
   - Do NOT cache the fallback (per `14_ai_prompts.md`)
   - Audit log: `event_type: "ai_generation_failed"` with reason
   - UI shows "Could not generate. Showing baseline content. [Retry]"
```

---

## 5. Cache invalidation

Cache rows are invalidated (marked stale, kept for audit) when:

| Trigger | Behavior |
|---------|----------|
| Admin edits a respondent's answer (post-closure) | All cache rows for this `assessment_id` invalidate. **Warning modal before edit:** *"Editing this answer will invalidate the existing AI report ({N} cached versions). Regenerate to refresh. Continue?"* |
| Admin edits a respondent's demographics (post-closure) | Same — all cache rows for this `assessment_id` invalidate, with warning |
| Admin manually clicks "Regenerate" on a specific filter | Only that filter's cache row invalidates and is replaced |
| Assessment is reopened from closed (admin extends deadline post-closure) | **Not in v1** — once closed, an assessment stays closed |
| AI provider/model is changed in settings | Cache rows are NOT auto-invalidated. They retain the provider info. The next regeneration uses the new provider. |
| Baseline action items in code are edited | Cache rows are NOT invalidated (per `04_recommendations.md`). |
| Respondent answers a question (during collection) | **Not invalidated automatically.** Drafts get stale during collection; admin can regenerate to refresh. The "Draft" banner already signals this. |

### 5.1 The bulk-invalidation warning copy

When a single edit invalidates multiple cached reports (admin had generated reports for several filters):

> *"Editing this {answer / demographic} will invalidate **{N} cached AI reports** for this assessment (across multiple filter views). The reports will remain visible with a 'Stale' warning banner until regenerated. Regenerating uses API tokens.*
>
> *Continue with the edit?"*
>
> [Cancel] [Continue Edit]

### 5.2 Stale warning UI

When a stale (invalidated) cache row is shown:

> ⚠ *"This AI report was generated before recent edits to respondent data on Apr 25, 11:14. Regenerate to refresh."* [Regenerate]

The stale report is still rendered (so admin can see what changed) — it doesn't disappear, just gets the warning.

---

## 6. PDF export

PDFs are generated **on demand** at click of "Export PDF". They are not cached — each click re-renders.

### 6.1 PDF source

- **AI sections** (executive summary, action items): pulled from the cached `generated_reports` row matching the active filter. If no row exists, baseline is used. If a stale row exists, **stale content is used by default** with a footer note: *"AI content based on data as of {generated_at}; assessment data has changed since."* Admin can regenerate first if they want a fresh PDF.
- **Numerical sections**: always recomputed from current respondent data (live).
- **Filter banner**: from the URL query / current filter state.

### 6.2 Why no PDF cache

PDF rendering is fast (~1–2s) and the input data can change. Re-rendering on demand keeps the PDF always-current relative to the cached AI report. Caching PDFs would add another invalidation surface.

### 6.3 PDF page-break rules

Per `05_report_structure.md` section 8:

- Each pillar's column from Section 2 starts on a new page (3 pillar pages)
- Section headers don't orphan: if a header would land within 80pt of page bottom, push to next page
- The anonymized individuals matrix never splits a row across pages
- Page numbers and footer on every page

### 6.4 PDF naming

Default filename: `Endurance_Assessment_{ClientName}_{FilterSlug}_{Date}.pdf`

Examples:
- `Endurance_Assessment_AcmeCorp_CompanyWide_2026-04-30.pdf`
- `Endurance_Assessment_AcmeCorp_Sales-Manager_2026-04-30.pdf`

---

## 7. Audit log entries from this surface

| Event | When |
|-------|------|
| `ai_report_generated` | Successful AI generation. Includes: filter_signature, filter_description, draft/final, provider, model, generated_by_admin |
| `ai_generation_failed` | After retry, validation failed. Includes: reason, attempted_count |
| `ai_fallback_used` | Generation failed, baseline fallback served. Includes: reason |
| `ai_report_invalidated` | Cache row marked stale. Includes: invalidation_reason (edit type), affected_rows |
| `pdf_exported` | Admin exported a PDF. Includes: filter_signature, used_ai_or_baseline |
| `ai_report_regenerated` | Admin clicked "Regenerate" on an existing cache row. Includes: previous_generated_at, new_generated_at |

See `11_anonymity_and_privacy.md` for what's NOT logged (individual answer values).

---

## 8. Provider configuration surface

The admin configures the AI provider in `/admin/settings/ai` (super admin only). Configuration is stored in a `settings` table with API key encrypted at rest (AES-256, master key in env var).

### 8.1 Settings page fields

- **Provider** dropdown: Gemini · Claude · OpenAI
- **API Key** masked input (shows last 4 chars when set)
- **Test Connection** button — sends a tiny ping to the provider, returns OK or specific error
- **Save** button (disabled until both fields valid)

### 8.2 Bootstrap fallback

If no settings row exists yet, the application reads `GEMINI_API_KEY` (or equivalent for the provider named in env) from environment variables. When this is the active source, a **persistent banner** on the settings page:

> *"Using bootstrap configuration from environment variables. Save settings here to persist in the database and override the env var."*

After the super admin saves to DB, the env var is ignored.

### 8.3 What the admin doesn't configure

- Specific model variant (hardcoded per provider — see `14_ai_prompts.md` section 8)
- Temperature, max tokens, system prompt — all in code
- Per-assessment overrides — there's one global AI config

---

## 9. Cost & usage tracking (informational)

Not in v1, but tracked here as v2 candidates:

- Per-assessment token usage display
- Per-month API spend rollup
- Per-admin generation count
- Forecasting next month's spend

In v1, the audit log captures every `ai_report_generated` event, which is a sufficient breadcrumb to reconstruct usage if needed.

---

## 10. Glossary cross-reference

For terminology used here, see `13_glossary.md`:
- AI report, Cached report, Filter signature, Watermark, Draft, Final, Bootstrap, Test connection, Audit log

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 2026-04-28 | Initial. Defines generation states (Not generated / Draft / Final / Stale), cache schema, generation flow, invalidation triggers (with warning), PDF rules (no PDF cache), provider settings page, audit log events. |

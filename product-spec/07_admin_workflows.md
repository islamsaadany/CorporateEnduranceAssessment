# 07 — Admin Workflows

**Version:** 0.1
**Last updated:** 2026-04-28

---

> Step-by-step flows for everything an admin does in the application: create an assessment, distribute codes, monitor responses, generate reports, edit submissions, manage other admins (super admin only).

---

## 1. Roles

Two admin roles, with the same login surface.

| Role | Capabilities |
|------|--------------|
| **Super admin** | Everything below + manage admins + AI provider configuration |
| **Admin** | Create / monitor / view / edit assessments; generate reports; export PDFs |

The super admin is the first/seeded admin and is permanent in v1. There is exactly one super admin per deployment.

See `11_anonymity_and_privacy.md` for what neither role can see (individual respondent names in results, individual answer values in audit log).

---

## 2. Login

### 2.1 Surface

- `/admin/login` — email + password form, "Sign in" button. No signup link in v1.

### 2.2 Authentication

- NextAuth credentials provider, password hashed with bcrypt
- Session cookie, secure + HttpOnly + SameSite=Lax
- No "remember me" checkbox in v1 — session lasts for the default NextAuth duration (~30 days idle)
- **No password reset flow in v1** — manual DB intervention if an admin loses their password

### 2.3 Failure states

- Invalid credentials: generic *"Invalid email or password"* (no enumeration of which is wrong)
- Rate limit: 5 failed attempts per IP per 15 minutes before temporary lockout
- Locked account (super admin can deactivate other admins): *"This account is inactive. Contact your administrator."*

---

## 3. Flow A — Create an assessment

### 3.1 Steps

1. Admin clicks "New Assessment" on `/admin/dashboard`
2. Lands on `/admin/assessments/new`
3. Fills in the form:
   - **Client organization name** (required) — e.g., "Acme Corp"
   - **Description** (optional, internal) — admin's notes
   - **Deadline** (required) — date + time picker, must be in the future
   - **Departments** (required) — admin types each department name; can add as many as needed. These become the dropdown options for respondents.
   - **Number of respondents** (required) — admin specifies how many codes to generate. (No need to enter respondent names/emails — codes are distributed manually outside the app.)
4. Clicks "Create Assessment"
5. System:
   - Creates the assessment row
   - Creates the department list rows (linked to assessment)
   - Generates N unique 6-character codes (per `10_code_distribution.md`)
   - Returns admin to `/admin/assessments/[id]` detail page
6. Admin sees the codes table (one row per code) with a Copy button per row
7. Admin **manually distributes** the codes to the intended respondents (Slack, email outside the app, in person — the application sends nothing)

### 3.2 What's NOT collected at create time

- Respondent names / emails (collected by the respondent themselves at code-entry time, optionally — see `09_demographics.md`)
- Respondent levels / tenures (also collected by the respondent)
- Per-respondent codes pre-assigned to specific people (codes are anonymous slots — admin tracks who-got-which outside the app)

### 3.3 Edit during collection

The admin can:
- **Add more codes** — if more respondents end up needing access than originally planned. Each add generates new unique codes.
- **Add more departments** — extend the dropdown for new respondents.
- **Remove a department** — only allowed if no respondent has used it yet. UI shows count: "Sales (used by 4 respondents — cannot remove)" vs. "Tech (unused — [Remove])"
- **Extend the deadline** — only forward in time. Audit-logged.
- **Revoke a code** — invalidates a specific code so it can no longer be used. Useful if a code was accidentally exposed. Audit-logged.

The admin **cannot** during collection:
- Reduce the deadline (only extend)
- Edit any respondent's answers (post-closure only — see Flow E)
- View AI report content for a closed view (must generate first)

---

## 4. Flow B — Monitor responses (during collection)

### 4.1 Surface

`/admin/assessments/[id]` — the assessment detail page.

### 4.2 What's shown

- **Header**: client name, status (Collecting), deadline countdown
- **Key stats**: "7 of 10 respondents completed" with a progress bar
- **Codes table**: one row per generated code, showing:
  - Code value (with Copy button)
  - Status: `Not Started` / `In Progress` / `Completed`
  - Started timestamp (if applicable)
  - Submitted timestamp (if applicable)
  - Demographics (if respondent has progressed past demographics screen): department, level, tenure
  - Optional name (if respondent provided one)
- **Actions panel**: Add codes · Add departments · Edit departments · Extend deadline
- **Numerical report shortcut**: "View live results →" goes to `/admin/assessments/[id]/results` — even during collection, the numerical report is viewable with the Preliminary banner

### 4.3 Live updates

- Page does not auto-refresh — admin reloads to see new submissions (kept simple in v1)
- v2 candidate: WebSocket or polling for live status updates

---

## 5. Flow C — View results (live or post-closure)

### 5.1 Surface

`/admin/assessments/[id]/results`

### 5.2 Content

Per `05_report_structure.md`. Banners:
- Filter banner (always)
- Preliminary banner (during collection)
- Draft AI banner (when cached AI report is from pre-closure)

### 5.3 Actions

- Generate AI report (or Regenerate)
- Export PDF
- Change filter
- Compare segments
- Activity log (audit drawer)
- Edit responses (closed only — see Flow E)

### 5.4 What can change between visits

- New respondents complete their assessment → numerical aggregates update
- Admin edits a respondent post-closure → cached AI reports go stale (with stale-warning banner)
- Admin generates a new AI report for a different filter → new cached report appears

---

## 6. Flow D — Generate AI report

### 6.1 Trigger

"Generate AI report" button on `/admin/assessments/[id]/results`. Button is disabled when:
- AI provider is unconfigured (and no env-var bootstrap)
- Filter has <3 respondents (anonymity floor)

### 6.2 Steps

1. Admin clicks button
2. Confirmation modal:
   - **During collection**: *"This will generate a draft AI report based on {N} of {total} respondents so far. The draft will be marked as preliminary. You can regenerate after closure for the final version. Generate?"* [Cancel] [Generate Draft]
   - **Post-closure (no prior cache)**: skip modal, proceed directly
   - **Post-closure (final cached)**: *"Regenerate this AI report? The current version will be replaced. This uses API tokens."* [Cancel] [Regenerate]
3. Server invokes the AI generation flow (per `15_report_generation_and_caching.md` section 4)
4. Loading state: button changes to "Generating…" (~10–20s typical)
5. On success: report renders with new content, audit log captures event
6. On failure: error message + retry button; baseline content shown

### 6.3 Special: pre-closure regeneration

If admin generates a draft, more respondents complete, and admin wants an updated draft:
- Click "Regenerate" → no closure forced
- Replaces previous draft with new draft
- Audit-logged

### 6.4 Special: closure forces no automatic regeneration

When the deadline passes and the cron flips status to closed:
- Existing cached drafts are NOT auto-promoted to final
- Existing cached drafts are NOT auto-regenerated
- Admin must explicitly click "Regenerate" to produce the final
- The Draft banner persists until explicit regeneration

---

## 7. Flow E — Edit a respondent's submission (post-closure only)

### 7.1 When allowed

- Assessment status must be `closed`
- Admin must be authenticated

### 7.2 Surface

On the results page, in the anonymized individuals tab, each row has an "Edit" action visible only post-closure. Clicking opens an edit drawer.

> Privacy note: the editing surface shows the respondent **identified internally** to the admin (by code, optionally by name they provided) — the anonymization is for the report rendering, not for the edit surface. The admin needs to know who they're editing.

### 7.3 What can be edited

- Demographics: department · level · tenure · name (if provided)
- Individual answers: any of the 30 ratings, 1–5

### 7.4 Pre-edit warning

Before any edit save:

> *"Editing this {answer / demographic} will invalidate **{N} cached AI reports** for this assessment. The reports will remain visible with a 'Stale' warning until regenerated. Continue?"*
>
> [Cancel] [Continue Edit]

If no AI reports are cached, modal text is shorter:

> *"Confirm edit?"*
>
> [Cancel] [Save]

### 7.5 Audit log entry

Every edit captures:
- `event_type: "respondent_demographic_edited"` or `"respondent_answer_edited"`
- `assessment_id`, `respondent_id` (internal — not exposed in admin UI in audit log)
- `field_changed`, `old_value`, `new_value`
- `edited_by_admin`, `edited_at`

The audit log entry is visible in the Activity tab; old/new values are shown for traceability.

### 7.6 What edit does NOT do

- Does NOT auto-regenerate AI reports (admin chooses when)
- Does NOT notify respondent (no emails)
- Does NOT permit edits during collection (collection is respondent-controlled)

---

## 8. Flow F — Export PDF

### 8.1 Trigger

"Export PDF" button on the results page.

### 8.2 Steps

1. Admin clicks button
2. Loading state: *"Generating PDF…"* (~1–3s)
3. Browser downloads file with default name: `Endurance_Assessment_{ClientName}_{FilterSlug}_{Date}.pdf`
4. Audit log captures: `pdf_exported` with filter signature

### 8.3 PDF content

Per `15_report_generation_and_caching.md` section 6 — uses cached AI content if present (with stale warning if applicable), baseline otherwise; numerical sections always live.

---

## 9. Flow G — Compare segments

### 9.1 Trigger

"Compare segments" button on the results page.

### 9.2 Steps

1. Admin clicks button → comparison view opens
2. Admin picks Filter A (left) and Filter B (right)
3. Each filter independently checked against ≥3 anonymity floor; if either fails, that side shows the lock card
4. Side-by-side quantitative comparison renders (per `06_report_filters_and_segments.md` section 6)
5. Admin can adjust either filter; the other remains
6. Admin can exit back to the single-filter report view (Filter A becomes active)

### 9.3 Limitations

- v1 is quantitative only — no comparison of AI narratives or action items
- v1 does not allow exporting the comparison view as PDF (regular PDF only)

---

## 10. Flow H — Manage admins (super admin only)

### 10.1 Surface

`/admin/users` (or `/admin/admins`) — accessible only to the super admin.

### 10.2 List view

Table of admins:
- Name · Email · Role (Super Admin / Admin) · Active (yes/no) · Created at · Last login

### 10.3 Add admin

"Add admin" button → form:
- Full name (required)
- Email (required, unique)
- Temporary password (required) — admin must change on first login (v2 candidate)
- Role: defaults to "Admin"; the super admin role is reserved for the seeded admin

Submit creates the admin row. The new admin can log in with the temp password.

### 10.4 Deactivate / reactivate an admin

Toggle switch on each row. Deactivated admins cannot log in but their assessment data remains.

### 10.5 Cannot

- Delete the super admin row
- Promote another admin to super admin (v1; requires manual DB intervention)
- Demote oneself if super admin

---

## 11. Flow I — Configure AI provider (super admin only)

### 11.1 Surface

`/admin/settings/ai` — super admin only.

### 11.2 Steps

Per `15_report_generation_and_caching.md` section 8:
1. Pick provider (Gemini / Claude / OpenAI)
2. Enter API key (masked input)
3. Click "Test Connection" — server pings provider, reports OK or specific error
4. Click "Save"
5. Settings stored in DB with API key encrypted at rest
6. Audit log captures: `ai_provider_changed` with from-provider and to-provider

### 11.3 Bootstrap banner

When no settings row exists, a persistent banner directs the super admin to save the config (env var fallback is in use).

---

## 12. Flow J — View Activity / Audit log

### 12.1 Per-assessment audit log

Activity tab on `/admin/assessments/[id]` — shows all events for this assessment:
- Created
- Codes added / removed / revoked
- Department added / removed
- Deadline extended
- Respondent started / submitted (timestamps; no answer values)
- Respondent answer edited (post-closure only — old/new values shown)
- Respondent demographics edited (post-closure only — old/new values shown)
- AI report generated (filter signature, draft/final, provider/model)
- AI report regenerated (with previous_generated_at)
- AI report invalidated (reason)
- AI fallback used (reason)
- PDF exported

### 12.2 Global audit log (super admin only)

`/admin/audit` — full activity across all assessments + admin-management events:
- Admin added / deactivated
- AI provider changed
- (everything from per-assessment logs, aggregated)

### 12.3 What's NOT logged

- Individual answer values (except in respondent-answer-edited events, where it's the only way to show what changed)
- API keys or other sensitive configuration values
- Respondent code values (logged by reference, not value)

---

## 13. Flow K — Archive an assessment (v2 candidate)

Not in v1. v2 will allow super admin to archive closed assessments to keep the dashboard clean.

---

## 14. Glossary cross-reference

For terminology used here, see `13_glossary.md`:
- Super admin, Admin, Assessment, Respondent, Access code, Collection window, Closure, Audit log

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 2026-04-28 | Initial. Captures admin login (no password reset in v1), assessment lifecycle (create → monitor → results → edit), AI report generation (anytime, with draft/final), comparison view, manage-admins (super admin only), AI settings, audit log surfacing. |

# 10 — Code Generation and Distribution

**Version:** 0.1
**Last updated:** 2026-04-28

---

> The application generates per-respondent access codes but does not distribute them. Distribution is a manual responsibility of the admin — Slack, email outside the app, in-person, however the admin chooses. This file specifies the code format, how the admin sees and copies codes, and what guardrails exist around distribution.

---

## 1. Code format

### 1.1 Length and character set

- **6 characters**, alphanumeric, **uppercase only**
- **Excluded ambiguous characters**:
  - `0` (zero), `O` (letter O)
  - `1` (one), `I` (letter I), `L` (letter L)
- **Valid character set** (32 characters): `23456789ABCDEFGHJKMNPQRSTUVWXYZ`
- Examples: `A7K2PQ`, `R3MN98`, `XQ24KH`

### 1.2 Possible values

`32 ^ 6 = ~1,073,741,824` — collisions are vanishingly rare but the system always checks for uniqueness on insert.

### 1.3 Why these constraints

- **Short enough** to type comfortably from memory if needed (6 chars > 8-char codes)
- **No ambiguous characters** — codes will be transcribed by humans (admin → respondent → respondent's address bar)
- **Uppercase only** — visually distinctive, normalized for input
- **No hyphens or other separators** — keeps the surface clean and the validation simple

### 1.4 Case-insensitive matching

Respondents type the code into the `/take` form. Input is uppercased before lookup, so `a7k2pq` and `A7K2PQ` both match the same code. The canonical form stored in DB is uppercase.

---

## 2. Code generation

### 2.1 When codes are generated

- **At assessment creation**, when admin specifies "number of respondents = N", the system generates N unique codes.
- **On admin demand**, when admin clicks "Add codes" on an assessment detail page during collection. Generates additional codes; does not regenerate existing ones.

### 2.2 Generation algorithm

```pseudocode
function generateAccessCode():
  chars = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
  do:
    code = ""
    for i in 0..6:
      code += chars[random_int(0, 31)]
    if not exists in db: return code
  // collision retry — vanishingly rare but safe
```

Collision check uses a unique index on `respondents.access_code`. If insert fails on conflict, regenerate and retry.

### 2.3 Codes are anonymous slots

A generated code is **not pre-assigned** to a specific respondent name in the application. The code is a slot; the demographics + optional name come from the respondent themselves at code-entry time.

The admin's tracking of "who got which code" is **outside the app** — typically a spreadsheet or notes alongside their distribution medium (Slack, email outside the app, in-person handoff).

This intentional separation:
- Keeps the application surface simple (no respondent management UI)
- Reinforces anonymity (the system doesn't know who's who)
- Lets admins distribute however they prefer

---

## 3. Admin's view of codes

### 3.1 Codes table on assessment detail

`/admin/assessments/[id]` shows a table of all generated codes for the assessment.

Per-row columns:
- **Code value** with a Copy button
- **Status**: `Not Started` / `In Progress` / `Completed` / `Revoked`
- **Started at** (if applicable)
- **Submitted at** (if applicable)
- **Demographics** (if respondent has progressed past the demographics screen): department · level · tenure
- **Optional name** (if respondent provided one)
- **Per-row actions**: Revoke (if not yet started), View answers (post-closure only)

### 3.2 Bulk copy

Above the table, a "Copy all codes" button copies all codes to clipboard, one per line, for easy paste into a spreadsheet.

### 3.3 Bulk add

"Add codes" button generates additional codes (admin specifies count). New rows appear at the top of the table, sorted by created_at descending.

### 3.4 Codes never sent by app

There is no "send invitation email" action anywhere in the admin UI. The only mechanism to deliver a code to a respondent is for the admin to copy it and share it through whatever channel they choose.

---

## 4. Code revocation

### 4.1 When admin can revoke

A code can be revoked if:
- Status is `Not Started` (respondent hasn't entered it) — and assessment is `collecting`

A code **cannot** be revoked if:
- Respondent has already started or submitted (their data is preserved as-is; revoking would orphan responses)
- Assessment is `closed`

### 4.2 Effect of revocation

- Code status is set to `revoked`
- Respondent attempting to use it gets: *"This code is no longer active. Please contact the administrator."*
- Audit log: `code_revoked` with code_id and admin_id

### 4.3 Re-generation after revoke

Revoked codes are NOT replaced automatically. If admin needs to invite someone else, they click "Add codes" to generate a fresh one.

---

## 5. Code lifecycle states

| State | Meaning |
|-------|---------|
| `Not Started` | Code generated; respondent hasn't entered it yet |
| `In Progress` | Respondent has entered code, completed demographics, currently answering questions |
| `Completed` | Respondent submitted all 30 answers |
| `Revoked` | Admin invalidated this code; cannot be used |

Transitions:
- `Not Started → In Progress` — respondent enters code + completes demographics
- `In Progress → Completed` — respondent submits review screen
- `Not Started → Revoked` — admin clicks Revoke
- (No transition out of `Completed` or `Revoked` in v1)

---

## 6. Admin's distribution responsibility

The admin is responsible for:

1. **Securely sharing codes** with intended respondents (e.g., 1:1 Slack DM, 1:1 email outside the app, printed handoff)
2. **Keeping a private record** of which code was given to which person (outside the app)
3. **Not sharing codes broadly** — each code = one slot, sharing it widely could result in unintended people taking the assessment
4. **Revoking codes** if a code was accidentally exposed to an unintended recipient

The application does not enforce any of these — it provides codes, surfaces their status, and trusts the admin to distribute responsibly.

---

## 7. What the application does NOT do

- ❌ Send invitation emails (no email of any kind)
- ❌ Send reminder emails to non-responders
- ❌ Send a "results are ready" email to the admin at closure
- ❌ Track *who* (named individual) was given each code
- ❌ Validate that the code was given to the "right" person — the system has no concept of intended recipient
- ❌ Provide a "share via Slack / email" button — distribution channel is the admin's choice
- ❌ Generate QR codes or links (the link is just `/take?code=A7K2PQ` — admin can construct it manually if useful)

---

## 8. Deep-link convenience

The app accepts a URL parameter that pre-fills the code field on `/take`:

```
/take?code=A7K2PQ
```

The admin can manually construct this URL and share it (e.g., in a Slack message: "Click here to start: https://...vercel.app/take?code=A7K2PQ").

Behavior:
- Pre-fills the input field with `A7K2PQ`
- Respondent must still click "Continue" to proceed (no auto-submit — soft confirmation)
- If pre-filled code is invalid, the standard error message displays after click

---

## 9. Glossary cross-reference

For terminology used here, see `13_glossary.md`:
- Access code, Respondent, Collection window, Closure

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 2026-04-28 | Initial. Defines 6-char alphanumeric format (no 0/O/1/I/L), generation algorithm with collision retry, admin-table surface for codes, manual distribution responsibility, deep-link convenience. Confirms application sends no emails. |

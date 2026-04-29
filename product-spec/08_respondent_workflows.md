# 08 — Respondent Workflows

**Version:** 0.1
**Last updated:** 2026-04-28

---

> Step-by-step flow for the respondent — code entry, demographics, the 30 questions, review, submit, confirmation. Designed to take 12–15 minutes end-to-end without rushing.

---

## 1. Surfaces (one route, multiple phases)

The respondent flow lives entirely under `/take/*`. Each step is its own URL so refresh-resume works cleanly.

| Route | Phase | Purpose |
|-------|-------|---------|
| `/take` | Code entry | Validate access code |
| `/take/welcome` | Welcome | Frame the assessment + privacy disclosure |
| `/take/demographics` | Demographics | Collect department / level / tenure / optional name |
| `/take/question/[1..30]` | Question flow | One Likert question per page, auto-advance |
| `/take/review` | Review | Show all 30 answers, allow edits, then submit |
| `/take/done` | Confirmation | Terminal screen — thank you message |

---

## 2. Phase 1 — Code entry (`/take`)

### 2.1 Layout

- Forefront wordmark top-center
- Card centered on page with:
  - Eyebrow: `THE ENDURANCE ASSESSMENT` (ochre, ALL CAPS)
  - Headline: *"Enter your access code to begin."*
  - Single text input: 6 characters, monospace, auto-uppercase, placeholder *"e.g., A7K2PQ"*
  - Helper text below input: *"Your code was provided by your assessment administrator."*
  - Primary button: *"Continue"*
- Footer: *"Forefront Consulting · The Corporate Endurance Model"*

### 2.2 Code validation

On submit (button click or Enter):

1. Server checks code against database
2. Code is matched **case-insensitively** (we uppercase before lookup) — convenience
3. Validation result determines next step:

| Outcome | Behavior |
|---------|----------|
| Valid + assessment is `collecting` + respondent has not submitted | Proceed to `/take/welcome` (or to the resume point if mid-progress) |
| Valid + assessment is `closed` | Show: *"This assessment has closed. Please contact the administrator if you believe this is in error."* |
| Valid + respondent has already submitted | Show: *"You have already submitted this assessment. Thank you."* |
| Valid + code revoked | Show: *"This code is no longer active. Please contact the administrator."* |
| Invalid code | Show: *"This code wasn't recognized. Please check and try again."* (no enumeration of *why* — same message for typos, expired, doesn't exist) |

### 2.3 Rate limiting

- Max 5 validation attempts per IP per minute
- After 5: *"Too many attempts. Try again in a minute."*
- Audit log captures repeated failures (suspicious activity signal)

### 2.4 Deep link from URL parameter

Optional convenience: `/take?code=A7K2PQ` pre-fills the input. Respondent must still click "Continue" — this is a soft confirmation, not auto-submission.

---

## 3. Phase 2 — Welcome (`/take/welcome`)

### 3.1 Layout

- Forefront wordmark top-center
- Centered content card:
  - Eyebrow: `[CLIENT NAME]` in ochre — e.g., `ACME CORP`
  - Headline (Georgia bold, ~32px): *"You've been invited to assess this organization's endurance."*
  - Three-pillar mini-explainer: 3 columns, one per pillar, each with verb pair + one-line definition
    - **Agility** — Sense and move. *Detect change early and respond with speed.*
    - **Toughness** — Absorb and hold. *Withstand shocks without breaking or losing control.*
    - **Resilience** — Recover and renew. *Rebuild and emerge stronger from disruption.*
  - Scale explainer: 1–5 Likert with labels — see `02_questions.md` section 3
  - **Crucial framing**, in `dark-blue` bold, larger:
    > *"Rate your organization — not yourself. Every question asks about how the organization operates today."*
  - Time estimate: *"Takes about 12–15 minutes. Your progress is saved automatically — you can close and resume from this device."*
  - **Privacy disclosure**, smaller, in `grey-text`:
    > *"Your responses are anonymized and aggregated. The team report uses AI assistance to interpret patterns. Your name (if provided) is never shared with the AI."*
  - Primary button: *"Begin Assessment"*

### 3.2 Behavior

- Clicking "Begin" advances to `/take/demographics`
- If respondent has already started (resume case), the welcome screen is skipped — see section 8 (Resume)

---

## 4. Phase 3 — Demographics (`/take/demographics`)

### 4.1 Layout

Centered form card:

- Eyebrow: `STEP 1 OF 3 · ABOUT YOU`
- Headline: *"A few quick details before we start."*
- Form fields:
  - **Full name** (optional, text input) — placeholder: *"Optional"*
    - Helper text: *"Your name is never shown to anyone reviewing the report. It's stored only for the administrator's reference."*
  - **Department** (required, dropdown of admin-defined values) — placeholder: *"Select…"*
    - Helper text: *"Choose the department that best fits your role today."*
  - **Level** (required, dropdown — fixed 5 options): Executive · Senior Leader · Manager · Team Lead · Individual Contributor
  - **Years at the organization** (required, dropdown — banded): <1 · 1–3 · 4–7 · 8–15 · 15+
- Primary button: *"Continue to questions"* (disabled until required fields filled)

### 4.2 Validation

- Department must be a value from the assessment's department list (server-side check in case of stale UI)
- Level must be one of the 5 fixed values
- Tenure must be one of the 5 fixed bands
- Name has no validation other than length cap (e.g., 200 chars)

### 4.3 Save

On click:
1. Server saves demographics to the respondent row
2. Status moves to `in_progress`
3. localStorage seeds resume state (see section 8)
4. Advances to `/take/question/1`

---

## 5. Phase 4 — Question flow (`/take/question/[1..30]`)

### 5.1 Per-question layout

- **Top bar**: progress indicator
  - Bar fills proportionally to (current question / 30)
  - Text: *"Question 7 of 30"*
- **Eyebrow**: pillar + capability — `AGILITY · DECISION VELOCITY`
- **Statement**: large Georgia serif, centered, ~24–28px — the visual focus of the page
- **Likert scale**: 5 horizontal tiles, labeled — *"1 · Strongly Disagree"* through *"5 · Strongly Agree"*
  - Tiles are wide and easy to tap on mobile
  - Selecting auto-advances after 300ms transition
- **Back button** below the scale (text link) — returns to previous question, preserves answer
- **Save indicator**: small text in lower right *"Saved automatically ✓"* — appears briefly after each answer

### 5.2 Keyboard support

- **Number keys 1–5** — select the corresponding tile
- **Arrow keys ← →** — move between tiles (focus only, doesn't select)
- **Enter** — confirm selected tile, advance
- **Escape** — no action (no exit)
- **Backspace** — no action (use the visible Back button to avoid accidental loss)

### 5.3 Per-question save

When a tile is selected:
1. Save to localStorage immediately (`endurance:[code]`)
2. POST to `/api/respondent/answer` with `{ code, question_id, score }`
3. Auto-advance after 300ms

If the POST fails (network error):
- Save remains in localStorage
- Retry on next answer / on resume
- No error shown to user (resilient quiet retry)

### 5.4 Editing a previous answer

The respondent can use the Back button to revisit any earlier question. Selecting a different score updates the stored value and re-advances.

### 5.5 Question order

Fixed for all respondents: 1a, 1b, 2a, 2b, 3a, 3b, … 15a, 15b. See `02_questions.md` section 4.

---

## 6. Phase 5 — Review (`/take/review`)

After question 30, the respondent is taken to a review screen.

### 6.1 Layout

- **Headline**: *"Review your responses"*
- **Sub-headline**: *"Take a moment to check before you submit. Once submitted, you cannot change your responses."*
- **Grouped list** of all 30 answers, by pillar:
  - Pillar header: `AGILITY` (eyebrow) — *Sense and move*
  - Each question row:
    - Capability + angle (e.g., "Decision Velocity · Structure")
    - Statement (truncated with tooltip on hover, or full)
    - Selected score: numeral + label — `4 · Agree`
    - "Edit" link → returns to that specific question
- **Submit button**: large, primary, *"Submit my responses"*
- **Disclaimer below button**: *"By submitting, you confirm your responses are final."*

### 6.2 Edit from review

Clicking "Edit" on a row navigates to that question. After editing, the respondent can use a "Return to Review" link or hit the Back button until they reach review again. The natural flow re-walks subsequent questions if they advance forward instead.

> **UX simplification:** if implementing the "Return to Review" shortcut adds complexity, just rely on the Back button — the flow is short enough that re-walking is acceptable.

### 6.3 Submit

On click:
1. Confirmation modal: *"Submit your responses? This is final."* [Cancel] [Submit]
2. Server validates: all 30 answers present, code still valid, assessment still `collecting`
3. On success:
   - Mark respondent status as `completed`
   - Set `submitted_at` timestamp
   - Clear localStorage entry
   - Audit log: `respondent_submitted`
4. Advances to `/take/done`

### 6.4 Failure modes

- Assessment closed during review: show *"This assessment has closed since you started. Your responses up to this point have been saved but cannot be submitted."* with a "Got it" button that ends the flow (terminal screen).
- Network error: retry button.

---

## 7. Phase 6 — Confirmation (`/take/done`)

Terminal screen. No further navigation possible.

### 7.1 Layout

- Forefront wordmark top-center
- Centered card:
  - Large `✓` symbol in `green-solid`, ~64px (the only emoji-adjacent element in the entire product)
  - Headline (Georgia, bold): *"Thank you. Your responses have been recorded."*
  - Body: *"Results will be aggregated after the assessment closes on {deadline date}. Your administrator will share the findings with you."*
  - Footer hint: *"You may close this window."*
- No buttons. No links to results. No further calls to action.

### 7.2 Behavior on revisit

If the respondent later visits `/take` and enters the same code: they get the *"You have already submitted this assessment"* message. They cannot return to `/take/done` directly — that route is part of the submit flow only.

---

## 8. Resume — interrupted flow

The respondent can leave at any point and return on the **same browser/device** to continue.

### 8.1 What's saved locally

In `localStorage[endurance:{code}]`:

```json
{
  "code": "A7K2PQ",
  "answers": { "1a": 4, "1b": 3, "2a": 5, ... },
  "currentQuestionIndex": 7,
  "demographicsCompleted": true,
  "startedAt": "2026-04-22T10:00:00Z"
}
```

### 8.2 Resume behavior

When respondent returns via `/take` and enters the same code:

1. Code validated (per section 2.2)
2. If localStorage has matching state → skip to the stored `currentQuestionIndex`, pre-filled with stored answers
3. If localStorage is missing (different device or cleared) → fetch from server-side stored answers via the access code; resume from the last answered question
4. If no answers exist server-side either → start fresh from `/take/welcome` or demographics (depending on whether demographics is complete)

### 8.3 Cross-device caveat

localStorage is per-device. A respondent who answers half on a laptop and half on a phone will reconcile via the server (each answer is POSTed). The phone shows previously saved answers from the server. Demographics, though, are stored server-side so cross-device works for that too.

---

## 9. Submitting an interrupted partial response

Respondents cannot submit a partial response. The Submit button is only reachable from `/take/review`, which is only reachable after answering all 30 questions.

If a respondent abandons mid-flow and the deadline passes:
- Their partial answers are preserved server-side (audit-loggable)
- They count as "in progress" in admin-monitoring
- They do NOT count toward the anonymity floor in the report
- Their data is NOT included in any aggregations or AI prompts

---

## 10. Edge cases

| Case | Behavior |
|------|----------|
| Respondent enters code, completes demographics, then deadline passes mid-assessment | They can finish answering up to the deadline timestamp. Submit attempt after deadline → "This assessment has closed" + their progress is saved server-side but not aggregated. |
| Respondent enters code, takes assessment, but admin revokes code mid-flow | Next answer save attempt fails server-side. Show: *"Your access has been revoked. Please contact the administrator."* Local state preserved but submission not possible. |
| Respondent submits all 5s | Valid — produces overall 5.00. No anti-acquiescence detection in v1. |
| Respondent reaches review, then closes browser | localStorage retained. On return, lands on review screen with answers pre-populated. |
| Respondent uses two browsers simultaneously | Each browser has its own localStorage but server is single source of truth — last-write-wins per question. Edge case; not optimized. |
| Respondent's code matches but assessment has been deleted by admin | This shouldn't be possible (admins cannot delete an assessment with submitted responses in v1) but treat as "code not recognized" if it occurs. |

---

## 11. Accessibility

- All form inputs have associated `<label>` elements
- Focus order is logical top-to-bottom
- Keyboard-only completion is fully supported (number keys, arrow keys, Tab, Enter)
- Color is never the only signifier — band labels (and similar) are also textual
- ARIA `role="radiogroup"` on the Likert scale, with `aria-checked` on each tile

---

## 12. Glossary cross-reference

For terminology used here, see `13_glossary.md`:
- Respondent, Access code, Likert scale, Demographics, Resume, Privacy disclosure

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 2026-04-28 | Initial. Defines six-phase flow (code → welcome → demographics → questions → review → done), keyboard support, resume behavior, cross-device handling, edge cases. |

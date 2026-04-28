# 12 — Design Language

**Version:** 0.1
**Last updated:** 2026-04-28

---

> Visual and verbal language for the product. The application should feel like the same product family as the Corporate Endurance Model deck and Forefront Consulting's other materials.

---

## 1. Color tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `dark-blue` | `#0B2545` | Primary surface, headers, body text on light bg |
| `dark-blue-soft` | `#13315C` | Secondary dark panels |
| `white` | `#FFFFFF` | Background, text on dark surfaces |
| `grey-text` | `#5A6572` | Secondary body text, captions |
| `grey-light` | `#E8EBEE` | Borders, dividers |
| `grey-soft-bg` | `#F4F6F8` | Subtle backgrounds, cards on white |
| `ochre` | `#D4A24C` | Accent, highlights, scores, emphasis |
| `ochre-soft` | `#E9C98A` | Hover states, softer accents |
| `red-critical` | `#C0392B` | Critical Gap band |
| `orange-gap` | `#E67E22` | Needs Work band |
| `green-solid` | `#27AE60` | Strong band |
| `input-blue` | `#0000FF` | Reserved exclusively for editable user input fields |

**Solid band uses ochre `#D4A24C`** — the existing accent color doubles as the band color.

**Token guidance:**
- Score numerals use `ochre` for emphasis.
- Section eyebrows ("AGILITY · DECISION VELOCITY") use `ochre` in ALL CAPS with letter-spacing.
- Hover states on cards use `ochre-soft` borders.
- The `input-blue` is reserved purely for live-editable values (admin form inputs) so the eye can quickly find what's user-controlled vs. system-rendered.

---

## 2. Typography

| Use case | Font | Weight |
|----------|------|--------|
| Headlines, score numerals, hero text | **Georgia** (serif), bold | 700 |
| Body, UI labels, buttons | System sans (Tailwind default — Inter/SF Pro/Calibri equivalent) | 400–600 |
| Eyebrows / section labels (ALL CAPS) | System sans, bold, letter-spacing 3–4px | 700 |
| Statement text on respondent question screens | Georgia (serif) — visual center of the screen | 400–500 |

**Sizing scale (rough):**
- Hero score numeral: 88–96px
- Section title: 28–32px
- Body: 15–17px
- Eyebrow: 11–12px

**Use serif sparingly.** Georgia is reserved for moments of weight: hero scores, the statement on question screens, the report's hero panel headline. Everything else is sans for legibility.

---

## 3. Spacing and layout

- **Max content width on desktop:** 1200px, centered
- **Section padding:** 24px mobile, 48px tablet, 64px desktop
- **Card corner radius:** 4px (subtle, not rounded-friendly)
- **Card shadow:** very soft — `0 1px 3px rgba(11, 37, 69, 0.08)` — gentle elevation only
- **Top-of-card ochre accent strip:** 4px tall, full-width, on primary cards
- **Section spacing:** generous — let panels breathe; this is a boardroom-grade product, not a packed dashboard

---

## 4. Tone of voice

### Voice

- **Serious, executive, confident.** Never cute, never playful.
- **Active voice.** Subject-verb-object. Avoid passive constructions.
- **Short sentences.** Boardroom prose, not academic prose. Aim for 18 words or fewer per sentence on average.
- **Plain English.** Avoid jargon unless it's the methodology's own vocabulary (Agility / Toughness / Resilience / Structure / Practice / spread).

### Word choices

| Use | Don't use |
|-----|-----------|
| "the organization" | "your company", "the client", "you guys" |
| "respondent" | "user", "participant", "tester" |
| "the team" | "the cohort", "the group" (when referring to all respondents) |
| "deadline" | "due date", "cutoff" |
| "assessment" | "survey", "questionnaire", "test" |
| "report" | "results", "output" (in user-facing copy; "results" is fine internally) |
| "endurance" | "resilience" (Resilience is one of three pillars; don't conflate) |
| "anonymized" | "anonymous" (precise — we anonymize by removing identifiers, the data isn't inherently anonymous) |
| "Strongly Agree" / "Strongly Disagree" | "Definitely yes" / "Hard no" |

### Microcopy principles

- **No emoji.** A single ✓ on the confirmation screen is acceptable. Nothing else.
- **No exclamation marks** in admin copy. Allowed sparingly in respondent-facing thank-you copy ("Thank you. Your responses have been recorded.")
- **Title case for buttons:** "Begin Assessment", not "Begin assessment" or "BEGIN ASSESSMENT".
- **Sentence case for labels:** "Department", "Level", "Years at organization".
- **No abbreviations** in the user-facing UI. Spell out "Department", "Individual Contributor". Acronyms allowed only when industry-standard (PDF, AI).
- **Date formatting:** "April 30, 2026 at 11:59 PM" in respondent-facing copy. ISO format (`2026-04-30T23:59`) only in admin/technical contexts.
- **Number formatting:** Always 2 decimal places for scores ("3.03", not "3" or "3.0").

### Framing rules

- **Always frame as the organization.** Every question prompt, the welcome screen, the report — never address the respondent's personal feelings or behavior.
- **Use the verb test.** When describing pillars, lead with the verb pair: "Sense and move", "Absorb and hold", "Recover and renew". The verbs anchor what the pillar measures.
- **Surface spread when high.** When spread > 1.0 on a capability, prefix the score line with "Range: 1.5 – 4.0" or use a dedicated spread badge. High spread is itself a finding — don't bury it.
- **Don't moralize about scores.** A "Critical Gap" is descriptive, not punitive. The interpretation strings explain what to do, not how the organization should feel.

---

## 5. Visual language

### Charts

- Use minimal chart chrome: no gridlines on score bars, single tick marks where needed, no chart titles (use a sibling section header instead).
- Score bars are filled solid in the band color, with a thin grey-light track behind.
- Pillar comparison views use horizontal bars (left-to-right reads more naturally than vertical for grouped data).
- Comparison view: paired bars (filter A vs. filter B) — same chart, two colors, color-coded legend at top.

### Icons

- Use sparingly. Icons must be line-style, monochrome, ochre or grey-text only.
- No filled icons, no multicolor.
- Icon set suggestion: Lucide (lucide-react) — consistent line weight, modern but not playful.

### Branding strip

- Top of every page: thin Forefront Consulting wordmark in `dark-blue`, left-aligned.
- Footer on every page: *"Forefront Consulting · The Corporate Endurance Model"* in `grey-text`, centered, 11px.

### Interaction states

- **Hover (cards):** border shifts to `ochre-soft`, shadow deepens slightly.
- **Selected (radio/Likert tile):** border becomes `ochre`, background tints to `ochre-soft` at 20% opacity, score number becomes `ochre`.
- **Disabled (button, locked tab):** opacity 0.5, cursor not-allowed, no hover state.
- **Focus (keyboard):** 2px `ochre` outline at 2px offset.
- **Loading:** subtle pulse animation (opacity 0.6 ↔ 1.0 over 1.2s) on the affected element. No spinners, no skeletons in v1.

---

## 6. Responsive behavior

- **Desktop-first design**, but the respondent flow must be usable on tablet and mobile.
- **Mobile question screens:** Likert tiles stack vertically, full-width.
- **Admin dashboard:** desktop-oriented, OK to be less polished on mobile (most consultants will use a laptop).
- **Breakpoints:** 768px (tablet), 1024px (small desktop), 1280px (full desktop).

---

## 7. Accessibility commitments

- **WCAG AA at minimum** for text contrast, focus indicators, and keyboard navigation.
- All Likert tiles, buttons, inputs reachable via Tab.
- Number keys 1–5 select Likert options on question screens.
- Arrow keys move between Likert tiles; Enter advances.
- ARIA labels on icon-only buttons.
- Color is **never the only signifier** — band labels also display textually ("Critical Gap"), not just by color.
- Screen-reader pass not required for v1 but the structure shouldn't preclude it.

---

## 8. Inspirational anchors

When unsure about a design choice, ask: *"Would this look out of place in a McKinsey or Bain partner's executive deck?"* If yes, soften it.

The product should feel:
- **Authoritative** without being intimidating
- **Quiet** — visual restraint is a signal of seriousness
- **Confident** — no hedging in copy or visual emphasis
- **Premium** — typography and whitespace do the work; ornamentation is sparse

The product should not feel:
- Playful, casual, or "consumer-app"
- Over-designed, gradient-heavy, or full of motion
- Apologetic ("oops!", "uh oh", "we're sorry")
- Salesy or marketing-toned

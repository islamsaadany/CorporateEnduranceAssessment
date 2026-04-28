# The Endurance Assessment — Web App Build Spec

**For:** Forefront Consulting
**Product:** Web application implementing The Corporate Endurance Model's team-based diagnostic assessment
**Target:** Claude Code (implementation)
**Version:** 1.0 (initial build)
**Last updated:** April 2026

---

## 1. Product Overview

The Endurance Assessment is a web-based diagnostic tool that measures an organization's endurance across three pillars — **Agility**, **Toughness**, and **Resilience** — by aggregating responses from a team of senior leaders.

### The short version

A Forefront consultant creates an assessment for a client organization, invites a set of respondents by email (each receives a unique 6-character access code), respondents complete a 30-statement questionnaire one question at a time, the system collects responses until a preset deadline, and after closure the consultant views an aggregated **Organizational Endurance Profile** showing team-level scores, agreement/spread across respondents, and prioritized focus areas.

### Who uses it

**Admin (Forefront consultant):** Creates assessments, invites respondents, monitors response rates, reviews aggregated results after closure.

**Respondent (client executive or senior leader):** Receives an email invitation with a unique code, visits the app, enters their code, completes 30 questions one at a time, submits.

### Core design principles

1. **Organizational-level** — Every question asks about *the organization*, not the respondent's personal feelings.
2. **Anonymous aggregation** — Individual respondents' scores are never shown identified. Only the aggregated team view is surfaced.
3. **Deadline-driven** — Assessments close automatically at a set date/time. No manual closure in v1.
4. **Spread matters** — The tool highlights where the team agrees vs. where they diverge. Divergence is itself a finding.
5. **Consulting-grade output** — The results view is designed to be presentable in a client boardroom without further formatting.

---

## 2. The Conceptual Model

The assessment implements a locked **3 + 15 + 30** structure. These are not placeholders — they are the final, agreed content.

### The Three Pillars

| Pillar | Verb | Definition | The Test |
|--------|------|------------|----------|
| **Agility** | Sense and move | The ability to detect change early and respond with speed and judgment. | *"Did we see it coming and move in time?"* |
| **Toughness** | Absorb and hold | The ability to withstand shocks without breaking or losing control. | *"When it hit, did we stay standing?"* |
| **Resilience** | Recover and renew | The ability to rebuild, reconfigure, and emerge stronger after disruption. | *"Did we come back — and come back stronger?"* |

### The 15 Capability Areas (5 per pillar)

#### Agility
1. **Decision Velocity** — clear decision rights, reduced escalation layers
2. **Market & Signal Intelligence** — real-time sensing of customers, competitors, regulatory environment
3. **Adaptive Governance** — flexible policies, scenario-based decision-making
4. **Experimentation Muscle** — fast pilots, rapid feedback loops
5. **Delegation & Empowerment** — frontline authority, defined autonomy

#### Toughness
6. **Leadership Strength Under Pressure** — second-line depth + calm visible leadership in crisis
7. **Financial Shock Absorption** — liquidity buffers, contingency budgets, stress-testing
8. **Operational Continuity** — backup suppliers, alternative paths, BCM plans
9. **Risk & Compliance Discipline** — integrated governance of risk, legal, compliance
10. **Trust & Collaboration** — teams that hold together under pressure

#### Resilience
11. **System Recoverability** — tested BCM/DR plans, modular systems
12. **Culture of Grit & Ownership** — accountability without blame, pride in overcoming setbacks
13. **Learning Discipline** — post-mortem rituals applied to all pressure events
14. **Strategic Adaptability** — scenario planning depth, resource reallocation agility
15. **Offensive Readiness** — defined growth thesis, playbooks to switch from defense to offense

---

## 3. The 30 Questions (Locked Content)

All 30 statements are locked. **Do not rewrite them.** Paste verbatim into code.

Each question has:
- `id` — short identifier like "1a", "1b", "2a", etc.
- `pillar` — "Agility", "Toughness", or "Resilience"
- `capability` — one of the 15 capability area names
- `angle` — "Structure" (does the mechanism exist?) or "Practice" (does it actually work?)
- `text` — the statement the respondent rates

```json
[
  { "id": "1a", "pillar": "Agility", "capability": "Decision Velocity", "angle": "Structure",
    "text": "Our organization has clearly defined decision rights, so people know who decides what without having to escalate." },
  { "id": "1b", "pillar": "Agility", "capability": "Decision Velocity", "angle": "Practice",
    "text": "Key strategic decisions are made and acted upon within days or weeks, not months." },

  { "id": "2a", "pillar": "Agility", "capability": "Market & Signal Intelligence", "angle": "Structure",
    "text": "We have active mechanisms to detect early signals of change in our markets, customers, competitors, and technology." },
  { "id": "2b", "pillar": "Agility", "capability": "Market & Signal Intelligence", "angle": "Practice",
    "text": "Insights from our sensing activities consistently translate into timely decisions and adjustments." },

  { "id": "3a", "pillar": "Agility", "capability": "Adaptive Governance", "angle": "Structure",
    "text": "Our policies and governance frameworks allow for exceptions and fast adjustments when circumstances demand it." },
  { "id": "3b", "pillar": "Agility", "capability": "Adaptive Governance", "angle": "Practice",
    "text": "When external conditions change, we are able to revise strategies and budgets without getting stuck in bureaucracy." },

  { "id": "4a", "pillar": "Agility", "capability": "Experimentation Muscle", "angle": "Structure",
    "text": "We have a disciplined process for running small, fast experiments before committing to large investments." },
  { "id": "4b", "pillar": "Agility", "capability": "Experimentation Muscle", "angle": "Practice",
    "text": "Our organization learns from failed experiments without punishing the people who ran them." },

  { "id": "5a", "pillar": "Agility", "capability": "Delegation & Empowerment", "angle": "Structure",
    "text": "Decision-making authority is pushed down to the people closest to the action, within clear boundaries." },
  { "id": "5b", "pillar": "Agility", "capability": "Delegation & Empowerment", "angle": "Practice",
    "text": "Frontline leaders and teams feel trusted to make real decisions without constant approval from above." },

  { "id": "6a", "pillar": "Toughness", "capability": "Leadership Strength Under Pressure", "angle": "Structure",
    "text": "We have identified and actively developed strong second-line leaders and successors for every critical role." },
  { "id": "6b", "pillar": "Toughness", "capability": "Leadership Strength Under Pressure", "angle": "Practice",
    "text": "In past crises, our senior leaders have remained calm, visible, and honest in their communication." },

  { "id": "7a", "pillar": "Toughness", "capability": "Financial Shock Absorption", "angle": "Structure",
    "text": "We maintain cash buffers, liquidity reserves, and contingency budgets sized for realistic shock scenarios." },
  { "id": "7b", "pillar": "Toughness", "capability": "Financial Shock Absorption", "angle": "Practice",
    "text": "Our finance function regularly stress-tests the business against severe but plausible financial shocks." },

  { "id": "8a", "pillar": "Toughness", "capability": "Operational Continuity", "angle": "Structure",
    "text": "We have backup suppliers, alternative operational paths, and continuity plans for our most critical processes." },
  { "id": "8b", "pillar": "Toughness", "capability": "Operational Continuity", "angle": "Practice",
    "text": "Our continuity plans are tested regularly — not just documented — and would work if activated today." },

  { "id": "9a", "pillar": "Toughness", "capability": "Risk & Compliance Discipline", "angle": "Structure",
    "text": "Risk, legal, and compliance matters have clear ownership and integrated governance across the organization." },
  { "id": "9b", "pillar": "Toughness", "capability": "Risk & Compliance Discipline", "angle": "Practice",
    "text": "We identify and address emerging risks proactively, rather than reacting to problems after they materialize." },

  { "id": "10a", "pillar": "Toughness", "capability": "Trust & Collaboration", "angle": "Structure",
    "text": "Our cross-functional teams have the relationships and operating rhythms to collaborate effectively under pressure." },
  { "id": "10b", "pillar": "Toughness", "capability": "Trust & Collaboration", "angle": "Practice",
    "text": "When things go wrong, our teams pull together rather than retreating into silos or internal politics." },

  { "id": "11a", "pillar": "Resilience", "capability": "System Recoverability", "angle": "Structure",
    "text": "We have documented and tested business continuity and disaster recovery plans covering our critical systems." },
  { "id": "11b", "pillar": "Resilience", "capability": "System Recoverability", "angle": "Practice",
    "text": "When systems or processes break, we restore them quickly and without lasting damage to operations." },

  { "id": "12a", "pillar": "Resilience", "capability": "Culture of Grit & Ownership", "angle": "Structure",
    "text": "Accountability is clearly assigned and accepted in our organization — people own their outcomes, good or bad." },
  { "id": "12b", "pillar": "Resilience", "capability": "Culture of Grit & Ownership", "angle": "Practice",
    "text": "Our people push through setbacks and difficulty rather than escalating early or disengaging." },

  { "id": "13a", "pillar": "Resilience", "capability": "Learning Discipline", "angle": "Structure",
    "text": "We have structured rituals — such as post-mortems and after-action reviews — for capturing lessons from pressure events." },
  { "id": "13b", "pillar": "Resilience", "capability": "Learning Discipline", "angle": "Practice",
    "text": "Lessons from past events measurably change how we operate; we don't repeat the same mistakes." },

  { "id": "14a", "pillar": "Resilience", "capability": "Strategic Adaptability", "angle": "Structure",
    "text": "We conduct regular scenario planning and strategy reviews that prepare us for multiple possible futures." },
  { "id": "14b", "pillar": "Resilience", "capability": "Strategic Adaptability", "angle": "Practice",
    "text": "When conditions change, we are able to reallocate resources and redesign our strategy quickly and decisively." },

  { "id": "15a", "pillar": "Resilience", "capability": "Offensive Readiness", "angle": "Structure",
    "text": "We have a defined growth thesis and investment playbooks ready to activate when conditions allow." },
  { "id": "15b", "pillar": "Resilience", "capability": "Offensive Readiness", "angle": "Practice",
    "text": "After stabilizing from a shock, our organization has historically returned to offense and growth quickly." }
]
```

### The 5-point Likert scale

Each question is rated on this scale (strictly 1–5 whole numbers):

| Score | Label | Meaning |
|-------|-------|---------|
| **1** | Strongly Disagree | This is clearly not true of our organization. |
| **2** | Disagree | This is only partly or occasionally true. |
| **3** | Neutral | True in some areas, not in others. Mixed picture. |
| **4** | Agree | Mostly true of our organization. |
| **5** | Strongly Agree | Clearly and consistently true of our organization. |

No "N/A" or skip option. All 30 must be answered to complete the assessment.

---

## 4. Scoring Logic

### Individual (per respondent)

For a single respondent:
- **Capability score** = mean of the 2 questions in that capability, e.g., `(q1a + q1b) / 2`
- **Pillar score** = mean of the 5 capability scores in that pillar
- **Overall endurance score** = mean of the 3 pillar scores

All scores expressed to 2 decimal places. Range: 1.00 to 5.00.

### Team aggregation

For N respondents:
- **Team capability score** = mean of all N respondents' capability scores for that capability
- **Team pillar score** = mean of all N respondents' pillar scores for that pillar
- **Team overall endurance score** = mean of all N respondents' overall scores

Additionally, compute and surface **spread** (range) for each capability:
- **Min** = lowest individual capability score among respondents
- **Max** = highest individual capability score among respondents
- **Spread** = max − min

High spread on a capability is a significant finding — it means the team disagrees about that capability. Surface this visibly in results.

### Interpretation bands

Applied uniformly to any score (overall, pillar, capability):

| Band | Range | Color (hex) | Meaning |
|------|-------|-------------|---------|
| Critical Gap | 1.00 – 1.99 | `#C0392B` (red) | Immediate priority; actively damaging |
| Needs Work | 2.00 – 2.99 | `#E67E22` (orange) | Address within the current strategic cycle |
| Solid | 3.00 – 3.99 | `#D4A24C` (ochre) | Generally sound, refine where useful |
| Strong | 4.00 – 5.00 | `#27AE60` (green) | Organizational strength, leverage this |

### Focus areas (top 5 weakest capabilities)

After an assessment closes, derive the top 5 action items by ranking all 15 team capability scores ascending (lowest first), taking the first 5, and matching each to its named recommendation (see Section 9.3).

Tie-breaking: if two capabilities have identical team scores, rank by spread descending (higher disagreement = higher priority). If still tied, rank alphabetically.

---

## 5. User Roles and Permissions

### Admin (Forefront consultant)
- Log in with email + password (standard auth)
- Can create, view, edit, and archive assessments
- Can add/remove respondents during the collection window
- Can extend a deadline (but cannot manually close)
- Sees aggregated results after assessment closure
- Sees individual responses **anonymized** (no names attached) in a separate view
- Can export results as PDF (see Section 11)

### Respondent (executive / senior leader)
- Does NOT create an account
- Authenticates with a **6-character alphanumeric access code** sent by email
- Accesses only their own assessment session
- Can save progress (local to browser) and resume
- After submitting, sees a confirmation screen only — no access to results
- Does NOT receive the team results (those go only to the admin)

### Public (unauthenticated)
- Landing page explaining the tool
- Login page for admins
- Access-code entry page for respondents
- No other pages are accessible without authentication

---

## 6. User Flows

### Flow A: Admin creates an assessment

1. Admin logs in at `/admin/login`
2. Lands on dashboard showing their active and past assessments
3. Clicks "New Assessment"
4. Fills in:
   - Client organization name (e.g., "Acme Corp")
   - Optional short description
   - Deadline (date + time; must be in the future)
   - List of respondents: each has **full name** and **email address**
5. Clicks "Create & Send Invitations"
6. System:
   - Generates one unique 6-character access code per respondent (format: `A7K2PQ`, uppercase letters + digits, no ambiguous chars like `0/O`, `1/I/L`)
   - Sends invitation email to each respondent (see email template in Section 10)
   - Returns admin to assessment detail page

### Flow B: Respondent takes the assessment

1. Respondent receives email invitation with their access code and a link
2. Clicks link → lands on `/take` page with code pre-filled from URL parameter, OR visits `/take` directly and enters code manually
3. Welcome screen shows:
   - Client organization name ("You're taking the assessment for Acme Corp")
   - Short intro paragraph
   - The scale explanation (1–5 with labels)
   - A crucial framing note: *"Rate your organization — not yourself. Every question is about how the organization operates today."*
   - "Begin" button
4. Clicks "Begin" → enters Typeform-style question flow (Section 7)
5. Answers all 30 questions one at a time, with progress saved to localStorage after each answer
6. If they close the browser, they can return via the same link and resume from where they stopped
7. After question 30, sees a review screen summarizing their 30 answers with option to go back and change any
8. Clicks "Submit"
9. Sees confirmation screen: *"Thank you. Your responses have been recorded. Results will be shared with your team lead after the assessment closes on [deadline]."*
10. LocalStorage is cleared after successful submit

### Flow C: Assessment closes and admin reviews results

1. At the deadline timestamp, the system automatically:
   - Marks the assessment as **closed**
   - Prevents any further responses (respondents see a "This assessment has closed" message if they try to submit)
   - Sends an email notification to the admin with a link to results
2. Admin clicks the link → lands on the Results page for that assessment (see Section 9)
3. Admin can view pillar scores, capability profile, focus areas, and individual anonymized responses
4. Admin can export PDF

### Flow D: Mid-assessment monitoring

1. Admin can visit an in-progress assessment at any time
2. Sees:
   - Number of respondents (e.g., "7 of 10 completed")
   - Deadline countdown
   - List of respondents with status: `Not started`, `In progress`, `Completed`
3. Admin can:
   - Add new respondents (generates new codes and sends invitations)
   - Remove respondents who haven't started (their codes become invalid)
   - Resend invitation email to respondents who haven't completed
   - Extend the deadline
4. Admin **cannot** view any scores or results until the assessment closes.

---

## 7. Screen / Page Specifications

### 7.1 Public pages

#### `/` — Landing page
- Forefront branding (logo top-left, small footer)
- Hero: *"The Endurance Assessment"* with tagline *"Measure your organization's ability to move early, stand firm, and come back better."*
- Short 3-pillar explainer (Agility / Toughness / Resilience) with verb + one-line each
- Two CTAs: "I'm an admin" → `/admin/login`, "I have an access code" → `/take`
- Footer: *"Forefront Consulting · The Corporate Endurance Model"*

#### `/admin/login`
- Clean login form: email + password fields, "Sign in" button
- Forefront branding
- No signup link in v1 (admins created manually in database)

#### `/take` — Respondent code entry
- Centered card with the Forefront logo
- Single input: "Enter your 6-character access code"
- "Start assessment" button
- Code format guidance under the input: *"Your code was sent to you by email, e.g., A7K2PQ"*
- Error states: invalid code, expired/closed assessment, already submitted

### 7.2 Respondent pages

#### `/take/welcome` — Welcome screen (after code validation)
- *"You've been invited to assess [Client Organization Name]"*
- 3-pillar summary
- The scale explanation
- The crucial framing: *"You are rating the organization — not yourself. Every question asks about how your organization operates today."*
- Estimated time: *"Takes about 12–15 minutes."*
- "Begin" button
- "Save progress automatically" reassurance in small text

#### `/take/question/[1..30]` — Typeform-style question screen
- Progress bar at top: "Question 7 of 30"
- Capability name + pillar tag above the statement (e.g., "AGILITY · DECISION VELOCITY")
- The statement itself in large serif (Georgia) — the visual center of the screen
- 5 tappable radio buttons or large tiles for the Likert scale:
  - "1 · Strongly Disagree"
  - "2 · Disagree"
  - "3 · Neutral"
  - "4 · Agree"
  - "5 · Strongly Agree"
- Selecting an option advances to the next question automatically (with a brief 300ms transition)
- Below the scale: "Back" button to revisit the previous question
- Keyboard support: arrow keys to navigate between options, number keys 1–5 to select, Enter to advance

#### `/take/review` — Review screen (after question 30)
- Title: *"Review your responses"*
- All 30 questions listed with current answer, grouped by pillar
- Each row has an "Edit" link that returns to that specific question
- "Submit my responses" button at the bottom (primary)
- Warning: *"Once submitted, you cannot change your responses."*

#### `/take/done` — Confirmation screen
- Large checkmark or similar positive visual
- *"Thank you. Your responses have been recorded."*
- *"Results will be aggregated after the assessment closes on [deadline]. Your team lead will share the findings with you."*
- No further navigation — this is a terminal screen

### 7.3 Admin pages

#### `/admin/dashboard`
- Header with Forefront branding, admin name, logout
- Two sections: "Active Assessments" and "Closed Assessments"
- Each assessment shown as a card with:
  - Client name
  - Status (Collecting / Closed)
  - Response count (e.g., "7 of 10")
  - Deadline / closed date
  - Primary action (View / Edit / View Results)
- "New Assessment" button top-right

#### `/admin/assessments/new`
- Form with fields:
  - Client organization name (required)
  - Description (optional, for admin reference)
  - Deadline date + time (required, must be future)
  - Respondents: add rows with `Full name` + `Email`. Minimum 1, no maximum.
- Live summary: "You're inviting 5 respondents. Deadline: April 30, 2026, 11:59 PM."
- "Create & Send Invitations" button
- Confirmation modal before sending

#### `/admin/assessments/[id]` — Assessment detail (during collection)
- Header: Client name, status, countdown to deadline
- Key stats: "7 of 10 completed", progress bar
- Respondent table:
  - Name, email, status, code (with copy button), last activity
  - Actions per row: Resend email, Remove (if not started)
- Actions panel:
  - "Add respondent" — opens modal to add more
  - "Extend deadline" — opens modal to change deadline to a later time
- No scores visible here. Banner: *"Results will be available after the assessment closes."*

#### `/admin/assessments/[id]/results` — Results page (after closure)
See Section 9 for full specification.

### 7.4 Error pages

- `404` — not found, link back to dashboard or landing
- `403` — access denied
- `410` — assessment closed (for respondents who click an invite after closure)
- Respondent-facing errors should be friendly and never expose internal details

---

## 8. Email Templates

### 8.1 Invitation email (to respondent)

**Subject:** You've been invited to assess [Client Organization Name]

**Body:**
```
Hi [Respondent First Name],

You've been invited by [Admin Name] to take part in an Endurance Assessment
for [Client Organization Name].

The Endurance Assessment measures an organization's ability to sense change
early, hold together under pressure, and come back stronger from disruption.

It takes about 12–15 minutes. Every question asks about your organization —
not about you personally.

Your access code: [A7K2PQ]

[Start the assessment →]  (button, deep-links to /take?code=A7K2PQ)

This assessment closes on [deadline, formatted as "April 30, 2026 at 11:59 PM"].

Forefront Consulting · The Corporate Endurance Model
```

### 8.2 Closure notification (to admin)

**Subject:** Results are ready: [Client Organization Name] Endurance Assessment

**Body:**
```
The assessment for [Client Organization Name] has closed.

Responses received: [N of M respondents completed]

[View results →]  (button, links to /admin/assessments/[id]/results)

Forefront Consulting
```

### 8.3 Reminder email (optional, sent 48h and 24h before deadline to non-completers)

**Subject:** Reminder: your [Client] Endurance Assessment closes soon

**Body:**
```
Hi [Respondent First Name],

Just a reminder — your Endurance Assessment for [Client Organization Name]
closes on [deadline]. It takes about 12–15 minutes to complete.

Your access code: [A7K2PQ]

[Continue the assessment →]

Forefront Consulting
```

---

## 9. Results Page Specification (Admin-only)

The results page is the most important surface of the app. It must be designed to be presentable in a boardroom without further formatting. Three sections, in order:

### 9.1 Section 1: Summary (hero)

Full-width panel, dark blue background (`#0B2545`), white text.

**Left side (hero score):**
- Label in ochre: "TEAM ENDURANCE SCORE"
- Large number (~90px Georgia bold): the team overall score to 2 decimal places, e.g., "3.03"
- Subtle "/ 5.00" underneath
- Band label in ochre (e.g., "SOLID")
- One-line interpretation (generated based on band, see below)

**Right side (pillar breakdown):**
- Three pillar rows, each showing:
  - Pillar name (AGILITY / TOUGHNESS / RESILIENCE)
  - Verb underneath
  - Team score (e.g., "2.60")
  - Band label (color-coded)
  - Horizontal progress bar filled to score/5 ratio, color matching band

**Bottom of section:**
- Four-band legend: Critical Gap (1–2) · Needs Work (2–3) · Solid (3–4) · Strong (4–5)

**Interpretation strings (auto-generated based on overall score):**
- Critical Gap: *"The organization is in a fragile position and needs urgent intervention across multiple pillars."*
- Needs Work: *"The organization has real gaps that threaten endurance. Investment is needed."*
- Solid: *"The organization is generally sound, with specific gaps to address."*
- Strong: *"The organization is in a position of strength — maintain and leverage."*

### 9.2 Section 2: Capability Profile (grouped by pillar)

Three columns side by side (one per pillar), each showing all 5 capabilities in that pillar sorted by team score descending.

Each column:
- **Header panel** (dark blue): pillar name, verb, pillar-level team score, band
- **5 capability rows**, each with:
  - Small score bar (width proportional to score/5, color by band)
  - Capability name
  - Score (to 1 decimal)
  - **Spread indicator** (small tooltip or inline text): *"Range: 1.5 – 3.5"* — shown when spread > 1.0, indicating disagreement

Ordering within each column: highest score first (strongest at top), weakest at bottom.

### 9.3 Section 3: Focus Areas (top 5 weakest capabilities + action items)

A ranked list of 5 rows. Each row shows:
- Rank (01 through 05), large ochre numeral
- Capability name + pillar tag
- Team score + band (color-coded)
- Two action items (bullet-numbered 1 and 2)

The 5 action item pairs are **pre-defined per capability** and selected based on which capabilities rank in the bottom 5.

#### Pre-defined action items (paste verbatim into code)

```json
{
  "Decision Velocity": [
    "Publish a decision-rights matrix clarifying who decides what across the top 20 recurring decisions.",
    "Cut one layer of approval from standard operating decisions within the next quarter."
  ],
  "Market & Signal Intelligence": [
    "Stand up an early-warning dashboard tracking customer, competitor, and regulatory signals.",
    "Assign a rotating 'signal owner' on the executive team responsible for weekly synthesis."
  ],
  "Adaptive Governance": [
    "Introduce an explicit exceptions process for policy deviations with senior sponsor approval.",
    "Move to rolling 90-day budget reviews with reallocation authority, replacing annual cycles."
  ],
  "Experimentation Muscle": [
    "Install a disciplined pilot process with clear success criteria and fast kill decisions.",
    "Create a small 'experiments budget' ring-fenced from core operations for rapid tests."
  ],
  "Delegation & Empowerment": [
    "Define the specific decisions that must be pushed to the frontline and publish the boundaries.",
    "Coach senior leaders to stop pre-approving decisions their direct reports own."
  ],
  "Leadership Strength Under Pressure": [
    "Build a successor plan for every critical role with named second-line leaders and development paths.",
    "Run a crisis-leadership simulation annually with the top team to rehearse behaviors under stress."
  ],
  "Financial Shock Absorption": [
    "Define explicit liquidity buffers and minimum cash reserves sized for realistic shock scenarios.",
    "Run quarterly financial stress tests against severe but plausible adverse conditions."
  ],
  "Operational Continuity": [
    "Map critical processes, identify single points of failure, and establish backup suppliers/paths.",
    "Test business continuity plans at least once a year — live, not just tabletop."
  ],
  "Risk & Compliance Discipline": [
    "Unify risk, legal, and compliance ownership under integrated governance with clear accountability.",
    "Shift posture from reactive to proactive: identify emerging risks before they materialize."
  ],
  "Trust & Collaboration": [
    "Invest in cross-functional operating rhythms and joint goals that reward collaboration.",
    "Address political behaviors visibly — signal that silos cost the team, especially under pressure."
  ],
  "System Recoverability": [
    "Document and test disaster recovery for all critical systems — aim for measurable recovery time.",
    "Move toward modular architectures that allow partial system restoration during disruption."
  ],
  "Culture of Grit & Ownership": [
    "Reinforce accountability by making ownership visible; reward pushing through difficulty.",
    "Address escalation patterns: coach leaders who escalate too early or abdicate ownership."
  ],
  "Learning Discipline": [
    "Institute structured after-action reviews for every project exceeding a defined impact threshold.",
    "Create a quarterly 'lessons forum' where cross-functional learnings are captured and actioned."
  ],
  "Strategic Adaptability": [
    "Formalize scenario planning into the strategy cycle — at least three plausible futures annually.",
    "Build faster resource reallocation mechanisms that don't require full annual budget cycles."
  ],
  "Offensive Readiness": [
    "Define a growth thesis that specifies where the organization will invest when conditions stabilize.",
    "Pre-build investment playbooks with activation criteria, owners, and timelines."
  ]
}
```

### 9.4 Section 4: Individual anonymized responses (secondary tab)

A separate tab or drawer showing:
- Each respondent's individual overall score and pillar scores (labeled "Respondent A", "Respondent B", etc. — never by name in this view)
- A matrix view: 15 capabilities × N respondents with each cell colored by band
- This helps the admin see individual spread and outliers without identifying anyone

Admin can also see a **separate identified list** (names and emails) that shows *whether* each person responded, but not *how* they responded. Complete separation of "who responded" from "what they said."

---

## 10. Design System

Match the Corporate Endurance Model deck's visual language. The app should feel like the same product family.

### 10.1 Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Dark Blue | `#0B2545` | Primary surface, headers, body text on light bg |
| Dark Blue Soft | `#13315C` | Secondary dark panels |
| White | `#FFFFFF` | Background, text on dark surfaces |
| Grey Text | `#5A6572` | Secondary body text, captions |
| Grey Light | `#E8EBEE` | Borders, dividers |
| Grey Soft BG | `#F4F6F8` | Subtle backgrounds, cards on white |
| Ochre | `#D4A24C` | Accent, highlights, scores, emphasis |
| Ochre Soft | `#E9C98A` | Ochre for hover states, softer accents |
| Red Critical | `#C0392B` | Critical Gap band |
| Orange Gap | `#E67E22` | Needs Work band |
| Green Solid | `#27AE60` | Strong band |
| Input Blue | `#0000FF` | User input fields (reserved for editable values) |

### 10.2 Typography

- **Headlines / numerals** — Georgia (serif), bold, for pillar names, score numerals, hero text
- **Body / UI** — System sans-serif stack (Calibri / Inter / SF Pro equivalent) — whatever Tailwind's default sans is
- **Eyebrows / labels** — ALL CAPS, Calibri, bold, with letter-spacing 3–4px in ochre `#D4A24C`

### 10.3 Spacing and layout

- Max content width on desktop: 1200px, centered
- Section padding: 24px mobile, 48px tablet, 64px desktop
- Card corner radius: 4px (subtle, not rounded-friendly)
- Card shadow: very soft, `0 1px 3px rgba(11, 37, 69, 0.08)` — aim for gentle elevation, not drop shadows
- Top-of-card ochre accent strip: 4px tall, full-width, always at the top of primary cards

### 10.4 Tone and language

- Serious, executive, confident.
- Never cute, never playful. No emoji except possibly a single ✓ on the confirmation screen.
- Short sentences. Active voice.
- "The organization" — never "your company." Consistent framing.

### 10.5 Responsive behavior

- Desktop-first design, but must be usable on tablet and mobile for respondents
- On mobile: question screens stack vertically, scale tiles become full-width
- Admin dashboard is desktop-oriented (tables, multi-column views) — acceptable to be less polished on mobile

---

## 11. Technical Stack and Architecture

Stack selection prioritizes speed-to-build, Claude Code's strengths, and sensible defaults for a consulting-firm internal tool.

### 11.1 Recommended stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Next.js 14 (App Router)** | Full-stack, React-based, built-in API routes, excellent TypeScript support |
| Language | **TypeScript** | Type safety prevents entire categories of bugs in a data-heavy app |
| Styling | **Tailwind CSS** | Fast, consistent, matches the deck's clean aesthetic |
| Database | **PostgreSQL via Supabase** | Managed Postgres, generous free tier, easy to set up |
| ORM | **Prisma** | Industry standard with Postgres/Next.js, clean migrations |
| Auth (admin) | **NextAuth.js (v5)** with email/password credentials provider | Built-in session management, pairs naturally with Next.js |
| Email sending | **Resend** | Modern, developer-friendly email API, free tier adequate for v1 |
| Hosting | **Vercel** | Zero-config for Next.js, automatic deployments from Git, free tier sufficient |
| PDF generation | **@react-pdf/renderer** or Puppeteer | Server-side PDF rendering of results page |
| Scheduled jobs | **Vercel Cron** | Runs the deadline-close job hourly |

### 11.2 Database schema

```sql
-- Admin users (Forefront consultants)
CREATE TABLE admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Assessments (one per client engagement)
CREATE TABLE assessments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id             UUID NOT NULL REFERENCES admins(id),
  client_name          VARCHAR(255) NOT NULL,
  description          TEXT,
  deadline             TIMESTAMPTZ NOT NULL,
  status               VARCHAR(20) NOT NULL DEFAULT 'collecting',
    -- values: 'collecting', 'closed', 'archived'
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  closed_at            TIMESTAMPTZ,
  CHECK (status IN ('collecting', 'closed', 'archived'))
);

-- Respondents (invited participants)
CREATE TABLE respondents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id   UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  full_name       VARCHAR(255) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  access_code     VARCHAR(6) UNIQUE NOT NULL,
    -- 6-char alphanumeric, uppercase, no 0/O/1/I/L
  status          VARCHAR(20) NOT NULL DEFAULT 'not_started',
    -- 'not_started', 'in_progress', 'completed'
  invited_at      TIMESTAMPTZ DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  submitted_at    TIMESTAMPTZ,
  CHECK (status IN ('not_started', 'in_progress', 'completed'))
);

-- Responses (one row per question per respondent)
CREATE TABLE responses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  respondent_id   UUID NOT NULL REFERENCES respondents(id) ON DELETE CASCADE,
  question_id     VARCHAR(5) NOT NULL,
    -- matches the question ID from the locked list, e.g., "1a"
  score           INTEGER NOT NULL,
  answered_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(respondent_id, question_id),
  CHECK (score BETWEEN 1 AND 5)
);

CREATE INDEX idx_respondents_code ON respondents(access_code);
CREATE INDEX idx_respondents_assessment ON respondents(assessment_id);
CREATE INDEX idx_responses_respondent ON responses(respondent_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_deadline ON assessments(deadline);
```

### 11.3 Key API routes

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/auth/*` | - | NextAuth endpoints | - |
| `/api/admin/assessments` | GET, POST | List / create assessments | Admin |
| `/api/admin/assessments/[id]` | GET, PATCH | Detail / update | Admin |
| `/api/admin/assessments/[id]/respondents` | POST | Add respondents | Admin |
| `/api/admin/assessments/[id]/results` | GET | Get computed results | Admin |
| `/api/admin/assessments/[id]/export-pdf` | GET | Server-render PDF | Admin |
| `/api/respondent/validate-code` | POST | Check code, return assessment info | Public |
| `/api/respondent/answer` | POST | Save single answer | Code-auth |
| `/api/respondent/submit` | POST | Mark respondent as complete | Code-auth |
| `/api/cron/close-deadlines` | POST | Runs hourly, closes expired assessments, sends admin emails | Cron |

### 11.4 Scheduled close job

Vercel Cron configuration:
```json
{
  "crons": [
    {
      "path": "/api/cron/close-deadlines",
      "schedule": "0 * * * *"
    }
  ]
}
```

Logic:
1. Find all assessments where `status = 'collecting'` AND `deadline < NOW()`
2. For each:
   - Update `status = 'closed'`, set `closed_at = NOW()`
   - Send admin the "Results are ready" email
3. Return `{ closed: N }` for observability

---

## 12. Access Code Generation

6-character alphanumeric codes, uppercase letters and digits only.

**Excluded characters** (ambiguous):
- `0` (zero), `O` (letter O)
- `1` (one), `I` (letter I), `L` (letter L)

**Valid character set:**
`23456789 ABCDEFGHJKMNPQRSTUVWXYZ` — 32 characters total

Generation:
```typescript
function generateAccessCode(): string {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
```

On creation, check the database for collision. Retry on collision. With 32^6 ≈ 1 billion possibilities, collisions should be vanishingly rare, but still check.

---

## 13. State Management

### Respondent local state
- Store in browser `localStorage` under key `endurance:[access_code]`
- Shape:
  ```json
  {
    "accessCode": "A7K2PQ",
    "answers": { "1a": 4, "1b": 3, "2a": 5, ... },
    "currentQuestionIndex": 7,
    "startedAt": "2026-04-22T10:00:00Z"
  }
  ```
- On each answer, also POST to `/api/respondent/answer` to persist server-side. If offline, answers are queued in localStorage and retry when online.
- On successful submit, clear the localStorage entry.

### Admin UI state
- Standard Next.js data fetching patterns. No need for global state management beyond React Server Components and React Query for client-side cache.

---

## 14. Non-functional Requirements

### Performance
- Respondent question screens must render in under 200ms after selection (snappy feel is critical for Typeform-style flow)
- Admin results page must render aggregated results in under 2 seconds even for 50-respondent assessments

### Accessibility
- v1 should meet basic WCAG AA: keyboard navigation on all screens, semantic HTML, ARIA labels on icon-only buttons, sufficient color contrast (check all text on colored backgrounds)
- Screen-reader pass not required for v1 but the structure shouldn't preclude it

### Security
- Admin auth over HTTPS only
- Admin passwords hashed with bcrypt (NextAuth handles this)
- Access codes are case-sensitive but matched case-insensitively (user convenience)
- SQL injection prevented by Prisma's parameterized queries
- CSRF protection via Next.js built-ins
- Rate limiting on code validation endpoint (prevent brute-force: max 5 attempts per IP per minute)
- Respondents cannot access any URL containing another respondent's data
- Individual responses never exposed identified to admins

### Browser support
- Last 2 versions of Chrome, Safari, Firefox, Edge
- Mobile Safari (iOS 15+), Chrome mobile (Android 10+)

### Data privacy
- Respondents' emails and names stored but never surfaced in results views
- Admin can delete an entire assessment (cascades to respondents and responses)
- No third-party analytics, no tracking pixels, no cookies beyond session auth

---

## 15. What's Out of Scope for v1

Explicit to prevent scope creep during the build:

- ❌ Multi-admin / multi-tenant UI (all admins see all assessments in v1 — add tenant scoping later)
- ❌ SSO / Google login
- ❌ Self-service (team-leader-initiated) assessments
- ❌ Arabic language support (English only)
- ❌ In-app notifications (email-only)
- ❌ Custom branding per client (Forefront-branded only)
- ❌ Export to PowerPoint (PDF only)
- ❌ Benchmarking across clients
- ❌ Historical comparisons (assessment over time)
- ❌ Admin-configurable question set (the 30 questions are locked)
- ❌ Reminder emails automation in v1 (can be manual resend from admin UI)
- ❌ Password reset flow for admins (done manually in database for v1; add self-serve later)
- ❌ Respondent ability to view results

These are all reasonable v2 additions, but not v1.

---

## 16. Build Order (Recommended Sequencing)

For Claude Code iterating toward a working product:

1. **Foundation** — Next.js + Tailwind + Prisma setup, database schema, seed an admin user
2. **Admin auth** — login page, session handling
3. **Admin dashboard + create assessment** — the form, respondent table entry, access code generation
4. **Respondent flow (happy path)** — code validation, welcome, question screens, review, submit
5. **Email sending (Resend integration)** — invitation emails on creation
6. **Admin monitoring page** — respondent status, resend, extend deadline
7. **Scoring logic** — pure functions, tested with sample data
8. **Deadline-close cron job + admin email**
9. **Results page — Summary section**
10. **Results page — Capability Profile section (grouped by pillar)**
11. **Results page — Focus Areas section with action items**
12. **Results page — Individual anonymized responses tab**
13. **PDF export**
14. **Polish pass** — loading states, error states, empty states, 404, mobile layout
15. **Rate limiting and security hardening**

Each step should end with a working, testable slice of the app. Don't build the full UI before wiring up data.

---

## 17. Sample Data for Testing

Use this profile for end-to-end testing of the results page:

- **Team of 5 respondents** (Respondent A through E)
- **Overall team score:** 3.03
- **Pillar team scores:** Agility 2.60 (Needs Work), Toughness 3.90 (Solid), Resilience 2.60 (Needs Work)
- **Weakest capabilities:**
  1. Offensive Readiness — 1.5 (Critical Gap)
  2. Decision Velocity — 2.0 (Needs Work)
  3. Adaptive Governance — 2.0 (Needs Work)
  4. Learning Discipline — 2.0 (Needs Work)
  5. Market & Signal Intelligence — 2.5 (Needs Work)

Seed script should populate one admin + one closed assessment with these scores for smoke-testing the results page.

---

## 18. Handoff Checklist

When Claude Code has a first working build, it should deliver:

- [ ] Working app deployed to a Vercel preview URL
- [ ] Admin account credentials for Forefront to log in and try
- [ ] One seeded closed assessment with sample data for testing the results page
- [ ] A README with setup instructions, env var list, and local dev commands
- [ ] Notes on any decisions made that weren't in this spec (so Forefront can review and adjust)

---

**End of spec.**

If any requirement is ambiguous, choose the option that best matches a consulting-firm-grade product used in boardrooms. When in doubt, prefer simplicity over cleverness.

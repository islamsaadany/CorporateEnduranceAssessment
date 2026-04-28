# 11 — Anonymity and Privacy

**Version:** 0.1
**Last updated:** 2026-04-28

---

> The full data-handling contract: what's collected, who can see what, what's sent where, and where the boundaries are. Privacy is a design principle of the product — the rules below are not optional polish, they are core to what makes the assessment trustworthy to respondents.

---

## 1. Privacy posture in one paragraph

The Endurance Assessment is **organizational**, not personal. Individual respondents fill out the assessment to contribute to a team-level result. They are never named in the report; the admin sees aggregate scores, anonymized per-respondent letters with demographics, and AI-generated interpretations. Names, when provided, never leave the database — they are not in the report, not in the PDF, and not sent to AI providers. Filtered views require ≥3 respondents to render, so segments are never small enough to re-identify.

---

## 2. What's stored

| Data | Where stored | Who can see it |
|------|--------------|----------------|
| Admin email + password hash | `admins` table | Admins themselves (their own); super admin (all admins, list view; never sees other admins' passwords) |
| Assessment metadata (client name, deadline, status) | `assessments` table | All admins |
| Department list per assessment | `departments` table | All admins (in the codes table + filter UI); respondents (the dropdown they pick from) |
| Per-respondent access code | `respondents.access_code` | All admins (in the codes table); respondent themselves |
| Respondent name (optional) | `respondents.full_name` | All admins (in the codes table + edit drawer); never in report or PDF or AI prompt |
| Respondent demographics (department, level, tenure) | `respondents.*` | All admins (in the codes table + report); sent to AI labeled by letter |
| Respondent timestamps (started, submitted) | `respondents.*` | All admins (in the codes table + audit log) |
| Per-question Likert ratings | `responses` table | All admins (in the anonymized individuals heatmap, by letter); sent to AI in band-summarized form (no integer scores) |
| Aggregated scores (computed live, not stored) | computed | All admins via the report |
| Cached AI reports | `generated_reports` table | All admins via the report; super admin via global audit log |
| Audit log entries | `audit_log` table | All admins for their assessments; super admin globally |
| AI provider settings (provider name + encrypted API key) | `settings` table | Super admin only |

---

## 3. Who sees what (role matrix)

### Respondent
| Surface | Visible? | Notes |
|---------|----------|-------|
| Their own code, their own demographics, their own answers (during/before submit) | ✓ | Via localStorage + server |
| Their own data after submit | ✗ | Confirmation screen only — no return path to their own answers |
| Other respondents' anything | ✗ | Never |
| Aggregated team report | ✗ | Admin only |
| AI-generated content | ✗ | Admin only |

### Admin (regular)
| Surface | Visible? | Notes |
|---------|----------|-------|
| All assessments (no tenant scoping in v1) | ✓ | All admins see all assessments |
| Codes for any assessment | ✓ | Codes table on assessment detail |
| Respondent names (when provided) | ✓ | Codes table only — never in report/PDF/AI |
| Respondent demographics | ✓ | Codes table + report (anonymized in report) |
| Numerical report (any filter) | ✓ | Subject to ≥3 anonymity floor per filter |
| AI report content (when generated) | ✓ | Same as above |
| Anonymized individuals heatmap | ✓ | Letters + demographics, no names |
| Per-respondent answer values (post-closure edit drawer) | ✓ | Necessary for editing; identified internally |
| Audit log for assessments they have touched | ✓ | Per-assessment Activity tab |
| AI provider settings | ✗ | Super admin only |
| Other admins' password hashes / login activity | ✗ | Super admin only |

### Super admin
Everything a regular admin sees, plus:
| Surface | Visible? |
|---------|----------|
| Admin management (list, add, deactivate) | ✓ |
| AI provider settings | ✓ |
| Global audit log (all assessments + admin-management events) | ✓ |

---

## 4. What's never shown

### 4.1 In the report (any filter, any view)

- Respondent **names**
- Respondent **access codes**
- Respondent **specific Likert ratings** as integers (only band-level interpretation)
- Linkages between letter labels (Respondent A) and identity (the same person could be Respondent A in one report load and Respondent C in another — assignment is per-render, not persistent)

### 4.2 In the AI prompt

- Respondent **names** — never sent to LLM
- Respondent **codes** — never sent
- Respondent **email addresses** — not collected
- Respondent **specific integer Likert ratings** per question — only band-level summaries are passed
- Organization-specific facts the AI was not told (the AI must not invent these)

### 4.3 In the PDF export

- Same exclusions as the report (PDF is a render of the report)
- Plus: PDF metadata (author, creator) does not include any identifying respondent data

### 4.4 In the audit log

- Individual Likert rating values, except in `respondent_answer_edited` events where old/new values are necessary for the edit's traceability
- API keys, password hashes, or any other credential material
- Internal IDs are referenced; the log avoids exposing raw credentials

---

## 5. Anonymity floor (≥3)

### 5.1 Rule

Any view (company-wide or filtered) requires **≥3 submitted respondents** in scope to display. Below the floor, the view is locked.

### 5.2 Why ≥3 (not 1, 2, or 5)

- **1–2 respondents:** statistically meaningless and effectively re-identifying — anyone reading would map the score back to a specific person they know.
- **≥3:** the practical floor for plausible deniability — a reader cannot point at a specific person and say "this is their answer."
- **≥5 (alternative):** more conservative, but in this product the typical respondent count is 5–20 senior leaders. Setting ≥5 would lock too many useful segments. v2 may revisit.

### 5.3 What's locked when floor is not met

Everything: hero, capability profile, focus areas, anonymized individuals heatmap. Lock card replaces the entire report area with messaging directing the admin to clear or adjust the filter.

### 5.4 Comparison view

In comparison view, each side independently checked. If side A has 3 respondents and side B has 2, side A renders normally and side B shows the lock card; both sides can be re-filtered.

---

## 6. Privacy disclosure to respondents

### 6.1 Welcome screen line

Per `08_respondent_workflows.md` section 3:

> *"Your responses are anonymized and aggregated. The team report uses AI assistance to interpret patterns. Your name (if provided) is never shared with the AI."*

### 6.2 What this discloses

- Anonymization (no names in report)
- Aggregation (responses combined with others)
- AI assistance (AI reads anonymized data to write recommendations)
- Name protection (name stays in the database, not exposed)

### 6.3 What this does not say (but is implicit)

- That data is stored in a database (Neon Postgres)
- That backups exist (per Vercel/Neon defaults)
- That code distribution is the admin's responsibility (this is the admin's problem, not the respondent's)
- That no email is ever sent (no need to disclose — there's nothing to disclose)

---

## 7. AI privacy contract

Per `14_ai_prompts.md` section 7:

The LLM **receives**:
- Filter description string
- Aggregated scores per pillar/capability **as band names** (never integers)
- Spread per capability
- Top-5 weakest capabilities (by band)
- Anonymized individuals labeled by **letter** (Respondent A, B, C…) with their demographics
- Per-individual capability scores **as bands** (never integers)
- Sample size

The LLM **never** receives:
- Names
- Codes
- Email addresses (not collected anyway)
- Per-question integer ratings
- Organization-specific facts the prompt does not include

### 7.1 LLM provider data retention

Different providers handle data retention differently. The application does not control this. The privacy disclosure on the welcome screen acknowledges AI use; the admin should be aware of the provider's policy when configuring (Gemini / Claude / OpenAI all have published policies about training-data use of API inputs — admins should review these for their compliance posture).

This is documented for transparency; v1 does not include a provider-policy summary screen, but `15_report_generation_and_caching.md` section 8 mentions the provider config surface.

---

## 8. Encryption

| Data | Encryption |
|------|------------|
| In transit (all client↔server) | TLS 1.2+ via HTTPS (enforced by Vercel) |
| Admin password | bcrypt (handled by NextAuth) |
| AI provider API keys | AES-256 at rest in DB; master key in env var (`AI_KEY_ENCRYPTION_SECRET` or similar) |
| Database backups | Per Neon's default backup encryption |
| LLM API key in transit to provider | TLS via provider SDK |
| Session cookies | HttpOnly, SameSite=Lax, Secure in prod |

---

## 9. Data retention

### 9.1 Default retention

All data persists indefinitely in v1. There is no auto-deletion mechanism.

### 9.2 Manual deletion

Admins **cannot** delete an assessment with submitted responses in v1 (avoid accidental data loss). Super admin has manual DB intervention as the escape hatch.

### 9.3 Respondent right to deletion

Not implemented in v1. If a respondent contacts the admin requesting deletion of their submission, the admin would manually delete that respondent's row via DB intervention (with audit-log capture). This is acknowledged as a v2 candidate for a self-service flow.

### 9.4 Cached AI reports

Cached AI reports persist with the assessment indefinitely. Invalidated cache rows (superseded by regeneration) are kept for traceability.

---

## 10. Audit log scope

### 10.1 What's captured

Per `07_admin_workflows.md` Flow J:

- Admin actions: create, edit, delete (where applicable), generate, configure
- Respondent lifecycle: started, submitted (timestamps only)
- Edits to respondent data post-closure: old/new values
- AI report events: generated, regenerated, invalidated, fallback used
- PDF exports
- Admin management (super admin only): admins added, deactivated; AI provider changed

### 10.2 What's NOT captured

- Individual Likert rating values (except in edit events, where they're the only way to log what changed)
- Successful login events (only failed-login attempts logged for rate limiting)
- Read-only browsing actions ("admin viewed results page X")
- Filter changes on the report (high cardinality, low value)

### 10.3 Retention

Audit log persists indefinitely. v2 candidate: archival policy after N months.

---

## 11. Compliance posture (informational, not contractual)

This product is designed for use by Forefront Consulting with their clients' senior leadership teams. It is not designed as a regulated-industry tool (HIPAA, SOC 2, ISO 27001 etc.) in v1.

- **GDPR-style anonymization principles** are followed even though this is not a GDPR product:
  - Data minimization (only collect what's needed)
  - Purpose limitation (data used only for the assessment + report)
  - Privacy disclosure on the welcome screen
  - Right to deletion handled manually (v2 candidate for self-service)
- **Sensitive data (names, codes, API keys)** are encrypted at rest where applicable
- **No third-party telemetry, analytics, or tracking pixels**
- **No cookies beyond session auth**

If a future client requires formal compliance certification, the architecture should support it (the patterns in this file support it), but certification work is out of scope for v1.

---

## 12. Threat model (brief)

| Threat | Mitigation |
|--------|------------|
| Code brute-force by malicious respondent | Rate limit (5 attempts / IP / minute), failed-attempt audit log |
| Admin session hijack | Secure session cookies, NextAuth defaults |
| Admin enumeration | Generic login error messaging |
| API key leak | AES-256 at rest, never logged, masked in UI |
| LLM exfiltration of sensitive data | Strip names + integer scores before sending to LLM |
| Filter probing for re-identification | ≥3 anonymity floor on every view |
| URL hand-crafted to bypass UI | Server-side validation of all filter parameters and access checks |
| Disgruntled admin exporting all data | Audit log captures every PDF export and AI generation |
| Database compromise | Neon's encryption-at-rest + bcrypt for passwords + AES for API keys means leaked DB doesn't yield plaintext credentials |

---

## 13. Glossary cross-reference

For terminology used here, see `13_glossary.md`:
- Anonymity floor, Anonymized individual, Audit log, Privacy disclosure

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 2026-04-28 | Initial. Privacy posture summary, data-storage matrix, role-by-role visibility matrix, anonymity floor (≥3) rationale, AI privacy contract, encryption details, retention policy (indefinite in v1), audit log scope (no individual answer values except in edit events), threat model. |

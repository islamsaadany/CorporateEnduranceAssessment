# 14 — AI Prompts

**Version:** 0.1
**Last updated:** 2026-04-28

---

> The system prompt, user prompt template, validation rules, and fallback content for AI-generated reports. Refining this file refines report quality without touching code. Bump the version on every meaningful prompt change.

---

## 1. What the AI generates in v1

Two artifacts, returned as a single structured JSON response:

1. **Executive summary** — one paragraph (≤ 120 words) that interprets the team-level result and points to the top focus area. Filter-aware.
2. **Adapted action items per focus-area capability** — for each of the top-5 focus areas, exactly **2** action items, each ≤ 25 words. Filter-aware, spread-aware, sample-size-aware.

Anything else (full pillar narrative, comparison narratives, individual interpretations) is out of scope for v1 — see `Plan & Progress/execution-plan.md` section 6.

---

## 2. System prompt

> This is the role-and-tone instruction sent to the LLM as the system message (or `systemInstruction` for Gemini). Edit carefully — small changes here ripple through every generated report.

```
You are a senior consultant at Forefront Consulting writing a brief board-grade report for a client's leadership team. The client has just completed an Endurance Assessment that measures the organization across three pillars — Agility (sense and move), Toughness (absorb and hold), and Resilience (recover and renew) — and 15 underlying capabilities.

You will be given:
- The aggregated team scores per pillar and per capability
- The spread (max minus min) for each capability across respondents
- The top-5 weakest capabilities (the "focus areas") with their scores and spreads
- A list of the baseline action items already prepared for each focus-area capability
- The current filter context (which subset of respondents this report describes)
- The sample size (how many respondents are included in this view)
- An anonymized list of individual respondents labeled by letter, with their demographics (department, level, tenure band) and per-capability scores — never names

Your job is to produce TWO things, returned as a single JSON object:

1. An "executive_summary" paragraph: one paragraph, no more than 120 words, that interprets the result for this filter context and points to the leading concern. Reference the band names ("Critical Gap", "Needs Work", "Solid", "Strong") but never the numeric scores. If spread is high on a focus-area capability, acknowledge the divergence as itself a finding.

2. An "action_items" object: a dictionary keyed by capability name (one key per focus-area capability), with each value being an array of exactly 2 strings. Each string is one action item, no more than 25 words, action-oriented (verb-first when natural), in plain English. Use the baseline action items provided as your starting point — adapt them to the filter context and the spread/sample-size signals. Do not invent new categories of action; stay grounded in the methodology.

Hard rules:
- Never reference numeric scores in any output. Use band names instead.
- Never name individual respondents (you only see letters anyway, but do not refer to "Respondent A" in output).
- Never invent organization-specific facts (industry, history, competitors, internal initiatives) — you have not been told these.
- Never include emoji, exclamation marks, or marketing language.
- Use the executive register: serious, confident, plain English, active voice, short sentences.
- Always write in the third person about "the organization" or "this segment" — never address "you" or "your team" directly.
- Always return valid JSON conforming to the schema given in the user prompt. Do not wrap the JSON in markdown code fences.
- If you must include a caveat about sample size, do it once, in the executive_summary, not in every action item.
```

---

## 3. User prompt template

> This is the per-request prompt with the actual data substituted in. Variables are in `{{ double curly braces }}`.

```
Generate the Endurance Assessment report for the following segment.

FILTER APPLIED: {{filter_description}}
SAMPLE SIZE: {{n_respondents}} of {{n_total_respondents}} respondents in this segment
ASSESSMENT STATUS: {{collecting | closed}}
{{#if collecting}}NOTE: This is a draft based on partial responses. Treat findings as preliminary.{{/if}}

TEAM SCORES (segment-level):

Overall: {{overall_band}} ({{overall_score_band_only}})

By pillar:
- Agility — {{agility_band}}, capabilities ranked best to worst:
  {{#each agility_capabilities}}
  - {{name}} ({{band}}{{#if spread_high}}, range from {{min_band}} to {{max_band}} — team is split{{/if}})
  {{/each}}
- Toughness — {{toughness_band}}, capabilities ranked best to worst:
  {{#each toughness_capabilities}}
  - {{name}} ({{band}}{{#if spread_high}}, range from {{min_band}} to {{max_band}} — team is split{{/if}})
  {{/each}}
- Resilience — {{resilience_band}}, capabilities ranked best to worst:
  {{#each resilience_capabilities}}
  - {{name}} ({{band}}{{#if spread_high}}, range from {{min_band}} to {{max_band}} — team is split{{/if}})
  {{/each}}

TOP-5 FOCUS AREAS (weakest, ranked):
{{#each focus_areas}}
{{rank}}. {{capability}} ({{pillar}}) — {{band}}{{#if spread_high}}, team is split (range {{min_band}} to {{max_band}}){{/if}}
   Baseline action items (use as starting point — adapt to this segment):
   - {{baseline_item_1}}
   - {{baseline_item_2}}
{{/each}}

ANONYMIZED INDIVIDUAL RESPONSES (labeled by letter only — never names):
{{#each individuals}}
- Respondent {{letter}}: {{department}} · {{level}} · {{tenure_band}}
  Capability scores by band: {{capability_bands_summary}}
{{/each}}

OUTPUT JSON SCHEMA (return exactly this shape, valid JSON, no markdown fence):
{
  "executive_summary": "string, one paragraph, ≤120 words",
  "action_items": {
    "{{focus_area_1_capability_name}}": ["string ≤25 words", "string ≤25 words"],
    "{{focus_area_2_capability_name}}": ["string ≤25 words", "string ≤25 words"],
    "{{focus_area_3_capability_name}}": ["string ≤25 words", "string ≤25 words"],
    "{{focus_area_4_capability_name}}": ["string ≤25 words", "string ≤25 words"],
    "{{focus_area_5_capability_name}}": ["string ≤25 words", "string ≤25 words"]
  }
}

Generate the JSON now.
```

### Notes on the template

- `{{filter_description}}` — human-readable description of active filter. Examples: `"Company-wide (all departments, all levels, all tenures)"`; `"Sales department, Manager level, all tenures"`; `"Engineering × Senior Leader × 4–7y tenure"`.
- `{{overall_score_band_only}}` — pass *only* the band string (`"Solid"`), never the numeric score. The system prompt forbids numeric references in output; we don't even feed them in.
- `{{capability_bands_summary}}` — for individual rows, format as `"3 in Critical Gap, 4 in Needs Work, 6 in Solid, 2 in Strong"` rather than per-capability listings (keeps prompt size manageable).
- `{{spread_high}}` — true when capability spread > 1.0; surfaces "team is split" framing.

### Generation parameters

| Parameter | Value | Why |
|-----------|-------|-----|
| `temperature` | 0.3 | Low enough for structural consistency, high enough to avoid robotic repetition across capabilities |
| `max_tokens` (or equivalent) | 2000 | Generous headroom for the full JSON; typical responses are ~500 tokens |
| `response_format` | JSON object (where supported, e.g., OpenAI / Gemini structured output) | Reduces parsing failures |

---

## 4. Validation rules

After receiving the LLM response, the server validates before caching/displaying:

| Rule | Behavior on fail |
|------|------------------|
| Response is valid JSON parsable | Retry once with same prompt |
| Top-level keys exactly: `executive_summary` (string), `action_items` (object) | Retry once |
| `executive_summary` length ≤ 120 words | Truncate at sentence boundary; warn in audit log |
| `action_items` has exactly the 5 focus-area capability names as keys | Retry once |
| Each capability key has exactly 2 strings | Retry once |
| Each action item ≤ 25 words | Truncate at word boundary; warn in audit log |
| **No numeric score references** — regex `\b\d\.\d{1,2}\b` (e.g., "3.05", "1.5") in any string field | Strip the offending sentence; if more than one offender, retry |
| **No first-person address** — the strings "you ", "your ", "we " (case-insensitive, word-boundary) | Strip-and-retry once; fallback to baseline if persists |
| **No em dashes** — Unicode `—` | Replace with `. ` (sentence break) |
| **No emoji or exclamation marks** | Strip; warn in audit log |

If any retry fails or the second attempt also fails validation, the system falls back to baseline action items + a static executive summary string (see section 5). The fallback is **not cached** — admin can attempt regeneration and may succeed on a future call.

---

## 5. Fallback content

Used when AI generation fails after retry, or when AI is disabled/unconfigured.

### 5.1 Fallback executive summary

Static strings keyed by the team overall band (same as the band-keyed interpretation strings in `03_scoring_and_bands.md` section 5). Pre-pended with a sample-size disclaimer when applicable.

```json
{
  "Critical Gap": "The organization is in a fragile position and needs urgent intervention across multiple pillars.",
  "Needs Work": "The organization has real gaps that threaten endurance. Investment is needed.",
  "Solid": "The organization is generally sound, with specific gaps to address.",
  "Strong": "The organization is in a position of strength — maintain and leverage."
}
```

When N < (full respondent count), the fallback prepends: *"Based on {N} of {total} respondents — interpret as preliminary."*

### 5.2 Fallback action items

The baseline action items in `04_recommendations.md` section 3, used verbatim. No filter adaptation in fallback mode.

### 5.3 UI indication of fallback

When the report is rendered from fallback rather than AI:
- Subtle line under the executive summary: *"Generated from baseline content — AI assistance unavailable."*
- A small "Regenerate with AI" button (only enabled when AI is configured)
- Audit log captures: `event_type: "ai_fallback_used"` with reason

---

## 6. Token budgeting

Rough token estimates per call (using GPT/Gemini-equivalent tokenizers):

| Component | Tokens |
|-----------|--------|
| System prompt | ~600 |
| User prompt — baseline (no individuals) | ~800 |
| User prompt — individuals section (per respondent ~80 tokens) | 80 × N |
| Output | ~500 |
| **Total per call (10 respondents)** | ~2700 in + ~500 out = ~3200 |
| **Total per call (50 respondents)** | ~5900 in + ~500 out = ~6400 |

At Gemini 2.5 Flash pricing (well under $0.01 per call for typical sizes), the cost per cached report is negligible. **Caching is more about avoiding redundant work than token cost** — the incentive is consistency (admin sees the same recommendations on repeat views) and speed (instant on cached, ~5–15s on fresh).

---

## 7. Privacy contract with the LLM

The LLM **never** receives:

- Respondent names (collected as optional during demographics)
- Respondent access codes
- Email addresses (we don't even collect these in v1)
- The numeric Likert ratings of any individual question (only band-level summaries)

The LLM **does** receive:

- Anonymized respondent letters (A, B, C…) with their demographics: department, level, tenure band
- Per-respondent capability score *bands* (not numerics)
- Aggregated team scores by band
- Filter context describing which segment

The privacy disclosure on the respondent welcome screen (`08_respondent_workflows.md` section 3) is the user-facing acknowledgment that AI assistance is used. The full data-handling specification is in `11_anonymity_and_privacy.md`.

---

## 8. Provider-specific notes

### Gemini (default)
- Pass system prompt as `systemInstruction` on the model config.
- Use `responseMimeType: "application/json"` + `responseSchema` for structured output if SDK version supports it.
- `gemini-2.5-flash` is the default model.

### Claude
- Pass system prompt as the `system` parameter.
- Use the `tools` mechanism with a forced JSON-shaped tool to get structured output, OR rely on prompt-level JSON instruction with strict validation.
- `claude-haiku-4-5` is the default for cost; `claude-sonnet-4-6` is the upgrade for quality.

### OpenAI
- Pass system prompt as a `role: "system"` message.
- Use `response_format: { type: "json_object" }` for structured output.
- `gpt-4.1-mini` is the default for cost; `gpt-5` for quality.

The provider abstraction layer (`src/lib/ai/*`) encapsulates these differences. The prompt content (sections 2 and 3) does NOT change across providers.

---

## 9. Refinement workflow

When the user asks for a prompt change:

1. Edit sections 2 / 3 / 4 / 5 in this file as needed
2. Bump the version in the file header
3. Add a changelog entry in section 11
4. **Note in the entry whether existing cached reports should be invalidated** — by default they are not (admins regenerate manually); for major prompt overhauls, recommend an admin-initiated bulk-regenerate or note that the next admin-triggered generation will pick up the new prompt
5. Update `15_report_generation_and_caching.md` if cache behavior changes

---

## 10. Glossary cross-reference

For terminology used here, see `13_glossary.md`:
- AI report, Cached report, Filter signature, Watermark, Draft, Final, Anonymized individual

---

## 11. Changelog

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 2026-04-28 | Initial draft — system prompt, user template, validation rules, fallback content, provider notes. |

/**
 * Spec-14 prompt builder.
 *
 * Provider-neutral. Returns a `{ system, user }` pair the adapters in
 * gemini.ts / claude.ts / openai.ts feed into their respective JSON-mode
 * APIs. The exact wording mirrors product-spec/14_ai_prompts.md § 2 + § 3
 * and must be edited there (with a version bump) before being edited here.
 *
 * Names are stripped via anonymizeRespondents() before any string formatting.
 * The output strings never contain names.
 */

import {
  BAND_THRESHOLDS,
  BASELINE_ACTION_ITEMS,
  CAPABILITY_LABELS,
  CAPABILITY_ORDER,
  CAPABILITY_TO_PILLAR,
  LEVEL_LABELS,
  PILLAR_LABELS,
  PILLAR_ORDER,
  TENURE_LABELS,
  bandFor,
} from '@/data/constants'
import type { BandKey, CapabilityKey, PillarKey } from '@/data/types'
import { anonymizeRespondents, type AnonymizedRespondent } from './strip-names'
import type { GenerateReportInput } from './types'

/**
 * Mirrors product-spec/14_ai_prompts.md § 2. If you change this, bump
 * Settings.promptVersion and the spec file's version header in lockstep
 * — see CLAUDE.md "After Making Changes to AI Prompts".
 */
const SYSTEM_PROMPT = `You are a senior consultant at Forefront Consulting writing a brief board-grade report for a client's leadership team. The client has just completed an Endurance Assessment that measures the organization across three pillars — Agility (sense and move), Toughness (absorb and hold), and Resilience (recover and renew) — and 15 underlying capabilities.

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
- If you must include a caveat about sample size, do it once, in the executive_summary, not in every action item.`

/** Spread > this triggers the "team is split" framing per spec 14 § 3 notes. */
const SPREAD_HIGH_THRESHOLD = 1.0

export interface BuiltPrompt {
  system: string
  user: string
  /**
   * The capability *labels* the LLM is expected to produce as keys in
   * action_items, in spec-14 ranked order. Slice 7.4 will use this list
   * to validate the response shape before caching.
   */
  expectedActionItemKeys: string[]
  /**
   * The anonymized respondent payload that was serialized into the prompt.
   * Slice 7.3 stores this in GeneratedReport.inputJson as the audit trail
   * (Q4/A — store the *stripped* version, not the pre-strip).
   */
  anonymizedRespondents: AnonymizedRespondent[]
}

export function buildPrompt(input: GenerateReportInput): BuiltPrompt {
  const anonymized = anonymizeRespondents(input.respondents)
  const user = formatUserPrompt(input, anonymized)
  const expectedActionItemKeys = input.aggregates.focusAreas.map((c) => CAPABILITY_LABELS[c])
  return {
    system: SYSTEM_PROMPT,
    user,
    expectedActionItemKeys,
    anonymizedRespondents: anonymized,
  }
}

// ─── User prompt formatting ──────────────────────────────────────────────

function formatUserPrompt(input: GenerateReportInput, anon: AnonymizedRespondent[]): string {
  const { aggregates, filterDescription, matchingFilter, totalSubmitted, assessmentStatus } = input

  const lines: string[] = []
  lines.push('Generate the Endurance Assessment report for the following segment.')
  lines.push('')
  lines.push(`FILTER APPLIED: ${filterDescription}`)
  lines.push(`SAMPLE SIZE: ${matchingFilter} of ${totalSubmitted} respondents in this segment`)
  lines.push(`ASSESSMENT STATUS: ${assessmentStatus}`)
  if (assessmentStatus === 'collecting') {
    lines.push('NOTE: This is a draft based on partial responses. Treat findings as preliminary.')
  }
  lines.push('')
  lines.push('TEAM SCORES (segment-level):')
  lines.push('')
  lines.push(`Overall: ${bandLabelOrInsufficient(aggregates.overall.band)}`)
  lines.push('')
  lines.push('By pillar:')

  for (const p of PILLAR_ORDER) {
    const pillar = aggregates.pillars[p]
    lines.push(`- ${PILLAR_LABELS[p]} — ${bandLabelOrInsufficient(pillar.band)}, capabilities ranked best to worst:`)
    const caps = capabilitiesForPillar(p)
    const sorted = caps
      .map((c) => ({ key: c, result: aggregates.capabilities[c] }))
      .filter((x) => x.result.score !== null)
      .sort((a, b) => (b.result.score! - a.result.score!))
    for (const { key, result } of sorted) {
      lines.push(`  - ${CAPABILITY_LABELS[key]} (${formatCapabilityBands(result)})`)
    }
    // Capabilities with insufficient data are listed last so the model
    // sees them but knows they're not scored.
    const insufficient = caps.filter((c) => aggregates.capabilities[c].score === null)
    for (const c of insufficient) {
      lines.push(`  - ${CAPABILITY_LABELS[c]} (insufficient data)`)
    }
  }
  lines.push('')

  lines.push('TOP-5 FOCUS AREAS (weakest, ranked):')
  if (aggregates.focusAreas.length === 0) {
    lines.push('  (No focus areas identified — every capability either has insufficient data or is in the top scores.)')
  } else {
    aggregates.focusAreas.forEach((capKey, i) => {
      const r = aggregates.capabilities[capKey]
      const pillar = CAPABILITY_TO_PILLAR[capKey]
      lines.push(
        `${i + 1}. ${CAPABILITY_LABELS[capKey]} (${PILLAR_LABELS[pillar]}) — ${formatCapabilityBands(r)}`,
      )
      lines.push('   Baseline action items (use as starting point — adapt to this segment):')
      for (const item of baselineFor(capKey)) {
        lines.push(`   - ${item}`)
      }
    })
  }
  lines.push('')

  lines.push('ANONYMIZED INDIVIDUAL RESPONSES (labeled by letter only — never names):')
  if (anon.length === 0) {
    lines.push('  (No individual rows in this segment.)')
  } else {
    for (const r of anon) {
      const demo = [r.department ?? 'unknown department', r.level ? LEVEL_LABELS[r.level] : 'unknown level', r.tenure ? TENURE_LABELS[r.tenure] : 'unknown tenure'].join(' · ')
      lines.push(`- Respondent ${r.letter}: ${demo}`)
      lines.push(`  Capability scores by band: ${capabilityBandsSummary(r.capabilities)}`)
    }
  }
  lines.push('')

  lines.push('OUTPUT JSON SCHEMA (return exactly this shape, valid JSON, no markdown fence):')
  lines.push('{')
  lines.push('  "executive_summary": "string, one paragraph, ≤120 words",')
  lines.push('  "action_items": {')
  if (aggregates.focusAreas.length === 0) {
    lines.push('    // No focus areas → return an empty object {}.')
  } else {
    aggregates.focusAreas.forEach((capKey, i) => {
      const trail = i < aggregates.focusAreas.length - 1 ? ',' : ''
      lines.push(`    "${CAPABILITY_LABELS[capKey]}": ["string ≤25 words", "string ≤25 words"]${trail}`)
    })
  }
  lines.push('  }')
  lines.push('}')
  lines.push('')
  lines.push('Generate the JSON now.')

  return lines.join('\n')
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function capabilitiesForPillar(p: PillarKey): CapabilityKey[] {
  return CAPABILITY_ORDER.filter((c) => CAPABILITY_TO_PILLAR[c] === p)
}

function bandLabelOrInsufficient(band: BandKey | null): string {
  if (!band) return 'insufficient data'
  return labelForBand(band)
}

function labelForBand(band: BandKey): string {
  return BAND_THRESHOLDS.find((b) => b.key === band)?.label ?? 'insufficient data'
}

function formatCapabilityBands(r: { band: BandKey | null; spread: number | null; min: number | null; max: number | null; insufficient: boolean }): string {
  if (r.insufficient || r.band === null) return 'insufficient data'
  const baseLabel = labelForBand(r.band)
  const spreadHigh = r.spread !== null && r.spread > SPREAD_HIGH_THRESHOLD
  if (!spreadHigh) return baseLabel
  const minBand = r.min !== null ? labelForBand(bandFor(r.min)) : null
  const maxBand = r.max !== null ? labelForBand(bandFor(r.max)) : null
  if (minBand && maxBand) {
    return `${baseLabel}, range from ${minBand} to ${maxBand} — team is split`
  }
  return `${baseLabel} — team is split`
}

/**
 * Per spec 14 § 3 notes: serialize a respondent's 15-capability vector as a
 * compact band tally rather than per-capability listings, to keep prompt
 * size manageable on large samples.
 */
function capabilityBandsSummary(caps: Record<CapabilityKey, number | null>): string {
  const tally: Record<BandKey, number> = {
    critical_gap: 0,
    needs_work: 0,
    solid: 0,
    strong: 0,
  }
  let unrated = 0
  for (const k of CAPABILITY_ORDER) {
    const v = caps[k]
    if (v === null || v === undefined) unrated++
    else tally[bandFor(v)]++
  }
  const parts: string[] = []
  for (const b of BAND_THRESHOLDS) {
    parts.push(`${tally[b.key]} in ${b.label}`)
  }
  if (unrated > 0) parts.push(`${unrated} unrated`)
  return parts.join(', ')
}

function baselineFor(capKey: CapabilityKey): readonly [string, string] {
  return BASELINE_ACTION_ITEMS[capKey]
}

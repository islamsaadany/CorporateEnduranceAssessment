/**
 * Spec-14 prompt builder. Provider-neutral.
 *
 * Prompt v2 (2026-05-03): executive summary is an ARRAY of 3–5 correlation
 * bullets (not a paragraph), action items must cite at least one data
 * signal (spread, demographic pattern, filter context, or capability
 * tension), and the framing of baseline action items shifts from "use
 * as starting point" to "FOR REFERENCE — your output must be substantively
 * different, not paraphrases."
 *
 * The wording mirrors product-spec/14_ai_prompts.md § 2 + § 3 verbatim.
 * If you change either side you MUST bump CURRENT_PROMPT_VERSION below
 * AND mirror the change in the spec file with a changelog entry — see
 * CLAUDE.md "After Making Changes to AI Prompts".
 *
 * Names are stripped via anonymizeRespondents() before any string
 * formatting. Output strings never contain names.
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
 * Bumped on every meaningful prompt change. Cached reports written under
 * an older version still render but the UI shows a "Generated with prompt
 * v{N}; current is v{M} — regenerate for the latest framing" note. We
 * never silently invalidate per CLAUDE.md.
 *
 * v1: Initial paragraph-style executive summary (spec 14 v0.1).
 * v2: Correlation bullets, signal-citation rule, anti-paraphrase framing
 *     (spec 14 v0.2).
 */
export const CURRENT_PROMPT_VERSION = 2

/**
 * Mirrors product-spec/14_ai_prompts.md § 2.
 */
const SYSTEM_PROMPT = `You are a senior consultant at Forefront Consulting writing a brief board-grade report for a client's leadership team. The client has just completed an Endurance Assessment that measures the organization across three pillars — Agility (sense and move), Toughness (absorb and hold), and Resilience (recover and renew) — and 15 underlying capabilities.

You will be given:
- The aggregated team scores per pillar and per capability (band labels only)
- The spread (how much respondents disagree) for each capability
- The top-5 weakest capabilities (the "focus areas") with their bands and spread signals
- Baseline action items the consultant typically uses for each focus-area capability — FOR REFERENCE ONLY, not for paraphrasing
- The current filter context (which subset of respondents this report describes)
- The sample size (how many respondents are included in this view)
- An anonymized list of individual respondents labeled by letter, with their demographics (department, level, tenure band) and per-capability score band tallies — never names

Your job is to produce TWO things, returned as a single JSON object:

1. An "executive_summary": an ARRAY of 3 to 5 short bullet strings. Each bullet must surface a CORRELATION — a relationship between two or more data points the reader could not have spotted by glancing at the numbers. Acceptable correlation types include:
   - Pillar interplay ("Toughness rates Solid but Resilience rates Needs Work — the organization can absorb shocks but struggles to renew afterward.")
   - Within-pillar tension ("Decision Velocity is Strong while Adaptive Governance is Needs Work — leaders move fast but rules-of-the-game haven't caught up.")
   - Demographic gap ("Senior leaders rate Risk Discipline Solid; managers rate it Needs Work — a meaningful gap in shared visibility.")
   - Spread as signal ("Trust & Collaboration shows the widest disagreement of any capability — some respondents see strong cross-functional ties, others see silos.")
   - Focus-area concentration ("Three of the top-5 focus areas sit in Resilience, suggesting renewal is the binding constraint, not raw operational toughness.")
   Each bullet ≤ 30 words. NO bullet may merely state a single capability's band — the value of the bullet IS the relationship.

2. An "action_items" object: a dictionary keyed by capability name (one key per focus-area capability), with each value being an array of exactly 2 strings.
   Each action item ≤ 40 words. Each action item MUST cite at least one of:
   - A spread signal (when the team is split on this capability)
   - A demographic pattern (which level, department, or tenure band drives the gap)
   - The filter context (e.g., "for this Sales × Manager segment...")
   - A tension with another capability (named explicitly)
   Action items must be SUBSTANTIVELY DIFFERENT from the baseline action items provided. If your action item could be lifted into any other organization's report unchanged, it has not been adapted — produce something that names a data signal.

Hard rules:
- Never reference numeric scores in any output. Use band names ("Critical Gap", "Needs Work", "Solid", "Strong") instead.
- Never name individual respondents (you only see letters anyway, but do not refer to "Respondent A" in output).
- Never invent organization-specific facts (industry, history, competitors, internal initiatives) — you have not been told these.
- Never include emoji, exclamation marks, or marketing language.
- Use the executive register: serious, confident, plain English, active voice.
- Always write in the third person about "the organization" or "this segment" — never address "you" or "your team" directly.
- Always return valid JSON conforming to the schema given in the user prompt. Do not wrap the JSON in markdown code fences.
- If you must include a caveat about sample size, do it in one bullet of the executive_summary, not in every action item.`

/** Spread > this triggers the "team is split" framing per spec 14 § 3 notes. */
const SPREAD_HIGH_THRESHOLD = 1.0

export interface BuiltPrompt {
  system: string
  user: string
  /**
   * The capability *labels* the LLM is expected to produce as keys in
   * action_items, in spec-14 ranked order. The validator uses this to
   * check the response shape before caching.
   */
  expectedActionItemKeys: string[]
  /**
   * The anonymized respondent payload that was serialized into the prompt.
   * Stored in GeneratedReport.inputJson as the audit trail (Q4/A — store
   * the *stripped* version, not the pre-strip).
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
      lines.push('   Baseline action items the consultant typically uses (FOR REFERENCE ONLY — your action items must be substantively different, not paraphrases):')
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
  lines.push('  "executive_summary": [')
  lines.push('    "Correlation bullet 1, ≤30 words, names a relationship between data points.",')
  lines.push('    "Correlation bullet 2, ≤30 words, names a relationship between data points.",')
  lines.push('    "Correlation bullet 3, ≤30 words, names a relationship between data points."')
  lines.push('    // 3 to 5 entries total. Each must be a relationship, not a single-capability statement.')
  lines.push('  ],')
  lines.push('  "action_items": {')
  if (aggregates.focusAreas.length === 0) {
    lines.push('    // No focus areas → return an empty object {}.')
  } else {
    aggregates.focusAreas.forEach((capKey, i) => {
      const trail = i < aggregates.focusAreas.length - 1 ? ',' : ''
      lines.push(`    "${CAPABILITY_LABELS[capKey]}": [`)
      lines.push(`      "Action 1 ≤40 words, MUST cite a data signal (spread, demographic pattern, filter context, or named capability tension).",`)
      lines.push(`      "Action 2 ≤40 words, MUST cite a data signal (spread, demographic pattern, filter context, or named capability tension)."`)
      lines.push(`    ]${trail}`)
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

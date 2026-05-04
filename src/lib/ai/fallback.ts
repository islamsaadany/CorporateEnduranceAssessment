/**
 * Spec 14 § 5 — fallback content for when AI generation fails after retry.
 *
 * Returns a fully-formed AiReportOutput so the UI can render the same
 * shape it would for a successful AI call. Per spec 14 § 5 the fallback
 * is NOT cached; the route returns it transiently and the user can hit
 * Retry to attempt regeneration.
 */

import { BASELINE_ACTION_ITEMS } from '@/data/constants'
import type { AiReportOutput, BandKey, CapabilityKey } from '@/data/types'

const SUMMARY_BY_BAND: Record<BandKey, string> = {
  critical_gap:
    'The organization is in a fragile position and needs urgent intervention across multiple pillars.',
  needs_work:
    'The organization has real gaps that threaten endurance. Investment is needed.',
  solid: 'The organization is generally sound, with specific gaps to address.',
  strong: 'The organization is in a position of strength — maintain and leverage.',
}

const SUMMARY_NO_BAND =
  'Insufficient rated answers to summarize the organization at the team level. Review the per-capability detail below.'

export interface FallbackInput {
  overallBand: BandKey | null
  matchingFilter: number
  totalSubmitted: number
  focusAreas: CapabilityKey[]
}

export function buildFallback(input: FallbackInput): AiReportOutput {
  const baseSummary =
    input.overallBand !== null ? SUMMARY_BY_BAND[input.overallBand] : SUMMARY_NO_BAND

  // Spec 14 § 5.1: when N < total, prepend a sample-size disclaimer
  // as a separate bullet so the rest of the static summary stays
  // readable. Prompt v2 changed executive_summary to a bullet array.
  const summaryBullets: string[] = []
  if (input.matchingFilter < input.totalSubmitted) {
    summaryBullets.push(
      `Based on ${input.matchingFilter} of ${input.totalSubmitted} respondents — interpret as preliminary.`,
    )
  }
  summaryBullets.push(baseSummary)

  // v3 shape: each focus area has `observations` (empty in fallback) +
  // `actions` (the static baseline two-pack from constants). The UI's
  // baseline-action-items tier uses BASELINE_ACTION_ITEMS directly, so
  // the AI-tier `actions` here just mirror the baseline as a graceful
  // degradation when AI is unavailable.
  const focusAreas = input.focusAreas.map((capability) => ({
    capability,
    observations: [] as string[],
    actions: [...BASELINE_ACTION_ITEMS[capability]],
  }))

  return {
    executiveSummary: summaryBullets,
    focusAreas,
  }
}

// Tailwind class snippets keyed by BandKey. Centralized so a band that
// shows up on the hero, in the capability profile, in a focus card, and
// in the respondent heatmap all look the same.

import { BAND_THRESHOLDS } from '@/data/constants'
import type { BandKey } from '@/data/types'

export const BAND_LABEL: Record<BandKey, string> = Object.fromEntries(
  BAND_THRESHOLDS.map((b) => [b.key, b.label]),
) as Record<BandKey, string>

export const BAND_RANGE_LABEL: Record<BandKey, string> = Object.fromEntries(
  BAND_THRESHOLDS.map((b) => [b.key, `${b.min.toFixed(2)}–${b.max.toFixed(2)}`]),
) as Record<BandKey, string>

export const BAND_BG: Record<BandKey, string> = {
  critical_gap: 'bg-report-band-critical',
  needs_work: 'bg-report-band-needs',
  solid: 'bg-report-band-solid',
  strong: 'bg-report-band-strong',
}

export const BAND_TEXT: Record<BandKey, string> = {
  critical_gap: 'text-report-band-critical',
  needs_work: 'text-report-band-needs',
  solid: 'text-report-band-solid',
  strong: 'text-report-band-strong',
}

// Same hex as BAND_BG but as inline styles, used in places where the
// width is dynamic and Tailwind can't generate the class at build time.
export const BAND_HEX: Record<BandKey, string> = {
  critical_gap: '#C0392B',
  needs_work: '#E67E22',
  solid: '#D4A24C',
  strong: '#27AE60',
}

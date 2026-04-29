// Pillar / capability metadata + display lists.
// Source-of-truth for rules: product-spec/01_pillars_and_capabilities.md and product-spec/03_scoring_and_bands.md.
// If a value here disagrees with the spec, the spec wins — fix this file.

import type { BandKey, CapabilityKey, PillarKey } from './types'
import { Level, TenureBand } from '@prisma/client'

// ─── Pillars ──────────────────────────────────────────────────────────

export const PILLAR_ORDER: PillarKey[] = ['agility', 'toughness', 'resilience']

export const PILLAR_LABELS: Record<PillarKey, string> = {
  agility: 'Agility',
  toughness: 'Toughness',
  resilience: 'Resilience',
}

// ─── Capabilities ─────────────────────────────────────────────────────

// Order within each pillar matches product-spec/01.
export const CAPABILITY_ORDER: CapabilityKey[] = [
  // Agility
  'sensing',
  'decisiveness',
  'reconfiguration',
  'learning_velocity',
  'external_orientation',
  // Toughness
  'operational_discipline',
  'risk_posture',
  'conviction',
  'cost_capital_stewardship',
  'accountability',
  // Resilience
  'recovery',
  'wellbeing',
  'continuity',
  'adaptive_capacity',
  'trust',
]

export const CAPABILITY_LABELS: Record<CapabilityKey, string> = {
  sensing: 'Sensing',
  decisiveness: 'Decisiveness',
  reconfiguration: 'Reconfiguration',
  learning_velocity: 'Learning Velocity',
  external_orientation: 'External Orientation',
  operational_discipline: 'Operational Discipline',
  risk_posture: 'Risk Posture',
  conviction: 'Conviction',
  cost_capital_stewardship: 'Cost & Capital Stewardship',
  accountability: 'Accountability',
  recovery: 'Recovery',
  wellbeing: 'Wellbeing',
  continuity: 'Continuity',
  adaptive_capacity: 'Adaptive Capacity',
  trust: 'Trust',
}

export const CAPABILITY_TO_PILLAR: Record<CapabilityKey, PillarKey> = {
  sensing: 'agility',
  decisiveness: 'agility',
  reconfiguration: 'agility',
  learning_velocity: 'agility',
  external_orientation: 'agility',
  operational_discipline: 'toughness',
  risk_posture: 'toughness',
  conviction: 'toughness',
  cost_capital_stewardship: 'toughness',
  accountability: 'toughness',
  recovery: 'resilience',
  wellbeing: 'resilience',
  continuity: 'resilience',
  adaptive_capacity: 'resilience',
  trust: 'resilience',
}

// ─── Bands ────────────────────────────────────────────────────────────

// Inclusive lower / inclusive upper. Uniform across overall / pillar / capability.
export const BAND_THRESHOLDS: Array<{ key: BandKey; min: number; max: number; label: string }> = [
  { key: 'critical_gap', min: 1.0, max: 1.99, label: 'Critical Gap' },
  { key: 'needs_work', min: 2.0, max: 2.99, label: 'Needs Work' },
  { key: 'solid', min: 3.0, max: 3.99, label: 'Solid' },
  { key: 'strong', min: 4.0, max: 5.0, label: 'Strong' },
]

export function bandFor(score: number): BandKey {
  for (const b of BAND_THRESHOLDS) {
    if (score >= b.min && score <= b.max) return b.key
  }
  // Out-of-range scores should not occur given 1–5 input; clamp defensively.
  return score < 1 ? 'critical_gap' : 'strong'
}

// ─── Demographics ─────────────────────────────────────────────────────

export const LEVELS: Level[] = ['executive', 'senior_leader', 'manager', 'team_lead', 'individual_contributor']

export const LEVEL_LABELS: Record<Level, string> = {
  executive: 'Executive',
  senior_leader: 'Senior Leader',
  manager: 'Manager',
  team_lead: 'Team Lead',
  individual_contributor: 'Individual Contributor',
}

export const TENURE_BANDS: TenureBand[] = ['lt_1y', 'y1_3', 'y4_7', 'y8_15', 'gt_15y']

export const TENURE_LABELS: Record<TenureBand, string> = {
  lt_1y: '<1 year',
  y1_3: '1–3 years',
  y4_7: '4–7 years',
  y8_15: '8–15 years',
  gt_15y: '15+ years',
}

// ─── Anonymity guardrail ──────────────────────────────────────────────

export const MIN_RESPONDENTS_FOR_VIEW = 3

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

// Order matches the canonical numeric ID in product-spec/01 (1→5 within
// Agility, 6→10 within Toughness, 11→15 within Resilience).
export const CAPABILITY_ORDER: CapabilityKey[] = [
  // Agility
  'decision_velocity',
  'market_signal_intelligence',
  'adaptive_governance',
  'experimentation_muscle',
  'delegation_empowerment',
  // Toughness
  'leadership_strength_under_pressure',
  'financial_shock_absorption',
  'operational_continuity',
  'risk_compliance_discipline',
  'trust_collaboration',
  // Resilience
  'system_recoverability',
  'culture_of_grit_ownership',
  'learning_discipline',
  'strategic_adaptability',
  'offensive_readiness',
]

// Display labels — use these verbatim in UI, copy, and reports.
// Casing matches product-spec/01 ("Decision Velocity", not "decision velocity").
export const CAPABILITY_LABELS: Record<CapabilityKey, string> = {
  decision_velocity: 'Decision Velocity',
  market_signal_intelligence: 'Market & Signal Intelligence',
  adaptive_governance: 'Adaptive Governance',
  experimentation_muscle: 'Experimentation Muscle',
  delegation_empowerment: 'Delegation & Empowerment',
  leadership_strength_under_pressure: 'Leadership Strength Under Pressure',
  financial_shock_absorption: 'Financial Shock Absorption',
  operational_continuity: 'Operational Continuity',
  risk_compliance_discipline: 'Risk & Compliance Discipline',
  trust_collaboration: 'Trust & Collaboration',
  system_recoverability: 'System Recoverability',
  culture_of_grit_ownership: 'Culture of Grit & Ownership',
  learning_discipline: 'Learning Discipline',
  strategic_adaptability: 'Strategic Adaptability',
  offensive_readiness: 'Offensive Readiness',
}

export const CAPABILITY_TO_PILLAR: Record<CapabilityKey, PillarKey> = {
  decision_velocity: 'agility',
  market_signal_intelligence: 'agility',
  adaptive_governance: 'agility',
  experimentation_muscle: 'agility',
  delegation_empowerment: 'agility',
  leadership_strength_under_pressure: 'toughness',
  financial_shock_absorption: 'toughness',
  operational_continuity: 'toughness',
  risk_compliance_discipline: 'toughness',
  trust_collaboration: 'toughness',
  system_recoverability: 'resilience',
  culture_of_grit_ownership: 'resilience',
  learning_discipline: 'resilience',
  strategic_adaptability: 'resilience',
  offensive_readiness: 'resilience',
}

// ─── Likert scale ─────────────────────────────────────────────────────

// 1–4 Likert + "I don't know" (stored as NULL). No neutral midpoint —
// see decisions log entry "Likert scale" 2026-04-29.
export const LIKERT_VALUES = [1, 2, 3, 4] as const
export const LIKERT_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Strongly Disagree',
  2: 'Disagree',
  3: 'Agree',
  4: 'Strongly Agree',
}
// Sentinel for the "I don't know" choice in form state.
export const I_DONT_KNOW = 'idk' as const
export const I_DONT_KNOW_LABEL = "I don't know"

// ─── Bands ────────────────────────────────────────────────────────────

// Even quartile bands across the 1.00–4.00 range. Uniform for overall /
// pillar / capability. Source of truth: product-spec/03_scoring_and_bands.md.
export const BAND_THRESHOLDS: Array<{ key: BandKey; min: number; max: number; label: string }> = [
  { key: 'critical_gap', min: 1.0, max: 1.74, label: 'Critical Gap' },
  { key: 'needs_work', min: 1.75, max: 2.49, label: 'Needs Work' },
  { key: 'solid', min: 2.5, max: 3.24, label: 'Solid' },
  { key: 'strong', min: 3.25, max: 4.0, label: 'Strong' },
]

export function bandFor(score: number): BandKey {
  for (const b of BAND_THRESHOLDS) {
    if (score >= b.min && score <= b.max) return b.key
  }
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

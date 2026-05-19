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

// Order matches the canonical numeric ID in product-spec/01 V2 (1→7 within
// Agility, 8→14 within Toughness, 15→21 within Resilience).
export const CAPABILITY_ORDER: CapabilityKey[] = [
  // Agility (7)
  'decision_velocity',
  'market_signal_intelligence',
  'adaptive_governance',
  'experimentation_muscle',
  'delegation_empowerment',
  'digital_data_fluency',
  'strategic_renewal_scenario_planning',
  // Toughness (7)
  'crisis_leadership',
  'bench_depth_succession',
  'financial_shock_absorption',
  'operational_continuity',
  'risk_compliance_discipline',
  'trust_collaboration',
  'cyber_technology_resilience',
  // Resilience (7)
  'system_recoverability',
  'culture_of_grit_ownership',
  'learning_discipline',
  'offensive_readiness',
  'reputation_stakeholder_trust_recovery',
  'vision_clarity_forward_mandate',
  'workforce_recovery_re_engagement',
]

// Display labels — use these verbatim in UI, copy, and reports.
// Casing matches product-spec/01 V2 ("Decision Velocity", not "decision velocity").
export const CAPABILITY_LABELS: Record<CapabilityKey, string> = {
  decision_velocity: 'Decision Velocity',
  market_signal_intelligence: 'Market & Signal Intelligence',
  adaptive_governance: 'Adaptive Governance',
  experimentation_muscle: 'Experimentation Muscle',
  delegation_empowerment: 'Delegation & Empowerment',
  digital_data_fluency: 'Digital & Data Fluency',
  strategic_renewal_scenario_planning: 'Strategic Renewal & Scenario Planning',
  crisis_leadership: 'Crisis Leadership',
  bench_depth_succession: 'Bench Depth & Succession',
  financial_shock_absorption: 'Financial Shock Absorption',
  operational_continuity: 'Operational Continuity',
  risk_compliance_discipline: 'Risk & Compliance Discipline',
  trust_collaboration: 'Trust & Collaboration',
  cyber_technology_resilience: 'Cyber & Technology Resilience',
  system_recoverability: 'System Recoverability',
  culture_of_grit_ownership: 'Culture of Grit & Ownership',
  learning_discipline: 'Learning Discipline',
  offensive_readiness: 'Offensive Readiness',
  reputation_stakeholder_trust_recovery: 'Reputation & Stakeholder Trust Recovery',
  vision_clarity_forward_mandate: 'Vision Clarity & Forward Mandate',
  workforce_recovery_re_engagement: 'Workforce Recovery & Re-engagement',
}

export const CAPABILITY_TO_PILLAR: Record<CapabilityKey, PillarKey> = {
  decision_velocity: 'agility',
  market_signal_intelligence: 'agility',
  adaptive_governance: 'agility',
  experimentation_muscle: 'agility',
  delegation_empowerment: 'agility',
  digital_data_fluency: 'agility',
  strategic_renewal_scenario_planning: 'agility',
  crisis_leadership: 'toughness',
  bench_depth_succession: 'toughness',
  financial_shock_absorption: 'toughness',
  operational_continuity: 'toughness',
  risk_compliance_discipline: 'toughness',
  trust_collaboration: 'toughness',
  cyber_technology_resilience: 'toughness',
  system_recoverability: 'resilience',
  culture_of_grit_ownership: 'resilience',
  learning_discipline: 'resilience',
  offensive_readiness: 'resilience',
  reputation_stakeholder_trust_recovery: 'resilience',
  vision_clarity_forward_mandate: 'resilience',
  workforce_recovery_re_engagement: 'resilience',
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

// 4 merged tiers — see product-spec/09_demographics.md.
// Order in the dropdown is least-senior → most-senior.
export const LEVELS: Level[] = ['individual_contributor', 'team_leader', 'manager', 'senior_leader']

export const LEVEL_LABELS: Record<Level, string> = {
  individual_contributor: 'Individual Contributor / Early Career',
  team_leader: 'Team Leader / Supervisor',
  manager: 'Manager / Department Head',
  senior_leader: 'Senior Leader / Executive',
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

// ─── Pillar verb pairs ────────────────────────────────────────────────

// Eyebrow text under each pillar header — spec 05 § 3.1, spec 12 § 4.
export const PILLAR_VERB_PAIRS: Record<PillarKey, string> = {
  agility: 'Sense and move',
  toughness: 'Absorb and hold',
  resilience: 'Recover and renew',
}

// ─── Static interpretation strings ────────────────────────────────────

// One sentence per band, shown beneath the team overall score on the
// report hero panel. Source of truth: product-spec/03 § 5.
// AI integration (Phase 7) may extend this with custom executive summary
// prose, but the static line stays as the lead.
export const BAND_INTERPRETATION: Record<BandKey, string> = {
  critical_gap:
    'The organization is in a fragile position and needs urgent intervention across multiple pillars.',
  needs_work:
    'The organization has real gaps that threaten endurance. Investment is needed.',
  solid: 'The organization is generally sound, with specific gaps to address.',
  strong: 'The organization is in a position of strength — maintain and leverage.',
}

// ─── Baseline action items ────────────────────────────────────────────

// Two methodology-validated action items per capability — used directly
// in the Focus Areas section when no AI report is cached, and as the
// input/inspiration for AI adaptation. Source of truth:
// product-spec/04_recommendations.md § 3. Editing rules in § 7 of that file.
export const BASELINE_ACTION_ITEMS: Record<CapabilityKey, [string, string]> = {
  decision_velocity: [
    'Publish a decision-rights matrix clarifying who decides what across the top 20 recurring decisions.',
    'Cut one layer of approval from standard operating decisions within the next quarter.',
  ],
  market_signal_intelligence: [
    'Stand up an early-warning dashboard tracking customer, competitor, and regulatory signals.',
    "Assign a rotating 'signal owner' on the executive team responsible for weekly synthesis.",
  ],
  adaptive_governance: [
    'Introduce an explicit exceptions process for policy deviations with senior sponsor approval.',
    'Move to rolling 90-day budget reviews with reallocation authority, replacing annual cycles.',
  ],
  experimentation_muscle: [
    'Install a disciplined pilot process with clear success criteria and fast kill decisions.',
    "Create a small 'experiments budget' ring-fenced from core operations for rapid tests.",
  ],
  delegation_empowerment: [
    'Define the specific decisions that must be pushed to the frontline and publish the boundaries.',
    'Coach senior leaders to stop pre-approving decisions their direct reports own.',
  ],
  digital_data_fluency: [
    'Audit data and AI tool gaps in the top 10 recurring decisions; close the most consequential ones within two quarters.',
    'Embed data fluency expectations into role profiles and performance reviews for managers and above.',
  ],
  strategic_renewal_scenario_planning: [
    'Run scenario planning at least annually against three plausible 5-year futures, with explicit triggers for strategy redesign.',
    'Establish long-cycle reallocation authority that can shift >10% of capital between businesses outside the annual cycle.',
  ],
  crisis_leadership: [
    'Define a crisis communication and decision protocol for the top team, including roles, cadence, and escalation.',
    'Rehearse crisis behavior annually through a tabletop or live simulation involving the full executive team.',
  ],
  bench_depth_succession: [
    'Maintain a named successor and active development plan for every role two layers below the CEO.',
    'Pressure-test bench depth annually by simulating "leader out for 90 days" on critical roles.',
  ],
  financial_shock_absorption: [
    'Define explicit liquidity buffers and minimum cash reserves sized for realistic shock scenarios.',
    'Run quarterly financial stress tests against severe but plausible adverse conditions.',
  ],
  operational_continuity: [
    'Map critical processes, identify single points of failure, and establish backup suppliers/paths.',
    'Test business continuity plans at least once a year — live, not just tabletop.',
  ],
  risk_compliance_discipline: [
    'Unify risk, legal, and compliance ownership under integrated governance with clear accountability.',
    'Shift posture from reactive to proactive: identify emerging risks before they materialize.',
  ],
  trust_collaboration: [
    'Invest in cross-functional operating rhythms and joint goals that reward collaboration.',
    'Address political behaviors visibly — signal that silos cost the team, especially under pressure.',
  ],
  cyber_technology_resilience: [
    'Define impact tolerances for critical services and run a live cyber incident exercise at least annually.',
    'Maintain tested response playbooks for ransomware, third-party outage, and prolonged technology disruption scenarios.',
  ],
  system_recoverability: [
    'Document and test disaster recovery for all critical systems — aim for measurable recovery time.',
    'Move toward modular architectures that allow partial system restoration during disruption.',
  ],
  culture_of_grit_ownership: [
    'Reinforce accountability by making ownership visible; reward pushing through difficulty.',
    'Address escalation patterns: coach leaders who escalate too early or abdicate ownership.',
  ],
  learning_discipline: [
    'Institute structured after-action reviews for every project exceeding a defined impact threshold.',
    "Create a quarterly 'lessons forum' where cross-functional learnings are captured and actioned.",
  ],
  offensive_readiness: [
    'Define a growth thesis that specifies where the organization will invest when conditions stabilize.',
    'Pre-build investment playbooks with activation criteria, owners, and timelines.',
  ],
  reputation_stakeholder_trust_recovery: [
    'Establish a stakeholder communication playbook covering customers, employees, regulators, and media for major disruptions.',
    'After any significant incident, deliver visible accountability actions and a transparent change report within 90 days.',
  ],
  vision_clarity_forward_mandate: [
    'Build a forward-direction template — a defined format with priority slots, named owner slots, and 30 / 60 / 90-day milestones — that leadership can populate within days of a major disruption.',
    'Run a quarterly vision and priorities review with the top team so a renewed direction can be activated quickly when conditions shift.',
  ],
  workforce_recovery_re_engagement: [
    'Develop a workforce pulse instrument now — capacity, engagement, and trust dimensions — and pre-position it for rapid deployment under stress.',
    'Pre-build a re-engagement playbook covering workload rebalancing, manager support, and recognition protocols that can activate within days of a disruption.',
  ],
}

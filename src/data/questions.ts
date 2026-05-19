// The 42 verbatim statements. Locked content — refinement requires a
// methodology revision. Source of truth: product-spec/02_questions - V2.md.
// Capability keys match src/data/constants.ts CAPABILITY_LABELS.

import type { CapabilityKey, QuestionDef } from './types'

export const QUESTIONS: ReadonlyArray<QuestionDef> = [
  // ── Agility ────────────────────────────────────────────────────────
  {
    id: '1a',
    pillar: 'agility',
    capability: 'decision_velocity',
    angle: 'a',
    text: 'Our organization has clearly defined decision rights, so people know who decides what without having to escalate.',
  },
  {
    id: '1b',
    pillar: 'agility',
    capability: 'decision_velocity',
    angle: 'b',
    text: 'Key strategic decisions are made and acted upon within days or weeks, not months.',
  },
  {
    id: '2a',
    pillar: 'agility',
    capability: 'market_signal_intelligence',
    angle: 'a',
    text: 'We have active mechanisms to detect early signals of change in our markets, customers, competitors, and technology.',
  },
  {
    id: '2b',
    pillar: 'agility',
    capability: 'market_signal_intelligence',
    angle: 'b',
    text: 'Insights from our sensing activities consistently translate into timely decisions and adjustments.',
  },
  {
    id: '3a',
    pillar: 'agility',
    capability: 'adaptive_governance',
    angle: 'a',
    text: 'Our policies and governance frameworks allow for exceptions and fast adjustments when circumstances demand it.',
  },
  {
    id: '3b',
    pillar: 'agility',
    capability: 'adaptive_governance',
    angle: 'b',
    text: 'When external conditions change, we are able to revise strategies and budgets without getting stuck in bureaucracy.',
  },
  {
    id: '4a',
    pillar: 'agility',
    capability: 'experimentation_muscle',
    angle: 'a',
    text: 'We have a disciplined process for running small, fast experiments before committing to large investments.',
  },
  {
    id: '4b',
    pillar: 'agility',
    capability: 'experimentation_muscle',
    angle: 'b',
    text: 'Our organization learns from failed experiments without punishing the people who ran them.',
  },
  {
    id: '5a',
    pillar: 'agility',
    capability: 'delegation_empowerment',
    angle: 'a',
    text: 'Decision-making authority is pushed down to the people closest to the action, within clear boundaries.',
  },
  {
    id: '5b',
    pillar: 'agility',
    capability: 'delegation_empowerment',
    angle: 'b',
    text: 'Frontline leaders and teams feel trusted to make real decisions without constant approval from above.',
  },
  {
    id: '6a',
    pillar: 'agility',
    capability: 'digital_data_fluency',
    angle: 'a',
    text: 'We have the data, analytics, AI, and digital tools needed to support timely, evidence-based decisions across the business.',
  },
  {
    id: '6b',
    pillar: 'agility',
    capability: 'digital_data_fluency',
    angle: 'b',
    text: 'Our people use data and digital tools fluently in everyday work — they shape decisions and execution, not just reports.',
  },
  {
    id: '7a',
    pillar: 'agility',
    capability: 'strategic_renewal_scenario_planning',
    angle: 'a',
    text: 'We conduct regular scenario planning and strategy reviews that prepare us for multiple possible futures.',
  },
  {
    id: '7b',
    pillar: 'agility',
    capability: 'strategic_renewal_scenario_planning',
    angle: 'b',
    text: 'When conditions shift fundamentally, we are able to redesign our strategy and reallocate resources at the long-cycle level — not just adjust tactics.',
  },

  // ── Toughness ──────────────────────────────────────────────────────
  {
    id: '8a',
    pillar: 'toughness',
    capability: 'crisis_leadership',
    angle: 'a',
    text: 'Our senior leaders have a defined approach for communicating and decision-making during crises — not just improvisation.',
  },
  {
    id: '8b',
    pillar: 'toughness',
    capability: 'crisis_leadership',
    angle: 'b',
    text: 'In past crises, our senior leaders have remained calm, visible, and honest in their communication.',
  },
  {
    id: '9a',
    pillar: 'toughness',
    capability: 'bench_depth_succession',
    angle: 'a',
    text: 'We have identified and actively developed strong second-line leaders and successors for every critical role.',
  },
  {
    id: '9b',
    pillar: 'toughness',
    capability: 'bench_depth_succession',
    angle: 'b',
    text: 'When key leaders depart unexpectedly, the organization continues to function without losing momentum or direction.',
  },
  {
    id: '10a',
    pillar: 'toughness',
    capability: 'financial_shock_absorption',
    angle: 'a',
    text: 'We maintain cash buffers, liquidity reserves, and contingency budgets sized for realistic shock scenarios.',
  },
  {
    id: '10b',
    pillar: 'toughness',
    capability: 'financial_shock_absorption',
    angle: 'b',
    text: 'Our finance function regularly stress-tests the business against severe but plausible financial shocks.',
  },
  {
    id: '11a',
    pillar: 'toughness',
    capability: 'operational_continuity',
    angle: 'a',
    text: 'We have backup suppliers, alternative operational paths, and continuity plans for our most critical processes.',
  },
  {
    id: '11b',
    pillar: 'toughness',
    capability: 'operational_continuity',
    angle: 'b',
    text: 'Our continuity plans are tested regularly — not just documented — and would work if activated today.',
  },
  {
    id: '12a',
    pillar: 'toughness',
    capability: 'risk_compliance_discipline',
    angle: 'a',
    text: 'Risk, legal, and compliance matters have clear ownership and integrated governance across the organization.',
  },
  {
    id: '12b',
    pillar: 'toughness',
    capability: 'risk_compliance_discipline',
    angle: 'b',
    text: 'We identify and address emerging risks proactively, rather than reacting to problems after they materialize.',
  },
  {
    id: '13a',
    pillar: 'toughness',
    capability: 'trust_collaboration',
    angle: 'a',
    text: 'Our cross-functional teams have the relationships and operating rhythms to collaborate effectively under pressure.',
  },
  {
    id: '13b',
    pillar: 'toughness',
    capability: 'trust_collaboration',
    angle: 'b',
    text: 'When things go wrong, our teams pull together rather than retreating into silos or internal politics.',
  },
  {
    id: '14a',
    pillar: 'toughness',
    capability: 'cyber_technology_resilience',
    angle: 'a',
    text: 'We have defined controls, response playbooks, and impact tolerances to keep critical services running through cyber attacks and technology failures.',
  },
  {
    id: '14b',
    pillar: 'toughness',
    capability: 'cyber_technology_resilience',
    angle: 'b',
    text: 'When we have faced cyber incidents or major technology disruptions, we have contained them and continued operating within acceptable limits.',
  },

  // ── Resilience ─────────────────────────────────────────────────────
  {
    id: '15a',
    pillar: 'resilience',
    capability: 'system_recoverability',
    angle: 'a',
    text: 'We have documented and tested business continuity and disaster recovery plans covering our critical systems.',
  },
  {
    id: '15b',
    pillar: 'resilience',
    capability: 'system_recoverability',
    angle: 'b',
    text: 'When systems or processes break, we restore them quickly and without lasting damage to operations.',
  },
  {
    id: '16a',
    pillar: 'resilience',
    capability: 'culture_of_grit_ownership',
    angle: 'a',
    text: 'Accountability is clearly assigned and accepted in our organization — people own their outcomes, good or bad.',
  },
  {
    id: '16b',
    pillar: 'resilience',
    capability: 'culture_of_grit_ownership',
    angle: 'b',
    text: 'Our people push through setbacks and difficulty rather than escalating early or disengaging.',
  },
  {
    id: '17a',
    pillar: 'resilience',
    capability: 'learning_discipline',
    angle: 'a',
    text: 'We have structured rituals — such as post-mortems and after-action reviews — for capturing lessons from pressure events.',
  },
  {
    id: '17b',
    pillar: 'resilience',
    capability: 'learning_discipline',
    angle: 'b',
    text: "Lessons from past events measurably change how we operate; we don't repeat the same mistakes.",
  },
  {
    id: '18a',
    pillar: 'resilience',
    capability: 'offensive_readiness',
    angle: 'a',
    text: 'We have a defined growth thesis and investment playbooks ready to activate when conditions allow.',
  },
  {
    id: '18b',
    pillar: 'resilience',
    capability: 'offensive_readiness',
    angle: 'b',
    text: 'After stabilizing from a shock, our organization has historically returned to offense and growth quickly.',
  },
  {
    id: '19a',
    pillar: 'resilience',
    capability: 'reputation_stakeholder_trust_recovery',
    angle: 'a',
    text: 'We have defined approaches for communicating with customers, employees, regulators, and the public after a disruption — not just improvisation.',
  },
  {
    id: '19b',
    pillar: 'resilience',
    capability: 'reputation_stakeholder_trust_recovery',
    angle: 'b',
    text: 'After significant disruption, we have visibly restored stakeholder trust through transparent communication, accountable action, and demonstrable change.',
  },
  {
    id: '20a',
    pillar: 'resilience',
    capability: 'vision_clarity_forward_mandate',
    angle: 'a',
    text: 'We have a clear post-disruption forward direction with defined priorities, owners, and milestones.',
  },
  {
    id: '20b',
    pillar: 'resilience',
    capability: 'vision_clarity_forward_mandate',
    angle: 'b',
    text: 'After significant disruption, our leadership has rallied the organization around a renewed sense of direction within weeks, not months.',
  },
  {
    id: '21a',
    pillar: 'resilience',
    capability: 'workforce_recovery_re_engagement',
    angle: 'a',
    text: 'We have defined approaches and tools to assess workforce capacity and engagement after significant disruption.',
  },
  {
    id: '21b',
    pillar: 'resilience',
    capability: 'workforce_recovery_re_engagement',
    angle: 'b',
    text: 'When the organization has been through major disruption (such as restructuring, layoffs, or sustained pressure), we have effectively rebuilt workforce capacity and re-engaged people.',
  },
] as const

export const TOTAL_QUESTIONS = QUESTIONS.length // 42

// Lookup by question id
export const QUESTIONS_BY_ID: ReadonlyMap<string, QuestionDef> = new Map(
  QUESTIONS.map((q) => [q.id, q]),
)

// Position (1-indexed) → QuestionDef. /take/question/[n] uses the
// position, not the id, so respondents can always navigate by number.
export function questionAtPosition(n: number): QuestionDef | null {
  if (!Number.isInteger(n) || n < 1 || n > QUESTIONS.length) return null
  return QUESTIONS[n - 1]
}

// Group questions by capability for the review screen.
export function questionsByCapability(): Record<CapabilityKey, QuestionDef[]> {
  const out = {} as Record<CapabilityKey, QuestionDef[]>
  for (const q of QUESTIONS) {
    if (!out[q.capability]) out[q.capability] = []
    out[q.capability].push(q)
  }
  return out
}

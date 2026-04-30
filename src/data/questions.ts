// The 30 verbatim statements. Locked content — refinement requires a
// methodology revision. Source of truth: product-spec/02_questions.md.
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

  // ── Toughness ──────────────────────────────────────────────────────
  {
    id: '6a',
    pillar: 'toughness',
    capability: 'leadership_strength_under_pressure',
    angle: 'a',
    text: 'We have identified and actively developed strong second-line leaders and successors for every critical role.',
  },
  {
    id: '6b',
    pillar: 'toughness',
    capability: 'leadership_strength_under_pressure',
    angle: 'b',
    text: 'In past crises, our senior leaders have remained calm, visible, and honest in their communication.',
  },
  {
    id: '7a',
    pillar: 'toughness',
    capability: 'financial_shock_absorption',
    angle: 'a',
    text: 'We maintain cash buffers, liquidity reserves, and contingency budgets sized for realistic shock scenarios.',
  },
  {
    id: '7b',
    pillar: 'toughness',
    capability: 'financial_shock_absorption',
    angle: 'b',
    text: 'Our finance function regularly stress-tests the business against severe but plausible financial shocks.',
  },
  {
    id: '8a',
    pillar: 'toughness',
    capability: 'operational_continuity',
    angle: 'a',
    text: 'We have backup suppliers, alternative operational paths, and continuity plans for our most critical processes.',
  },
  {
    id: '8b',
    pillar: 'toughness',
    capability: 'operational_continuity',
    angle: 'b',
    text: 'Our continuity plans are tested regularly — not just documented — and would work if activated today.',
  },
  {
    id: '9a',
    pillar: 'toughness',
    capability: 'risk_compliance_discipline',
    angle: 'a',
    text: 'Risk, legal, and compliance matters have clear ownership and integrated governance across the organization.',
  },
  {
    id: '9b',
    pillar: 'toughness',
    capability: 'risk_compliance_discipline',
    angle: 'b',
    text: 'We identify and address emerging risks proactively, rather than reacting to problems after they materialize.',
  },
  {
    id: '10a',
    pillar: 'toughness',
    capability: 'trust_collaboration',
    angle: 'a',
    text: 'Our cross-functional teams have the relationships and operating rhythms to collaborate effectively under pressure.',
  },
  {
    id: '10b',
    pillar: 'toughness',
    capability: 'trust_collaboration',
    angle: 'b',
    text: 'When things go wrong, our teams pull together rather than retreating into silos or internal politics.',
  },

  // ── Resilience ─────────────────────────────────────────────────────
  {
    id: '11a',
    pillar: 'resilience',
    capability: 'system_recoverability',
    angle: 'a',
    text: 'We have documented and tested business continuity and disaster recovery plans covering our critical systems.',
  },
  {
    id: '11b',
    pillar: 'resilience',
    capability: 'system_recoverability',
    angle: 'b',
    text: 'When systems or processes break, we restore them quickly and without lasting damage to operations.',
  },
  {
    id: '12a',
    pillar: 'resilience',
    capability: 'culture_of_grit_ownership',
    angle: 'a',
    text: 'Accountability is clearly assigned and accepted in our organization — people own their outcomes, good or bad.',
  },
  {
    id: '12b',
    pillar: 'resilience',
    capability: 'culture_of_grit_ownership',
    angle: 'b',
    text: 'Our people push through setbacks and difficulty rather than escalating early or disengaging.',
  },
  {
    id: '13a',
    pillar: 'resilience',
    capability: 'learning_discipline',
    angle: 'a',
    text: 'We have structured rituals — such as post-mortems and after-action reviews — for capturing lessons from pressure events.',
  },
  {
    id: '13b',
    pillar: 'resilience',
    capability: 'learning_discipline',
    angle: 'b',
    text: "Lessons from past events measurably change how we operate; we don't repeat the same mistakes.",
  },
  {
    id: '14a',
    pillar: 'resilience',
    capability: 'strategic_adaptability',
    angle: 'a',
    text: 'We conduct regular scenario planning and strategy reviews that prepare us for multiple possible futures.',
  },
  {
    id: '14b',
    pillar: 'resilience',
    capability: 'strategic_adaptability',
    angle: 'b',
    text: 'When conditions change, we are able to reallocate resources and redesign our strategy quickly and decisively.',
  },
  {
    id: '15a',
    pillar: 'resilience',
    capability: 'offensive_readiness',
    angle: 'a',
    text: 'We have a defined growth thesis and investment playbooks ready to activate when conditions allow.',
  },
  {
    id: '15b',
    pillar: 'resilience',
    capability: 'offensive_readiness',
    angle: 'b',
    text: 'After stabilizing from a shock, our organization has historically returned to offense and growth quickly.',
  },
] as const

export const TOTAL_QUESTIONS = QUESTIONS.length // 30

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

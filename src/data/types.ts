// Shared TypeScript types for The Endurance Assessment.
// Product rules these encode live in product-spec/. Don't redefine those rules here.

export type PillarKey = 'agility' | 'toughness' | 'resilience'

export type CapabilityKey =
  // Agility
  | 'decision_velocity'
  | 'market_signal_intelligence'
  | 'adaptive_governance'
  | 'experimentation_muscle'
  | 'delegation_empowerment'
  // Toughness
  | 'leadership_strength_under_pressure'
  | 'financial_shock_absorption'
  | 'operational_continuity'
  | 'risk_compliance_discipline'
  | 'trust_collaboration'
  // Resilience
  | 'system_recoverability'
  | 'culture_of_grit_ownership'
  | 'learning_discipline'
  | 'strategic_adaptability'
  | 'offensive_readiness'

export type Angle = 'a' | 'b'

// "1a", "1b", … "15b"
export type QuestionId = `${number}${Angle}`

// 1–4 Likert (no neutral). NULL means the respondent picked "I don't know"
// — a valid completion answer that is excluded from scoring math.
export type LikertValue = 1 | 2 | 3 | 4
export type AnswerValue = LikertValue | null

export type BandKey = 'critical_gap' | 'needs_work' | 'solid' | 'strong'

export interface QuestionDef {
  id: QuestionId
  pillar: PillarKey
  capability: CapabilityKey
  angle: Angle
  text: string
}

// Filter parsed from URLSearchParams. All dimensions are multi-select per
// product-spec/06 § 1; an empty array means "all" on that dimension.
// Filter signature serializes this back out as `dept=A,B&level=manager`
// (sorted, canonical) — see src/lib/filters.ts.
export interface ParsedFilter {
  departments: string[] // department names (filtered by name, not id)
  levels: import('@prisma/client').Level[]
  tenures: import('@prisma/client').TenureBand[]
}

// One capability's team result. `score`/`spread`/`band` are null when
// fewer than 3 respondents in the active filter rated this capability
// (per-capability anonymity floor — product-spec/03 § 3.1).
export interface CapabilityResult {
  score: number | null
  spread: number | null
  ratedCount: number
  insufficient: boolean
  band: BandKey | null
}

// One pillar's team result. `score` is null only in the extreme edge case
// where no individual in the filter has a pillar score (every respondent
// picked "I don't know" for both angles of every capability in the pillar).
export interface PillarResult {
  score: number | null
  ratedCount: number
  band: BandKey | null
}

export interface AggregatedResults {
  // Total submitted respondents in the active filter — INCLUDING ones who
  // contributed no rated answers. Used for the "Preliminary — N of M" banner
  // and the ≥3 anonymity floor check.
  sampleSize: number
  overall: { score: number | null; band: BandKey | null }
  pillars: Record<PillarKey, PillarResult>
  capabilities: Record<CapabilityKey, CapabilityResult>
  // Top-5 weakest capabilities under the filter. Tie-break: spread desc,
  // then alphabetical by display label. Capabilities with insufficient
  // data are excluded — see product-spec/03 § 6.
  focusAreas: CapabilityKey[]
}

// Shape of a generated AI report (stored in GeneratedReport.outputJson).
export interface AiReportOutput {
  executiveSummary: string
  focusAreaActions: Array<{
    capability: CapabilityKey
    actions: string[] // bullet items
  }>
}

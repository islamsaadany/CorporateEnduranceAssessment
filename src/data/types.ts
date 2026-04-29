// Shared TypeScript types for The Endurance Assessment.
// Product rules these encode live in product-spec/. Don't redefine those rules here.

export type PillarKey = 'agility' | 'toughness' | 'resilience'

export type CapabilityKey =
  // Agility
  | 'sensing'
  | 'decisiveness'
  | 'reconfiguration'
  | 'learning_velocity'
  | 'external_orientation'
  // Toughness
  | 'operational_discipline'
  | 'risk_posture'
  | 'conviction'
  | 'cost_capital_stewardship'
  | 'accountability'
  // Resilience
  | 'recovery'
  | 'wellbeing'
  | 'continuity'
  | 'adaptive_capacity'
  | 'trust'

export type Angle = 'a' | 'b'

// "1a", "1b", … "15b"
export type QuestionId = `${number}${Angle}`

export type LikertValue = 1 | 2 | 3 | 4 | 5

export type BandKey = 'critical_gap' | 'needs_work' | 'solid' | 'strong'

export interface QuestionDef {
  id: QuestionId
  pillar: PillarKey
  capability: CapabilityKey
  angle: Angle
  text: string
}

// Filter parsed from URLSearchParams. All fields optional → "no filter".
// `compound` is just multiple fields set at once.
export interface ParsedFilter {
  department?: string // department name (we filter by name, not id, for portability across regenerated ids)
  level?: import('@prisma/client').Level
  tenure?: import('@prisma/client').TenureBand
}

export interface CapabilityResult {
  score: number // mean across respondents in filter
  spread: number // max − min across respondents in filter
}

export interface AggregatedResults {
  sampleSize: number
  overall: number
  pillars: Record<PillarKey, number>
  capabilities: Record<CapabilityKey, CapabilityResult>
  focusAreas: CapabilityKey[] // top-5 weakest, see product-spec/03 for tie-break rule
  bands: {
    overall: BandKey
    pillars: Record<PillarKey, BandKey>
    capabilities: Record<CapabilityKey, BandKey>
  }
}

// Shape of a generated AI report (stored in GeneratedReport.outputJson).
export interface AiReportOutput {
  executiveSummary: string
  focusAreaActions: Array<{
    capability: CapabilityKey
    actions: string[] // bullet items
  }>
}

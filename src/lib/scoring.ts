// Server-side scoring engine. Pure aggregation — no DB access, no side
// effects. Caller fetches rows from Prisma, hands them in, and gets the
// fully-banded `AggregatedResults` plus per-individual breakdowns.
//
// Source-of-truth math: product-spec/03_scoring_and_bands.md.
// "I don't know" answers (value === null) are excluded from every mean
// per § 1 / § 2.1. NULL means "deliberate non-answer" — they still count
// toward the headline N but contribute nothing to scores.

import {
  CAPABILITY_LABELS,
  CAPABILITY_ORDER,
  CAPABILITY_TO_PILLAR,
  MIN_RESPONDENTS_FOR_VIEW,
  PILLAR_ORDER,
  bandFor,
} from '@/data/constants'
import { QUESTIONS } from '@/data/questions'
import type {
  AggregatedResults,
  CapabilityKey,
  CapabilityResult,
  PillarKey,
  PillarResult,
} from '@/data/types'

// Question id → capability mapping (1a → decision_velocity, etc).
// Built once at module load.
const QUESTION_TO_CAPABILITY: Record<string, CapabilityKey> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q.capability]),
)

// Input row to the engine. `value` is 1..4 for a rated answer, or null
// for "I don't know". Rows whose questionId we don't recognize are
// silently dropped (defensive — shouldn't happen if the seed is consistent).
export interface ScoringInputRow {
  respondentId: string
  questionId: string
  value: number | null
}

export interface IndividualScores {
  // Capabilities the respondent rated at least one angle of. Other
  // capabilities are intentionally absent — a missing key means "this
  // respondent contributes nothing to that capability's team aggregation".
  capabilities: Partial<Record<CapabilityKey, number>>
  pillars: Partial<Record<PillarKey, number>>
  overall: number | null
}

// Per-respondent score map keyed by respondentId. The caller supplies the
// universe of respondent ids (`respondentIds`) so respondents who picked
// "I don't know" for everything still appear in the map (with empty
// individual scores) — they need to count toward sampleSize.
export function computeIndividualScores(
  rows: ScoringInputRow[],
  respondentIds: string[],
): Map<string, IndividualScores> {
  // Step 1: bucket valid (rated) ratings by respondent → capability.
  const buckets = new Map<string, Map<CapabilityKey, number[]>>()
  for (const row of rows) {
    if (row.value === null || row.value === undefined) continue
    const cap = QUESTION_TO_CAPABILITY[row.questionId]
    if (!cap) continue
    let perCap = buckets.get(row.respondentId)
    if (!perCap) {
      perCap = new Map()
      buckets.set(row.respondentId, perCap)
    }
    const arr = perCap.get(cap)
    if (arr) {
      arr.push(row.value)
    } else {
      perCap.set(cap, [row.value])
    }
  }

  const out = new Map<string, IndividualScores>()
  for (const rid of respondentIds) {
    const perCap = buckets.get(rid)
    const capScores: Partial<Record<CapabilityKey, number>> = {}
    const pillarBuckets: Partial<Record<PillarKey, number[]>> = {}

    if (perCap) {
      for (const cap of CAPABILITY_ORDER) {
        const ratings = perCap.get(cap)
        if (ratings && ratings.length > 0) {
          const score = mean(ratings)
          capScores[cap] = score
          const pillar = CAPABILITY_TO_PILLAR[cap]
          const list = pillarBuckets[pillar] ?? []
          list.push(score)
          pillarBuckets[pillar] = list
        }
      }
    }

    const pillarScores: Partial<Record<PillarKey, number>> = {}
    const pillarVals: number[] = []
    for (const p of PILLAR_ORDER) {
      const list = pillarBuckets[p]
      if (list && list.length > 0) {
        const v = mean(list)
        pillarScores[p] = v
        pillarVals.push(v)
      }
    }

    out.set(rid, {
      capabilities: capScores,
      pillars: pillarScores,
      overall: pillarVals.length > 0 ? mean(pillarVals) : null,
    })
  }
  return out
}

// Roll up individual scores into the team-level shape used by the report.
// `sampleSize` is the count of submitted respondents in the active filter
// (passed in directly so the caller controls what "in-filter" means).
export function aggregateTeam(
  individuals: Map<string, IndividualScores>,
  sampleSize: number,
): AggregatedResults {
  // ── Capabilities ────────────────────────────────────────────────────
  const capabilities = {} as Record<CapabilityKey, CapabilityResult>
  for (const cap of CAPABILITY_ORDER) {
    const vals: number[] = []
    for (const s of individuals.values()) {
      const v = s.capabilities[cap]
      if (typeof v === 'number') vals.push(v)
    }
    capabilities[cap] = capabilityResult(vals)
  }

  // ── Pillars: mean of individual pillar scores ───────────────────────
  const pillars = {} as Record<PillarKey, PillarResult>
  for (const p of PILLAR_ORDER) {
    const vals: number[] = []
    for (const s of individuals.values()) {
      const v = s.pillars[p]
      if (typeof v === 'number') vals.push(v)
    }
    pillars[p] = pillarResult(vals)
  }

  // ── Overall: mean of individual overall scores ──────────────────────
  // (per product-spec/03 § 3.3; not the mean of the 3 team-pillar scores.)
  const overallVals: number[] = []
  for (const s of individuals.values()) {
    if (typeof s.overall === 'number') overallVals.push(s.overall)
  }
  const overallScore = overallVals.length > 0 ? mean(overallVals) : null
  const overall = {
    score: overallScore,
    band: overallScore !== null ? bandFor(overallScore) : null,
  }

  // ── Focus areas: 5 weakest capabilities ─────────────────────────────
  // Tie-break: spread descending, then capability label alphabetical.
  // Capabilities with insufficient data are excluded from the ranking
  // (we can't honestly call something the team's biggest weakness when
  // <3 people rated it).
  const focusAreas: CapabilityKey[] = CAPABILITY_ORDER.filter(
    (c) => !capabilities[c].insufficient,
  )
    .map((c) => ({
      cap: c,
      score: capabilities[c].score as number,
      spread: capabilities[c].spread as number,
      label: CAPABILITY_LABELS[c],
    }))
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score
      if (a.spread !== b.spread) return b.spread - a.spread
      return a.label.localeCompare(b.label)
    })
    .slice(0, 5)
    .map((x) => x.cap)

  return {
    sampleSize,
    overall,
    pillars,
    capabilities,
    focusAreas,
  }
}

function capabilityResult(vals: number[]): CapabilityResult {
  if (vals.length === 0) {
    return {
      score: null,
      spread: null,
      ratedCount: 0,
      insufficient: true,
      band: null,
    }
  }
  const insufficient = vals.length < MIN_RESPONDENTS_FOR_VIEW
  if (insufficient) {
    return {
      score: null,
      spread: null,
      ratedCount: vals.length,
      insufficient: true,
      band: null,
    }
  }
  const score = mean(vals)
  const spread = Math.max(...vals) - Math.min(...vals)
  return {
    score,
    spread,
    ratedCount: vals.length,
    insufficient: false,
    band: bandFor(score),
  }
}

function pillarResult(vals: number[]): PillarResult {
  if (vals.length === 0) {
    return { score: null, ratedCount: 0, band: null }
  }
  const score = mean(vals)
  return { score, ratedCount: vals.length, band: bandFor(score) }
}

function mean(arr: number[]): number {
  let s = 0
  for (const v of arr) s += v
  return s / arr.length
}

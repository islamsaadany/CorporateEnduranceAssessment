// Single source of truth for "fetch + aggregate the report data."
// Called by both the GET /api/assessments/[id]/results route handler and
// the server-rendered /admin/assessments/[id]/results page so they can
// never disagree about what's on screen.
//
// Auth is the caller's responsibility. This module just does the data work.

import type { Level, TenureBand } from '@prisma/client'

import { CAPABILITY_ORDER, MIN_RESPONDENTS_FOR_VIEW, PILLAR_ORDER } from '@/data/constants'
import type {
  AggregatedResults,
  CapabilityKey,
  ParsedFilter,
  PillarKey,
} from '@/data/types'
import {
  filterDescription,
  filterSignature,
  isCompanyWide,
  prismaWhereForFilter,
} from '@/lib/filters'
import { prisma } from '@/lib/prisma'
import {
  aggregateTeam,
  computeIndividualScores,
  type IndividualScores,
} from '@/lib/scoring'

export interface RespondentRow {
  // Names are shown directly in v1 — anonymization (letter labels +
  // reveal toggle) is deferred. The AI prompt builder in Phase 7 must
  // strip names before sending anything to the LLM (spec 11 § 5).
  name: string | null
  department: string | null
  level: Level | null
  tenure: TenureBand | null
  overall: number | null
  pillars: Record<PillarKey, number | null>
  capabilities: Record<CapabilityKey, number | null>
}

export interface LockInfo {
  reason: 'no_respondents' | 'below_floor'
  count: number
  isCompanyWide: boolean
}

export interface ResultsBundle {
  assessment: {
    id: string
    clientName: string
    status: 'collecting' | 'closed'
    deadline: Date
    closedAt: Date | null
    code: string
    maxUses: number
  }
  filter: {
    parsed: ParsedFilter
    signature: string
    description: string
    isCompanyWide: boolean
  }
  counts: {
    totalSubmitted: number
    matchingFilter: number
  }
  lock: LockInfo | null
  aggregates: AggregatedResults | null
  respondents: RespondentRow[]
  // ── Filter-UI metadata (slice 6.3) ───────────────────────────────────
  // Always present, regardless of filter or lock state, so the filter
  // modal can render chips and compute live preview counts even when the
  // current filtered view is locked.
  availableDepartments: string[]
  allSubmittedDemos: Array<{
    department: string | null
    level: Level | null
    tenure: TenureBand | null
  }>
}

// Returns null when the assessment id doesn't exist. Caller decides
// whether that's a 404 (API) or notFound() (page).
export async function loadResults(
  assessmentId: string,
  filter: ParsedFilter,
): Promise<ResultsBundle | null> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: {
      id: true,
      clientName: true,
      status: true,
      deadline: true,
      closedAt: true,
      code: true,
      maxUses: true,
      // Defined departments for this assessment — even ones that no
      // respondent has used. The filter modal needs the full list so it
      // can render every department as a selectable chip.
      departments: { select: { name: true }, orderBy: { name: 'asc' } },
    },
  })
  if (!assessment) return null

  // "Submitted" gate — only respondents with submittedAt IS NOT NULL count
  // toward team aggregates and the ≥3 anonymity floor (spec 03 § 3.1, 06 § 3.1).
  const submittedScope = {
    assessmentId,
    submittedAt: { not: null },
  } as const

  // Demographics for ALL submitted respondents on this assessment,
  // independent of the active filter. Drives the modal's live preview
  // count without an extra round-trip.
  const allSubmitted = await prisma.respondent.findMany({
    where: submittedScope,
    select: {
      level: true,
      tenure: true,
      department: { select: { name: true } },
    },
  })
  const allSubmittedDemos = allSubmitted.map((r) => ({
    department: r.department?.name ?? null,
    level: r.level,
    tenure: r.tenure,
  }))
  const totalSubmitted = allSubmitted.length

  const matchingRespondents = await prisma.respondent.findMany({
    where: { ...submittedScope, ...prismaWhereForFilter(filter) },
    select: {
      id: true,
      name: true,
      level: true,
      tenure: true,
      submittedAt: true,
      department: { select: { name: true } },
    },
    orderBy: { submittedAt: 'asc' },
  })
  const matchingFilter = matchingRespondents.length

  const availableDepartments = assessment.departments.map((d) => d.name)

  const filterMeta = {
    parsed: filter,
    signature: filterSignature(filter),
    description: filterDescription(filter),
    isCompanyWide: isCompanyWide(filter),
  }
  const counts = { totalSubmitted, matchingFilter }
  const assessmentMeta = {
    id: assessment.id,
    clientName: assessment.clientName,
    status: assessment.status,
    deadline: assessment.deadline,
    closedAt: assessment.closedAt,
    code: assessment.code,
    maxUses: assessment.maxUses,
  }

  // Lock decisions
  if (matchingFilter < MIN_RESPONDENTS_FOR_VIEW) {
    return {
      assessment: assessmentMeta,
      filter: filterMeta,
      counts,
      lock: {
        reason: matchingFilter === 0 ? 'no_respondents' : 'below_floor',
        count: matchingFilter,
        isCompanyWide: filterMeta.isCompanyWide,
      },
      aggregates: null,
      respondents: [],
      availableDepartments,
      allSubmittedDemos,
    }
  }

  const respondentIds = matchingRespondents.map((r) => r.id)
  const responses = await prisma.response.findMany({
    where: { respondentId: { in: respondentIds } },
    select: { respondentId: true, questionId: true, value: true },
  })

  const individuals = computeIndividualScores(
    responses.map((r) => ({
      respondentId: r.respondentId,
      questionId: r.questionId,
      value: r.value,
    })),
    respondentIds,
  )
  const aggregates = aggregateTeam(individuals, matchingFilter)

  const respondents: RespondentRow[] = matchingRespondents.map((r) => {
    const scores = individuals.get(r.id) ?? emptyIndividual()
    return {
      name: r.name,
      department: r.department?.name ?? null,
      level: r.level,
      tenure: r.tenure,
      overall: scores.overall,
      pillars: pillarVector(scores),
      capabilities: capabilityVector(scores),
    }
  })

  return {
    assessment: assessmentMeta,
    filter: filterMeta,
    counts,
    lock: null,
    aggregates,
    respondents,
    availableDepartments,
    allSubmittedDemos,
  }
}

function emptyIndividual(): IndividualScores {
  return { capabilities: {}, pillars: {}, overall: null }
}

function pillarVector(s: IndividualScores): Record<PillarKey, number | null> {
  const out = {} as Record<PillarKey, number | null>
  for (const p of PILLAR_ORDER) out[p] = s.pillars[p] ?? null
  return out
}

function capabilityVector(s: IndividualScores): Record<CapabilityKey, number | null> {
  const out = {} as Record<CapabilityKey, number | null>
  for (const c of CAPABILITY_ORDER) out[c] = s.capabilities[c] ?? null
  return out
}

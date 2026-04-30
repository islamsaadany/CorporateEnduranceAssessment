// GET /api/assessments/[id]/results
//
// Returns the fully-aggregated numerical report for the assessment under
// the active filter (read from the URL query string per the spec in
// product-spec/06). NextAuth-gated. Source-of-truth math: src/lib/scoring.ts.
//
// The shape is designed to be the single read source for both the report
// page (slice 6.2+) and the AI generation endpoint (Phase 7) — so they
// can never disagree on what "the numbers" are.

import { NextResponse } from 'next/server'
import type { Level, TenureBand } from '@prisma/client'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  filterDescription,
  filterSignature,
  isCompanyWide,
  parseFilterFromSearchParams,
  prismaWhereForFilter,
} from '@/lib/filters'
import {
  aggregateTeam,
  computeIndividualScores,
  type IndividualScores,
} from '@/lib/scoring'
import { CAPABILITY_ORDER, MIN_RESPONDENTS_FOR_VIEW, PILLAR_ORDER } from '@/data/constants'
import type {
  AggregatedResults,
  BandKey,
  CapabilityKey,
  ParsedFilter,
  PillarKey,
} from '@/data/types'

interface Ctx {
  params: Promise<{ id: string }>
}

interface RespondentRow {
  letter: string
  department: string | null
  level: Level | null
  tenure: TenureBand | null
  overall: number | null
  pillars: Record<PillarKey, number | null>
  capabilities: Record<CapabilityKey, number | null>
}

interface LockInfo {
  reason: 'no_respondents' | 'below_floor'
  count: number
  isCompanyWide: boolean
}

interface ResultsResponse {
  assessment: {
    id: string
    clientName: string
    status: 'collecting' | 'closed'
    deadline: string
    closedAt: string | null
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
    totalSubmitted: number // submitted respondents on the assessment, ignoring filter
    matchingFilter: number // submitted respondents matching the filter
  }
  lock: LockInfo | null
  aggregates: AggregatedResults | null
  respondents: RespondentRow[]
}

export async function GET(req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const url = new URL(req.url)
  const filter = parseFilterFromSearchParams(url.searchParams)

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    select: {
      id: true,
      clientName: true,
      status: true,
      deadline: true,
      closedAt: true,
      code: true,
      maxUses: true,
    },
  })
  if (!assessment) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // "Submitted" gate: only respondents with submittedAt IS NOT NULL count
  // toward team aggregates, the per-capability rated counts, and the ≥3
  // anonymity floor. In-flight respondents (demographics done, answers
  // partial or unsubmitted) are excluded entirely from the report
  // (product-spec/03 § 3.1, /06 § 3.1).
  const submittedScope = {
    assessmentId: id,
    submittedAt: { not: null },
  } as const

  const totalSubmitted = await prisma.respondent.count({ where: submittedScope })

  const matchingRespondents = await prisma.respondent.findMany({
    where: {
      ...submittedScope,
      ...prismaWhereForFilter(filter),
    },
    select: {
      id: true,
      level: true,
      tenure: true,
      submittedAt: true,
      department: { select: { name: true } },
      // Note: we don't select `name` here. Names are stored but never
      // exposed by this API surface — the admin reveal toggle (slice 6.2)
      // will use a separate gated endpoint per product-spec/11 § 3.
    },
    orderBy: { submittedAt: 'asc' },
  })

  const matchingFilter = matchingRespondents.length

  // ── Lock decisions ───────────────────────────────────────────────────
  let lock: LockInfo | null = null
  if (matchingFilter === 0) {
    lock = {
      reason: 'no_respondents',
      count: 0,
      isCompanyWide: isCompanyWide(filter),
    }
  } else if (matchingFilter < MIN_RESPONDENTS_FOR_VIEW) {
    lock = {
      reason: 'below_floor',
      count: matchingFilter,
      isCompanyWide: isCompanyWide(filter),
    }
  }

  const baseResponse: Omit<ResultsResponse, 'aggregates' | 'respondents' | 'lock'> = {
    assessment: {
      id: assessment.id,
      clientName: assessment.clientName,
      status: assessment.status,
      deadline: assessment.deadline.toISOString(),
      closedAt: assessment.closedAt?.toISOString() ?? null,
      code: assessment.code,
      maxUses: assessment.maxUses,
    },
    filter: {
      parsed: filter,
      signature: filterSignature(filter),
      description: filterDescription(filter),
      isCompanyWide: isCompanyWide(filter),
    },
    counts: { totalSubmitted, matchingFilter },
  }

  if (lock) {
    return NextResponse.json({
      ...baseResponse,
      lock,
      aggregates: null,
      respondents: [],
    } satisfies ResultsResponse)
  }

  // ── Fetch responses for the matching respondents ─────────────────────
  const respondentIds = matchingRespondents.map((r) => r.id)
  const responses = await prisma.response.findMany({
    where: { respondentId: { in: respondentIds } },
    select: { respondentId: true, questionId: true, value: true },
  })

  // ── Compute scores ───────────────────────────────────────────────────
  const individuals = computeIndividualScores(
    responses.map((r) => ({
      respondentId: r.respondentId,
      questionId: r.questionId,
      value: r.value,
    })),
    respondentIds,
  )
  const aggregates = aggregateTeam(individuals, matchingFilter)

  // ── Per-respondent rows (anonymized; letters assigned at render) ─────
  const respondents: RespondentRow[] = matchingRespondents.map((r, i) => {
    const scores = individuals.get(r.id) ?? emptyIndividual()
    return {
      letter: letterFor(i),
      department: r.department?.name ?? null,
      level: r.level,
      tenure: r.tenure,
      overall: scores.overall,
      pillars: pillarVector(scores),
      capabilities: capabilityVector(scores),
    }
  })

  return NextResponse.json({
    ...baseResponse,
    lock: null,
    aggregates,
    respondents,
  } satisfies ResultsResponse)
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

// Anonymized letter labels: A, B, ..., Z, AA, AB, ... so we don't run out
// at >26 respondents (rare but legal — maxUses caps at 500). Letters are
// ephemeral per product-spec/05 § 6.3 — they're assigned in submitted-at
// order here for stable JSON output across calls but carry no meaning.
function letterFor(index: number): string {
  let n = index
  let out = ''
  do {
    out = String.fromCharCode(65 + (n % 26)) + out
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return out
}

// Re-export the response type for the page consumers.
export type { ResultsResponse, RespondentRow, LockInfo }
// `BandKey` re-export keeps the page from having to re-import constants.
export type { BandKey }

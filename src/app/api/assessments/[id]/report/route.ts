import { NextResponse } from 'next/server'
import type { AiReportOutput } from '@/data/types'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import {
  AiConfigError,
  AiGenerationError,
  generateReport,
  readCachedReport,
  writeCachedReport,
} from '@/lib/ai'
import { parseFilterFromSearchParams } from '@/lib/filters'
import { loadResults } from '@/lib/results-service'

/**
 * AI report endpoint, keyed by `(assessmentId, filterSignature)`.
 *
 *   GET   → return cached row for the active filter, or 404 if none
 *   POST  → run generateReport(), upsert the cache row, audit-log
 *           ai.generate, return the row. Server enforces the ≥3
 *           anonymity floor + the assessment-exists gate. Pre-closure
 *           generations land as `isDraft=true`.
 *
 * Validation hardening (spec 14 § 4) + retry / fallback (spec 14 § 5)
 * are slice 7.4. This slice surfaces any error from generateReport()
 * directly to the caller for the moment.
 *
 * Cache invalidation on respondent edits is Phase 9.
 */

interface Ctx {
  params: Promise<{ id: string }>
}

interface SerializedReport {
  outputJson: AiReportOutput
  isDraft: boolean
  generatedAt: string
  provider: string
  promptVersion: number
  filterSignature: string
  generatedBy: { name: string } | null
}

async function serializeRow(row: import('@prisma/client').GeneratedReport): Promise<SerializedReport> {
  const generatedBy = await prisma.admin.findUnique({
    where: { id: row.generatedById },
    select: { name: true },
  })
  return {
    outputJson: row.outputJson as unknown as AiReportOutput,
    isDraft: row.isDraft,
    generatedAt: row.generatedAt.toISOString(),
    provider: row.provider,
    promptVersion: row.promptVersion,
    filterSignature: row.filterSignature,
    generatedBy,
  }
}

function urlParamsFrom(req: Request): URLSearchParams {
  return new URL(req.url).searchParams
}

// ─── GET ─────────────────────────────────────────────────────────────────

export async function GET(req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const filter = parseFilterFromSearchParams(urlParamsFrom(req))
  const bundle = await loadResults(id, filter)
  if (!bundle) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const row = await readCachedReport(id, bundle.filter.signature)
  if (!row) {
    return NextResponse.json({ cached: false })
  }
  return NextResponse.json({ cached: true, report: await serializeRow(row) })
}

// ─── POST ────────────────────────────────────────────────────────────────

export async function POST(req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const filter = parseFilterFromSearchParams(urlParamsFrom(req))
  const bundle = await loadResults(id, filter)
  if (!bundle) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // Server-side guardrails — the button on the report page is hidden
  // when these are true, but defense in depth.
  if (bundle.lock || !bundle.aggregates) {
    return NextResponse.json(
      {
        error: 'anonymity_floor',
        message: `AI generation requires at least ${bundle.lock?.count ?? 0} respondents in this filter to satisfy the anonymity guardrail.`,
      },
      { status: 409 },
    )
  }
  if (bundle.aggregates.focusAreas.length === 0) {
    return NextResponse.json(
      { error: 'no_focus_areas', message: 'Cannot generate a report — no focus areas were identified.' },
      { status: 409 },
    )
  }

  const isDraft = bundle.assessment.status === 'collecting'

  let result: Awaited<ReturnType<typeof generateReport>>
  try {
    result = await generateReport({
      filterDescription: bundle.filter.description,
      filterIsCompanyWide: bundle.filter.isCompanyWide,
      matchingFilter: bundle.counts.matchingFilter,
      totalSubmitted: bundle.counts.totalSubmitted,
      assessmentStatus: bundle.assessment.status,
      aggregates: bundle.aggregates,
      respondents: bundle.respondents.map((r) => ({
        name: r.name,
        department: r.department,
        level: r.level,
        tenure: r.tenure,
        capabilities: r.capabilities,
      })),
    })
  } catch (err) {
    if (err instanceof AiConfigError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: err.code === 'no_key_configured' ? 412 : 500 },
      )
    }
    if (err instanceof AiGenerationError) {
      return NextResponse.json(
        { error: err.code, message: err.message, details: err.details ?? null },
        { status: 502 },
      )
    }
    return NextResponse.json(
      { error: 'unknown', message: err instanceof Error ? err.message : 'unknown error' },
      { status: 500 },
    )
  }

  // Cache write per Q3/A — generateReport() is pure, the route persists.
  // Q4/A — inputJson stores the *stripped* (letter-labeled) snapshot.
  const row = await writeCachedReport({
    assessmentId: id,
    filterSignature: bundle.filter.signature,
    isDraft,
    promptVersion: result.promptVersion,
    provider: result.provider,
    inputJson: result.inputSnapshot as unknown as import('@prisma/client').Prisma.InputJsonValue,
    outputJson: result.outputJson as unknown as import('@prisma/client').Prisma.InputJsonValue,
    generatedById: session.user.id,
  })

  await logAdminAction({
    actorAdminId: session.user.id,
    assessmentId: id,
    action: 'ai.generate',
    metadata: {
      filterSignature: bundle.filter.signature,
      filterDescription: bundle.filter.description,
      provider: result.provider,
      model: result.model,
      promptVersion: result.promptVersion,
      isDraft,
      sampleSize: bundle.counts.matchingFilter,
    },
  })

  return NextResponse.json({ cached: true, report: await serializeRow(row) })
}

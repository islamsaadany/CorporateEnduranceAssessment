import { NextResponse } from 'next/server'
import type { AiReportOutput } from '@/data/types'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { generateReport, readCachedReport, writeCachedReport } from '@/lib/ai'
import { parseFilterFromSearchParams } from '@/lib/filters'
import { loadResults } from '@/lib/results-service'

/**
 * AI report endpoint, keyed by `(assessmentId, filterSignature)`.
 *
 *   GET   → return cached row for the active filter, or { cached: false }
 *   POST  → run generateReport(); on success write cache + audit ai.generate;
 *           on fallback DO NOT cache (per spec 14 § 5), audit
 *           ai.generation_failed + ai.fallback_used, return the fallback
 *           content with `kind: 'fallback'` so the client can render it
 *           transiently with a Retry button.
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

  // Server-side guardrails — defense in depth (button is hidden client-side).
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

  const outcome = await generateReport({
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

  if (outcome.kind === 'success') {
    // Q3/A — Q4/A: cache the *stripped* snapshot as the audit trail.
    const row = await writeCachedReport({
      assessmentId: id,
      filterSignature: bundle.filter.signature,
      isDraft,
      promptVersion: outcome.promptVersion,
      provider: outcome.provider,
      inputJson: outcome.inputSnapshot as unknown as import('@prisma/client').Prisma.InputJsonValue,
      outputJson: outcome.outputJson as unknown as import('@prisma/client').Prisma.InputJsonValue,
      generatedById: session.user.id,
    })
    await logAdminAction({
      actorAdminId: session.user.id,
      assessmentId: id,
      action: 'ai.generate',
      metadata: {
        filterSignature: bundle.filter.signature,
        filterDescription: bundle.filter.description,
        provider: outcome.provider,
        model: outcome.model,
        promptVersion: outcome.promptVersion,
        isDraft,
        sampleSize: bundle.counts.matchingFilter,
        attempts: outcome.attempts,
        // Q1/A: granular per-call quality signals.
        softFixes: outcome.softFixes,
      },
    })
    return NextResponse.json({ kind: 'success', report: await serializeRow(row) })
  }

  // Fallback path — DO NOT cache. Audit two events so the activity log
  // tells the full story: the failure and the recovery.
  await logAdminAction({
    actorAdminId: session.user.id,
    assessmentId: id,
    action: 'ai.generation_failed',
    metadata: {
      filterSignature: bundle.filter.signature,
      filterDescription: bundle.filter.description,
      provider: outcome.provider,
      attempts: outcome.attempts,
      reason: outcome.reason,
      attemptReasons: outcome.attemptReasons,
      isDraft,
      sampleSize: bundle.counts.matchingFilter,
    },
  })
  await logAdminAction({
    actorAdminId: session.user.id,
    assessmentId: id,
    action: 'ai.fallback_used',
    metadata: {
      filterSignature: bundle.filter.signature,
      filterDescription: bundle.filter.description,
      provider: outcome.provider,
      reason: outcome.reason,
      overallBand: bundle.aggregates.overall.band,
      isDraft,
    },
  })

  return NextResponse.json({
    kind: 'fallback',
    fallback: {
      outputJson: outcome.outputJson,
      provider: outcome.provider,
      reason: outcome.reason,
      attempts: outcome.attempts,
      isDraft,
    },
  })
}

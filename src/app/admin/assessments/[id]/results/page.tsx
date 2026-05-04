// /admin/assessments/[id]/results — slice 6.2 + 7.3 (AI section).
//
// Server component. Reads filter from URL query string, renders the
// banner stack + four numerical sections + (slice 7.3) the AI Insights
// section above the Summary hero with cached executive summary +
// Generate / Regenerate button. Focus Areas inherits AI-adapted action
// items when the cache row exists for the active filter.

import Link from 'next/link'
import { notFound } from 'next/navigation'

import type { AiReportOutput } from '@/data/types'
import { readCachedReport } from '@/lib/ai'
import { requireAdmin } from '@/lib/admin-guard'
import { filterToQueryString, parseFilterFromSearchParams } from '@/lib/filters'
import { prisma } from '@/lib/prisma'
import { loadResults } from '@/lib/results-service'

import { AiSection, type CachedReport } from './ai-section'
import { PreliminaryBanner } from './banners'
import { FilterControls } from './filter-controls'
import { LockCard } from './lock-card'
import { SummarySection } from './summary-section'
import { WhoRespondedSection } from './who-responded-section'
import { CapabilityProfileSection } from './capability-profile-section'
import { FocusAreasSection } from './focus-areas-section'
import { IndividualResponsesSection } from './individual-responses-section'

export const metadata = { title: 'Results — The Endurance Assessment' }

interface ResultsPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ResultsPage({ params, searchParams }: ResultsPageProps) {
  await requireAdmin()
  const { id } = await params
  const sp = await searchParams

  // Build URLSearchParams from the awaited Next.js searchParams object so
  // parseFilterFromSearchParams sees the same shape it gets from a Request.
  const urlParams = new URLSearchParams()
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === 'string') urlParams.set(k, v)
    else if (Array.isArray(v) && v.length > 0) urlParams.set(k, v.join(','))
  }
  const filter = parseFilterFromSearchParams(urlParams)

  const bundle = await loadResults(id, filter)
  if (!bundle) notFound()

  const { assessment, counts, lock, aggregates, respondents } = bundle

  // Pre-fetch the cached AI report row for this filter so the AI section
  // and the focus-areas section render in the same server pass — no
  // client round-trip on initial load. Skipped when locked or empty.
  let cachedReport: CachedReport | null = null
  if (!lock && aggregates) {
    const row = await readCachedReport(id, bundle.filter.signature)
    if (row) {
      const generatedBy = await prisma.admin.findUnique({
        where: { id: row.generatedById },
        select: { name: true },
      })
      cachedReport = {
        outputJson: normalizeOutputJson(row.outputJson as unknown as AiReportOutput),
        isDraft: row.isDraft,
        generatedAt: row.generatedAt.toISOString(),
        provider: row.provider,
        promptVersion: row.promptVersion,
        filterSignature: row.filterSignature,
        generatedBy,
      }
    }
  }

  // Filter query string (canonical, sorted) — same form as filterSignature
  // but URL-safe ("" for company-wide so we don't carry a stray `?`).
  const filterQueryString = filterToQueryString(filter)
  const belowAnonymityFloor = Boolean(lock)
  const noFocusAreas = Boolean(aggregates && aggregates.focusAreas.length === 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Link
          href={`/admin/assessments/${assessment.id}`}
          className="text-sm text-brand-grey-text transition hover:text-brand-dark-blue"
        >
          ← Back to assessment
        </Link>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="font-serif text-3xl font-bold text-brand-dark-blue">
            Results — {assessment.clientName}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/admin/assessments/${assessment.id}/results/compare`}
              className="rounded border border-brand-dark-blue bg-white px-3 py-1 text-xs font-medium text-brand-dark-blue transition hover:bg-brand-dark-blue hover:text-white"
            >
              Compare segments
            </Link>
            <p className="text-sm text-brand-grey-text">
              {assessment.status === 'closed' ? 'Closed' : 'Collecting'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter controls + banner stack */}
      <div className="space-y-2">
        <FilterControls
          assessmentId={assessment.id}
          currentFilter={bundle.filter.parsed}
          matchingFilter={counts.matchingFilter}
          isCompanyWide={bundle.filter.isCompanyWide}
          availableDepartments={bundle.availableDepartments}
          allSubmittedDemos={bundle.allSubmittedDemos}
        />
        {assessment.status === 'collecting' ? (
          <PreliminaryBanner
            matchingFilter={counts.matchingFilter}
            totalSubmitted={counts.totalSubmitted}
            expected={assessment.maxUses}
            deadline={assessment.deadline}
          />
        ) : null}
      </div>

      {/* Body: lock or sections */}
      {lock ? (
        <LockCard assessmentId={assessment.id} lock={lock} />
      ) : aggregates ? (
        <div className="space-y-8">
          <AiSection
            assessmentId={assessment.id}
            filterQueryString={filterQueryString}
            cached={cachedReport}
            belowAnonymityFloor={belowAnonymityFloor}
            noFocusAreas={noFocusAreas}
          />
          <SummarySection aggregates={aggregates} />
          <WhoRespondedSection allSubmittedDemos={bundle.allSubmittedDemos} />
          <CapabilityProfileSection aggregates={aggregates} />
          <FocusAreasSection
            aggregates={aggregates}
            aiPerCapability={cachedReport?.outputJson.focusAreas}
          />
          <IndividualResponsesSection respondents={respondents} />
        </div>
      ) : null}
    </div>
  )
}

/**
 * Backward-compat shim covering all prompt-version migrations:
 *   v1 → v2: `executiveSummary` was a single string; wrap as one-bullet array
 *   v2 → v3: `focusAreaActions: [{capability, actions}]` → `focusAreas:
 *            [{capability, observations: [], actions}]`
 *
 * Legacy rows render without crashing; the AI section already shows a
 * "regenerate for the latest framing" note when `promptVersion <
 * CURRENT_PROMPT_VERSION`. Per CLAUDE.md we never silently invalidate.
 */
function normalizeOutputJson(raw: AiReportOutput): AiReportOutput {
  // ── executiveSummary: string (v1) → string[] ────────────────────────
  let executiveSummary: string[]
  const summary = raw.executiveSummary as unknown
  if (typeof summary === 'string') {
    executiveSummary = [summary]
  } else if (Array.isArray(summary)) {
    executiveSummary = summary as string[]
  } else {
    executiveSummary = []
  }

  // ── focusAreas: v2's focusAreaActions → v3's focusAreas ─────────────
  let focusAreas: AiReportOutput['focusAreas']
  const v3 = (raw as { focusAreas?: AiReportOutput['focusAreas'] }).focusAreas
  if (Array.isArray(v3)) {
    focusAreas = v3
  } else {
    const v2 = (raw as { focusAreaActions?: Array<{ capability: AiReportOutput['focusAreas'][number]['capability']; actions: string[] }> }).focusAreaActions
    if (Array.isArray(v2)) {
      focusAreas = v2.map((fa) => ({
        capability: fa.capability,
        observations: [],
        actions: fa.actions,
      }))
    } else {
      focusAreas = []
    }
  }

  return { ...raw, executiveSummary, focusAreas }
}

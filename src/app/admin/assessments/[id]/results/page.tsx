// /admin/assessments/[id]/results — slice 6.2.
//
// Server component. Reads filter from URL query string (always
// "company-wide" in 6.2 since the filter UI ships in 6.3) and renders
// the four-section numerical report with the banner stack at the top.

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireAdmin } from '@/lib/admin-guard'
import { parseFilterFromSearchParams } from '@/lib/filters'
import { loadResults } from '@/lib/results-service'

import { PreliminaryBanner } from './banners'
import { FilterControls } from './filter-controls'
import { LockCard } from './lock-card'
import { SummarySection } from './summary-section'
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
          <p className="text-sm text-brand-grey-text">
            {assessment.status === 'closed' ? 'Closed' : 'Collecting'}
          </p>
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
          <SummarySection aggregates={aggregates} />
          <CapabilityProfileSection aggregates={aggregates} />
          <FocusAreasSection aggregates={aggregates} />
          <IndividualResponsesSection respondents={respondents} />
        </div>
      ) : null}
    </div>
  )
}

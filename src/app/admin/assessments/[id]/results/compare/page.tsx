// /admin/assessments/[id]/results/compare — slice 6.4.
//
// Server component. Reads two filters from the URL (a* and b* prefixes),
// runs the aggregation engine twice in parallel, and renders the twin
// comparison sections. Quantitative only — no AI narrative comparison
// or per-respondent table in v1 (spec 06 § 6.3).
//
// Each side is independently checked against the ≥3 anonymity floor;
// when one side is locked, that column shows a "Locked" placeholder
// and the other still renders (spec 06 § 6.2).

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireAdmin } from '@/lib/admin-guard'
import { filterToQueryString, parseFilterFromSearchParams } from '@/lib/filters'
import { loadResults } from '@/lib/results-service'

import { ComparisonCapabilitySection } from './comparison-capability-section'
import { ComparisonFilterControls } from './comparison-filter-controls'
import { ComparisonFocusAreasSection } from './comparison-focus-areas-section'
import { ComparisonPillarSection } from './comparison-pillar-section'
import { ComparisonSummarySection } from './comparison-summary-section'

export const metadata = { title: 'Compare segments — The Endurance Assessment' }

interface ComparePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ComparePage({ params, searchParams }: ComparePageProps) {
  await requireAdmin()
  const { id } = await params
  const sp = await searchParams

  // Build URLSearchParams once so the prefix parser can read both A and B.
  const urlParams = new URLSearchParams()
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === 'string') urlParams.set(k, v)
    else if (Array.isArray(v) && v.length > 0) urlParams.set(k, v.join(','))
  }
  const filterA = parseFilterFromSearchParams(urlParams, 'a')
  const filterB = parseFilterFromSearchParams(urlParams, 'b')

  const [bundleA, bundleB] = await Promise.all([loadResults(id, filterA), loadResults(id, filterB)])
  if (!bundleA || !bundleB) notFound()

  // "Exit comparison" returns to the single-filter report view with
  // Filter A as the active filter (spec 06 § 6.4).
  const exitQs = filterToQueryString(bundleA.filter.parsed)
  const exitHref = `/admin/assessments/${bundleA.assessment.id}/results${exitQs ? `?${exitQs}` : ''}`

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href={exitHref}
          className="text-sm text-brand-grey-text transition hover:text-brand-dark-blue"
        >
          ← Exit comparison
        </Link>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="font-serif text-3xl font-bold text-brand-dark-blue">
            Compare segments — {bundleA.assessment.clientName}
          </h1>
          <p className="text-sm text-brand-grey-text">
            {bundleA.assessment.status === 'closed' ? 'Closed' : 'Collecting'}
          </p>
        </div>
      </div>

      <ComparisonFilterControls
        assessmentId={bundleA.assessment.id}
        filterA={bundleA.filter.parsed}
        filterB={bundleB.filter.parsed}
        matchingA={bundleA.counts.matchingFilter}
        matchingB={bundleB.counts.matchingFilter}
        availableDepartments={bundleA.availableDepartments}
        allSubmittedDemos={bundleA.allSubmittedDemos}
      />

      <div className="space-y-8">
        <ComparisonSummarySection a={bundleA} b={bundleB} />
        <ComparisonPillarSection a={bundleA} b={bundleB} />
        <ComparisonCapabilitySection a={bundleA} b={bundleB} />
        <ComparisonFocusAreasSection a={bundleA} b={bundleB} />
      </div>
    </div>
  )
}

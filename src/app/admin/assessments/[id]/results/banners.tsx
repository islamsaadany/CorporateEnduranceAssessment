// Filter banner + "Preliminary — N of M" banner. The Draft AI banner
// (spec 05 § 2.3) lands in Phase 7 alongside the AI integration.

interface FilterBannerProps {
  description: string
  matchingFilter: number
}

export function FilterBanner({ description, matchingFilter }: FilterBannerProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-brand-grey-light bg-brand-grey-soft-bg px-4 py-3">
      <p className="text-sm text-brand-dark-blue">
        <span className="font-medium">{description}</span>{' '}
        <span className="text-brand-grey-text">
          ({matchingFilter} respondent{matchingFilter === 1 ? '' : 's'})
        </span>
      </p>
    </div>
  )
}

interface PreliminaryBannerProps {
  matchingFilter: number
  totalSubmitted: number
  expected: number
  deadline: Date
}

export function PreliminaryBanner({
  matchingFilter,
  totalSubmitted,
  expected,
  deadline,
}: PreliminaryBannerProps) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
  // Show the per-filter count when filtered; the company-wide count
  // ("N of M responded") otherwise — the spec's banner copy assumes the
  // unfiltered case but the filter banner already states the per-filter N.
  const isFiltered = matchingFilter !== totalSubmitted
  return (
    <div
      className="rounded border border-[#F5C97A] bg-[#FFF4E6] px-4 py-3 text-sm text-brand-dark-blue"
      role="status"
    >
      <span className="font-medium">Preliminary —</span> based on{' '}
      {isFiltered
        ? `${matchingFilter} of ${totalSubmitted} submitted (filtered) of ${expected} expected respondents`
        : `${totalSubmitted} of ${expected} expected respondents`}
      . Final results lock at the deadline ({fmt.format(deadline)}).
    </div>
  )
}

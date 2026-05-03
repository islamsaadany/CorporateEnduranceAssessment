// "Preliminary — N of M" banner. The Draft AI banner (spec 05 § 2.3)
// lands in Phase 7. The filter banner moved to FilterControls in slice 6.3.

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

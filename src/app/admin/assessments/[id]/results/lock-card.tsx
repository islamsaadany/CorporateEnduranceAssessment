// Centered lock card shown when the active filter (or company-wide view)
// has fewer than the anonymity floor of submitted respondents. Spec 06 § 3.2.

import Link from 'next/link'
import type { LockInfo } from '@/lib/results-service'
import { MIN_RESPONDENTS_FOR_VIEW } from '@/data/constants'

interface LockCardProps {
  assessmentId: string
  lock: LockInfo
}

export function LockCard({ assessmentId, lock }: LockCardProps) {
  const message = (() => {
    if (lock.reason === 'no_respondents') {
      return lock.isCompanyWide
        ? 'Awaiting first response. Once at least 3 respondents submit, results will appear here.'
        : 'No respondents match this filter.'
    }
    // below_floor (1–2)
    return lock.isCompanyWide
      ? `Awaiting more responses (currently ${lock.count} of at least ${MIN_RESPONDENTS_FOR_VIEW} required to display anonymously).`
      : `Too few respondents (${lock.count}) to display this segment anonymously. Adjust the filter or return to company-wide view.`
  })()

  return (
    <div className="rounded border border-brand-grey-light bg-brand-grey-soft-bg px-8 py-16 text-center">
      <p className="font-serif text-2xl text-brand-dark-blue">Results locked</p>
      <p className="mx-auto mt-3 max-w-xl text-sm text-brand-grey-text">{message}</p>
      {!lock.isCompanyWide ? (
        <Link
          href={`/admin/assessments/${assessmentId}/results`}
          className="mt-6 inline-block rounded border border-brand-dark-blue px-4 py-1.5 text-sm font-medium text-brand-dark-blue transition hover:bg-brand-dark-blue hover:text-white"
        >
          Clear filter
        </Link>
      ) : null}
    </div>
  )
}

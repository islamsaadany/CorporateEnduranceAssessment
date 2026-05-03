'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface GenerateButtonProps {
  assessmentId: string
  /**
   * The query string used by the page to identify the filter (e.g.
   * `?dept=Sales&level=manager`). Forwarded as-is to the POST endpoint
   * so the server resolves the same filter signature the page used.
   */
  filterQueryString: string
  label: string
}

/**
 * Calls POST /api/assessments/[id]/report?<filter>. Spinner is button-level
 * only — the rest of the page stays interactive. On success, refreshes the
 * server component so the new cache row replaces the old summary inline.
 *
 * Per spec 14 § 6 the call typically completes in 5–15s. We show the
 * timing in the label so the admin doesn't think it stalled.
 */
export function GenerateButton({ assessmentId, filterQueryString, label }: GenerateButtonProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onClick() {
    setError(null)
    startTransition(async () => {
      try {
        const url = `/api/assessments/${assessmentId}/report${filterQueryString ? `?${filterQueryString}` : ''}`
        const res = await fetch(url, { method: 'POST' })
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string
            message?: string
          }
          setError(data.message ?? data.error ?? `Generation failed (${res.status}).`)
          return
        }
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error.')
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="inline-flex items-center justify-center rounded bg-brand-dark-blue px-4 py-2 text-xs font-medium text-white transition hover:bg-brand-dark-blue/90 disabled:cursor-not-allowed disabled:bg-brand-grey-light disabled:text-brand-grey-text"
      >
        {isPending ? 'Generating… (up to 15s)' : label}
      </button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  )
}

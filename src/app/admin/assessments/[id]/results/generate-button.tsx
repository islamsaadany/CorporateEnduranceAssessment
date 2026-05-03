'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { AiReportOutput } from '@/data/types'

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

interface FallbackResult {
  outputJson: AiReportOutput
  provider: string | null
  reason: string
  attempts: number
  isDraft: boolean
}

/**
 * POSTs to /api/assessments/[id]/report?<filter>.
 *
 * Three outcomes:
 *   - HTTP error → red error message under the button
 *   - JSON kind=success → router.refresh(); the AI section above re-renders
 *     with the new cached row; this component clears its transient state
 *   - JSON kind=fallback → render the baseline summary inline below the
 *     button (per spec 14 § 5; not cached) plus a Retry button (Q3/B).
 *
 * Per Q2/A the label says "(up to 30s)" because retry doubles the worst
 * case from spec 14 § 6's 5–15s baseline.
 */
export function GenerateButton({ assessmentId, filterQueryString, label }: GenerateButtonProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [fallback, setFallback] = useState<FallbackResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function onClick() {
    setError(null)
    setFallback(null)
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
        const data = (await res.json()) as
          | { kind: 'success' }
          | { kind: 'fallback'; fallback: FallbackResult }
        if (data.kind === 'success') {
          // New cache row exists — refresh server props so the AI section
          // and Focus Areas re-render with AI content.
          router.refresh()
        } else {
          // Fallback content is transient. Show inline; the user can Retry.
          setFallback(data.fallback)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error.')
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="inline-flex w-fit items-center justify-center rounded bg-brand-dark-blue px-4 py-2 text-xs font-medium text-white transition hover:bg-brand-dark-blue/90 disabled:cursor-not-allowed disabled:bg-brand-grey-light disabled:text-brand-grey-text"
      >
        {isPending ? 'Generating… (up to 30s)' : label}
      </button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
      {fallback ? <FallbackCard fallback={fallback} onRetry={onClick} disabled={isPending} /> : null}
    </div>
  )
}

function FallbackCard({
  fallback,
  onRetry,
  disabled,
}: {
  fallback: FallbackResult
  onRetry: () => void
  disabled: boolean
}) {
  return (
    <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[2px] text-amber-900">
        AI assistance unavailable — showing baseline content
      </p>
      <p className="mt-2 font-serif text-sm leading-relaxed text-brand-dark-blue">
        {fallback.outputJson.executiveSummary}
      </p>
      <p className="mt-2 text-[11px] italic text-amber-900">
        Generated from baseline content. The AI provider returned an unusable response after one
        retry. Baseline action items are also shown in the Focus Areas section below.
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={disabled}
        className="mt-3 inline-flex items-center justify-center rounded border border-amber-700 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {disabled ? 'Retrying…' : 'Retry AI generation'}
      </button>
    </div>
  )
}

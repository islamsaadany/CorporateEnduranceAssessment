'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CAPABILITY_LABELS, I_DONT_KNOW_LABEL, LIKERT_LABELS, PILLAR_LABELS } from '@/data/constants'
import { QUESTIONS, TOTAL_QUESTIONS } from '@/data/questions'
import type { CapabilityKey, PillarKey } from '@/data/types'

interface RespondentState {
  respondent: { id: string; submittedAt: string | null }
  answersByQuestionId: Record<string, number | null>
}

export function ReviewBoard() {
  const router = useRouter()
  const [state, setState] = useState<RespondentState | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    const id = findRespondentIdInStorage()
    if (!id) {
      setLoadError('We could not find your in-flight session.')
      setLoading(false)
      return
    }
    let cancelled = false
    fetch(`/api/respondents/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('fetch_failed')
        return (await res.json()) as RespondentState
      })
      .then((data) => {
        if (cancelled) return
        if (data.respondent.submittedAt) {
          router.push('/take/done')
          return
        }
        setState(data)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoadError('Could not load your session.')
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [router])

  const grouped = useMemo(() => {
    const out = new Map<PillarKey, Map<CapabilityKey, typeof QUESTIONS[number][]>>()
    for (const q of QUESTIONS) {
      if (!out.has(q.pillar)) out.set(q.pillar, new Map())
      const byCap = out.get(q.pillar)!
      if (!byCap.has(q.capability)) byCap.set(q.capability, [])
      byCap.get(q.capability)!.push(q)
    }
    return out
  }, [])

  const answeredCount = state
    ? Object.keys(state.answersByQuestionId).length
    : 0
  const allAnswered = answeredCount >= TOTAL_QUESTIONS

  const onSubmit = () => {
    if (!state || !allAnswered) return
    setSubmitError(null)
    startTransition(async () => {
      const res = await fetch(`/api/respondents/${state.respondent.id}/submit`, {
        method: 'POST',
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        setSubmitError(humanizeError(body?.error))
        return
      }
      router.push('/take/done')
    })
  }

  if (loading) return <p className="text-sm text-ink-muted">Loading…</p>
  if (loadError || !state) {
    return (
      <div className="rounded-md border border-band-critical/40 bg-band-critical/5 px-3 py-2 text-sm text-band-critical">
        {loadError}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between rounded-md border border-canvas-border bg-canvas px-4 py-3 text-sm">
        <span className="text-ink">
          Answered <strong>{answeredCount}</strong> of {TOTAL_QUESTIONS}
        </span>
        {!allAnswered ? (
          <span className="text-band-needs">
            {TOTAL_QUESTIONS - answeredCount} remaining — return to questions
          </span>
        ) : (
          <span className="text-band-strong">All questions answered</span>
        )}
      </div>

      {Array.from(grouped.entries()).map(([pillar, capMap]) => (
        <section key={pillar} className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-ink-muted">
            {PILLAR_LABELS[pillar]}
          </h2>
          <div className="overflow-hidden rounded-lg border border-canvas-border bg-canvas">
            {Array.from(capMap.entries()).map(([cap, qs]) => (
              <div key={cap} className="border-b border-canvas-border last:border-b-0">
                <p className="bg-canvas-muted px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink-muted">
                  {CAPABILITY_LABELS[cap]}
                </p>
                <ul>
                  {qs.map((q) => {
                    const value = state.answersByQuestionId[q.id]
                    const position = QUESTIONS.findIndex((qq) => qq.id === q.id) + 1
                    return (
                      <li key={q.id} className="border-t border-canvas-border first:border-t-0 px-4 py-3">
                        <div className="flex items-start justify-between gap-3 text-sm">
                          <p className="flex-1 text-ink">{q.text}</p>
                          <Link
                            href={`/take/question/${position}`}
                            className="shrink-0 text-xs font-medium text-ink-muted underline transition hover:text-ink"
                          >
                            Edit
                          </Link>
                        </div>
                        <p className="mt-1 text-xs text-ink-muted">
                          {value === undefined ? (
                            <span className="text-band-needs">Not answered</span>
                          ) : value === null ? (
                            <span className="italic">{I_DONT_KNOW_LABEL}</span>
                          ) : (
                            <>
                              <span className="font-mono">{value}</span> · {LIKERT_LABELS[value as 1 | 2 | 3 | 4]}
                            </>
                          )}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}

      {submitError ? (
        <div role="alert" className="rounded-md border border-band-critical/40 bg-band-critical/5 px-3 py-2 text-sm text-band-critical">
          {submitError}
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-canvas-border pt-4">
        <Link
          href={`/take/question/${TOTAL_QUESTIONS}`}
          className="text-sm font-medium text-ink-muted transition hover:text-ink"
        >
          ← Back to questions
        </Link>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!allAnswered || pending}
          className="inline-flex items-center justify-center rounded-md bg-ink px-6 py-3 text-sm font-medium text-canvas transition hover:bg-ink-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Submitting…' : 'Submit assessment'}
        </button>
      </div>
    </div>
  )
}

function humanizeError(code: string | undefined): string {
  switch (code) {
    case 'incomplete':
      return 'Some questions are still unanswered. Go back and answer them before submitting.'
    case 'demographics_incomplete':
      return 'Demographics are incomplete. Go back to the demographics screen.'
    case 'already_submitted':
      return 'This response has already been submitted.'
    case 'assessment_closed':
      return 'This assessment has closed. Submissions are no longer accepted.'
    default:
      return 'Could not submit. Please try again.'
  }
}

function findRespondentIdInStorage(): string | null {
  if (typeof window === 'undefined') return null
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith('tea_respondent_')) {
        return window.localStorage.getItem(key)
      }
    }
  } catch {
    // ignore
  }
  return null
}

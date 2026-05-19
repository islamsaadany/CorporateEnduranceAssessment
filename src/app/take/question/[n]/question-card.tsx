'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LIKERT_LABELS, LIKERT_VALUES, I_DONT_KNOW_LABEL } from '@/data/constants'
import { findInFlightRespondentId } from '@/lib/take-storage'

interface QuestionCardProps {
  position: number
  total: number
  eyebrow: string
  questionId: string
  questionText: string
}

type Selection = 1 | 2 | 3 | 4 | 'idk'

export function QuestionCard({ position, total, eyebrow, questionId, questionText }: QuestionCardProps) {
  const router = useRouter()
  const [respondentId, setRespondentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Selection | null>(null)
  const [saving, setSaving] = useState(false)
  // Last question only: while the submit network call is in flight,
  // lock the tiles + show "Submitting…" so the user doesn't double-click
  // and hit a confusing already_submitted error after a successful submit.
  const [submitting, setSubmitting] = useState(false)

  // Load respondent id + the existing answer for THIS question.
  useEffect(() => {
    const id = findInFlightRespondentId()
    if (!id) {
      setLoadError('We could not find your in-flight session. Please re-enter your access code.')
      setLoading(false)
      return
    }
    setRespondentId(id)

    let cancelled = false
    fetch(`/api/respondents/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('fetch_failed')
        return (await res.json()) as {
          respondent: { submittedAt: string | null }
          answersByQuestionId: Record<string, number | null>
        }
      })
      .then((data) => {
        if (cancelled) return
        if (data.respondent.submittedAt) {
          router.push('/take/done')
          return
        }
        const existing = data.answersByQuestionId[questionId]
        // existing === undefined → no row yet; null → "I don't know"; 1..4 → rated
        if (existing === undefined) {
          setSelected(null)
        } else if (existing === null) {
          setSelected('idk')
        } else {
          setSelected(existing as 1 | 2 | 3 | 4)
        }
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoadError('Could not load your session. Please re-enter your access code.')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [questionId, router])

  const persist = async (choice: Selection) => {
    if (!respondentId) return
    setSaving(true)
    setSelected(choice)
    try {
      const value = choice === 'idk' ? null : choice
      await fetch(`/api/respondents/${respondentId}/responses`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answers: [{ questionId, value }] }),
      })
    } finally {
      setSaving(false)
    }
  }

  const advance = async () => {
    if (position >= total) {
      // Last question: submit immediately. No review screen.
      if (!respondentId) return
      setSubmitting(true)
      try {
        const res = await fetch(`/api/respondents/${respondentId}/submit`, { method: 'POST' })
        if (!res.ok) {
          // Surface a one-line error and let the user retry by re-clicking.
          // The most common case is "incomplete" — they have an
          // unanswered question earlier in the flow.
          const body = (await res.json().catch(() => null)) as { error?: string } | null
          setLoadError(humanizeSubmitError(body?.error))
          setSubmitting(false)
          return
        }
        router.push('/take/done')
        // Don't unset submitting — the navigation away handles teardown.
      } catch {
        setLoadError('Could not submit. Please try again.')
        setSubmitting(false)
      }
    } else {
      router.push(`/take/question/${position + 1}`)
    }
  }

  const onSelect = async (choice: Selection) => {
    await persist(choice)
    // 300ms grace so the visual selection is visible before navigating
    setTimeout(advance, 300)
  }

  const onBack = () => {
    if (position <= 1) {
      router.push('/take/demographics')
    } else {
      router.push(`/take/question/${position - 1}`)
    }
  }

  // Keyboard shortcuts: 1..4 selects, 0 selects "I don't know".
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (loading || loadError) return
      if (e.key >= '1' && e.key <= '4') {
        const v = Number(e.key) as 1 | 2 | 3 | 4
        onSelect(v)
      } else if (e.key === '0') {
        onSelect('idk')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, loadError, respondentId])

  if (loading) {
    return <p className="text-sm text-ink-muted">Loading…</p>
  }
  if (loadError) {
    return (
      <div className="rounded-md border border-band-critical/40 bg-band-critical/5 px-3 py-2 text-sm text-band-critical">
        {loadError}
      </div>
    )
  }

  const progressPct = Math.round((position / total) * 100)

  return (
    <div className="space-y-8">
      {/* Progress bar */}
      <div>
        <div className="mb-1 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-ink-muted">
          <span>Question {position} of {total}</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas-muted">
          <div className="h-full bg-ink transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Eyebrow */}
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-muted">{eyebrow}</p>

      {/* Statement */}
      <h1 className="text-2xl font-medium leading-snug text-ink sm:text-3xl">{questionText}</h1>

      {/* Likert tiles — single horizontal row of 4 on desktop. On
          narrow screens (< 480px) they wrap to a 2×2 grid. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {LIKERT_VALUES.map((v) => {
          const isSelected = selected === v
          return (
            <button
              key={v}
              type="button"
              onClick={() => onSelect(v)}
              disabled={saving || submitting}
              className={`flex flex-col items-center gap-1 rounded-md border px-3 py-4 text-center text-sm transition disabled:cursor-not-allowed ${
                isSelected
                  ? 'border-ink bg-ink text-canvas'
                  : 'border-canvas-border bg-canvas text-ink hover:bg-canvas-muted'
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded font-mono text-sm font-semibold ${
                  isSelected ? 'bg-canvas/20 text-canvas' : 'bg-canvas-muted text-ink-muted'
                }`}
              >
                {v}
              </span>
              <span className="text-xs font-medium leading-tight sm:text-sm">{LIKERT_LABELS[v]}</span>
            </button>
          )
        })}
      </div>

      {/* I don't know — visually distinct */}
      <div>
        <button
          type="button"
          onClick={() => onSelect('idk')}
          disabled={saving}
          className={`w-full rounded-md border-2 border-dashed px-4 py-3 text-sm transition disabled:cursor-not-allowed ${
            selected === 'idk'
              ? 'border-ink bg-ink text-canvas'
              : 'border-canvas-border bg-canvas text-ink-muted hover:bg-canvas-muted hover:text-ink'
          }`}
        >
          {I_DONT_KNOW_LABEL}
          <span className="ml-2 text-xs opacity-60">(does not affect scoring)</span>
        </button>
      </div>

      {/* Footer: Back + status hint */}
      <div className="flex items-center justify-between border-t border-canvas-border pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="text-sm font-medium text-ink-muted transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Back
        </button>
        <span className="text-xs text-ink-subtle">
          {submitting
            ? 'Submitting…'
            : saving
              ? 'Saving…'
              : selected !== null
                ? 'Saved'
                : ' '}
        </span>
      </div>
    </div>
  )
}

function humanizeSubmitError(code: string | undefined): string {
  switch (code) {
    case 'incomplete':
      return 'You have an unanswered earlier question. Use Back to find and answer it.'
    case 'demographics_incomplete':
      return 'Your demographics are incomplete. Please return to the demographics step.'
    case 'already_submitted':
      return 'This response has already been submitted.'
    case 'assessment_closed':
      return 'This assessment has closed. No more responses are accepted.'
    default:
      return 'Could not submit. Please try again.'
  }
}


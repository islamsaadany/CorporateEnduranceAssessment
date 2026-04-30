'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LIKERT_LABELS, LIKERT_VALUES, I_DONT_KNOW_LABEL } from '@/data/constants'

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

  // Load respondent id + the existing answer for THIS question.
  useEffect(() => {
    const id = findRespondentIdInStorage()
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

  const advance = () => {
    if (position >= total) {
      router.push('/take/review')
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

      {/* Likert tiles */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {LIKERT_VALUES.map((v) => {
          const isSelected = selected === v
          return (
            <button
              key={v}
              type="button"
              onClick={() => onSelect(v)}
              disabled={saving}
              className={`flex items-center gap-3 rounded-md border px-4 py-3 text-left text-sm transition disabled:cursor-not-allowed ${
                isSelected
                  ? 'border-ink bg-ink text-canvas'
                  : 'border-canvas-border bg-canvas text-ink hover:bg-canvas-muted'
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-xs ${
                  isSelected ? 'bg-canvas/20 text-canvas' : 'bg-canvas-muted text-ink-muted'
                }`}
              >
                {v}
              </span>
              <span className="font-medium">{LIKERT_LABELS[v]}</span>
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

      {/* Footer: Back */}
      <div className="flex items-center justify-between border-t border-canvas-border pt-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-ink-muted transition hover:text-ink"
        >
          ← Back
        </button>
        <span className="text-xs text-ink-subtle">
          {saving ? 'Saving…' : selected !== null ? 'Saved' : ' '}
        </span>
      </div>
    </div>
  )
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

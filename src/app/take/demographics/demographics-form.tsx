'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Level, TenureBand } from '@prisma/client'
import { LEVELS, LEVEL_LABELS, TENURE_BANDS, TENURE_LABELS } from '@/data/constants'
import { findInFlightRespondentId } from '@/lib/take-storage'

interface DepartmentOption {
  id: string
  name: string
}

interface RespondentState {
  respondent: {
    id: string
    name: string | null
    departmentId: string | null
    level: Level | null
    tenure: TenureBand | null
    submittedAt: string | null
  }
  assessment: {
    id: string
    code: string
    departments: DepartmentOption[]
    status: string
  }
}

export function DemographicsForm() {
  const router = useRouter()

  const [state, setState] = useState<RespondentState | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [level, setLevel] = useState<Level | ''>('')
  const [tenure, setTenure] = useState<TenureBand | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // On mount: read respondentId out of localStorage (we don't know which
  // assessment-code key it's under without trying), then fetch state.
  useEffect(() => {
    const respondentId = findInFlightRespondentId()
    if (!respondentId) {
      setLoadError('We could not find your in-flight session. Please re-enter your access code.')
      setLoading(false)
      return
    }

    let cancelled = false
    fetch(`/api/respondents/${respondentId}`)
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
        setName(data.respondent.name ?? '')
        setDepartmentId(data.respondent.departmentId ?? '')
        setLevel(data.respondent.level ?? '')
        setTenure(data.respondent.tenure ?? '')
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
  }, [router])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!state) return
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    if (!departmentId) {
      setError('Please pick a department.')
      return
    }
    if (!level) {
      setError('Please pick a level.')
      return
    }
    if (!tenure) {
      setError('Please pick a tenure band.')
      return
    }

    startTransition(async () => {
      const res = await fetch(`/api/respondents/${state.respondent.id}/demographics`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          departmentId,
          level,
          tenure,
        }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        if (body?.error === 'assessment_full') {
          setError('This assessment is at capacity. Contact your consultant to raise the cap.')
        } else {
          setError('Could not save. Please try again.')
        }
        return
      }

      router.push('/take/question/1')
    })
  }

  if (loading) {
    return <p className="text-sm text-ink-muted">Loading…</p>
  }
  if (loadError || !state) {
    return (
      <div className="rounded-md border border-band-critical/40 bg-band-critical/5 px-3 py-2 text-sm text-band-critical">
        {loadError ?? 'Session not found.'}
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" aria-busy={pending}>
      {error ? (
        <div role="alert" className="rounded-md border border-band-critical/40 bg-band-critical/5 px-3 py-2 text-sm text-band-critical">
          {error}
        </div>
      ) : null}

      <Field label="Full name" required>
        <input
          type="text"
          required
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="Your name"
        />
      </Field>

      <Field label="Department" required>
        <select
          required
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="input"
        >
          <option value="" disabled>
            Choose your department
          </option>
          {state.assessment.departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Level" required>
        <select
          required
          value={level}
          onChange={(e) => setLevel(e.target.value as Level | '')}
          className="input"
        >
          <option value="" disabled>
            Choose your level
          </option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {LEVEL_LABELS[l]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tenure at this organization" required>
        <select
          required
          value={tenure}
          onChange={(e) => setTenure(e.target.value as TenureBand | '')}
          className="input"
        >
          <option value="" disabled>
            Choose your tenure band
          </option>
          {TENURE_BANDS.map((t) => (
            <option key={t} value={t}>
              {TENURE_LABELS[t]}
            </option>
          ))}
        </select>
      </Field>

      <div className="flex items-center justify-end pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-md bg-ink px-6 py-3 text-sm font-medium text-canvas transition hover:bg-ink-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Continue to questions'}
        </button>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid rgb(226 232 240);
          background-color: white;
          padding: 0.6rem 0.75rem;
          color: rgb(15 23 42);
          outline: none;
          font: inherit;
        }
        .input:focus {
          border-color: rgb(15 23 42);
          box-shadow: 0 0 0 1px rgb(15 23 42);
        }
      `}</style>
    </form>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">
        {label}
        {required ? <span className="ml-1 text-band-critical">*</span> : null}
      </label>
      {children}
    </div>
  )
}


'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

// Default deadline: 14 days out at 23:59 local time. The datetime-local
// input wants a "YYYY-MM-DDTHH:mm" string with no timezone suffix.
function defaultDeadline(): string {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  d.setHours(23, 59, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface ServerError {
  error: string
  issues?: { fieldErrors?: Record<string, string[]> }
}

export function NewAssessmentForm() {
  const router = useRouter()
  const [clientName, setClientName] = useState('')
  const [deadline, setDeadline] = useState(defaultDeadline())
  const [departments, setDepartments] = useState<string[]>([''])
  const [respondentCount, setRespondentCount] = useState(8)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const updateDept = (i: number, val: string) => {
    setDepartments((prev) => prev.map((d, j) => (j === i ? val : d)))
  }
  const addDept = () => setDepartments((prev) => [...prev, ''])
  const removeDept = (i: number) =>
    setDepartments((prev) => (prev.length === 1 ? prev : prev.filter((_, j) => j !== i)))

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanDepartments = departments.map((d) => d.trim()).filter(Boolean)
    if (cleanDepartments.length === 0) {
      setError('Add at least one department.')
      return
    }
    if (respondentCount < 3) {
      setError('Respondent count must be at least 3 to satisfy the anonymity guardrail.')
      return
    }
    const deadlineDate = new Date(deadline)
    if (deadlineDate.getTime() <= Date.now()) {
      setError('Deadline must be in the future.')
      return
    }

    startTransition(async () => {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName.trim(),
          deadline: deadlineDate.toISOString(),
          departments: cleanDepartments,
          respondentCount,
        }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as ServerError | null
        const fieldErrors = body?.issues?.fieldErrors
        const firstField = fieldErrors ? Object.values(fieldErrors).flat()[0] : null
        setError(firstField ?? 'Could not create assessment. Please try again.')
        return
      }

      const { id } = (await res.json()) as { id: string }
      router.push(`/admin/assessments/${id}`)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" aria-busy={pending}>
      {error ? (
        <div role="alert" className="rounded-md border border-band-critical/40 bg-band-critical/5 px-3 py-2 text-sm text-band-critical">
          {error}
        </div>
      ) : null}

      <Field label="Client name" hint="Visible only to admins.">
        <input
          type="text"
          required
          maxLength={120}
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="e.g. Acme Corp"
          className="input"
        />
      </Field>

      <Field label="Deadline" hint="When the assessment closes. The hourly cron flips the status to closed past this point.">
        <input
          type="datetime-local"
          required
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="input"
        />
      </Field>

      <Field label="Departments" hint="Respondents pick from this list during demographics. You can add more later, but cannot remove a department once any respondent has used it.">
        <div className="space-y-2">
          {departments.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                maxLength={60}
                value={d}
                onChange={(e) => updateDept(i, e.target.value)}
                placeholder={i === 0 ? 'e.g. Sales' : 'e.g. Engineering'}
                className="input"
              />
              <button
                type="button"
                onClick={() => removeDept(i)}
                disabled={departments.length === 1}
                className="rounded-md border border-canvas-border bg-canvas px-3 py-2 text-sm text-ink-muted transition hover:bg-canvas-muted disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={`Remove department ${i + 1}`}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addDept}
            className="text-sm font-medium text-ink-muted transition hover:text-ink"
          >
            + Add department
          </button>
        </div>
      </Field>

      <Field label="Respondent count" hint="The system will generate this many unique 6-character codes. Minimum 3 (anonymity guardrail), maximum 100.">
        <input
          type="number"
          min={3}
          max={100}
          required
          value={respondentCount}
          onChange={(e) => setRespondentCount(Number(e.target.value) || 0)}
          className="input w-32"
        />
      </Field>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition hover:bg-ink-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Creating…' : 'Create assessment'}
        </button>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid rgb(226 232 240);
          background-color: white;
          padding: 0.5rem 0.75rem;
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
      {hint ? <p className="mb-2 text-xs text-ink-muted">{hint}</p> : null}
      {children}
    </div>
  )
}

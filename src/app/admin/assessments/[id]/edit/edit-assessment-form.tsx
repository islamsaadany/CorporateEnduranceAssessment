'use client'

import Link from 'next/link'
import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export interface ExistingDepartment {
  id: string
  name: string
  inUse: boolean // true → cannot be removed
}

interface EditAssessmentFormProps {
  assessmentId: string
  initialClientName: string
  initialDeadline: string // datetime-local format
  initialMaxUses: number
  minMaxUses: number // floor for the cap (= current respondent count, or 3)
  existingDepartments: ExistingDepartment[]
}

interface ServerError {
  error: string
  message?: string
  issues?: { fieldErrors?: Record<string, string[]> }
}

export function EditAssessmentForm({
  assessmentId,
  initialClientName,
  initialDeadline,
  initialMaxUses,
  minMaxUses,
  existingDepartments,
}: EditAssessmentFormProps) {
  const router = useRouter()
  const [clientName, setClientName] = useState(initialClientName)
  const [deadline, setDeadline] = useState(initialDeadline)
  const [maxUses, setMaxUses] = useState(initialMaxUses)
  const [keep, setKeep] = useState<Set<string>>(
    new Set(existingDepartments.map((d) => d.id)),
  )
  const [newDepts, setNewDepts] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const newDeptInputsRef = useRef<Array<HTMLInputElement | null>>([])

  const toggleKeep = (id: string, inUse: boolean) => {
    if (inUse) return // hard-block in the UI; the server also rejects.
    setKeep((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const updateNewDept = (i: number, val: string) =>
    setNewDepts((prev) => prev.map((d, j) => (j === i ? val : d)))
  const addNewDept = () => setNewDepts((prev) => [...prev, ''])
  const removeNewDept = (i: number) =>
    setNewDepts((prev) => prev.filter((_, j) => j !== i))

  // Same Enter-key behavior as the create form: append + focus, do
  // nothing if the current row is empty, never submit the form.
  const onNewDeptKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (!newDepts[i].trim()) return
    setNewDepts((prev) => [...prev, ''])
    setTimeout(() => {
      newDeptInputsRef.current[i + 1]?.focus()
    }, 0)
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (maxUses < minMaxUses) {
      setError(`Cap cannot be lower than ${minMaxUses}.`)
      return
    }
    const deadlineDate = new Date(deadline)
    if (Number.isNaN(deadlineDate.getTime())) {
      setError('Invalid deadline.')
      return
    }
    if (keep.size === 0 && newDepts.filter((d) => d.trim()).length === 0) {
      setError('At least one department is required.')
      return
    }

    startTransition(async () => {
      const res = await fetch(`/api/assessments/${assessmentId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName.trim(),
          deadline: deadlineDate.toISOString(),
          departments: {
            keep: Array.from(keep),
            add: newDepts.map((d) => d.trim()).filter(Boolean),
          },
          maxUses,
        }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as ServerError | null
        if (body?.error === 'department_in_use' && body.message) {
          setError(body.message)
          return
        }
        const fieldErrors = body?.issues?.fieldErrors
        const firstField = fieldErrors ? Object.values(fieldErrors).flat()[0] : null
        setError(firstField ?? 'Could not save changes. Please try again.')
        return
      }

      router.push(`/admin/assessments/${assessmentId}`)
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

      <Field label="Client name">
        <input
          type="text"
          required
          maxLength={120}
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="input"
        />
      </Field>

      <Field label="Deadline">
        <input
          type="datetime-local"
          required
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="input"
        />
      </Field>

      <Field
        label="Departments"
        hint="Departments already used by a respondent are locked (greyed out). Press Enter inside a new-department row to add another."
      >
        {/* Existing departments — checkbox = "keep". in-use → disabled. */}
        <div className="space-y-2">
          {existingDepartments.map((d) => {
            const checked = keep.has(d.id)
            return (
              <label
                key={d.id}
                className={`flex items-center gap-3 rounded-md border border-canvas-border bg-canvas px-3 py-2 text-sm ${
                  d.inUse ? 'opacity-70' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={d.inUse}
                  onChange={() => toggleKeep(d.id, d.inUse)}
                  className="h-4 w-4"
                />
                <span className="flex-1 text-ink">{d.name}</span>
                {d.inUse ? (
                  <span className="rounded bg-canvas-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                    In use — cannot remove
                  </span>
                ) : null}
              </label>
            )
          })}
        </div>

        {/* New department rows */}
        {newDepts.length > 0 ? (
          <div className="mt-3 space-y-2">
            {newDepts.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  ref={(el) => { newDeptInputsRef.current[i] = el }}
                  type="text"
                  maxLength={60}
                  value={d}
                  onChange={(e) => updateNewDept(i, e.target.value)}
                  onKeyDown={(e) => onNewDeptKeyDown(e, i)}
                  placeholder="New department name"
                  className="input"
                />
                <button
                  type="button"
                  onClick={() => removeNewDept(i)}
                  className="rounded-md border border-canvas-border bg-canvas px-3 py-2 text-sm text-ink-muted transition hover:bg-canvas-muted"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={addNewDept}
          className="mt-2 text-sm font-medium text-ink-muted transition hover:text-ink"
        >
          + Add department
        </button>
      </Field>

      <Field
        label="Maximum respondents (cap)"
        hint={`Hard cap on the number of respondents. Cannot be lower than ${minMaxUses}.`}
      >
        <input
          type="number"
          min={minMaxUses}
          max={500}
          required
          value={maxUses}
          onChange={(e) => setMaxUses(Number(e.target.value) || 0)}
          className="input w-32"
        />
      </Field>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href={`/admin/assessments/${assessmentId}`}
          className="rounded-md border border-canvas-border bg-canvas px-4 py-2 text-sm font-medium text-ink transition hover:bg-canvas-muted"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-canvas transition hover:bg-ink-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save changes'}
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

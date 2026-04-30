'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export function CloseButton({ assessmentId }: { assessmentId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const onClose = () => {
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/assessments/${assessmentId}/close`, { method: 'POST' })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        setError(body?.error === 'already_closed' ? 'Already closed.' : 'Could not close. Try again.')
        setConfirming(false)
        return
      }
      router.refresh()
      setConfirming(false)
    })
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-muted">Close this assessment now?</span>
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="rounded-md bg-band-critical px-3 py-1.5 text-xs font-medium text-canvas transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Closing…' : 'Yes, close'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-md border border-canvas-border bg-canvas px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-canvas-muted disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        {error ? <span className="text-xs text-band-critical">{error}</span> : null}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="rounded-md border border-canvas-border bg-canvas px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-canvas-muted"
    >
      Close now
    </button>
  )
}

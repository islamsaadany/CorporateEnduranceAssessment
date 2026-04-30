'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { loadRespondentId, saveRespondentId } from '@/lib/take-storage'

export function CodeEntryForm() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleaned = code.trim().toUpperCase()
    if (cleaned.length === 0) {
      setError('Enter the access code.')
      return
    }

    startTransition(async () => {
      const resumeRespondentId = loadRespondentId(cleaned) ?? undefined
      const res = await fetch('/api/respondents/validate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: cleaned, resumeRespondentId }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        setError(humanizeError(body?.error))
        return
      }

      const data = (await res.json()) as { respondentId: string; resumed?: boolean }
      saveRespondentId(cleaned, data.respondentId)

      // Resume flow: skip welcome, go to whatever screen makes sense next.
      // For simplicity v1 always lands on /take/welcome — the user can read
      // it again, then proceed. The questions screen is keyed by position.
      router.push('/take/welcome')
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-busy={pending}>
      {error ? (
        <div role="alert" className="rounded-md border border-band-critical/40 bg-band-critical/5 px-3 py-2 text-sm text-band-critical">
          {error}
        </div>
      ) : null}

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink">Access code</span>
        <input
          type="text"
          inputMode="text"
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          required
          maxLength={12}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. XYZAB2"
          className="w-full rounded-md border border-canvas-border bg-canvas px-4 py-3 text-center font-mono text-xl tracking-[0.3em] text-ink outline-none focus:border-ink focus:ring-1 focus:ring-ink"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-md bg-ink px-4 py-3 text-sm font-medium text-canvas transition hover:bg-ink-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Verifying…' : 'Continue'}
      </button>
    </form>
  )
}

function humanizeError(code: string | undefined): string {
  switch (code) {
    case 'invalid_code':
      return "We couldn't find an assessment with that code. Double-check with your consultant."
    case 'assessment_closed':
      return 'This assessment has closed. No more responses are being accepted.'
    case 'assessment_full':
      return 'This assessment is at capacity. Contact your consultant to raise the cap.'
    default:
      return 'Could not validate the code. Please try again.'
  }
}

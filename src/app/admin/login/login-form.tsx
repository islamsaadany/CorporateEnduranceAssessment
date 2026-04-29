'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

interface LoginFormProps {
  callbackUrl: string
  initialError?: string
}

export function LoginForm({ callbackUrl, initialError }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(initialError ? humanizeError(initialError) : null)
  const [pending, startTransition] = useTransition()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await signIn('credentials', { redirect: false, email, password, callbackUrl })
      if (!res || res.error) {
        setError('Email or password is incorrect.')
        return
      }
      router.push(res.url ?? callbackUrl)
      router.refresh()
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
        <span className="mb-1 block font-medium text-ink">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-canvas-border bg-canvas px-3 py-2 text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink">Password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-canvas-border bg-canvas px-3 py-2 text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-canvas transition hover:bg-ink-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

function humanizeError(code: string): string {
  switch (code) {
    case 'CredentialsSignin':
      return 'Email or password is incorrect.'
    case 'AccessDenied':
      return 'This account is disabled.'
    default:
      return 'Could not sign in. Please try again.'
  }
}

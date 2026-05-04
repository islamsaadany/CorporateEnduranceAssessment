import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { testConnection } from '@/lib/ai'

/**
 * Round-trip "Test connection" for the active AI provider configuration.
 *
 * Lifted to slice 7.2's `src/lib/ai/index.ts`. Per-provider HTTP details
 * now live in the per-provider adapter modules; this route is a thin
 * super-admin gate + payload-mapping shim. External response shape is
 * unchanged from slice 7.1.
 *
 * Body forms:
 *   { provider }                 → use the saved DB key (or env fallback)
 *   { provider, apiKey }         → use the supplied key (lets the admin
 *                                  test before clicking Save)
 */

const testSchema = z.object({
  provider: z.enum(['gemini', 'claude', 'openai']),
  apiKey: z.string().min(1).max(500).optional(),
})

function humanize(provider: 'gemini' | 'claude' | 'openai', status: number, message: string): string {
  if (status === 0) return message
  if (status === 401 || status === 403) return 'Authentication failed — the API key was rejected.'
  if (status === 429) return 'Rate limited — the key works but the provider is throttling.'
  if (status >= 500) return `${provider} returned ${status} — try again in a moment.`
  return `${provider} returned ${status}: ${message}`
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  if (session.user.role !== 'super_admin') {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }
  const parsed = testSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation_failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { provider, apiKey } = parsed.data

  let outcome: Awaited<ReturnType<typeof testConnection>>
  try {
    outcome = await testConnection(provider, apiKey)
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown'
    const isAbort = err instanceof Error && err.name === 'AbortError'
    return NextResponse.json({
      ok: false,
      error: isAbort ? 'timeout' : 'network_error',
      message: isAbort
        ? 'Timed out — check the network or try again.'
        : `Could not reach ${provider}: ${reason}`,
    })
  }

  if (outcome.result.ok) {
    return NextResponse.json({ ok: true, source: outcome.source })
  }
  return NextResponse.json({
    ok: false,
    error: 'provider_error',
    status: outcome.result.status,
    message: humanize(provider, outcome.result.status, outcome.result.message),
  })
}

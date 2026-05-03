import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decryptSecret } from '@/lib/crypto'

/**
 * Round-trip "Test connection" for the active AI provider configuration.
 *
 * Strategy: hit each provider's list-models endpoint with the candidate
 * key. That validates auth without consuming generation tokens. Keeping
 * the per-provider HTTP calls inline here in slice 7.1 — slice 7.2 will
 * lift these into the provider abstraction at `src/lib/ai/`.
 *
 * Body forms:
 *   { provider }                 → use the saved DB key (or env fallback)
 *   { provider, apiKey }         → use the supplied key (lets the admin
 *                                  test before clicking Save)
 */

type ProviderKey = 'gemini' | 'claude' | 'openai'

const ENV_VAR_FOR: Record<ProviderKey, string> = {
  gemini: 'GEMINI_API_KEY',
  claude: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
}

const COLUMN_FOR: Record<ProviderKey, 'encryptedApiKeyGemini' | 'encryptedApiKeyClaude' | 'encryptedApiKeyOpenai'> = {
  gemini: 'encryptedApiKeyGemini',
  claude: 'encryptedApiKeyClaude',
  openai: 'encryptedApiKeyOpenai',
}

const REQUEST_TIMEOUT_MS = 8000

const testSchema = z.object({
  provider: z.enum(['gemini', 'claude', 'openai']),
  apiKey: z.string().min(1).max(500).optional(),
})

async function resolveKey(provider: ProviderKey, supplied?: string): Promise<{ key: string; source: 'supplied' | 'db' | 'env' } | { error: string }> {
  if (supplied) return { key: supplied.trim(), source: 'supplied' }

  const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } })
  const stored = settings ? (settings[COLUMN_FOR[provider]] as Buffer | null) : null
  if (stored && stored.length > 0) {
    try {
      return { key: decryptSecret(stored), source: 'db' }
    } catch {
      return { error: 'decryption_failed' }
    }
  }

  const envKey = process.env[ENV_VAR_FOR[provider]]
  if (envKey && envKey.length > 0) {
    return { key: envKey, source: 'env' }
  }

  return { error: 'no_key_configured' }
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function pingGemini(key: string) {
  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
    { method: 'GET' },
  )
  if (res.ok) return { ok: true as const }
  return { ok: false as const, status: res.status, message: await readErr(res) }
}

async function pingClaude(key: string) {
  const res = await fetchWithTimeout('https://api.anthropic.com/v1/models', {
    method: 'GET',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
  })
  if (res.ok) return { ok: true as const }
  return { ok: false as const, status: res.status, message: await readErr(res) }
}

async function pingOpenai(key: string) {
  const res = await fetchWithTimeout('https://api.openai.com/v1/models', {
    method: 'GET',
    headers: { Authorization: `Bearer ${key}` },
  })
  if (res.ok) return { ok: true as const }
  return { ok: false as const, status: res.status, message: await readErr(res) }
}

async function readErr(res: Response): Promise<string> {
  try {
    const text = await res.text()
    // Try to parse a structured error message; fall back to first 200 chars.
    try {
      const j = JSON.parse(text) as { error?: { message?: string } | string }
      const msg = typeof j.error === 'string' ? j.error : j.error?.message
      if (msg) return msg
    } catch {
      // not JSON
    }
    return text.slice(0, 200)
  } catch {
    return res.statusText
  }
}

function humanize(provider: ProviderKey, status: number, message: string): string {
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

  const resolved = await resolveKey(provider, apiKey)
  if ('error' in resolved) {
    const messages: Record<string, string> = {
      decryption_failed: 'Could not decrypt the saved key. Re-enter and save it.',
      no_key_configured: 'No API key configured for this provider — paste one above and try again.',
    }
    return NextResponse.json({ ok: false, error: resolved.error, message: messages[resolved.error] ?? resolved.error })
  }

  let result: { ok: true } | { ok: false; status: number; message: string }
  try {
    if (provider === 'gemini') result = await pingGemini(resolved.key)
    else if (provider === 'claude') result = await pingClaude(resolved.key)
    else result = await pingOpenai(resolved.key)
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown'
    const isAbort = err instanceof Error && err.name === 'AbortError'
    return NextResponse.json({
      ok: false,
      error: isAbort ? 'timeout' : 'network_error',
      message: isAbort
        ? `Timed out after ${REQUEST_TIMEOUT_MS / 1000}s — check the network or try again.`
        : `Could not reach ${provider}: ${reason}`,
    })
  }

  if (result.ok) {
    return NextResponse.json({ ok: true, source: resolved.source })
  }
  return NextResponse.json({
    ok: false,
    error: 'provider_error',
    status: result.status,
    message: humanize(provider, result.status, result.message),
  })
}

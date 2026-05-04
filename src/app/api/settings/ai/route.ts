import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encryptSecret, lastFourOf } from '@/lib/crypto'
import { logAdminAction } from '@/lib/audit'

/**
 * Super-admin-only AI provider settings.
 *
 *   GET    → current provider + per-provider {hasKey, lastFour, source}
 *   PATCH  → update provider and/or one provider's API key
 *
 * Per spec 15 § 8: a single global config (no per-assessment override).
 * Bootstrap fallback: when no DB key exists for the active provider,
 * the matching env var is reported as `source: 'env'` so the page can
 * surface the persistent banner directing the super admin to save in panel.
 */

type ProviderKey = 'gemini' | 'claude' | 'openai'

const PROVIDERS: ProviderKey[] = ['gemini', 'claude', 'openai']

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

async function requireSuperAdminApi() {
  const session = await auth()
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  }
  if (session.user.role !== 'super_admin') {
    return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  }
  return { user: session.user }
}

async function loadOrCreateSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: 'singleton' } })
  if (existing) return existing
  return prisma.settings.create({ data: { id: 'singleton' } })
}

export async function GET() {
  const guard = await requireSuperAdminApi()
  if ('error' in guard) return guard.error

  const settings = await loadOrCreateSettings()

  const updatedBy = settings.updatedById
    ? await prisma.admin.findUnique({
        where: { id: settings.updatedById },
        select: { name: true, email: true },
      })
    : null

  const providers = Object.fromEntries(
    PROVIDERS.map((p) => {
      const stored = settings[COLUMN_FOR[p]] as Buffer | null
      const lastFour = lastFourOf(stored)
      const hasDbKey = stored !== null && stored.length > 0 && lastFour !== null
      const envKey = process.env[ENV_VAR_FOR[p]]
      const hasEnvKey = typeof envKey === 'string' && envKey.length > 0
      let source: 'db' | 'env' | 'none' = 'none'
      let displayLastFour: string | null = null
      if (hasDbKey) {
        source = 'db'
        displayLastFour = lastFour
      } else if (hasEnvKey) {
        source = 'env'
        displayLastFour = envKey!.slice(-4)
      }
      return [
        p,
        { hasKey: source !== 'none', source, lastFour: displayLastFour, envVarName: ENV_VAR_FOR[p] },
      ]
    }),
  )

  return NextResponse.json({
    provider: settings.aiProvider,
    providers,
    updatedAt: settings.updatedAt.toISOString(),
    updatedBy: updatedBy ? { name: updatedBy.name, email: updatedBy.email } : null,
  })
}

const patchSchema = z
  .object({
    provider: z.enum(['gemini', 'claude', 'openai']).optional(),
    apiKeyProvider: z.enum(['gemini', 'claude', 'openai']).optional(),
    apiKey: z.string().min(1).max(500).optional(),
  })
  .refine(
    (v) => v.provider !== undefined || (v.apiKey !== undefined && v.apiKeyProvider !== undefined),
    'Specify provider, or specify both apiKeyProvider and apiKey.',
  )

export async function PATCH(req: Request) {
  const guard = await requireSuperAdminApi()
  if ('error' in guard) return guard.error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { provider, apiKeyProvider, apiKey } = parsed.data

  const data: Prisma.SettingsUpdateInput = {
    updatedById: guard.user.id,
  }
  if (provider !== undefined) {
    data.aiProvider = provider
  }
  if (apiKey !== undefined && apiKeyProvider !== undefined) {
    data[COLUMN_FOR[apiKeyProvider]] = encryptSecret(apiKey.trim())
  }

  const createData: Prisma.SettingsCreateInput = {
    id: 'singleton',
    aiProvider: provider ?? 'gemini',
    updatedById: guard.user.id,
  }
  if (apiKey !== undefined && apiKeyProvider !== undefined) {
    createData[COLUMN_FOR[apiKeyProvider]] = encryptSecret(apiKey.trim())
  }

  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: data,
    create: createData,
  })

  await logAdminAction({
    actorAdminId: guard.user.id,
    action: 'ai.config_change',
    metadata: {
      providerChanged: provider !== undefined,
      keyChangedFor: apiKeyProvider ?? null,
      // Never log the key itself or its tail.
    },
  })

  return NextResponse.json({ ok: true })
}

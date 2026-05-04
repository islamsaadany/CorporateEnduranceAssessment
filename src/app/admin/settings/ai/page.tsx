import { requireSuperAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/prisma'
import { lastFourOf } from '@/lib/crypto'
import { SettingsAiForm, type ProviderState } from './settings-form'

export const metadata = { title: 'AI provider settings — The Endurance Assessment' }

const PROVIDERS = ['gemini', 'claude', 'openai'] as const
type ProviderKey = (typeof PROVIDERS)[number]

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

export default async function AiSettingsPage() {
  await requireSuperAdmin()

  const settings = await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  })

  const updatedBy = settings.updatedById
    ? await prisma.admin.findUnique({
        where: { id: settings.updatedById },
        select: { name: true },
      })
    : null

  const providers: Record<ProviderKey, ProviderState> = {
    gemini: makeProviderState('gemini', settings),
    claude: makeProviderState('claude', settings),
    openai: makeProviderState('openai', settings),
  }

  const activeProviderState = providers[settings.aiProvider as ProviderKey]
  const showBootstrapBanner = activeProviderState.source === 'env'

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-serif text-3xl font-bold text-brand-dark-blue">
          AI provider settings
        </h1>
        <p className="text-sm text-brand-grey-text">
          Configure the AI service used to generate assessment reports. One global configuration applies to all assessments.
        </p>
      </header>

      {showBootstrapBanner ? (
        <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Using bootstrap configuration from environment variables.</p>
          <p className="mt-1 text-amber-800">
            The active provider ({settings.aiProvider}) is reading its key from the{' '}
            <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">
              {ENV_VAR_FOR[settings.aiProvider as ProviderKey]}
            </code>{' '}
            environment variable. Save a key here to persist it in the database and override the env var.
          </p>
        </div>
      ) : null}

      <SettingsAiForm
        initialProvider={settings.aiProvider as ProviderKey}
        initialProviders={providers}
      />

      <p className="text-xs text-brand-grey-text">
        {updatedBy
          ? `Last updated by ${updatedBy.name} on ${formatDateTime(settings.updatedAt)}.`
          : `Last updated on ${formatDateTime(settings.updatedAt)}.`}
      </p>
    </div>
  )
}

function makeProviderState(provider: ProviderKey, settings: {
  encryptedApiKeyGemini: Buffer | null
  encryptedApiKeyClaude: Buffer | null
  encryptedApiKeyOpenai: Buffer | null
}): ProviderState {
  const stored = settings[COLUMN_FOR[provider]]
  const lastFour = lastFourOf(stored)
  const hasDbKey = stored !== null && stored.length > 0 && lastFour !== null
  const envKey = process.env[ENV_VAR_FOR[provider]]
  const hasEnvKey = typeof envKey === 'string' && envKey.length > 0
  if (hasDbKey) {
    return { source: 'db', lastFour: lastFour!, envVarName: ENV_VAR_FOR[provider] }
  }
  if (hasEnvKey) {
    return { source: 'env', lastFour: envKey!.slice(-4), envVarName: ENV_VAR_FOR[provider] }
  }
  return { source: 'none', lastFour: null, envVarName: ENV_VAR_FOR[provider] }
}

function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

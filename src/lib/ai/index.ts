/**
 * AI orchestration entry point.
 *
 * The only module callers outside `src/lib/ai/` should import from. Hides
 * provider selection, key resolution, prompt building, and JSON parsing
 * behind a single `generateReport()` and a single `testConnection()`.
 *
 * Validation per spec 14 § 4 (word counts, no-numerics, etc.) is slice 7.4
 * — this slice intentionally does only structural Zod validation so that
 * 7.3 can hook up the endpoint and 7.4 can layer on the strict rules.
 */

import { CAPABILITY_LABELS, CAPABILITY_ORDER } from '@/data/constants'
import type { AiReportOutput, CapabilityKey } from '@/data/types'
import { prisma } from '@/lib/prisma'
import { decryptSecret } from '@/lib/crypto'
import { claudeAdapter } from './claude'
import { geminiAdapter } from './gemini'
import { openaiAdapter } from './openai'
import { buildPrompt } from './prompt'
import {
  aiResponseSchema,
  type GenerateReportInput,
  type Provider,
  type ProviderAdapter,
  type TestConnectionResult,
} from './types'

const ENV_VAR_FOR: Record<Provider, string> = {
  gemini: 'GEMINI_API_KEY',
  claude: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
}

const COLUMN_FOR: Record<Provider, 'encryptedApiKeyGemini' | 'encryptedApiKeyClaude' | 'encryptedApiKeyOpenai'> = {
  gemini: 'encryptedApiKeyGemini',
  claude: 'encryptedApiKeyClaude',
  openai: 'encryptedApiKeyOpenai',
}

const ADAPTERS: Record<Provider, ProviderAdapter> = {
  gemini: geminiAdapter,
  claude: claudeAdapter,
  openai: openaiAdapter,
}

// ─── Provider + key resolution ───────────────────────────────────────────

export type KeySource = 'db' | 'env' | 'supplied'

export interface ResolvedProvider {
  provider: Provider
  apiKey: string
  source: KeySource
  /** Hardcoded model name for the provider (spec 14 § 8). */
  model: string
  /** From Settings.promptVersion at resolution time — recorded into the cache. */
  promptVersion: number
}

/**
 * Reads the active provider + key, falling back to the env var when no
 * DB key is saved. Throws when nothing is configured. Used by slice 7.3
 * to decide what to call.
 */
export async function resolveActiveProvider(): Promise<ResolvedProvider> {
  const settings = await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  })
  const provider = settings.aiProvider as Provider

  const stored = settings[COLUMN_FOR[provider]] as Buffer | null
  if (stored && stored.length > 0) {
    let apiKey: string
    try {
      apiKey = decryptSecret(stored)
    } catch {
      throw new AiConfigError(
        'decryption_failed',
        `Could not decrypt the saved API key for ${provider}. Re-save it in /admin/settings/ai.`,
      )
    }
    return {
      provider,
      apiKey,
      source: 'db',
      model: ADAPTERS[provider].modelName,
      promptVersion: settings.promptVersion,
    }
  }

  const envKey = process.env[ENV_VAR_FOR[provider]]
  if (envKey && envKey.length > 0) {
    return {
      provider,
      apiKey: envKey,
      source: 'env',
      model: ADAPTERS[provider].modelName,
      promptVersion: settings.promptVersion,
    }
  }

  throw new AiConfigError(
    'no_key_configured',
    `No API key configured for ${provider}. Save one in /admin/settings/ai or set ${ENV_VAR_FOR[provider]} in the environment.`,
  )
}

/**
 * `testConnection` resolves a key the same way as `resolveActiveProvider`,
 * but accepts an optional `apiKey` override so the settings page can test
 * before saving. The `provider` arg is required because the settings page
 * tests the *selected* provider, which may not be the *active* one.
 */
export async function testConnection(
  provider: Provider,
  suppliedApiKey?: string,
): Promise<{ result: TestConnectionResult; source: KeySource } | { result: TestConnectionResult; source: 'none' }> {
  let apiKey: string
  let source: KeySource

  if (suppliedApiKey && suppliedApiKey.trim().length > 0) {
    apiKey = suppliedApiKey.trim()
    source = 'supplied'
  } else {
    const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } })
    const stored = settings ? (settings[COLUMN_FOR[provider]] as Buffer | null) : null
    if (stored && stored.length > 0) {
      try {
        apiKey = decryptSecret(stored)
        source = 'db'
      } catch {
        return {
          result: { ok: false, status: 0, message: 'Could not decrypt the saved key. Re-enter and save it.' },
          source: 'db',
        }
      }
    } else {
      const envKey = process.env[ENV_VAR_FOR[provider]]
      if (envKey && envKey.length > 0) {
        apiKey = envKey
        source = 'env'
      } else {
        return {
          result: {
            ok: false,
            status: 0,
            message: `No API key configured for ${provider} — paste one above and try again.`,
          },
          source: 'none',
        }
      }
    }
  }

  const result = await ADAPTERS[provider].testConnection({ apiKey })
  return { result, source }
}

// ─── Generation ──────────────────────────────────────────────────────────

export interface GenerateReportResult {
  outputJson: AiReportOutput
  /**
   * The raw stripped+rendered prompt input — slice 7.3 stores this in
   * `GeneratedReport.inputJson` per Q4/A (audit trail uses the
   * already-anonymized version, not the pre-strip).
   */
  inputSnapshot: {
    filterDescription: string
    matchingFilter: number
    totalSubmitted: number
    assessmentStatus: 'collecting' | 'closed'
    promptSystem: string
    promptUser: string
    anonymizedRespondents: import('./strip-names').AnonymizedRespondent[]
  }
  provider: Provider
  model: string
  promptVersion: number
}

/**
 * End-to-end: resolve provider → build prompt → call provider → parse JSON
 * → coerce into `AiReportOutput` shape.
 *
 * Slice 7.2 contract: throws on any failure (decryption, network, JSON
 * parse). Slice 7.4 will wrap this in retry + fallback logic.
 */
export async function generateReport(input: GenerateReportInput): Promise<GenerateReportResult> {
  const resolved = await resolveActiveProvider()
  const prompt = buildPrompt(input)

  let raw: string
  try {
    raw = await ADAPTERS[resolved.provider].generate({
      system: prompt.system,
      user: prompt.user,
      apiKey: resolved.apiKey,
    })
  } catch (err) {
    throw new AiGenerationError(
      'provider_call_failed',
      err instanceof Error ? err.message : 'unknown error',
      { provider: resolved.provider },
    )
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(stripMarkdownFences(raw))
  } catch {
    throw new AiGenerationError('json_parse_failed', 'Provider returned non-JSON content.', {
      provider: resolved.provider,
      rawPreview: raw.slice(0, 300),
    })
  }

  const validated = aiResponseSchema.safeParse(parsed)
  if (!validated.success) {
    throw new AiGenerationError('schema_mismatch', 'Provider response did not match the expected JSON shape.', {
      provider: resolved.provider,
      issues: validated.error.flatten(),
    })
  }

  const outputJson = mapToAiReportOutput(validated.data, input.aggregates.focusAreas)

  return {
    outputJson,
    inputSnapshot: {
      filterDescription: input.filterDescription,
      matchingFilter: input.matchingFilter,
      totalSubmitted: input.totalSubmitted,
      assessmentStatus: input.assessmentStatus,
      promptSystem: prompt.system,
      promptUser: prompt.user,
      anonymizedRespondents: prompt.anonymizedRespondents,
    },
    provider: resolved.provider,
    model: resolved.model,
    promptVersion: resolved.promptVersion,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Gemini (and occasionally Claude) sometimes wraps JSON output in
 * ```json ... ``` despite explicit JSON-mode requests. Strip a single
 * leading/trailing fence pair if present; leave un-fenced content alone.
 * Slice 7.4's retry-on-parse-failure handles the case where the model
 * emitted actual non-JSON prose.
 */
function stripMarkdownFences(raw: string): string {
  const trimmed = raw.trim()
  // Match ```<lang>?\n ... \n``` (lang optional, e.g. "json").
  const match = /^```[a-zA-Z0-9]*\s*\n?([\s\S]*?)\n?```$/m.exec(trimmed)
  if (match) return match[1].trim()
  return trimmed
}

const LABEL_TO_KEY: Map<string, CapabilityKey> = new Map(
  CAPABILITY_ORDER.map((k) => [CAPABILITY_LABELS[k], k]),
)

/**
 * The LLM emits action_items keyed by capability *labels* ("Decision
 * Velocity"); our internal AiReportOutput stores them keyed by the
 * snake_case `CapabilityKey`. Maps + drops anything that doesn't match a
 * known label or wasn't in the focus-area set.
 *
 * Validation that the keys MATCH the focus areas exactly is deferred to
 * slice 7.4 — for now we just produce the cleanest possible mapping from
 * what the model returned.
 */
function mapToAiReportOutput(
  raw: { executive_summary: string; action_items: Record<string, string[]> },
  focusAreas: CapabilityKey[],
): AiReportOutput {
  const focusSet = new Set(focusAreas)
  const focusAreaActions: AiReportOutput['focusAreaActions'] = []
  for (const [label, actions] of Object.entries(raw.action_items)) {
    const key = LABEL_TO_KEY.get(label)
    if (!key || !focusSet.has(key)) continue
    focusAreaActions.push({ capability: key, actions })
  }
  // Preserve the focus-area order so the UI renders ranked.
  focusAreaActions.sort(
    (a, b) => focusAreas.indexOf(a.capability) - focusAreas.indexOf(b.capability),
  )
  return {
    executiveSummary: raw.executive_summary,
    focusAreaActions,
  }
}

// ─── Errors ──────────────────────────────────────────────────────────────

export class AiConfigError extends Error {
  constructor(public code: 'no_key_configured' | 'decryption_failed', message: string) {
    super(message)
    this.name = 'AiConfigError'
  }
}

export class AiGenerationError extends Error {
  constructor(
    public code: 'provider_call_failed' | 'json_parse_failed' | 'schema_mismatch',
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'AiGenerationError'
  }
}

// ─── Re-exports ──────────────────────────────────────────────────────────

export { buildPrompt } from './prompt'
export { anonymizeRespondents, indexToLetter } from './strip-names'
export { readCachedReport, writeCachedReport, invalidateCachesForAssessment } from './cache'
export type {
  GenerateReportInput,
  Provider,
  TestConnectionResult,
  RespondentForPrompt,
} from './types'

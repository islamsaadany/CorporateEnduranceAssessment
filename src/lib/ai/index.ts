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

import type { AiReportOutput, CapabilityKey } from '@/data/types'
import { prisma } from '@/lib/prisma'
import { decryptSecret } from '@/lib/crypto'
import { claudeAdapter } from './claude'
import { geminiAdapter } from './gemini'
import { openaiAdapter } from './openai'
import { CURRENT_PROMPT_VERSION, buildPrompt } from './prompt'
import { buildFallback } from './fallback'
import {
  aiResponseSchema,
  type GenerateReportInput,
  type Provider,
  type ProviderAdapter,
  type TestConnectionResult,
} from './types'
import { validate } from './validate'

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
      // Source of truth for the current prompt version is the
      // CURRENT_PROMPT_VERSION constant in src/lib/ai/prompt.ts —
      // bumped together with the prompt wording. Settings.promptVersion
      // in the DB is kept for legacy reasons but ignored here so that
      // a deploy carries the version forward without a SQL paste.
      promptVersion: CURRENT_PROMPT_VERSION,
    }
  }

  const envKey = process.env[ENV_VAR_FOR[provider]]
  if (envKey && envKey.length > 0) {
    return {
      provider,
      apiKey: envKey,
      source: 'env',
      model: ADAPTERS[provider].modelName,
      // Source of truth for the current prompt version is the
      // CURRENT_PROMPT_VERSION constant in src/lib/ai/prompt.ts —
      // bumped together with the prompt wording. Settings.promptVersion
      // in the DB is kept for legacy reasons but ignored here so that
      // a deploy carries the version forward without a SQL paste.
      promptVersion: CURRENT_PROMPT_VERSION,
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

export interface InputSnapshot {
  filterDescription: string
  matchingFilter: number
  totalSubmitted: number
  assessmentStatus: 'collecting' | 'closed'
  promptSystem: string
  promptUser: string
  anonymizedRespondents: import('./strip-names').AnonymizedRespondent[]
}

/**
 * Discriminated outcome returned by `generateReport()`.
 *
 *   kind: 'success'  → cache it, return to UI, audit `ai.generate` with
 *                      the list of soft fixes applied (Q1/A audit detail).
 *   kind: 'fallback' → DO NOT cache (per spec 14 § 5). Return baseline
 *                      summary + baseline action items to the UI. Audit
 *                      both `ai.generation_failed` (carrying the per-attempt
 *                      reasons) and `ai.fallback_used`.
 */
export type GenerateReportOutcome =
  | {
      kind: 'success'
      outputJson: AiReportOutput
      inputSnapshot: InputSnapshot
      provider: Provider
      model: string
      promptVersion: number
      softFixes: import('./validate').SoftFix[]
      attempts: 1 | 2
    }
  | {
      kind: 'fallback'
      outputJson: AiReportOutput
      provider: Provider | null
      attempts: number
      reason: string
      attemptReasons: string[]
    }

/**
 * End-to-end: resolve provider → build prompt → call provider → parse JSON
 * → run spec-14 § 4 validators → on hard fail, retry once with augmented
 * prompt → on second hard fail, return baseline fallback (not cached).
 *
 * Soft fixes (truncation, em-dash replace, emoji strip, single-numeric
 * sentence strip) are applied in place on the successful path and reported
 * via `softFixes` for audit.
 */
export async function generateReport(input: GenerateReportInput): Promise<GenerateReportOutcome> {
  let resolved: ResolvedProvider
  try {
    resolved = await resolveActiveProvider()
  } catch (err) {
    // Config errors (no key, decryption failed) → fallback. There's no
    // useful retry without a working key.
    const reason = err instanceof Error ? err.message : 'unknown'
    return {
      kind: 'fallback',
      outputJson: buildFallback({
        overallBand: input.aggregates.overall.band,
        matchingFilter: input.matchingFilter,
        totalSubmitted: input.totalSubmitted,
        focusAreas: input.aggregates.focusAreas,
      }),
      provider: null,
      attempts: 0,
      reason: 'ai_unavailable',
      attemptReasons: [reason],
    }
  }

  const prompt = buildPrompt(input)

  // Department names that appear in the input — handed to validate() so
  // the signal-citation rule recognizes them as legitimate citations.
  const departmentNamesInPrompt = Array.from(
    new Set(
      input.respondents
        .map((r) => r.department)
        .filter((d): d is string => typeof d === 'string' && d.length > 0),
    ),
  )

  // Attempt 1
  const a1 = await callAndValidate({
    system: prompt.system,
    user: prompt.user,
    apiKey: resolved.apiKey,
    provider: resolved.provider,
    focusAreas: input.aggregates.focusAreas,
    departmentNamesInPrompt,
  })
  if (a1.ok) {
    return {
      kind: 'success',
      outputJson: a1.output,
      inputSnapshot: snapshot(input, prompt),
      provider: resolved.provider,
      model: resolved.model,
      promptVersion: resolved.promptVersion,
      softFixes: a1.softFixes,
      attempts: 1,
    }
  }

  // Attempt 2 — augment the user prompt with the violation note so the
  // model knows why the first attempt was rejected.
  const augmentedUser = `${prompt.user}\n\nIMPORTANT: A previous attempt was rejected for this reason: ${a1.detail}\nPlease produce a response that fixes this issue while still conforming to the JSON schema above.`
  const a2 = await callAndValidate({
    system: prompt.system,
    user: augmentedUser,
    apiKey: resolved.apiKey,
    provider: resolved.provider,
    focusAreas: input.aggregates.focusAreas,
    departmentNamesInPrompt,
  })
  if (a2.ok) {
    return {
      kind: 'success',
      outputJson: a2.output,
      inputSnapshot: snapshot(input, prompt),
      provider: resolved.provider,
      model: resolved.model,
      promptVersion: resolved.promptVersion,
      softFixes: a2.softFixes,
      attempts: 2,
    }
  }

  // Both attempts hard-failed — fall back. Per spec 14 § 5 do NOT cache.
  return {
    kind: 'fallback',
    outputJson: buildFallback({
      overallBand: input.aggregates.overall.band,
      matchingFilter: input.matchingFilter,
      totalSubmitted: input.totalSubmitted,
      focusAreas: input.aggregates.focusAreas,
    }),
    provider: resolved.provider,
    attempts: 2,
    reason: 'validation_failed_after_retry',
    attemptReasons: [a1.reason, a2.reason],
  }
}

interface CallAndValidateInput {
  system: string
  user: string
  apiKey: string
  provider: Provider
  focusAreas: CapabilityKey[]
  departmentNamesInPrompt: string[]
}

type CallAndValidateResult =
  | { ok: true; output: AiReportOutput; softFixes: import('./validate').SoftFix[] }
  | { ok: false; reason: string; detail: string }

async function callAndValidate(input: CallAndValidateInput): Promise<CallAndValidateResult> {
  let raw: string
  try {
    raw = await ADAPTERS[input.provider].generate({
      system: input.system,
      user: input.user,
      apiKey: input.apiKey,
    })
  } catch (err) {
    return {
      ok: false,
      reason: 'provider_call_failed',
      detail: err instanceof Error ? err.message : 'unknown error',
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(stripMarkdownFences(raw))
  } catch {
    return {
      ok: false,
      reason: 'json_parse_failed',
      detail: 'Provider returned non-JSON content.',
    }
  }

  const shape = aiResponseSchema.safeParse(parsed)
  if (!shape.success) {
    return {
      ok: false,
      reason: 'shape_mismatch',
      detail: `Top-level shape is wrong (expected { executive_summary: string[3..5], action_items: object }).`,
    }
  }

  const validated = validate(shape.data, input.focusAreas, input.departmentNamesInPrompt)
  if (!validated.ok) {
    return { ok: false, reason: validated.reason, detail: validated.detail }
  }
  return { ok: true, output: validated.output, softFixes: validated.softFixes }
}

function snapshot(input: GenerateReportInput, prompt: ReturnType<typeof buildPrompt>): InputSnapshot {
  return {
    filterDescription: input.filterDescription,
    matchingFilter: input.matchingFilter,
    totalSubmitted: input.totalSubmitted,
    assessmentStatus: input.assessmentStatus,
    promptSystem: prompt.system,
    promptUser: prompt.user,
    anonymizedRespondents: prompt.anonymizedRespondents,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Gemini (and occasionally Claude) sometimes wraps JSON output in
 * ```json ... ``` despite explicit JSON-mode requests. Strip a single
 * leading/trailing fence pair if present; leave un-fenced content alone.
 */
function stripMarkdownFences(raw: string): string {
  const trimmed = raw.trim()
  // Match ```<lang>?\n ... \n``` (lang optional, e.g. "json").
  const match = /^```[a-zA-Z0-9]*\s*\n?([\s\S]*?)\n?```$/m.exec(trimmed)
  if (match) return match[1].trim()
  return trimmed
}

// ─── Errors ──────────────────────────────────────────────────────────────

/**
 * Config errors are caught inside `generateReport` and converted to a
 * fallback outcome. They're still exported so the test endpoint and the
 * settings UI can distinguish "no key" from other failures explicitly.
 */
export class AiConfigError extends Error {
  constructor(public code: 'no_key_configured' | 'decryption_failed', message: string) {
    super(message)
    this.name = 'AiConfigError'
  }
}

// ─── Re-exports ──────────────────────────────────────────────────────────

export { CURRENT_PROMPT_VERSION, buildPrompt } from './prompt'
export { anonymizeRespondents, indexToLetter } from './strip-names'
export { readCachedReport, writeCachedReport, invalidateCachesForAssessment } from './cache'
export type {
  GenerateReportInput,
  Provider,
  TestConnectionResult,
  RespondentForPrompt,
} from './types'

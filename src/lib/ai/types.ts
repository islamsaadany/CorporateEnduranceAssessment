/**
 * AI module — shared types.
 *
 * The output type the LLM must produce is the spec-14 § 1 contract:
 *   {
 *     "executive_summary": "string",
 *     "action_items": { "<capability label>": ["string", "string"], ... }
 *   }
 *
 * We validate at parse time with Zod (rough shape only in slice 7.2;
 * spec-14 § 4 word-count / no-numerics / no-em-dash rules land in 7.4).
 */

import { z } from 'zod'
import type { Level, TenureBand } from '@prisma/client'
import type {
  AggregatedResults,
  AnswerValue,
  AiReportOutput,
  CapabilityKey,
  PillarKey,
} from '@/data/types'

export type Provider = 'gemini' | 'claude' | 'openai'

// ─── Generation input ────────────────────────────────────────────────────
//
// Built by results-service (slice 7.3) and handed to generateReport().
// Includes names — the prompt builder is the *only* code path that strips
// them, per spec 11 § 5 (single chokepoint, easy to audit).

export interface RespondentForPrompt {
  name: string | null
  department: string | null
  level: Level | null
  tenure: TenureBand | null
  capabilities: Record<CapabilityKey, number | null>
}

export interface GenerateReportInput {
  // The active filter on the results page, formatted human-readably
  // ("Sales × Manager × 4–7y") or "Company-wide".
  filterDescription: string
  filterIsCompanyWide: boolean
  // Sample size = matching filter / total submitted.
  matchingFilter: number
  totalSubmitted: number
  // 'collecting' produces a draft (watermarked); 'closed' produces final.
  assessmentStatus: 'collecting' | 'closed'
  aggregates: AggregatedResults
  respondents: RespondentForPrompt[]
}

// ─── Raw LLM JSON shape (spec 14 § 1) ────────────────────────────────────
//
// Keys of action_items are the capability *labels* exactly as they appear
// in src/data/constants.ts (e.g. "Decision Velocity"), not the snake_case
// CapabilityKey enum values. The orchestrator maps labels back to keys
// after parsing.

export const aiResponseSchema = z.object({
  executive_summary: z.string().min(1).max(2000),
  action_items: z.record(z.string(), z.array(z.string()).length(2)),
})

export type AiResponseRaw = z.infer<typeof aiResponseSchema>

// ─── Provider adapter contract ───────────────────────────────────────────

export interface ProviderAdapter {
  /**
   * One-shot generation. Returns the model's raw response *text* (which
   * should parse as JSON when JSON-mode is enabled). Caller handles JSON
   * parsing + validation; the adapter is intentionally just a transport.
   */
  generate(input: { system: string; user: string; apiKey: string }): Promise<string>

  /**
   * Lightweight auth check — calls the provider's list-models endpoint.
   * Used by /api/settings/ai/test and (post-7.4) any pre-generation
   * sanity check. Doesn't consume generation tokens.
   */
  testConnection(input: { apiKey: string }): Promise<TestConnectionResult>

  /** Hardcoded default model name per spec 14 § 8. */
  modelName: string
}

export type TestConnectionResult =
  | { ok: true }
  | { ok: false; status: number; message: string }

// ─── Re-exports for convenience ──────────────────────────────────────────

export type { AggregatedResults, AnswerValue, AiReportOutput, CapabilityKey, PillarKey }

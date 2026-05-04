/**
 * Gemini provider adapter.
 *
 * Uses `@google/genai` SDK. JSON mode via `responseMimeType: 'application/json'`
 * — the model returns the JSON object as a plain string in `response.text`.
 *
 * Default model is `gemini-2.5-flash` per spec 14 § 8 (cheap + fast; quality
 * is sufficient for the small structured output we ask for).
 */

import { GoogleGenAI } from '@google/genai'
import type { ProviderAdapter, TestConnectionResult } from './types'

const MODEL_NAME = 'gemini-2.5-flash'
const REQUEST_TIMEOUT_MS = 60_000
const TEST_TIMEOUT_MS = 8_000

async function generate(input: { system: string; user: string; apiKey: string }): Promise<string> {
  const client = new GoogleGenAI({ apiKey: input.apiKey })
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: input.user,
      config: {
        systemInstruction: input.system,
        // Spec 14 § 3 (prompt v2): 0.5 trades a little structural
        // consistency for more lift in correlation phrasing.
        temperature: 0.5,
        // Bumped from 2000 → 4000 (2026-05-03) because gemini-2.5-flash's
        // thinking budget can eat into the output cap, occasionally
        // truncating the JSON payload. 4000 is generous headroom for a
        // ~1000-token output.
        maxOutputTokens: 4000,
        // Disable extended thinking for this call (2026-05-03). We're
        // generating short structured JSON, not solving a multi-step
        // problem — thinking adds latency, eats output tokens, and was
        // observed truncating the JSON mid-word. thinkingBudget: 0
        // tells gemini-2.5-flash to skip the thinking phase entirely.
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: 'application/json',
        abortSignal: controller.signal,
      },
    })
    const text = response.text
    if (typeof text !== 'string' || text.length === 0) {
      throw new Error('Gemini returned an empty response.')
    }
    return text
  } finally {
    clearTimeout(timer)
  }
}

async function testConnection(input: { apiKey: string }): Promise<TestConnectionResult> {
  // List-models is a free, auth-only round-trip — no token cost.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TEST_TIMEOUT_MS)
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(input.apiKey)}`,
      { method: 'GET', signal: controller.signal },
    )
    if (res.ok) return { ok: true }
    return { ok: false, status: res.status, message: await readErrorMessage(res) }
  } finally {
    clearTimeout(timer)
  }
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const text = await res.text()
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

export const geminiAdapter: ProviderAdapter = {
  modelName: MODEL_NAME,
  generate,
  testConnection,
}

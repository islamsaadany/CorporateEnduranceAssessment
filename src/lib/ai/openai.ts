/**
 * OpenAI provider adapter.
 *
 * Uses `openai` SDK (v6+). JSON mode via `response_format: { type: 'json_object' }`
 * which guarantees a syntactically valid JSON string in the response.
 *
 * Default model is `gpt-4.1-mini` per spec 14 § 8.
 */

import OpenAI from 'openai'
import type { ProviderAdapter, TestConnectionResult } from './types'

const MODEL_NAME = 'gpt-4.1-mini'
const REQUEST_TIMEOUT_MS = 30_000
const TEST_TIMEOUT_MS = 8_000

async function generate(input: { system: string; user: string; apiKey: string }): Promise<string> {
  const client = new OpenAI({ apiKey: input.apiKey, timeout: REQUEST_TIMEOUT_MS })
  const response = await client.chat.completions.create({
    model: MODEL_NAME,
    // Spec 14 § 3 (prompt v2): 0.5 trades a little structural
    // consistency for more lift in correlation phrasing.
    temperature: 0.5,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: input.system },
      { role: 'user', content: input.user },
    ],
  })
  const text = response.choices[0]?.message?.content
  if (typeof text !== 'string' || text.length === 0) {
    throw new Error('OpenAI returned an empty response.')
  }
  return text
}

async function testConnection(input: { apiKey: string }): Promise<TestConnectionResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TEST_TIMEOUT_MS)
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: { Authorization: `Bearer ${input.apiKey}` },
      signal: controller.signal,
    })
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

export const openaiAdapter: ProviderAdapter = {
  modelName: MODEL_NAME,
  generate,
  testConnection,
}

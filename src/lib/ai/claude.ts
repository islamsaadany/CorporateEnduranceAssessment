/**
 * Anthropic Claude provider adapter.
 *
 * Uses `@anthropic-ai/sdk`. JSON output via prompt-level instruction (the
 * system prompt + user prompt together demand JSON-only, no markdown). The
 * spec-14 § 8 note about a forced-JSON tool is overkill for a single call;
 * we rely on the prompt + post-parse validation in slice 7.4.
 *
 * Default model is `claude-haiku-4-5` per spec 14 § 8.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { ProviderAdapter, TestConnectionResult } from './types'

const MODEL_NAME = 'claude-haiku-4-5'
const ANTHROPIC_VERSION = '2023-06-01'
const REQUEST_TIMEOUT_MS = 30_000
const TEST_TIMEOUT_MS = 8_000

async function generate(input: { system: string; user: string; apiKey: string }): Promise<string> {
  const client = new Anthropic({ apiKey: input.apiKey, timeout: REQUEST_TIMEOUT_MS })
  const response = await client.messages.create({
    model: MODEL_NAME,
    max_tokens: 2000,
    // Spec 14 § 3 (prompt v2): 0.5 trades a little structural
    // consistency for more lift in correlation phrasing.
    temperature: 0.5,
    system: input.system,
    messages: [{ role: 'user', content: input.user }],
  })
  // Claude returns content blocks; we only ever ask for text.
  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text' || !textBlock.text) {
    throw new Error('Claude returned no text block in response.')
  }
  return textBlock.text
}

async function testConnection(input: { apiKey: string }): Promise<TestConnectionResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TEST_TIMEOUT_MS)
  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'x-api-key': input.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
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

export const claudeAdapter: ProviderAdapter = {
  modelName: MODEL_NAME,
  generate,
  testConnection,
}

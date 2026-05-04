/**
 * Spec-14 § 4 validators (prompt v2).
 *
 * Two failure categories:
 *   - Hard fail   → orchestrator retries once with augmented prompt; if
 *                   the second attempt also hard-fails, returns the
 *                   static baseline fallback (not cached).
 *   - Soft fix    → applied silently in place; the orchestrator records
 *                   which fixes were applied (audit metadata).
 *
 * Caller (src/lib/ai/index.ts) is responsible for JSON.parse + the
 * structural Zod check from src/lib/ai/types.ts.
 *
 * Prompt v2 changes vs v1:
 *   - executive_summary is an ARRAY of 3–5 bullets, each ≤30 words
 *     (was a single ≤120-word paragraph)
 *   - action items ≤40 words (was ≤25)
 *   - new HARD rule: each action item must cite at least one data
 *     signal (spread keyword, demographic name, filter context, or
 *     a named capability label)
 */

import { CAPABILITY_LABELS } from '@/data/constants'
import type { AiReportOutput, CapabilityKey } from '@/data/types'

export type SoftFix =
  | 'truncated_summary_bullet'
  | 'truncated_action_item'
  | 'replaced_em_dashes'
  | 'stripped_emoji_or_exclamation'
  | 'stripped_numeric_sentence'

export type HardFailReason =
  | 'shape_mismatch'
  | 'missing_focus_area_keys'
  | 'extra_action_keys'
  | 'wrong_action_count'
  | 'first_person_address'
  | 'multiple_numeric_references'

export type ValidationOutcome =
  | { ok: true; output: AiReportOutput; softFixes: SoftFix[] }
  | { ok: false; reason: HardFailReason; detail: string }

const SUMMARY_BULLET_WORD_LIMIT = 30
const ACTION_WORD_LIMIT = 40

const NUMERIC_SCORE_RE = /\b\d\.\d{1,2}\b/g
const FIRST_PERSON_RE = /\b(?:you|your|we)\b/gi
const EMOJI_RE = /\p{Extended_Pictographic}/gu

interface RawAi {
  executive_summary: string[]
  action_items: Record<string, string[]>
}

/**
 * Run the full pipeline.
 *
 * Note: the `departmentNamesInPrompt` arg is kept on the signature for
 * forward-compat with callers, but is no longer consulted. The
 * signal-citation hard-fail rule was dropped 2026-05-03 (over-strict
 * keyword matching was rejecting valid AI output and forcing fallback).
 * The system prompt still asks for citations; we trust the prompt now.
 */
export function validate(
  raw: RawAi,
  focusAreas: CapabilityKey[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _departmentNamesInPrompt: string[] = [],
): ValidationOutcome {
  const softFixes: SoftFix[] = []

  // ── Tolerate label whitespace + case in action_items keys ───────────
  // Gemini sometimes emits "Decision Velocity " with a trailing space or
  // "decision velocity" lowercase — accept these as the canonical label.
  const expectedLabels = focusAreas.map((c) => CAPABILITY_LABELS[c])
  const normalize = (s: string) => s.trim().toLowerCase()
  const normalizedToCanonical: Record<string, string> = {}
  for (const lbl of expectedLabels) normalizedToCanonical[normalize(lbl)] = lbl

  const normalizedActionItems: Record<string, string[]> = {}
  const extraOriginals: string[] = []
  for (const [k, v] of Object.entries(raw.action_items)) {
    const canonical = normalizedToCanonical[normalize(k)]
    if (canonical) {
      normalizedActionItems[canonical] = v
    } else {
      extraOriginals.push(k)
    }
  }

  const missing = expectedLabels.filter((k) => !(k in normalizedActionItems))
  if (missing.length > 0) {
    return {
      ok: false,
      reason: 'missing_focus_area_keys',
      detail: `Missing keys in action_items: ${missing.join(', ')}.`,
    }
  }

  if (extraOriginals.length > 0) {
    return {
      ok: false,
      reason: 'extra_action_keys',
      detail: `Unexpected keys in action_items: ${extraOriginals.join(', ')}. Expected exactly: ${expectedLabels.join(', ')}.`,
    }
  }

  // ── Each capability key has exactly 2 strings ────────────────────────
  for (const label of expectedLabels) {
    const items = normalizedActionItems[label]
    if (!Array.isArray(items) || items.length !== 2) {
      return {
        ok: false,
        reason: 'wrong_action_count',
        detail: `Capability "${label}" must have exactly 2 action items (got ${items?.length ?? 0}).`,
      }
    }
    if (!items.every((s) => typeof s === 'string' && s.trim().length > 0)) {
      return {
        ok: false,
        reason: 'wrong_action_count',
        detail: `Capability "${label}" has non-string or empty action items.`,
      }
    }
  }

  // From here on, work against `normalizedActionItems`, not raw.action_items.
  const rawActions = normalizedActionItems

  // ── Soft fix: em dashes in summary bullets + actions ────────────────
  let summaryBullets = raw.executive_summary.map((b) => b)
  let summaryHadEmDash = false
  summaryBullets = summaryBullets.map((b) => {
    if (b.includes('—')) summaryHadEmDash = true
    return b.replaceAll('—', '. ')
  })

  const actions: Record<string, [string, string]> = {}
  let anyActionEmDash = false
  for (const label of expectedLabels) {
    const [a, b] = rawActions[label]
    const aHad = a.includes('—')
    const bHad = b.includes('—')
    actions[label] = [a.replaceAll('—', '. '), b.replaceAll('—', '. ')]
    if (aHad || bHad) anyActionEmDash = true
  }
  if (summaryHadEmDash || anyActionEmDash) softFixes.push('replaced_em_dashes')

  // ── Soft fix: strip emoji + exclamation marks ────────────────────────
  const stripExclaim = (s: string) => s.replaceAll('!', '.')
  const stripEmoji = (s: string) => s.replace(EMOJI_RE, '')
  let summaryHadEmojiOrExclaim = false
  summaryBullets = summaryBullets.map((b) => {
    if (EMOJI_RE.test(b) || b.includes('!')) summaryHadEmojiOrExclaim = true
    EMOJI_RE.lastIndex = 0
    return stripEmoji(stripExclaim(b))
  })
  let anyActionEmojiOrExclaim = false
  for (const label of expectedLabels) {
    const [a, b] = actions[label]
    if (EMOJI_RE.test(a) || EMOJI_RE.test(b) || a.includes('!') || b.includes('!')) {
      anyActionEmojiOrExclaim = true
    }
    EMOJI_RE.lastIndex = 0
    actions[label] = [stripEmoji(stripExclaim(a)), stripEmoji(stripExclaim(b))]
  }
  if (summaryHadEmojiOrExclaim || anyActionEmojiOrExclaim) {
    softFixes.push('stripped_emoji_or_exclamation')
  }

  // ── Numeric scores: 1 occurrence in a bullet/action → strip its
  //    sentence; >1 occurrences in any single string → hard fail.
  let summaryStrippedNumeric = false
  summaryBullets = summaryBullets.map((b) => {
    const matches = b.match(NUMERIC_SCORE_RE) ?? []
    if (matches.length > 1) {
      // Defer to hard-fail handler below.
      return b
    }
    if (matches.length === 1) {
      summaryStrippedNumeric = true
      return stripSentenceContaining(b, NUMERIC_SCORE_RE)
    }
    return b
  })
  for (const b of summaryBullets) {
    const matches = b.match(NUMERIC_SCORE_RE) ?? []
    if (matches.length > 1) {
      return {
        ok: false,
        reason: 'multiple_numeric_references',
        detail: `Executive summary bullet contains ${matches.length} numeric score references; spec 14 § 4 forbids any.`,
      }
    }
  }
  let actionStrippedNumeric = false
  for (const label of expectedLabels) {
    const [a, b] = actions[label]
    const aMatches = a.match(NUMERIC_SCORE_RE) ?? []
    const bMatches = b.match(NUMERIC_SCORE_RE) ?? []
    if (aMatches.length > 1 || bMatches.length > 1) {
      return {
        ok: false,
        reason: 'multiple_numeric_references',
        detail: `Action item under "${label}" contains multiple numeric score references.`,
      }
    }
    actions[label] = [
      aMatches.length === 1 ? stripSentenceContaining(a, NUMERIC_SCORE_RE) : a,
      bMatches.length === 1 ? stripSentenceContaining(b, NUMERIC_SCORE_RE) : b,
    ]
    if (aMatches.length === 1 || bMatches.length === 1) actionStrippedNumeric = true
  }
  if (summaryStrippedNumeric || actionStrippedNumeric) {
    softFixes.push('stripped_numeric_sentence')
  }

  // ── First-person address: hard fail
  for (const b of summaryBullets) {
    if (FIRST_PERSON_RE.test(b)) {
      FIRST_PERSON_RE.lastIndex = 0
      return {
        ok: false,
        reason: 'first_person_address',
        detail: 'Executive summary uses first-person address ("you", "your", or "we"). Spec 14 § 4 forbids this — rewrite in the third person about "the organization" or "this segment".',
      }
    }
    FIRST_PERSON_RE.lastIndex = 0
  }
  for (const label of expectedLabels) {
    for (const item of actions[label]) {
      if (FIRST_PERSON_RE.test(item)) {
        FIRST_PERSON_RE.lastIndex = 0
        return {
          ok: false,
          reason: 'first_person_address',
          detail: `Action item under "${label}" uses first-person address. Rewrite in the third person.`,
        }
      }
      FIRST_PERSON_RE.lastIndex = 0
    }
  }

  // Note: the signal-citation hard fail (require each action item to
  // include a spread/demographic/filter/capability keyword) was dropped
  // 2026-05-03 — over-strict matching was forcing fallback on otherwise-
  // good output. The system prompt still asks for citations.

  // ── Word-count truncation (soft fixes) ───────────────────────────────
  let truncatedAnyBullet = false
  summaryBullets = summaryBullets.map((b) => {
    const tb = truncateAtWordBoundary(b, SUMMARY_BULLET_WORD_LIMIT)
    if (tb !== b) truncatedAnyBullet = true
    return tb
  })
  if (truncatedAnyBullet) softFixes.push('truncated_summary_bullet')

  let truncatedAnyAction = false
  for (const label of expectedLabels) {
    const [a, b] = actions[label]
    const ta = truncateAtWordBoundary(a, ACTION_WORD_LIMIT)
    const tb = truncateAtWordBoundary(b, ACTION_WORD_LIMIT)
    if (ta !== a || tb !== b) truncatedAnyAction = true
    actions[label] = [ta, tb]
  }
  if (truncatedAnyAction) softFixes.push('truncated_action_item')

  // ── Build AiReportOutput ────────────────────────────────────────────
  const focusAreaActions = focusAreas.map((capability) => ({
    capability,
    actions: actions[CAPABILITY_LABELS[capability]],
  }))

  return {
    ok: true,
    output: {
      executiveSummary: summaryBullets.map((b) => b.trim()).filter((b) => b.length > 0),
      focusAreaActions,
    },
    softFixes,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function truncateAtWordBoundary(s: string, limit: number): string {
  const words = s.trim().split(/\s+/).filter(Boolean)
  if (words.length <= limit) return s
  return words.slice(0, limit).join(' ').replace(/[,;:—-]+$/, '') + '…'
}

/**
 * Drop the sentence containing the first match of `re` from `s`.
 */
function stripSentenceContaining(s: string, re: RegExp): string {
  const localRe = new RegExp(re.source, re.flags)
  const sentences = s.match(/[^.!?]+[.!?]+\s*/g) ?? [s]
  const filtered = sentences.filter((sent) => {
    localRe.lastIndex = 0
    return !localRe.test(sent)
  })
  return filtered.join('').trim()
}

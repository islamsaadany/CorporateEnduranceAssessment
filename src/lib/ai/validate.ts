/**
 * Spec-14 § 4 validators for the LLM response.
 *
 * Two failure categories:
 *   - Hard fail   → the route should retry once with an augmented prompt;
 *                   if the second attempt also hard-fails, the orchestrator
 *                   returns the static baseline fallback.
 *   - Soft fix    → applied silently in place; the orchestrator records
 *                   which fixes were applied so the audit log can capture
 *                   per-call quality signals.
 *
 * All validators are pure. The orchestrator in src/lib/ai/index.ts wires
 * them into the retry/fallback control flow.
 */

import { CAPABILITY_LABELS } from '@/data/constants'
import type { AiReportOutput, CapabilityKey } from '@/data/types'

export type SoftFix =
  | 'truncated_summary'
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

const SUMMARY_WORD_LIMIT = 120
const ACTION_WORD_LIMIT = 25

// Spec 14 § 4: \b\d\.\d{1,2}\b — e.g., "3.05", "1.5"
const NUMERIC_SCORE_RE = /\b\d\.\d{1,2}\b/g
// Spec 14 § 4: word-boundary, case-insensitive, "you ", "your ", "we ".
const FIRST_PERSON_RE = /\b(?:you|your|we)\b/gi
// Match emoji per Unicode pictographic class.
const EMOJI_RE = /\p{Extended_Pictographic}/gu

interface RawAi {
  executive_summary: string
  action_items: Record<string, string[]>
}

/**
 * Run the full pipeline. Caller (src/lib/ai/index.ts) is responsible for
 * having already done JSON.parse + the structural Zod check from
 * src/lib/ai/types.ts. This function takes the parsed-and-shape-checked
 * object and applies the per-spec § 4 rules.
 */
export function validate(raw: RawAi, focusAreas: CapabilityKey[]): ValidationOutcome {
  const softFixes: SoftFix[] = []

  // ── Hard checks on action_items keys ────────────────────────────────
  const expectedLabels = focusAreas.map((c) => CAPABILITY_LABELS[c])
  const expectedSet = new Set(expectedLabels)
  const actualKeys = Object.keys(raw.action_items)

  const missing = expectedLabels.filter((k) => !(k in raw.action_items))
  if (missing.length > 0) {
    return {
      ok: false,
      reason: 'missing_focus_area_keys',
      detail: `Missing keys in action_items: ${missing.join(', ')}.`,
    }
  }

  const extras = actualKeys.filter((k) => !expectedSet.has(k))
  if (extras.length > 0) {
    return {
      ok: false,
      reason: 'extra_action_keys',
      detail: `Unexpected keys in action_items: ${extras.join(', ')}. Expected exactly: ${expectedLabels.join(', ')}.`,
    }
  }

  // ── Each capability key has exactly 2 strings ────────────────────────
  for (const label of expectedLabels) {
    const items = raw.action_items[label]
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

  // ── Soft fix: em dashes in summary + actions ─────────────────────────
  let summary = raw.executive_summary
  const summaryHadEmDash = summary.includes('—')
  summary = summary.replaceAll('—', '. ')

  const actions: Record<string, [string, string]> = {}
  let anyActionEmDash = false
  for (const label of expectedLabels) {
    const [a, b] = raw.action_items[label]
    const aHad = a.includes('—')
    const bHad = b.includes('—')
    actions[label] = [a.replaceAll('—', '. '), b.replaceAll('—', '. ')]
    if (aHad || bHad) anyActionEmDash = true
  }
  if (summaryHadEmDash || anyActionEmDash) softFixes.push('replaced_em_dashes')

  // ── Soft fix: strip emoji + exclamation marks ────────────────────────
  const stripExclaim = (s: string) => s.replaceAll('!', '.')
  const stripEmoji = (s: string) => s.replace(EMOJI_RE, '')
  const summaryHadEmoji = EMOJI_RE.test(summary)
  EMOJI_RE.lastIndex = 0
  const summaryHadExclaim = summary.includes('!')
  summary = stripEmoji(stripExclaim(summary))
  let anyActionEmojiOrExclaim = false
  for (const label of expectedLabels) {
    const [a, b] = actions[label]
    if (EMOJI_RE.test(a) || EMOJI_RE.test(b) || a.includes('!') || b.includes('!')) {
      anyActionEmojiOrExclaim = true
    }
    EMOJI_RE.lastIndex = 0
    actions[label] = [stripEmoji(stripExclaim(a)), stripEmoji(stripExclaim(b))]
  }
  if (summaryHadEmoji || summaryHadExclaim || anyActionEmojiOrExclaim) {
    softFixes.push('stripped_emoji_or_exclamation')
  }

  // ── Numeric scores: 1 occurrence → strip its sentence; >1 → hard fail
  const numericMatchesInSummary = summary.match(NUMERIC_SCORE_RE) ?? []
  if (numericMatchesInSummary.length === 1) {
    summary = stripSentenceContaining(summary, NUMERIC_SCORE_RE)
    softFixes.push('stripped_numeric_sentence')
  } else if (numericMatchesInSummary.length > 1) {
    return {
      ok: false,
      reason: 'multiple_numeric_references',
      detail: `Executive summary contains ${numericMatchesInSummary.length} numeric score references; spec 14 § 4 forbids any.`,
    }
  }

  // Also scan action items.
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
  if (actionStrippedNumeric && !softFixes.includes('stripped_numeric_sentence')) {
    softFixes.push('stripped_numeric_sentence')
  }

  // ── First-person address: hard fail (spec: strip-and-retry, fallback if persists)
  if (FIRST_PERSON_RE.test(summary)) {
    FIRST_PERSON_RE.lastIndex = 0
    return {
      ok: false,
      reason: 'first_person_address',
      detail: 'Executive summary uses first-person address ("you", "your", or "we"). Spec 14 § 4 forbids this — rewrite in the third person about "the organization" or "this segment".',
    }
  }
  FIRST_PERSON_RE.lastIndex = 0
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

  // ── Word-count truncation (soft fixes) ───────────────────────────────
  const truncatedSummary = truncateAtSentenceBoundary(summary, SUMMARY_WORD_LIMIT)
  if (truncatedSummary !== summary) {
    softFixes.push('truncated_summary')
    summary = truncatedSummary
  }
  let truncatedAnyAction = false
  for (const label of expectedLabels) {
    const [a, b] = actions[label]
    const ta = truncateAtWordBoundary(a, ACTION_WORD_LIMIT)
    const tb = truncateAtWordBoundary(b, ACTION_WORD_LIMIT)
    if (ta !== a || tb !== b) truncatedAnyAction = true
    actions[label] = [ta, tb]
  }
  if (truncatedAnyAction) softFixes.push('truncated_action_item')

  // ── Build the AiReportOutput shape (label → snake_case CapabilityKey).
  // Validity already guaranteed above (every focusArea has its label in
  // raw.action_items).
  const focusAreaActions = focusAreas.map((capability) => ({
    capability,
    actions: actions[CAPABILITY_LABELS[capability]],
  }))

  return {
    ok: true,
    output: { executiveSummary: summary.trim(), focusAreaActions },
    softFixes,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Truncate a string at a sentence boundary so the result has ≤ limit
 * words. If the first sentence already exceeds the limit, falls back to
 * a word-boundary truncate.
 */
function truncateAtSentenceBoundary(s: string, limit: number): string {
  if (countWords(s) <= limit) return s
  // Split on sentence terminators (kept).
  const sentences = s.match(/[^.!?]+[.!?]+\s*/g) ?? [s]
  let acc = ''
  for (const sent of sentences) {
    const candidate = (acc + sent).trim()
    if (countWords(candidate) > limit) break
    acc = candidate + ' '
  }
  const trimmed = acc.trim()
  if (trimmed.length === 0) return truncateAtWordBoundary(s, limit)
  return trimmed
}

function truncateAtWordBoundary(s: string, limit: number): string {
  const words = s.trim().split(/\s+/).filter(Boolean)
  if (words.length <= limit) return s
  return words.slice(0, limit).join(' ').replace(/[,;:—-]+$/, '') + '…'
}

/**
 * Drop the sentence containing the first match of `re` from `s`. Other
 * sentences are preserved in order.
 */
function stripSentenceContaining(s: string, re: RegExp): string {
  // Reset stateful `g` regex to avoid cross-call surprises.
  const localRe = new RegExp(re.source, re.flags)
  const sentences = s.match(/[^.!?]+[.!?]+\s*/g) ?? [s]
  const filtered = sentences.filter((sent) => {
    localRe.lastIndex = 0
    return !localRe.test(sent)
  })
  return filtered.join('').trim()
}

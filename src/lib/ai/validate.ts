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

import {
  CAPABILITY_LABELS,
  CAPABILITY_ORDER,
  LEVEL_LABELS,
  TENURE_LABELS,
} from '@/data/constants'
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
  | 'missing_signal_citation'

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
 * Lazy-built keyword lookup for the signal-citation rule. Includes:
 *   - "spread", "split", "diverge", "disagree", "range", "spans"  (spread)
 *   - all 4 LEVEL labels' lowercase tokens (e.g. "manager", "leader")
 *   - all 5 TENURE labels' canonical tokens (e.g. "1–3", "4–7", "<1")
 *   - all 15 CAPABILITY labels (e.g. "Decision Velocity")
 *   - "this segment", "for this", "this filter"  (filter context)
 *   - per-call: the actual department names appearing in the input
 *
 * The check is a substring search after lowercasing both sides — false
 * positives are tolerated; the goal is to catch action items that fail
 * to mention ANY data signal at all.
 */
function buildSignalKeywords(extraDepartments: string[]): string[] {
  const keywords: string[] = []
  // Spread signals
  keywords.push('spread', 'split', 'diverge', 'disagre', 'range', 'spans', 'team is split')
  // Demographic level keywords (split each label on slashes; lowercase parts)
  for (const lbl of Object.values(LEVEL_LABELS)) {
    for (const part of lbl.split('/')) keywords.push(part.trim().toLowerCase())
  }
  // Tenure tokens
  for (const lbl of Object.values(TENURE_LABELS)) {
    keywords.push(lbl.toLowerCase())
  }
  keywords.push('tenure', 'senior', 'junior', 'early-career', 'years')
  // Capability labels (any name-drop counts as a tension citation)
  for (const lbl of Object.values(CAPABILITY_LABELS)) {
    keywords.push(lbl.toLowerCase())
  }
  // Filter context phrases
  keywords.push('this segment', 'for this', 'this filter', 'across this group', 'in this view')
  // Departments seen in this run
  for (const d of extraDepartments) keywords.push(d.toLowerCase())
  return keywords
}

function citesSignal(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some((k) => k.length > 0 && lower.includes(k))
}

/**
 * Run the full pipeline. The third arg is the list of department names
 * that appeared in the prompt input — they're admin-defined so we can't
 * hardcode them, but we want them as valid signal citations.
 */
export function validate(
  raw: RawAi,
  focusAreas: CapabilityKey[],
  departmentNamesInPrompt: string[],
): ValidationOutcome {
  const softFixes: SoftFix[] = []
  const signalKeywords = buildSignalKeywords(departmentNamesInPrompt)

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

  // ── HARD: every action item must cite at least one data signal.
  // Skipped when the prompt did not surface enough data to cite (defensive).
  if (signalKeywords.length > 0) {
    for (const label of expectedLabels) {
      for (const item of actions[label]) {
        if (!citesSignal(item, signalKeywords)) {
          return {
            ok: false,
            reason: 'missing_signal_citation',
            detail: `Action item under "${label}" does not cite any data signal. Each action item must reference a spread signal (e.g., "split"), a demographic pattern (e.g., "managers"), the filter context, or a named capability tension. Item was: "${item}"`,
          }
        }
      }
    }
  }

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

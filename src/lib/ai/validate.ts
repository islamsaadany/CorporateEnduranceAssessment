/**
 * Spec-14 § 4 validators (prompt v3).
 *
 * v3 schema: each focus area has both `observations` (1-3, ≤30 words)
 * AND `actions` (1-3, ≤25 words). Replaces v2's flat per-capability
 * `actions: string[]`.
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
 */

import { CAPABILITY_LABELS } from '@/data/constants'
import type { AiReportOutput, CapabilityKey } from '@/data/types'

export type SoftFix =
  | 'truncated_summary_bullet'
  | 'truncated_observation'
  | 'truncated_action_item'
  | 'replaced_em_dashes'
  | 'stripped_emoji_or_exclamation'
  | 'stripped_numeric_sentence'

export type HardFailReason =
  | 'shape_mismatch'
  | 'missing_focus_area_keys'
  | 'extra_focus_area_keys'
  | 'wrong_observation_count'
  | 'wrong_action_count'
  | 'first_person_address'
  | 'multiple_numeric_references'

export type ValidationOutcome =
  | { ok: true; output: AiReportOutput; softFixes: SoftFix[] }
  | { ok: false; reason: HardFailReason; detail: string }

const SUMMARY_BULLET_WORD_LIMIT = 30
const OBSERVATION_WORD_LIMIT = 30
const ACTION_WORD_LIMIT = 25

const NUMERIC_SCORE_RE = /\b\d\.\d{1,2}\b/g
const FIRST_PERSON_RE = /\b(?:you|your|we)\b/gi
const EMOJI_RE = /\p{Extended_Pictographic}/gu

interface RawAi {
  executive_summary: string[]
  focus_areas: Record<string, { observations: string[]; actions: string[] }>
}

/**
 * Run the full pipeline.
 *
 * `_departmentNamesInPrompt` is kept on the signature for forward-compat
 * but is no longer consulted (the signal-citation hard fail was dropped
 * in v2).
 */
export function validate(
  raw: RawAi,
  focusAreas: CapabilityKey[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _departmentNamesInPrompt: string[] = [],
): ValidationOutcome {
  const softFixes: SoftFix[] = []

  // ── Tolerate label whitespace + case in focus_areas keys ────────────
  const expectedLabels = focusAreas.map((c) => CAPABILITY_LABELS[c])
  const normalize = (s: string) => s.trim().toLowerCase()
  const normalizedToCanonical: Record<string, string> = {}
  for (const lbl of expectedLabels) normalizedToCanonical[normalize(lbl)] = lbl

  const normalizedFocusAreas: Record<string, { observations: string[]; actions: string[] }> = {}
  const extraOriginals: string[] = []
  for (const [k, v] of Object.entries(raw.focus_areas)) {
    const canonical = normalizedToCanonical[normalize(k)]
    if (canonical) {
      normalizedFocusAreas[canonical] = v
    } else {
      extraOriginals.push(k)
    }
  }

  const missing = expectedLabels.filter((k) => !(k in normalizedFocusAreas))
  if (missing.length > 0) {
    return {
      ok: false,
      reason: 'missing_focus_area_keys',
      detail: `Missing keys in focus_areas: ${missing.join(', ')}.`,
    }
  }

  if (extraOriginals.length > 0) {
    return {
      ok: false,
      reason: 'extra_focus_area_keys',
      detail: `Unexpected keys in focus_areas: ${extraOriginals.join(', ')}. Expected exactly: ${expectedLabels.join(', ')}.`,
    }
  }

  // ── Per-capability counts ────────────────────────────────────────────
  for (const label of expectedLabels) {
    const fa = normalizedFocusAreas[label]
    if (!fa || !Array.isArray(fa.observations) || fa.observations.length < 1 || fa.observations.length > 3) {
      return {
        ok: false,
        reason: 'wrong_observation_count',
        detail: `Capability "${label}" must have 1 to 3 observations (got ${fa?.observations?.length ?? 0}).`,
      }
    }
    if (!Array.isArray(fa.actions) || fa.actions.length < 1 || fa.actions.length > 3) {
      return {
        ok: false,
        reason: 'wrong_action_count',
        detail: `Capability "${label}" must have 1 to 3 actions (got ${fa?.actions?.length ?? 0}).`,
      }
    }
    if (
      !fa.observations.every((s) => typeof s === 'string' && s.trim().length > 0) ||
      !fa.actions.every((s) => typeof s === 'string' && s.trim().length > 0)
    ) {
      return {
        ok: false,
        reason: 'wrong_observation_count',
        detail: `Capability "${label}" has non-string or empty entries.`,
      }
    }
  }

  // ── Soft fix: em dashes in summary, observations, actions ────────────
  let summaryBullets = raw.executive_summary.map((b) => b)
  let summaryHadEmDash = false
  summaryBullets = summaryBullets.map((b) => {
    if (b.includes('—')) summaryHadEmDash = true
    return b.replaceAll('—', '. ')
  })

  const observations: Record<string, string[]> = {}
  const actions: Record<string, string[]> = {}
  let anyEmDash = summaryHadEmDash
  for (const label of expectedLabels) {
    const obs = normalizedFocusAreas[label].observations
    const acts = normalizedFocusAreas[label].actions
    observations[label] = obs.map((o) => {
      if (o.includes('—')) anyEmDash = true
      return o.replaceAll('—', '. ')
    })
    actions[label] = acts.map((a) => {
      if (a.includes('—')) anyEmDash = true
      return a.replaceAll('—', '. ')
    })
  }
  if (anyEmDash) softFixes.push('replaced_em_dashes')

  // ── Soft fix: strip emoji + exclamation marks ────────────────────────
  const stripExclaim = (s: string) => s.replaceAll('!', '.')
  const stripEmoji = (s: string) => s.replace(EMOJI_RE, '')
  let anyEmojiOrExclaim = false
  const checkAndStrip = (s: string): string => {
    if (EMOJI_RE.test(s) || s.includes('!')) anyEmojiOrExclaim = true
    EMOJI_RE.lastIndex = 0
    return stripEmoji(stripExclaim(s))
  }
  summaryBullets = summaryBullets.map(checkAndStrip)
  for (const label of expectedLabels) {
    observations[label] = observations[label].map(checkAndStrip)
    actions[label] = actions[label].map(checkAndStrip)
  }
  if (anyEmojiOrExclaim) softFixes.push('stripped_emoji_or_exclamation')

  // ── Numeric scores: 1 in a string → strip its sentence; >1 → hard fail
  let strippedAnyNumeric = false
  const checkNumeric = (s: string, where: string): { val: string; hardFail?: HardFailReason } => {
    const matches = s.match(NUMERIC_SCORE_RE) ?? []
    if (matches.length > 1) {
      return { val: s, hardFail: 'multiple_numeric_references' }
    }
    if (matches.length === 1) {
      strippedAnyNumeric = true
      return { val: stripSentenceContaining(s, NUMERIC_SCORE_RE) }
    }
    void where
    return { val: s }
  }
  for (let i = 0; i < summaryBullets.length; i++) {
    const r = checkNumeric(summaryBullets[i], 'executive summary')
    if (r.hardFail) {
      return {
        ok: false,
        reason: r.hardFail,
        detail: `Executive summary bullet contains multiple numeric score references; spec 14 § 4 forbids any.`,
      }
    }
    summaryBullets[i] = r.val
  }
  for (const label of expectedLabels) {
    for (let i = 0; i < observations[label].length; i++) {
      const r = checkNumeric(observations[label][i], `observation in "${label}"`)
      if (r.hardFail) {
        return {
          ok: false,
          reason: r.hardFail,
          detail: `Observation under "${label}" contains multiple numeric score references.`,
        }
      }
      observations[label][i] = r.val
    }
    for (let i = 0; i < actions[label].length; i++) {
      const r = checkNumeric(actions[label][i], `action in "${label}"`)
      if (r.hardFail) {
        return {
          ok: false,
          reason: r.hardFail,
          detail: `Action under "${label}" contains multiple numeric score references.`,
        }
      }
      actions[label][i] = r.val
    }
  }
  if (strippedAnyNumeric) softFixes.push('stripped_numeric_sentence')

  // ── First-person address: hard fail
  const checkFirstPerson = (s: string): boolean => {
    const matched = FIRST_PERSON_RE.test(s)
    FIRST_PERSON_RE.lastIndex = 0
    return matched
  }
  for (const b of summaryBullets) {
    if (checkFirstPerson(b)) {
      return {
        ok: false,
        reason: 'first_person_address',
        detail: 'Executive summary uses first-person address ("you", "your", or "we"). Spec 14 § 4 forbids this — rewrite in the third person.',
      }
    }
  }
  for (const label of expectedLabels) {
    for (const o of observations[label]) {
      if (checkFirstPerson(o)) {
        return {
          ok: false,
          reason: 'first_person_address',
          detail: `Observation under "${label}" uses first-person address. Rewrite in the third person.`,
        }
      }
    }
    for (const a of actions[label]) {
      if (checkFirstPerson(a)) {
        return {
          ok: false,
          reason: 'first_person_address',
          detail: `Action under "${label}" uses first-person address. Rewrite in the third person.`,
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

  let truncatedAnyObservation = false
  let truncatedAnyAction = false
  for (const label of expectedLabels) {
    observations[label] = observations[label].map((o) => {
      const t = truncateAtWordBoundary(o, OBSERVATION_WORD_LIMIT)
      if (t !== o) truncatedAnyObservation = true
      return t
    })
    actions[label] = actions[label].map((a) => {
      const t = truncateAtWordBoundary(a, ACTION_WORD_LIMIT)
      if (t !== a) truncatedAnyAction = true
      return t
    })
  }
  if (truncatedAnyObservation) softFixes.push('truncated_observation')
  if (truncatedAnyAction) softFixes.push('truncated_action_item')

  // ── Build AiReportOutput ────────────────────────────────────────────
  const focusAreasOut = focusAreas.map((capability) => ({
    capability,
    observations: observations[CAPABILITY_LABELS[capability]],
    actions: actions[CAPABILITY_LABELS[capability]],
  }))

  return {
    ok: true,
    output: {
      executiveSummary: summaryBullets.map((b) => b.trim()).filter((b) => b.length > 0),
      focusAreas: focusAreasOut,
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

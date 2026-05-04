/**
 * Single chokepoint that converts respondent rows (with names) into the
 * letter-labeled, name-free shape that gets serialized into the LLM prompt.
 *
 * Per spec 11 § 5 and the comment on `RespondentRow.name` in
 * results-service.ts: names must NEVER be sent to an LLM. By centralizing
 * the strip here we get exactly one place to audit and exactly one place
 * to break if the contract were ever violated.
 */

import type { RespondentForPrompt } from './types'

export interface AnonymizedRespondent {
  /** "A", "B", … "Z", "AA", "AB", …  Index-based; stable across the prompt. */
  letter: string
  department: RespondentForPrompt['department']
  level: RespondentForPrompt['level']
  tenure: RespondentForPrompt['tenure']
  capabilities: RespondentForPrompt['capabilities']
}

/**
 * Maps an array of respondents to letter-labeled rows. Order is preserved
 * from the input array; the caller decides the order (typically
 * submittedAt asc, matching the report page). Names are intentionally
 * absent from the output type — callers that need names should not be
 * touching this module.
 */
export function anonymizeRespondents(rows: RespondentForPrompt[]): AnonymizedRespondent[] {
  return rows.map((r, i) => ({
    letter: indexToLetter(i),
    department: r.department,
    level: r.level,
    tenure: r.tenure,
    capabilities: r.capabilities,
  }))
}

/** 0→A, 25→Z, 26→AA, 27→AB, … */
export function indexToLetter(index: number): string {
  if (index < 0 || !Number.isFinite(index)) {
    throw new Error(`indexToLetter: invalid index ${index}`)
  }
  let n = Math.floor(index)
  let out = ''
  do {
    out = String.fromCharCode(65 + (n % 26)) + out
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return out
}

/**
 * Tiny localStorage helpers for the /take flow.
 *
 * The only thing we persist client-side is the (assessmentCode →
 * respondentId) mapping for THIS browser. Once the respondent's id is
 * known, every other piece of state (current question, existing
 * answers, demographics) is read from the server on each navigation —
 * the server is the source of truth.
 *
 * SSR-safe: every function returns null / no-ops when `window` is
 * undefined.
 */

const STORAGE_PREFIX = 'tea_respondent_'

export function saveRespondentId(assessmentCode: string, respondentId: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${assessmentCode.toUpperCase()}`, respondentId)
  } catch {
    // Quota / privacy mode — silent fail; flow still works without resume.
  }
}

export function loadRespondentId(assessmentCode: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(`${STORAGE_PREFIX}${assessmentCode.toUpperCase()}`)
  } catch {
    return null
  }
}

export function clearRespondentId(assessmentCode: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${assessmentCode.toUpperCase()}`)
  } catch {
    // ignore
  }
}

/**
 * 6-character cohort access code generator (one per Assessment).
 *
 * Alphabet excludes 0/O/1/I/L to avoid handwriting + reading ambiguity
 * (an admin reads the code from the UI to a respondent in chat / email
 * / SMS — collisions in shape matter). 31 characters → ~887M possible
 * codes, more than enough for any deployment.
 *
 * Validation always uppercases the input — codes are case-insensitive
 * for users.
 */

import { prisma } from './prisma'

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const CODE_LENGTH = 6

export function generateCode(): string {
  let out = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return out
}

/**
 * Generate a unique cohort code, retrying on collision against the
 * unique `Assessment.code` index. Throws if it can't converge within
 * reasonable retries (vanishingly unlikely at the alphabet size we use).
 */
export async function generateUniqueAssessmentCode(): Promise<string> {
  const MAX_ATTEMPTS = 10
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = generateCode()
    const taken = await prisma.assessment.findUnique({
      where: { code: candidate },
      select: { id: true },
    })
    if (!taken) return candidate
  }
  throw new Error(`Failed to generate a unique assessment code after ${MAX_ATTEMPTS} attempts.`)
}

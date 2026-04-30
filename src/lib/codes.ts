/**
 * 6-character access code generator for respondents.
 *
 * Alphabet excludes 0/O/1/I/L to avoid handwriting + reading ambiguity
 * (a respondent reads the code from a slack message, an email, a
 * sticky note — collisions in shape matter). 31 characters → ~887M
 * possible codes, more than enough for any single assessment.
 *
 * Generation runs in a loop with a per-batch collision check against
 * the unique `Respondent.code` index. We retry on conflict; the
 * caller wraps the bulk insert in a transaction so partial failure
 * doesn't leave half-created respondents.
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
 * Generate `count` unique codes, checking the DB so we don't collide
 * with an existing respondent (across any assessment — `code` is
 * globally unique). Returns the array; throws if it can't converge
 * within reasonable retries (vanishingly unlikely at the alphabet size
 * we use, but worth signaling rather than infinite-looping).
 */
export async function generateUniqueCodes(count: number): Promise<string[]> {
  if (count <= 0) return []
  const MAX_BATCH_RETRIES = 5

  const codes = new Set<string>()
  for (let attempt = 0; attempt < MAX_BATCH_RETRIES; attempt++) {
    while (codes.size < count) codes.add(generateCode())
    const candidates = Array.from(codes)
    const taken = await prisma.respondent.findMany({
      where: { code: { in: candidates } },
      select: { code: true },
    })
    if (taken.length === 0) return candidates
    for (const t of taken) codes.delete(t.code)
  }
  throw new Error(
    `Failed to generate ${count} unique respondent codes after ${MAX_BATCH_RETRIES} attempts.`,
  )
}

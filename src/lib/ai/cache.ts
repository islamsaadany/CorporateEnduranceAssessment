/**
 * Thin wrappers over the GeneratedReport Prisma model.
 *
 * Cache key per spec 15 § 3: `(assessmentId, filterSignature)`. Unlimited
 * entries per assessment; one *active* row per filter (a re-generation
 * overwrites the prior row for that filter).
 *
 * Slice 7.2 just owns the read/write helpers — slice 7.3 wires them into
 * the report endpoint, slice 7.4 hardens the validation that decides
 * whether to write at all.
 *
 * Cache invalidation on respondent edits is Phase 9 (per the alignment
 * decision before slice 7.1). The `invalidateCachesForAssessment` helper
 * here exists so callers can wire it up later without an API change.
 */

import type { GeneratedReport } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { Provider } from './types'

export type { GeneratedReport }

export interface WriteCacheInput {
  assessmentId: string
  filterSignature: string
  isDraft: boolean
  promptVersion: number
  provider: Provider
  inputJson: import('@prisma/client').Prisma.InputJsonValue
  outputJson: import('@prisma/client').Prisma.InputJsonValue
  generatedById: string
}

export async function readCachedReport(
  assessmentId: string,
  filterSignature: string,
): Promise<GeneratedReport | null> {
  return prisma.generatedReport.findUnique({
    where: { assessmentId_filterSignature: { assessmentId, filterSignature } },
  })
}

/**
 * Upsert. Spec 15 § 2: a new generation for the same `(assessment, filter)`
 * overwrites the prior cache row. We don't keep the previous payload —
 * spec 15 § 3.3's audit-trail comment is a v2 concern (Phase 9 will wire
 * audit-log entries on regenerate, not preserve old payloads).
 */
export async function writeCachedReport(input: WriteCacheInput): Promise<GeneratedReport> {
  return prisma.generatedReport.upsert({
    where: {
      assessmentId_filterSignature: {
        assessmentId: input.assessmentId,
        filterSignature: input.filterSignature,
      },
    },
    create: {
      assessmentId: input.assessmentId,
      filterSignature: input.filterSignature,
      isDraft: input.isDraft,
      promptVersion: input.promptVersion,
      provider: input.provider,
      inputJson: input.inputJson,
      outputJson: input.outputJson,
      generatedById: input.generatedById,
      generatedAt: new Date(),
    },
    update: {
      isDraft: input.isDraft,
      promptVersion: input.promptVersion,
      provider: input.provider,
      inputJson: input.inputJson,
      outputJson: input.outputJson,
      generatedById: input.generatedById,
      generatedAt: new Date(),
    },
  })
}

/**
 * Phase 9 will call this when an admin edits a respondent answer or
 * demographic post-closure. For slice 7.2 it's a placeholder — the helper
 * is here so callers wire to a stable name. The current schema has no
 * `invalidatedAt` column (deferred to Phase 9 per the alignment); for now
 * "invalidate" means "delete and let the next generation re-cache".
 */
export async function invalidateCachesForAssessment(assessmentId: string): Promise<{ count: number }> {
  const { count } = await prisma.generatedReport.deleteMany({ where: { assessmentId } })
  return { count }
}

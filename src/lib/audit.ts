/**
 * Audit log helpers. Append-only.
 *
 * Action strings follow `<entity>.<verb>` and are documented in
 * PROJECT_DETAILS.md → AuditLog. Metadata is free-form per action but
 * MUST NEVER include the value of an individual respondent answer.
 * (We log that an edit happened, not what changed to.)
 */

import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

export type AdminAction =
  | 'assessment.create'
  | 'assessment.edit'
  | 'assessment.close'
  | 'response.edit'
  | 'respondent.demographics_edit'
  | 'ai.generate'
  | 'ai.generation_failed'
  | 'ai.fallback_used'
  | 'ai.config_change'
  | 'admin.create'
  | 'admin.deactivate'
  | 'report.export_pdf'
  | 'report.show_names'

export type RespondentAction = 'respondent.start' | 'respondent.submit'

export async function logAdminAction(params: {
  actorAdminId: string
  assessmentId?: string | null
  action: AdminAction
  metadata?: Prisma.InputJsonValue
}) {
  await prisma.auditLog.create({
    data: {
      actorAdminId: params.actorAdminId,
      assessmentId: params.assessmentId ?? null,
      action: params.action,
      metadata: params.metadata ?? {},
    },
  })
}

export async function logRespondentLifecycle(params: {
  respondentId: string
  assessmentId: string
  action: RespondentAction
  metadata?: Prisma.InputJsonValue
}) {
  await prisma.auditLog.create({
    data: {
      actorRespondentId: params.respondentId,
      assessmentId: params.assessmentId,
      action: params.action,
      metadata: params.metadata ?? {},
    },
  })
}

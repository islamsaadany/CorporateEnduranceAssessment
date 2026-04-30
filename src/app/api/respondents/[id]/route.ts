import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Ctx {
  params: Promise<{ id: string }>
}

/**
 * Fetch a respondent's current state for the /take flow:
 *   - assessment metadata (clientName, code, status, departments)
 *   - this respondent's demographics + existing answers
 *
 * No auth — knowledge of the respondent id (kept in localStorage on the
 * device that started the assessment) is the credential. The id is a
 * UUIDv4, not guessable.
 */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params

  const respondent = await prisma.respondent.findUnique({
    where: { id },
    include: {
      assessment: {
        select: {
          id: true,
          clientName: true,
          code: true,
          status: true,
          departments: { select: { id: true, name: true }, orderBy: { name: 'asc' } },
        },
      },
      responses: { select: { questionId: true, value: true } },
    },
  })
  if (!respondent) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const answersByQuestionId: Record<string, number | null> = {}
  for (const r of respondent.responses) answersByQuestionId[r.questionId] = r.value

  return NextResponse.json({
    respondent: {
      id: respondent.id,
      name: respondent.name,
      departmentId: respondent.departmentId,
      level: respondent.level,
      tenure: respondent.tenure,
      submittedAt: respondent.submittedAt?.toISOString() ?? null,
    },
    assessment: respondent.assessment,
    answersByQuestionId,
  })
}

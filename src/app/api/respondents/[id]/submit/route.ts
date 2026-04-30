import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logRespondentLifecycle } from '@/lib/audit'
import { TOTAL_QUESTIONS } from '@/data/questions'

interface Ctx {
  params: Promise<{ id: string }>
}

export async function POST(_req: Request, { params }: Ctx) {
  const { id } = await params

  const respondent = await prisma.respondent.findUnique({
    where: { id },
    include: {
      assessment: { select: { status: true } },
      _count: { select: { responses: true } },
    },
  })
  if (!respondent) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  if (respondent.submittedAt) {
    return NextResponse.json({ error: 'already_submitted' }, { status: 410 })
  }
  if (respondent.assessment.status === 'closed') {
    return NextResponse.json({ error: 'assessment_closed' }, { status: 410 })
  }

  // Demographics must be set.
  if (!respondent.departmentId || !respondent.level || !respondent.tenure) {
    return NextResponse.json({ error: 'demographics_incomplete' }, { status: 400 })
  }

  // Every question must have a Response row (rated OR "I don't know" /
  // value=NULL). Row count check is sufficient because (respondentId,
  // questionId) is unique.
  if (respondent._count.responses < TOTAL_QUESTIONS) {
    return NextResponse.json(
      {
        error: 'incomplete',
        answered: respondent._count.responses,
        required: TOTAL_QUESTIONS,
      },
      { status: 400 },
    )
  }

  await prisma.respondent.update({
    where: { id },
    data: { submittedAt: new Date() },
  })

  await logRespondentLifecycle({
    respondentId: id,
    assessmentId: respondent.assessmentId,
    action: 'respondent.submit',
  })

  return NextResponse.json({ ok: true })
}

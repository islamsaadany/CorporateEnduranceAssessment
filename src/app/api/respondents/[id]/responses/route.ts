import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { QUESTIONS_BY_ID } from '@/data/questions'

// Upsert one or more answers. Each answer is { questionId, value }
// where value is 1..4 (rated) or null ("I don't know").
const answerSchema = z.object({
  questionId: z.string().min(1).max(8),
  value: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.null()]),
})

const bodySchema = z.object({
  answers: z.array(answerSchema).min(1).max(30),
})

interface Ctx {
  params: Promise<{ id: string }>
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // Reject any unknown question ids before touching the DB.
  for (const a of parsed.data.answers) {
    if (!QUESTIONS_BY_ID.has(a.questionId)) {
      return NextResponse.json(
        { error: 'unknown_question_id', questionId: a.questionId },
        { status: 400 },
      )
    }
  }

  const respondent = await prisma.respondent.findUnique({
    where: { id },
    include: { assessment: { select: { status: true } } },
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

  // Upsert each answer. Single transaction so partial failure rolls back.
  await prisma.$transaction(
    parsed.data.answers.map((a) =>
      prisma.response.upsert({
        where: { respondentId_questionId: { respondentId: id, questionId: a.questionId } },
        create: { respondentId: id, questionId: a.questionId, value: a.value },
        update: { value: a.value },
      }),
    ),
  )

  return NextResponse.json({ ok: true })
}

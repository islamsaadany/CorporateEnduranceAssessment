import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { logRespondentLifecycle } from '@/lib/audit'

const validateSchema = z.object({
  // Cohort code. Stored uppercased; we accept any case here.
  code: z.string().trim().min(1).max(32),
  // Optional: a respondent id this browser already has in localStorage.
  // If it's still in-flight (not submitted) and belongs to the same
  // assessment, we resume it instead of creating a new one.
  resumeRespondentId: z.string().uuid().optional(),
})

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = validateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation_failed' }, { status: 400 })
  }
  const code = parsed.data.code.toUpperCase()

  const assessment = await prisma.assessment.findUnique({
    where: { code },
    select: {
      id: true,
      clientName: true,
      status: true,
      maxUses: true,
      departments: { select: { id: true, name: true }, orderBy: { name: 'asc' } },
    },
  })
  if (!assessment) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 404 })
  }
  if (assessment.status === 'closed') {
    return NextResponse.json({ error: 'assessment_closed' }, { status: 410 })
  }

  // Resume path: caller already has a respondent id from localStorage.
  if (parsed.data.resumeRespondentId) {
    const existing = await prisma.respondent.findUnique({
      where: { id: parsed.data.resumeRespondentId },
      select: { id: true, assessmentId: true, submittedAt: true },
    })
    if (existing && existing.assessmentId === assessment.id && !existing.submittedAt) {
      return NextResponse.json({
        respondentId: existing.id,
        assessmentId: assessment.id,
        clientName: assessment.clientName,
        departments: assessment.departments,
        resumed: true,
      })
    }
    // Otherwise fall through and (subject to cap) create a new one.
  }

  // Cap check: only count respondents that finished demographics. Ghost
  // rows (validated-then-bounced, no demographics) do not consume slots.
  const completedCount = await prisma.respondent.count({
    where: { assessmentId: assessment.id, demographicsCompletedAt: { not: null } },
  })
  if (completedCount >= assessment.maxUses) {
    return NextResponse.json({ error: 'assessment_full' }, { status: 403 })
  }

  const respondent = await prisma.respondent.create({
    data: { assessmentId: assessment.id, startedAt: new Date() },
    select: { id: true },
  })

  await logRespondentLifecycle({
    respondentId: respondent.id,
    assessmentId: assessment.id,
    action: 'respondent.start',
  })

  return NextResponse.json({
    respondentId: respondent.id,
    assessmentId: assessment.id,
    clientName: assessment.clientName,
    departments: assessment.departments,
    resumed: false,
  })
}

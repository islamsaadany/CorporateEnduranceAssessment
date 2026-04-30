import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Level, TenureBand } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const demographicsSchema = z.object({
  // Name is required (the report still anonymizes it by default — only
  // surfaced via the admin "show names" toggle).
  name: z.string().trim().min(1, 'Name is required.').max(120),
  // Department by id (server cross-checks it belongs to the right
  // assessment).
  departmentId: z.string().uuid(),
  level: z.nativeEnum(Level),
  tenure: z.nativeEnum(TenureBand),
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

  const parsed = demographicsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const respondent = await prisma.respondent.findUnique({
    where: { id },
    select: {
      id: true,
      assessmentId: true,
      submittedAt: true,
      demographicsCompletedAt: true,
      assessment: { select: { status: true, maxUses: true } },
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

  // Cap re-check at the moment of "becoming a real respondent" (first
  // demographics save). Prevents a race where multiple ghost rows
  // validate when the cap had room, then all try to complete after it
  // filled up. Subsequent saves on the same respondent skip this check.
  if (!respondent.demographicsCompletedAt) {
    const completedCount = await prisma.respondent.count({
      where: { assessmentId: respondent.assessmentId, demographicsCompletedAt: { not: null } },
    })
    if (completedCount >= respondent.assessment.maxUses) {
      return NextResponse.json({ error: 'assessment_full' }, { status: 403 })
    }
  }

  // Verify the department belongs to this respondent's assessment.
  const dept = await prisma.department.findUnique({
    where: { id: parsed.data.departmentId },
    select: { id: true, assessmentId: true },
  })
  if (!dept || dept.assessmentId !== respondent.assessmentId) {
    return NextResponse.json({ error: 'invalid_department' }, { status: 400 })
  }

  await prisma.respondent.update({
    where: { id },
    data: {
      name: parsed.data.name,
      departmentId: dept.id,
      level: parsed.data.level,
      tenure: parsed.data.tenure,
      // First successful save stamps demographicsCompletedAt; subsequent
      // saves (e.g., user navigates back and changes a field before
      // submitting) leave the original timestamp in place.
      demographicsCompletedAt: respondent.demographicsCompletedAt ?? new Date(),
    },
  })

  return NextResponse.json({ ok: true })
}

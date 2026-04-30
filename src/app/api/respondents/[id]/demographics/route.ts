import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Level, TenureBand } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const demographicsSchema = z.object({
  name: z.string().trim().max(120).nullable().optional(),
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
      name: parsed.data.name ?? null,
      departmentId: dept.id,
      level: parsed.data.level,
      tenure: parsed.data.tenure,
    },
  })

  return NextResponse.json({ ok: true })
}

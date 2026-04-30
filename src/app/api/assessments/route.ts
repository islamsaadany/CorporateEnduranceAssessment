import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateUniqueCodes } from '@/lib/codes'
import { logAdminAction } from '@/lib/audit'

const createSchema = z.object({
  clientName: z.string().trim().min(1, 'Client name is required.').max(120),
  // ISO date string (datetime-local input). Must be in the future.
  deadline: z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid deadline.'),
  departments: z
    .array(z.string().trim().min(1).max(60))
    .min(1, 'At least one department is required.')
    .max(20, 'Too many departments (max 20).'),
  respondentCount: z.number().int().min(3).max(100),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { clientName, deadline, departments, respondentCount } = parsed.data

  const deadlineDate = new Date(deadline)
  if (deadlineDate.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: 'validation_failed', issues: { fieldErrors: { deadline: ['Deadline must be in the future.'] } } },
      { status: 400 },
    )
  }

  // Deduplicate department names case-insensitively but preserve the
  // first-seen casing for display.
  const seen = new Map<string, string>()
  for (const d of departments) {
    const key = d.toLowerCase()
    if (!seen.has(key)) seen.set(key, d)
  }
  const uniqueDepartments = Array.from(seen.values())

  // Pre-generate codes BEFORE the transaction so the (uncommon) retry
  // loop inside generateUniqueCodes doesn't hold a DB transaction open.
  const codes = await generateUniqueCodes(respondentCount)

  const assessment = await prisma.$transaction(async (tx) => {
    const created = await tx.assessment.create({
      data: {
        clientName,
        deadline: deadlineDate,
        createdById: session.user.id,
        departments: { create: uniqueDepartments.map((name) => ({ name })) },
        respondents: { create: codes.map((code) => ({ code })) },
      },
      select: { id: true },
    })
    return created
  })

  await logAdminAction({
    actorAdminId: session.user.id,
    assessmentId: assessment.id,
    action: 'assessment.create',
    metadata: {
      clientName,
      departmentCount: uniqueDepartments.length,
      respondentCount: codes.length,
      deadline: deadlineDate.toISOString(),
    },
  })

  return NextResponse.json({ id: assessment.id }, { status: 201 })
}

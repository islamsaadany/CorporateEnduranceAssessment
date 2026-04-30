import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'

const editSchema = z.object({
  clientName: z.string().trim().min(1).max(120),
  deadline: z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid deadline.'),
  // Existing departments referenced by id, plus zero or more brand-new
  // names. The server merges these against the DB.
  departments: z.object({
    keep: z.array(z.string().uuid()).max(20),
    add: z.array(z.string().trim().min(1).max(60)).max(20),
  }),
  maxUses: z.number().int().min(3).max(500),
})

interface Ctx {
  params: Promise<{ id: string }>
}

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = editSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { clientName, deadline, departments, maxUses } = parsed.data

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      departments: { include: { _count: { select: { respondents: true } } } },
      _count: { select: { respondents: true } },
    },
  })
  if (!assessment) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // Enforce: cannot lower maxUses below the count of respondents that
  // already exist for this assessment.
  if (maxUses < assessment._count.respondents) {
    return NextResponse.json(
      {
        error: 'validation_failed',
        issues: {
          fieldErrors: {
            maxUses: [
              `Cap cannot be lower than the current respondent count (${assessment._count.respondents}).`,
            ],
          },
        },
      },
      { status: 400 },
    )
  }

  // Departments to remove = existing rows whose id is NOT in `keep`.
  const keepSet = new Set(departments.keep)
  const toRemove = assessment.departments.filter((d) => !keepSet.has(d.id))

  // Block removal of any department that has been used by a respondent.
  const blocked = toRemove.filter((d) => d._count.respondents > 0)
  if (blocked.length > 0) {
    return NextResponse.json(
      {
        error: 'department_in_use',
        message: `Cannot remove department(s) that have been used: ${blocked.map((d) => d.name).join(', ')}`,
        blockedDepartmentIds: blocked.map((d) => d.id),
      },
      { status: 409 },
    )
  }

  // Deduplicate new department names case-insensitively, and exclude any
  // that match the case-insensitive name of a kept department.
  const keptNames = new Set(
    assessment.departments
      .filter((d) => keepSet.has(d.id))
      .map((d) => d.name.toLowerCase()),
  )
  const seen = new Map<string, string>()
  for (const n of departments.add) {
    const k = n.toLowerCase()
    if (keptNames.has(k) || seen.has(k)) continue
    seen.set(k, n)
  }
  const newDepartmentNames = Array.from(seen.values())

  const deadlineDate = new Date(deadline)

  await prisma.$transaction([
    prisma.assessment.update({
      where: { id },
      data: { clientName, deadline: deadlineDate, maxUses },
    }),
    ...(toRemove.length > 0
      ? [prisma.department.deleteMany({ where: { id: { in: toRemove.map((d) => d.id) } } })]
      : []),
    ...(newDepartmentNames.length > 0
      ? [
          prisma.department.createMany({
            data: newDepartmentNames.map((name) => ({ assessmentId: id, name })),
          }),
        ]
      : []),
  ])

  await logAdminAction({
    actorAdminId: session.user.id,
    assessmentId: id,
    action: 'assessment.edit',
    metadata: {
      clientNameChanged: clientName !== assessment.clientName,
      deadlineChanged: deadlineDate.getTime() !== assessment.deadline.getTime(),
      maxUsesChanged: maxUses !== assessment.maxUses,
      departmentsAdded: newDepartmentNames.length,
      departmentsRemoved: toRemove.length,
    },
  })

  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'

interface Ctx {
  params: Promise<{ id: string }>
}

/**
 * Manual close: an admin presses "Close now" on the assessment detail
 * page. Same effect as the cron's automatic closure, but auditable as
 * trigger='manual' with the actor's admin id.
 *
 * Idempotent: calling on an already-closed assessment is a 409 with
 * the existing closedAt — not destructive, but signals the no-op.
 */
export async function POST(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    select: { id: true, status: true, closedAt: true, deadline: true },
  })
  if (!assessment) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  if (assessment.status === 'closed') {
    return NextResponse.json(
      { error: 'already_closed', closedAt: assessment.closedAt?.toISOString() ?? null },
      { status: 409 },
    )
  }

  const closedAt = new Date()

  await prisma.$transaction([
    prisma.assessment.update({
      where: { id },
      data: { status: 'closed', closedAt },
    }),
  ])

  await logAdminAction({
    actorAdminId: session.user.id,
    assessmentId: id,
    action: 'assessment.close',
    metadata: {
      trigger: 'manual',
      deadline: assessment.deadline.toISOString(),
      closedAt: closedAt.toISOString(),
    },
  })

  return NextResponse.json({ ok: true, closedAt: closedAt.toISOString() })
}

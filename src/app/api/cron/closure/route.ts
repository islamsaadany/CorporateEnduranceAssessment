import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'

/**
 * Hourly closure cron. Triggered by Vercel Cron (configured in
 * vercel.json). For every collecting assessment past its deadline,
 * flips status → closed and stamps closedAt.
 *
 * Auth: Vercel Cron sends Authorization: Bearer <CRON_SECRET> when
 * the env var is set. Reject any request without the matching header.
 *
 * Idempotent: re-running on already-closed assessments is a no-op
 * because the WHERE clause filters on status='collecting'.
 *
 * Audit: each closure writes a single 'assessment.close' entry with
 * actorAdminId=NULL and metadata={ trigger: 'cron' }. Manual closures
 * (via /api/assessments/[id]/close) write { trigger: 'manual' }.
 */
export async function POST(req: Request) {
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // Two-step (find then update) so we can audit-log each closure with
  // its assessmentId and the deadline it missed. updateMany would be
  // one statement but wouldn't return the rows for logging.
  const dueForClosure = await prisma.assessment.findMany({
    where: { status: 'collecting', deadline: { lte: now } },
    select: { id: true, deadline: true, clientName: true },
  })

  let closedCount = 0
  for (const a of dueForClosure) {
    await prisma.$transaction([
      prisma.assessment.update({
        where: { id: a.id },
        data: { status: 'closed', closedAt: now },
      }),
      prisma.auditLog.create({
        data: {
          assessmentId: a.id,
          actorAdminId: null,
          action: 'assessment.close',
          metadata: {
            trigger: 'cron',
            deadline: a.deadline.toISOString(),
            closedAt: now.toISOString(),
          },
        },
      }),
    ])
    closedCount++
  }

  return NextResponse.json({
    ok: true,
    closedCount,
    checkedAt: now.toISOString(),
    closed: dueForClosure.map((a) => ({ id: a.id, clientName: a.clientName })),
  })
}

// Make GET return the same payload for easy manual testing from a
// browser or curl with the Authorization header — without needing to
// switch verbs.
export const GET = POST

// Cron handlers must be dynamic — never cache.
export const dynamic = 'force-dynamic'

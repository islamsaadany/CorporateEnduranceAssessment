import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Dashboard — The Endurance Assessment' }

export default async function DashboardPage() {
  const user = await requireAdmin()

  // Surface the env-var-credentials trade-off whenever it's active so a
  // super admin always knows their password is readable in the Vercel
  // dashboard. See src/lib/auth.ts for the matching login path.
  const envCredsActive =
    user.role === 'super_admin' &&
    Boolean(process.env.ADMIN_USERNAME) &&
    Boolean(process.env.ADMIN_PASSWORD)

  const [collecting, closed] = await Promise.all([
    prisma.assessment.findMany({
      where: { status: 'collecting' },
      orderBy: { deadline: 'asc' },
      select: {
        id: true,
        clientName: true,
        deadline: true,
        createdAt: true,
        _count: { select: { respondents: true } },
      },
    }),
    prisma.assessment.findMany({
      where: { status: 'closed' },
      orderBy: { closedAt: 'desc' },
      select: {
        id: true,
        clientName: true,
        deadline: true,
        closedAt: true,
        _count: { select: { respondents: true } },
      },
    }),
  ])

  return (
    <div className="space-y-10">
      {envCredsActive ? (
        <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Super admin password is set via environment variables.</p>
          <p className="mt-1 text-amber-800">
            Anyone with edit access to this project&rsquo;s Vercel environment variables can read
            this password in plaintext. To revert to a database-backed password, remove{' '}
            <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">ADMIN_PASSWORD</code> from
            Vercel and redeploy.
          </p>
        </div>
      ) : null}

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Assessments</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Active assessments first, closed assessments below.
          </p>
        </div>
        <Link
          href="/admin/assessments/new"
          className="inline-flex items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-medium text-canvas transition hover:bg-ink-muted"
        >
          New assessment
        </Link>
      </header>

      <Section title="Collecting" emptyText="No assessments are currently collecting responses." rows={collecting.map(toRow)} />
      <Section title="Closed" emptyText="No closed assessments yet." rows={closed.map(toRow)} />
    </div>
  )
}

interface Row {
  id: string
  clientName: string
  deadline: Date
  closedAt: Date | null
  respondentCount: number
}

function toRow(a: {
  id: string
  clientName: string
  deadline: Date
  closedAt?: Date | null
  _count: { respondents: number }
}): Row {
  return {
    id: a.id,
    clientName: a.clientName,
    deadline: a.deadline,
    closedAt: a.closedAt ?? null,
    respondentCount: a._count.respondents,
  }
}

function Section({ title, emptyText, rows }: { title: string; emptyText: string; rows: Row[] }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-ink-muted">
        {title} <span className="ml-1 text-ink-subtle">({rows.length})</span>
      </h2>
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-canvas-border bg-canvas px-6 py-8 text-center text-sm text-ink-muted">
          {emptyText}
        </div>
      ) : (
        <ul className="divide-y divide-canvas-border overflow-hidden rounded-lg border border-canvas-border bg-canvas">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/admin/assessments/${r.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-canvas-muted"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{r.clientName}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {r.respondentCount} {r.respondentCount === 1 ? 'respondent' : 'respondents'}
                  </p>
                </div>
                <div className="text-right text-xs text-ink-muted">
                  {r.closedAt ? (
                    <>Closed {formatDate(r.closedAt)}</>
                  ) : (
                    <>Deadline {formatDate(r.deadline)}</>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(d)
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/prisma'
import { LEVEL_LABELS, TENURE_LABELS } from '@/data/constants'
import { CopyButton } from './copy-button'
import { CopyAllCodes } from './copy-all-codes'

export const metadata = { title: 'Assessment — The Endurance Assessment' }

interface DetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AssessmentDetailPage({ params }: DetailPageProps) {
  await requireAdmin()
  const { id } = await params

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      departments: { orderBy: { name: 'asc' } },
      respondents: {
        orderBy: { code: 'asc' },
        include: { department: { select: { name: true } } },
      },
    },
  })
  if (!assessment) notFound()

  const totals = {
    total: assessment.respondents.length,
    notStarted: assessment.respondents.filter((r) => !r.startedAt && !r.submittedAt).length,
    inProgress: assessment.respondents.filter((r) => r.startedAt && !r.submittedAt).length,
    submitted: assessment.respondents.filter((r) => r.submittedAt).length,
  }

  const dateFmt = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <Link href="/admin/dashboard" className="text-sm text-ink-muted transition hover:text-ink">
          ← Back to dashboard
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-ink">{assessment.clientName}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              <StatusPill status={assessment.status} />
              <span className="ml-3">
                {assessment.status === 'closed' && assessment.closedAt
                  ? `Closed ${dateFmt.format(assessment.closedAt)}`
                  : `Deadline ${dateFmt.format(assessment.deadline)}`}
              </span>
            </p>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Respondents" value={totals.total} />
        <Stat label="Not started" value={totals.notStarted} />
        <Stat label="In progress" value={totals.inProgress} />
        <Stat label="Submitted" value={totals.submitted} accent />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-ink-muted">Departments</h2>
        <div className="flex flex-wrap gap-2">
          {assessment.departments.map((d) => (
            <span
              key={d.id}
              className="rounded-full border border-canvas-border bg-canvas px-3 py-1 text-xs text-ink"
            >
              {d.name}
            </span>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-ink-muted">
            Respondents <span className="ml-1 text-ink-subtle">({totals.total})</span>
          </h2>
          <CopyAllCodes codes={assessment.respondents.map((r) => r.code)} />
        </div>

        <div className="overflow-hidden rounded-lg border border-canvas-border bg-canvas">
          <table className="w-full text-sm">
            <thead className="border-b border-canvas-border bg-canvas-muted text-left text-xs font-medium uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Tenure</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-canvas-border">
              {assessment.respondents.map((r) => {
                const status = r.submittedAt ? 'submitted' : r.startedAt ? 'in_progress' : 'not_started'
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-mono text-xs text-ink">
                      <div className="flex items-center gap-2">
                        <span>{r.code}</span>
                        <CopyButton value={r.code} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink">{r.name ?? <span className="text-ink-subtle">—</span>}</td>
                    <td className="px-4 py-3 text-ink-muted">{r.department?.name ?? <span className="text-ink-subtle">—</span>}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      {r.level ? LEVEL_LABELS[r.level] : <span className="text-ink-subtle">—</span>}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {r.tenure ? TENURE_LABELS[r.tenure] : <span className="text-ink-subtle">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <RespondentStatus status={status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function StatusPill({ status }: { status: 'collecting' | 'closed' }) {
  if (status === 'collecting') {
    return <span className="rounded bg-band-strong/10 px-2 py-0.5 text-xs font-medium text-band-strong">Collecting</span>
  }
  return <span className="rounded bg-ink/10 px-2 py-0.5 text-xs font-medium text-ink">Closed</span>
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-lg border border-canvas-border bg-canvas px-4 py-3 ${accent ? 'ring-1 ring-band-strong/20' : ''}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent ? 'text-band-strong' : 'text-ink'}`}>{value}</p>
    </div>
  )
}

function RespondentStatus({ status }: { status: 'not_started' | 'in_progress' | 'submitted' }) {
  if (status === 'submitted') {
    return <span className="rounded bg-band-strong/10 px-2 py-0.5 text-xs font-medium text-band-strong">Submitted</span>
  }
  if (status === 'in_progress') {
    return <span className="rounded bg-band-needs/10 px-2 py-0.5 text-xs font-medium text-band-needs">In progress</span>
  }
  return <span className="rounded bg-canvas-muted px-2 py-0.5 text-xs font-medium text-ink-muted">Not started</span>
}

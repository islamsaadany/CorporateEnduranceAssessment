import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/prisma'
import { LEVEL_LABELS, TENURE_LABELS } from '@/data/constants'
import { CopyButton } from './copy-button'

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
      // Only "real" respondents — those who finished demographics. Ghost
      // rows from validate-then-bounce are filtered out so the table
      // doesn't show empty-data rows.
      respondents: {
        where: { demographicsCompletedAt: { not: null } },
        orderBy: [{ submittedAt: { sort: 'desc', nulls: 'last' } }, { demographicsCompletedAt: 'desc' }],
        include: { department: { select: { name: true } } },
      },
    },
  })
  if (!assessment) notFound()

  // "Started" = demographics done, not yet submitted.
  // "Submitted" = submitted.
  // Total counts toward the cap.
  const totals = {
    total: assessment.respondents.length,
    started: assessment.respondents.filter((r) => !r.submittedAt).length,
    submitted: assessment.respondents.filter((r) => r.submittedAt).length,
  }
  const remaining = Math.max(0, assessment.maxUses - totals.total)

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
          <Link
            href={`/admin/assessments/${assessment.id}/edit`}
            className="rounded-md border border-canvas-border bg-canvas px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-canvas-muted"
          >
            Edit
          </Link>
        </div>
      </div>

      {/* Cohort code card */}
      <section className="rounded-lg border border-canvas-border bg-canvas p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">Access code</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <code className="rounded bg-canvas-muted px-3 py-1.5 font-mono text-2xl font-semibold tracking-widest text-ink">
              {assessment.code}
            </code>
            <CopyButton value={assessment.code} label="Copy code" />
          </div>
          <p className="text-sm text-ink-muted">
            Share this code with every respondent. It is the same for everyone — there is no per-person code.
          </p>
        </div>
      </section>

      {/* Capacity strip */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total" value={totals.total} secondary={`of ${assessment.maxUses} cap`} />
        <Stat label="Started" value={totals.started} secondary="demographics done, in progress" />
        <Stat label="Submitted" value={totals.submitted} accent />
        <Stat label="Remaining capacity" value={remaining} />
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
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-ink-muted">
          Respondents <span className="ml-1 text-ink-subtle">({totals.started})</span>
        </h2>

        {assessment.respondents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-canvas-border bg-canvas px-6 py-10 text-center text-sm text-ink-muted">
            No respondents yet. Share the access code above to get started.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-canvas-border bg-canvas">
            <table className="w-full text-sm">
              <thead className="border-b border-canvas-border bg-canvas-muted text-left text-xs font-medium uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">Tenure</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-canvas-border">
                {assessment.respondents.map((r) => {
                  const status: 'started' | 'submitted' = r.submittedAt ? 'submitted' : 'started'
                  return (
                    <tr key={r.id}>
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
                      <td className="px-4 py-3 text-ink-muted">
                        {r.submittedAt ? dateFmt.format(r.submittedAt) : <span className="text-ink-subtle">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
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

function Stat({ label, value, secondary, accent }: { label: string; value: number; secondary?: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border border-canvas-border bg-canvas px-4 py-3 ${accent ? 'ring-1 ring-band-strong/20' : ''}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent ? 'text-band-strong' : 'text-ink'}`}>{value}</p>
      {secondary ? <p className="text-xs text-ink-subtle">{secondary}</p> : null}
    </div>
  )
}

function RespondentStatus({ status }: { status: 'started' | 'submitted' }) {
  if (status === 'submitted') {
    return <span className="rounded bg-band-strong/10 px-2 py-0.5 text-xs font-medium text-band-strong">Submitted</span>
  }
  return <span className="rounded bg-band-needs/10 px-2 py-0.5 text-xs font-medium text-band-needs">Started</span>
}

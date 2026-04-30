import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/prisma'
import { EditAssessmentForm, type ExistingDepartment } from './edit-assessment-form'

export const metadata = { title: 'Edit assessment — The Endurance Assessment' }

interface EditPageProps {
  params: Promise<{ id: string }>
}

export default async function EditAssessmentPage({ params }: EditPageProps) {
  await requireAdmin()
  const { id } = await params

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      departments: {
        orderBy: { name: 'asc' },
        include: { _count: { select: { respondents: true } } },
      },
      _count: { select: { respondents: true } },
    },
  })
  if (!assessment) notFound()

  const existingDepartments: ExistingDepartment[] = assessment.departments.map((d) => ({
    id: d.id,
    name: d.name,
    inUse: d._count.respondents > 0,
  }))

  // Format deadline for the datetime-local input (no timezone suffix).
  const d = assessment.deadline
  const pad = (n: number) => String(n).padStart(2, '0')
  const deadlineLocal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/admin/assessments/${assessment.id}`}
        className="text-sm text-ink-muted transition hover:text-ink"
      >
        ← Back to assessment
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-ink">Edit assessment</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Update the client name, deadline, departments, or respondent cap. Departments that have already been
        used by a respondent cannot be removed; the cap cannot be lowered below the current respondent count
        ({assessment._count.respondents}).
      </p>

      <div className="mt-8">
        <EditAssessmentForm
          assessmentId={assessment.id}
          initialClientName={assessment.clientName}
          initialDeadline={deadlineLocal}
          initialMaxUses={assessment.maxUses}
          existingDepartments={existingDepartments}
          minMaxUses={Math.max(3, assessment._count.respondents)}
        />
      </div>
    </div>
  )
}

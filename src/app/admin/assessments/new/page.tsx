import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-guard'
import { NewAssessmentForm } from './new-assessment-form'

export const metadata = { title: 'New assessment — The Endurance Assessment' }

export default async function NewAssessmentPage() {
  await requireAdmin()

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/dashboard" className="text-sm text-ink-muted transition hover:text-ink">
        ← Back to dashboard
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-ink">New assessment</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Create an assessment for a client. The system will generate a unique 6-character code for each
        respondent — distribute them manually after creation.
      </p>

      <div className="mt-8">
        <NewAssessmentForm />
      </div>
    </div>
  )
}

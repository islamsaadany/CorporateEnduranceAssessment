import { CodeEntryForm } from './code-entry-form'

export const metadata = { title: 'Begin — The Endurance Assessment' }

export default function CodeEntryPage() {
  return (
    <div className="mx-auto max-w-md">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-muted">
        Forefront Consulting
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-ink">The Endurance Assessment</h1>
      <p className="mt-3 text-sm text-ink-muted">
        Enter the 6-character access code you received from your consultant to begin.
      </p>
      <div className="mt-8">
        <CodeEntryForm />
      </div>
    </div>
  )
}

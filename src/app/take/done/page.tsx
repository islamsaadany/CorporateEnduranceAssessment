import { DoneCleanup } from './done-cleanup'

export const metadata = { title: 'Submitted — The Endurance Assessment' }

export default function DonePage() {
  return (
    <div className="space-y-6 text-center">
      <DoneCleanup />
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-band-strong">Submitted</p>
        <h1 className="text-3xl font-semibold text-ink">Thank you.</h1>
      </div>
      <p className="text-sm text-ink-muted">
        Your responses have been recorded. The aggregated team report will be shared by your
        consultant after the assessment closes.
      </p>
      <p className="text-xs text-ink-subtle">
        You can safely close this tab.
      </p>
    </div>
  )
}

import { DemographicsForm } from './demographics-form'

export const metadata = { title: 'Demographics — The Endurance Assessment' }

export default function DemographicsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-muted">
          Step 1 of 2
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">A few quick questions</h1>
        <p className="mt-1 text-sm text-ink-muted">
          These help us slice the team report by group. Your name is optional.
        </p>
      </div>

      <DemographicsForm />
    </div>
  )
}

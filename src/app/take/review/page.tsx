import { ReviewBoard } from './review-board'

export const metadata = { title: 'Review — The Endurance Assessment' }

export default function ReviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-muted">
          Step 2 of 2
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Review your answers</h1>
        <p className="mt-1 text-sm text-ink-muted">
          You can change any answer before submitting. Once you submit, your responses are locked.
        </p>
      </div>

      <ReviewBoard />
    </div>
  )
}

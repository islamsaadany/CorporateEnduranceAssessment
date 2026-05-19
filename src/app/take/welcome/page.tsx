import Link from 'next/link'

export const metadata = { title: 'Welcome — The Endurance Assessment' }

export default function WelcomePage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-muted">
          Welcome
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Before you begin</h1>
      </div>

      <section className="space-y-4 text-sm leading-relaxed text-ink">
        <p>
          You are about to take a short diagnostic that measures your organization&apos;s endurance
          — its ability to be agile, tough, and resilient under change and pressure.
        </p>

        <p className="rounded-md border-l-4 border-ink bg-canvas-muted px-4 py-3 font-medium">
          You are rating <em>the organization</em> — not yourself. Every question asks about how
          your organization operates today.
        </p>

        <p>The assessment has 42 statements, takes about 14–18 minutes, and works as follows:</p>

        <ul className="list-disc space-y-2 pl-5 text-ink-muted">
          <li>Each statement is rated on a 4-point scale, from <strong>1 — Strongly Disagree</strong> to <strong>4 — Strongly Agree</strong>.</li>
          <li>If you genuinely don&apos;t have visibility into a particular practice, pick <strong>&ldquo;I don&apos;t know&rdquo;</strong> — your honest answer is more useful than a guess.</li>
          <li>Before the questions, we&apos;ll ask a few short demographic questions (department, level, tenure). Your name is optional.</li>
          <li>You can go back and change any answer before submitting.</li>
        </ul>

        <p className="rounded-md border border-canvas-border bg-canvas px-4 py-3 text-xs text-ink-muted">
          <strong className="text-ink">Privacy:</strong> Your responses are anonymized and aggregated.
          The team report uses AI assistance to interpret patterns. Individual answers are not shared
          back with your organization in any form that identifies you.
        </p>
      </section>

      <div>
        <Link
          href="/take/demographics"
          className="inline-flex items-center justify-center rounded-md bg-ink px-6 py-3 text-sm font-medium text-canvas transition hover:bg-ink-muted"
        >
          Begin assessment
        </Link>
      </div>
    </div>
  )
}

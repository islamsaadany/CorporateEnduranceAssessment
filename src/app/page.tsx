import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-muted">
          Forefront Consulting
        </p>
        <h1 className="text-4xl font-semibold text-ink sm:text-5xl">The Endurance Assessment</h1>
        <p className="text-base text-ink-muted sm:text-lg">
          A team diagnostic measuring organizational endurance across three pillars — Agility,
          Toughness, and Resilience.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/take"
          className="inline-flex items-center justify-center rounded-md bg-ink px-5 py-3 text-sm font-medium text-canvas transition hover:bg-ink-muted"
        >
          I have an access code
        </Link>
        <Link
          href="/admin/login"
          className="inline-flex items-center justify-center rounded-md border border-canvas-border px-5 py-3 text-sm font-medium text-ink transition hover:bg-canvas-muted"
        >
          Admin login
        </Link>
      </div>
    </main>
  )
}

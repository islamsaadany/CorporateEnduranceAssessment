import Link from 'next/link'
import { auth, signOut } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // The login page renders inside this layout but without a session —
  // skip the chrome there.
  if (!session?.user) {
    return <>{children}</>
  }

  const isSuperAdmin = session.user.role === 'super_admin'

  return (
    <div className="min-h-screen bg-canvas-muted">
      <header className="border-b border-canvas-border bg-canvas">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="text-sm font-semibold text-ink">
              The Endurance Assessment
            </Link>
            <nav className="flex items-center gap-4 text-sm text-ink-muted">
              <Link href="/admin/dashboard" className="transition hover:text-ink">
                Dashboard
              </Link>
              {isSuperAdmin ? (
                <>
                  <Link href="/admin/settings/ai" className="transition hover:text-ink">
                    AI settings
                  </Link>
                  <Link href="/admin/admins" className="transition hover:text-ink">
                    Admins
                  </Link>
                </>
              ) : null}
            </nav>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink-muted">
              {session.user.name}
              {isSuperAdmin ? (
                <span className="ml-1 rounded bg-ink/10 px-1.5 py-0.5 text-xs font-medium text-ink">
                  super
                </span>
              ) : null}
            </span>
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/admin/login' })
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-canvas-border bg-canvas px-3 py-1.5 transition hover:bg-canvas-muted"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </div>
  )
}

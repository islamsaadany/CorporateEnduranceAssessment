import { LoginForm } from './login-form'

export const metadata = { title: 'Admin login — The Endurance Assessment' }

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const sp = await searchParams

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-muted">Forefront Consulting</p>
        <h1 className="text-2xl font-semibold text-ink">Admin login</h1>
        <p className="text-sm text-ink-muted">Sign in to manage assessments and reports.</p>
      </div>

      <div className="mt-8">
        <LoginForm callbackUrl={sp.callbackUrl ?? '/admin/dashboard'} initialError={sp.error} />
      </div>
    </main>
  )
}

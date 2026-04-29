import { redirect } from 'next/navigation'
import { auth } from './auth'
import type { AdminRole } from '@prisma/client'

/**
 * Server-component / server-action helpers to assert the caller is an admin
 * (or specifically a super_admin) and return the session user.
 *
 * Middleware already redirects unauthed traffic away from /admin/*. These
 * helpers exist for the inside-the-route checks (rendering decisions, role
 * gating on super-admin-only pages, defense in depth on API handlers).
 */

export async function requireAdmin() {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }
  return session.user as { id: string; email: string; name: string; role: AdminRole }
}

export async function requireSuperAdmin() {
  const user = await requireAdmin()
  if (user.role !== 'super_admin') {
    // Regular admins hitting a super-admin-only route → bounce to dashboard,
    // not 403. Less surprising; the link shouldn't have been visible anyway.
    redirect('/admin/dashboard')
  }
  return user
}

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAdminRoute = pathname.startsWith('/admin')
  const isLoginRoute = pathname === '/admin/login'

  // Already-authed users hitting the login page → bounce to dashboard.
  if (isLoginRoute && req.auth) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl))
  }

  // Unauthed users on any /admin route except /admin/login → send to login.
  if (isAdminRoute && !isLoginRoute && !req.auth) {
    const loginUrl = new URL('/admin/login', req.nextUrl)
    loginUrl.searchParams.set('callbackUrl', pathname + req.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }
})

export const config = {
  // Run on /admin/* and /api/admin/* (the latter is reserved for future Phase 3 routes).
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}

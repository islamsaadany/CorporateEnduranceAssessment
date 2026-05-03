import NextAuth, { type DefaultSession, type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from './prisma'
import type { AdminRole } from '@prisma/client'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const authConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) return null

        const email = parsed.data.email.toLowerCase()
        const password = parsed.data.password

        // Env-var super admin login (recovery path).
        //
        // If SEED_SUPER_ADMIN_EMAIL + SEED_SUPER_ADMIN_PASSWORD are set in
        // the environment and match the supplied credentials, log the user
        // in as the super admin. The DB row is created/repaired on demand
        // so that audit logs (actorAdminId) and assessment ownership keep
        // working. The DB password hash for this row is not consulted on
        // this code path — env-var match alone authenticates.
        //
        // Security trade-off: the password lives in plaintext in the
        // Vercel env-var dashboard. This is acceptable per the user's
        // explicit decision (recovery loop > additional surface). The
        // dashboard surfaces a persistent banner whenever this env var
        // is set so the trade-off stays visible. See CLAUDE.md.
        const envEmail = process.env.SEED_SUPER_ADMIN_EMAIL?.toLowerCase()
        const envPassword = process.env.SEED_SUPER_ADMIN_PASSWORD
        if (envEmail && envPassword && envEmail === email && envPassword === password) {
          const existing = await prisma.admin.findUnique({ where: { email } })
          if (existing) {
            // Repair: deactivated super admin row should still let env login through.
            const repaired =
              existing.role !== 'super_admin' || !existing.isActive
                ? await prisma.admin.update({
                    where: { id: existing.id },
                    data: { role: 'super_admin', isActive: true },
                  })
                : existing
            return {
              id: repaired.id,
              email: repaired.email,
              name: repaired.name,
              role: repaired.role,
            }
          }
          // No row yet — create one. passwordHash is set to a hash of the
          // env password as a sane initial value; env-var match is what
          // actually authenticates going forward.
          const created = await prisma.admin.create({
            data: {
              email,
              name: process.env.SEED_SUPER_ADMIN_NAME || 'Super Admin',
              passwordHash: await bcrypt.hash(password, 10),
              role: 'super_admin',
              isActive: true,
            },
          })
          return {
            id: created.id,
            email: created.email,
            name: created.name,
            role: created.role,
          }
        }

        // Standard DB-backed login for everyone else (and for the super
        // admin when env vars are not set).
        const admin = await prisma.admin.findUnique({ where: { email } })
        if (!admin || !admin.isActive) return null

        const ok = await bcrypt.compare(password, admin.passwordHash)
        if (!ok) return null

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user && user.id) {
        token.id = user.id
        token.role = (user as { role: AdminRole }).role
      }
      return token
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as AdminRole
      }
      return session
    },
    authorized: ({ auth, request }) => {
      const isOnAdmin = request.nextUrl.pathname.startsWith('/admin')
      const isOnLogin = request.nextUrl.pathname === '/admin/login'
      if (!isOnAdmin || isOnLogin) return true
      return Boolean(auth?.user)
    },
  },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

// Module augmentation so `session.user.role` and `session.user.id` are typed.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: AdminRole
    } & DefaultSession['user']
  }

  interface User {
    role: AdminRole
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string
    role: AdminRole
  }
}

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

        const admin = await prisma.admin.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        })
        if (!admin || !admin.isActive) return null

        const ok = await bcrypt.compare(parsed.data.password, admin.passwordHash)
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

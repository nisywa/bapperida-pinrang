import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Query logging only in development - production (Vercel) stays silent
// to avoid log overhead on every serverless invocation.
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'production'
        ? ['error']
        : ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

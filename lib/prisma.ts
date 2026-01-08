import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// SQLite with Prisma 7 - pass empty options object
const createPrismaClient = () => {
  // Skip Prisma initialization during Next.js build phase
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return {} as PrismaClient
  }

  // Prisma 7 requires options object, even if empty
  return new PrismaClient({})
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

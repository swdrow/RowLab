import { PrismaClient } from '@prisma/client';

// Singleton Prisma client instance for PostgreSQL
// Connection URL configured via DATABASE_URL env var and prisma.config.ts
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export { prisma };
export default prisma;

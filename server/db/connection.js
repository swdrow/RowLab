import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Connection pool for PostgreSQL
const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });

// Prisma adapter for pg
const adapter = new PrismaPg(pool);

// Singleton Prisma client instance for PostgreSQL
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export { prisma };
export default prisma;

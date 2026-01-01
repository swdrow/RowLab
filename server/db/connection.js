import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path - resolve relative to project root
const dbPath = path.resolve(__dirname, '../../data/rowlab.db');
const dbUrl = `file:${dbPath}`;

// Create adapter with SQLite database
const adapter = new PrismaBetterSqlite3({ url: dbUrl });

// Singleton Prisma client instance
const prisma = new PrismaClient({ adapter });

export default prisma;

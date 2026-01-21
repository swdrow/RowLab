import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if admin user exists
  const existingAdmin = await prisma.user.findFirst({
    where: { isAdmin: true }
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists:', existingAdmin.email);
    return;
  }

  // Create admin user - password MUST be set via environment variable
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD environment variable is required for seeding. Do not use default passwords.');
  }
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const user = await prisma.user.create({
    data: {
      email: 'swd@rowlab.net',
      username: 'swd',
      name: 'Admin',
      passwordHash: hashedPassword,
      isAdmin: true
    }
  });

  // Create a team for the admin
  const team = await prisma.team.create({
    data: {
      name: 'Admin Team',
      slug: 'admin-team'
    }
  });

  // Add user as team owner
  await prisma.teamMember.create({
    data: {
      userId: user.id,
      teamId: team.id,
      role: 'OWNER'
    }
  });

  // Create enterprise subscription
  await prisma.subscription.create({
    data: {
      teamId: team.id,
      plan: 'enterprise',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }
  });

  console.log('✅ Admin user created:', user.email);
  console.log('✅ Team created:', team.name);
  console.log('✅ Role: OWNER with Enterprise subscription');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

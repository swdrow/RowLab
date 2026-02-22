/**
 * Seed fake users, workouts, and follow relationships for social feed testing.
 * Run with: npm run seed:social
 * Idempotent — safe to run multiple times (upserts by username).
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const FAKE_USERS = [
  { username: 'emma_rows', name: 'Emma Chen', email: 'emma@fake.oarbit.net' },
  { username: 'sculler_mike', name: 'Mike Torres', email: 'mike@fake.oarbit.net' },
  { username: 'cox_sarah', name: 'Sarah Kim', email: 'sarah@fake.oarbit.net' },
  { username: 'sweep_jen', name: 'Jennifer Walsh', email: 'jen@fake.oarbit.net' },
  { username: 'steady_state', name: 'David Liu', email: 'david@fake.oarbit.net' },
  { username: 'erg_beast', name: 'Alex Johnson', email: 'alex@fake.oarbit.net' },
  { username: 'port_side', name: 'Maria Garcia', email: 'maria@fake.oarbit.net' },
  { username: 'catch_drive', name: 'James Wright', email: 'james@fake.oarbit.net' },
];

const MACHINE_TYPES = ['rower', 'bikerg', 'skierg', null]; // null = on-the-water
const SOURCES = ['concept2_sync', 'manual', 'strava_sync'];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomWorkout(userId, daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(randomBetween(5, 20), randomBetween(0, 59));

  const machineType = MACHINE_TYPES[randomBetween(0, MACHINE_TYPES.length - 1)];
  const type = machineType ? 'erg' : 'on_water';
  const distanceM = randomBetween(2000, 15000);
  const paceSecondsPerFiveHundred = randomBetween(90, 130); // 1:30 - 2:10
  const durationSeconds = Math.round((distanceM / 500) * paceSecondsPerFiveHundred);

  return {
    userId,
    date,
    source: SOURCES[randomBetween(0, SOURCES.length - 1)],
    type,
    machineType,
    distanceM,
    durationSeconds,
    avgPace: paceSecondsPerFiveHundred * 10, // tenths of seconds per 500m
    avgWatts: randomBetween(150, 350),
    strokeRate: machineType === 'bikerg' ? null : randomBetween(18, 32),
    notes: null,
  };
}

async function main() {
  const passwordHash = await bcrypt.hash('fakeuserpass', 12);

  // Find admin user (to set up follows)
  const admin = await prisma.user.findFirst({ where: { isAdmin: true } });
  if (!admin) {
    console.error('No admin user found. Run main seed first.');
    process.exit(1);
  }

  console.log(`Admin user: ${admin.username || admin.email} (${admin.id})`);

  // Upsert fake users
  const users = [];
  for (const u of FAKE_USERS) {
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: { name: u.name, email: u.email },
      create: {
        username: u.username,
        name: u.name,
        email: u.email,
        passwordHash,
        isAdmin: false,
      },
    });
    users.push(user);
    console.log(`  User: ${user.username} (${user.id})`);
  }

  // Create workouts for each fake user (5-8 workouts in last 14 days)
  let workoutCount = 0;
  for (const user of users) {
    const numWorkouts = randomBetween(5, 8);
    for (let i = 0; i < numWorkouts; i++) {
      const daysAgo = randomBetween(0, 13);
      const data = randomWorkout(user.id, daysAgo);
      await prisma.workout.create({ data });
      workoutCount++;
    }
  }
  console.log(`  Created ${workoutCount} fake workouts`);

  // Admin follows all fake users
  for (const user of users) {
    await prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId: admin.id, followingId: user.id },
      },
      update: {},
      create: { followerId: admin.id, followingId: user.id },
    });
  }
  console.log(`  Admin follows ${users.length} users`);

  // Some fake users follow admin back
  for (const user of users.slice(0, 5)) {
    await prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId: user.id, followingId: admin.id },
      },
      update: {},
      create: { followerId: user.id, followingId: admin.id },
    });
  }
  console.log(`  5 users follow admin back`);

  // Some cross-follows between fake users
  for (let i = 0; i < users.length - 1; i++) {
    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: users[i].id,
          followingId: users[i + 1].id,
        },
      },
      update: {},
      create: { followerId: users[i].id, followingId: users[i + 1].id },
    });
  }
  console.log('  Cross-follows created');

  console.log('Social seed complete!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

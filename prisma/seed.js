import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path
const dbPath = path.resolve(__dirname, '../data/rowlab.db');
const dbUrl = `file:${dbPath}`;

// Create adapter and client
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

// Parse CSV file
function parseCSV(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });
}

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminUsername = process.env.ADMIN_USERNAME || 'swd';
  const adminPassword = process.env.ADMIN_PASSWORD || '$r1j4JGMH03';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { username: adminUsername },
    update: { password: hashedPassword, status: 'approved' },
    create: {
      username: adminUsername,
      password: hashedPassword,
      name: 'Head Coach',
      role: 'admin',
      status: 'approved',
    },
  });
  console.log(`Created/updated admin user: ${admin.username}`);

  // Seed athletes from CSV
  const athletesPath = path.join(__dirname, '..', 'data', 'athletes.csv');
  if (fs.existsSync(athletesPath)) {
    const athletes = parseCSV(athletesPath);

    for (const athlete of athletes) {
      const side = athlete['Side'] || athlete['side'] || '';

      await prisma.athlete.upsert({
        where: {
          lastName_firstName: {
            lastName: athlete['Last Name'] || athlete['LastName'] || '',
            firstName: athlete['First Name'] || athlete['FirstName'] || '',
          },
        },
        update: {},
        create: {
          lastName: athlete['Last Name'] || athlete['LastName'] || '',
          firstName: athlete['First Name'] || athlete['FirstName'] || '',
          country: athlete['Country'] || athlete['country'] || 'USA',
          side: side,
          port: side === 'P' || side === 'B',
          starboard: side === 'S' || side === 'B',
          sculling: side === 'B',
          isCoxswain: side === 'Cox',
        },
      });
    }
    console.log(`Seeded ${athletes.length} athletes`);
  }

  // Seed boat configs
  const boatsPath = path.join(__dirname, '..', 'data', 'boats.csv');
  if (fs.existsSync(boatsPath)) {
    const boats = parseCSV(boatsPath);

    for (const boat of boats) {
      await prisma.boatConfig.upsert({
        where: { name: boat['BoatName'] || boat['Name'] || '' },
        update: {},
        create: {
          name: boat['BoatName'] || boat['Name'] || '',
          numSeats: parseInt(boat['NumSeats'] || boat['Seats'] || '8', 10),
          hasCoxswain: boat['HasCoxswain'] === '1' || boat['Coxswain'] === 'true',
        },
      });
    }
    console.log(`Seeded ${boats.length} boat configs`);
  }

  // Seed shells
  const shellsPath = path.join(__dirname, '..', 'data', 'shells.csv');
  if (fs.existsSync(shellsPath)) {
    const shells = parseCSV(shellsPath);

    for (const shell of shells) {
      await prisma.shell.upsert({
        where: { name: shell['ShellName'] || shell['Name'] || '' },
        update: {},
        create: {
          name: shell['ShellName'] || shell['Name'] || '',
          boatClass: shell['BoatClass'] || shell['Class'] || '',
          notes: shell['Notes'] || null,
        },
      });
    }
    console.log(`Seeded ${shells.length} shells`);
  }

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Import athletes from data/athletes.csv into the database
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Map side abbreviations to full values
const sideMap = {
  'P': 'Port',
  'S': 'Starboard',
  'B': 'Both',
  'Cox': 'Cox',
  '': null
};

async function main() {
  console.log('📥 Importing athletes from data/athletes.csv...\n');

  // Get the team ID
  const team = await prisma.team.findFirst({
    where: { name: 'Admin Team' }
  });

  if (!team) {
    throw new Error('Admin Team not found. Run prisma db seed first.');
  }

  console.log(`📋 Team: ${team.name} (${team.id})\n`);

  // Read and parse CSV
  const csvPath = path.join(__dirname, '..', 'data', 'athletes.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');

  // Skip header
  const header = lines[0].split(',');
  console.log(`📄 CSV columns: ${header.join(', ')}\n`);

  const athletes = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const lastName = values[0].trim();
    const firstName = values[1].trim();
    const country = values[2].trim();
    const sideAbbr = values[3].trim();

    athletes.push({
      firstName,
      lastName,
      country: country || null,
      side: sideMap[sideAbbr] ?? null,
      canScull: false,
      canCox: sideAbbr === 'Cox',
      isManaged: true,
      teamId: team.id
    });
  }

  console.log(`👥 Found ${athletes.length} athletes in CSV\n`);

  // Delete existing athletes for clean import
  const deleted = await prisma.athlete.deleteMany({
    where: { teamId: team.id }
  });
  console.log(`🗑️  Deleted ${deleted.count} existing athletes\n`);

  // Insert all athletes
  let created = 0;
  let errors = [];

  for (const athlete of athletes) {
    try {
      await prisma.athlete.create({
        data: athlete
      });
      created++;
      process.stdout.write(`✅ Created: ${athlete.firstName} ${athlete.lastName} ${athlete.country ? '(' + athlete.country + ')' : ''}\n`);
    } catch (error) {
      errors.push({ athlete, error: error.message });
      console.log(`❌ Failed: ${athlete.firstName} ${athlete.lastName} - ${error.message}`);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Import Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`${'='.repeat(50)}\n`);

  if (errors.length > 0) {
    console.log('Errors:');
    errors.forEach(e => console.log(`  - ${e.athlete.firstName} ${e.athlete.lastName}: ${e.error}`));
  }
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

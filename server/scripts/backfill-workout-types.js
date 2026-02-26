/**
 * Backfill script: Fix workout type and machineType for C2-synced workouts.
 *
 * Issues fixed:
 * 1. type field was never set to 'erg' for C2 workouts (all show as "Other" in frontend)
 * 2. machineType mapping missed "bike" → "bikerg" and "slides" → "rower"
 *
 * Usage: node --require=dotenv/config server/scripts/backfill-workout-types.js
 */

import { prisma } from '../db/connection.js';

const C2_TYPE_MAP = {
  rower: 'rower',
  slides: 'rower', // Dynamic indoor rower
  skierg: 'skierg',
  bike: 'bikerg', // C2 API returns "bike", not "bikerg"
  bikerg: 'bikerg',
};

async function backfill() {
  console.log('Starting workout type backfill...');

  // Get all C2 workouts
  const workouts = await prisma.workout.findMany({
    where: {
      OR: [{ source: 'concept2_sync' }, { source: 'concept2' }],
    },
    select: {
      id: true,
      type: true,
      machineType: true,
      rawData: true,
    },
  });

  console.log(`Found ${workouts.length} C2 workouts to check`);

  let typeFixed = 0;
  let machineFixed = 0;

  for (const w of workouts) {
    const raw = w.rawData || {};
    const c2Type = raw.type || raw.workout_type;
    const correctMachine = C2_TYPE_MAP[c2Type] || w.machineType || 'rower';
    const updates = {};

    // Fix missing type field
    if (w.type !== 'erg') {
      updates.type = 'erg';
      typeFixed++;
    }

    // Fix incorrect machineType
    if (w.machineType !== correctMachine) {
      updates.machineType = correctMachine;
      machineFixed++;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.workout.update({
        where: { id: w.id },
        data: updates,
      });
    }
  }

  console.log(`Done!`);
  console.log(`  type set to 'erg': ${typeFixed} workouts`);
  console.log(`  machineType corrected: ${machineFixed} workouts`);
  console.log(
    `  (${workouts.length - typeFixed - machineFixed + Math.min(typeFixed, machineFixed)} already correct)`
  );
}

backfill()
  .catch((e) => {
    console.error('Backfill failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

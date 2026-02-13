/**
 * Backfill ErgTests from Existing C2 Workouts
 *
 * One-time script to populate ErgTest table from standard-distance
 * Concept2 workouts that were synced before ErgTest auto-creation was implemented.
 *
 * Usage: node --env-file=.env server/scripts/backfill-erg-tests.js
 */

import { prisma } from '../db/connection.js';
import { convertWorkoutsToErgTests } from '../services/workoutToErgTest.js';
import logger from '../utils/logger.js';

async function backfillErgTests() {
  try {
    logger.info('Starting ErgTest backfill from C2 workouts');

    // Get all C2-synced workouts with athlete IDs
    const workouts = await prisma.workout.findMany({
      where: {
        source: 'concept2_sync',
        athleteId: { not: null },
      },
      orderBy: { date: 'asc' },
    });

    logger.info(`Found ${workouts.length} C2 workouts to process`);

    if (workouts.length === 0) {
      logger.info('No workouts to process. Exiting.');
      return;
    }

    // Group workouts by team for batch processing
    const workoutsByTeam = workouts.reduce((acc, workout) => {
      if (!acc[workout.teamId]) {
        acc[workout.teamId] = [];
      }
      acc[workout.teamId].push(workout);
      return acc;
    }, {});

    let totalCreated = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    // Process each team's workouts
    for (const [teamId, teamWorkouts] of Object.entries(workoutsByTeam)) {
      logger.info(`Processing ${teamWorkouts.length} workouts for team ${teamId}`);

      const result = await convertWorkoutsToErgTests(teamWorkouts, teamId);

      totalCreated += result.created;
      totalSkipped += result.skipped;
      totalFailed += result.failed;

      logger.info(`Team ${teamId} complete:`, {
        created: result.created,
        skipped: result.skipped,
        failed: result.failed,
      });
    }

    // Summary
    console.log('\n=== BACKFILL SUMMARY ===');
    console.log(`Total workouts processed: ${workouts.length}`);
    console.log(`ErgTests created: ${totalCreated}`);
    console.log(`Skipped (not standard distance or duplicate): ${totalSkipped}`);
    console.log(`Failed (errors): ${totalFailed}`);
    console.log('========================\n');

    // Verify final count
    const ergTestCount = await prisma.ergTest.count();
    logger.info(`Total ErgTests in database: ${ergTestCount}`);
    console.log(`\nTotal ErgTests in database: ${ergTestCount}`);
  } catch (error) {
    logger.error('Backfill failed', {
      error: error.message,
      stack: error.stack,
    });
    console.error('ERROR:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backfill
backfillErgTests();

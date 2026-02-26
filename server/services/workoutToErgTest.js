/**
 * Workout to ErgTest Conversion Service
 *
 * Converts qualifying Workout records (standard test distances) into ErgTest records.
 * Handles deduplication and batch processing.
 */

import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';

/**
 * Standard test distances with tolerance ranges
 * Real C2 workouts may end slightly off due to stroke timing
 */
const STANDARD_DISTANCES = [
  { type: '500m', min: 475, max: 525 },
  { type: '1k', min: 950, max: 1050 },
  { type: '2k', min: 1950, max: 2050 },
  { type: '5k', min: 4950, max: 5050 },
  { type: '6k', min: 5900, max: 6100 },
];

/**
 * Check if a distance matches a standard test distance
 * @param {number} distanceM - Distance in meters
 * @returns {string|null} - Test type ('500m', '1k', '2k', '5k', '6k') or null
 */
export function isStandardTestDistance(distanceM) {
  if (!distanceM || distanceM <= 0) return null;

  for (const distance of STANDARD_DISTANCES) {
    if (distanceM >= distance.min && distanceM <= distance.max) {
      return distance.type;
    }
  }

  return null;
}

/**
 * Convert a single workout to an ErgTest record
 * @param {object} workout - Workout record from database
 * @param {string} teamId - Team ID
 * @returns {Promise<object|null>} - Created ErgTest or null if not converted
 */
export async function convertWorkoutToErgTest(workout, teamId) {
  try {
    // Skip if no athlete (unmatched workouts)
    if (!workout.athleteId) {
      logger.debug('Skipping workout without athleteId', { workoutId: workout.id });
      return null;
    }

    // Skip BikeErg workouts — BikeErg benchmark distances are 2x RowErg
    // (e.g., a 1000m bike ≠ a 1000m row), so they shouldn't create ErgTest records
    if (workout.machineType === 'bikerg') {
      logger.debug('Skipping BikeErg workout for ErgTest conversion', { workoutId: workout.id });
      return null;
    }

    // Check if this is a standard test distance
    const testType = isStandardTestDistance(workout.distanceM);
    if (!testType) {
      logger.debug('Workout distance not a standard test', {
        workoutId: workout.id,
        distanceM: workout.distanceM,
      });
      return null;
    }

    // Check for duplicate - same athlete, date, and test type
    const testDate = new Date(workout.date);
    const startOfDay = new Date(testDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(testDate.setHours(23, 59, 59, 999));

    const existing = await prisma.ergTest.findFirst({
      where: {
        athleteId: workout.athleteId,
        testType,
        testDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existing) {
      logger.debug('ErgTest already exists for this athlete/date/type', {
        workoutId: workout.id,
        athleteId: workout.athleteId,
        testType,
        testDate: workout.date,
      });
      return null;
    }

    // Calculate split seconds from avgPace
    // avgPace is in tenths of seconds per 500m, divide by 10 to get seconds
    const splitSeconds = workout.avgPace ? parseFloat(workout.avgPace) / 10 : null;

    // Create ErgTest record
    const ergTest = await prisma.ergTest.create({
      data: {
        athleteId: workout.athleteId,
        teamId,
        testType,
        testDate: new Date(workout.date),
        distanceM: workout.distanceM,
        timeSeconds: workout.durationSeconds,
        splitSeconds,
        watts: workout.avgWatts,
        strokeRate: workout.strokeRate,
        notes: `Auto-created from Concept2 sync (${workout.c2LogbookId || 'unknown'})`,
      },
    });

    logger.info('Created ErgTest from workout', {
      ergTestId: ergTest.id,
      workoutId: workout.id,
      athleteId: workout.athleteId,
      testType,
      testDate: workout.date,
    });

    return ergTest;
  } catch (error) {
    logger.error('Failed to convert workout to ErgTest', {
      workoutId: workout.id,
      error: error.message,
      stack: error.stack,
    });
    return null;
  }
}

/**
 * Batch convert workouts to ErgTests
 * @param {Array<object>} workouts - Array of workout records
 * @param {string} teamId - Team ID
 * @returns {Promise<{created: number, skipped: number, failed: number}>}
 */
export async function convertWorkoutsToErgTests(workouts, teamId) {
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const workout of workouts) {
    try {
      const result = await convertWorkoutToErgTest(workout, teamId);
      if (result) {
        created++;
      } else {
        skipped++;
      }
    } catch (error) {
      failed++;
      logger.error('Failed to process workout in batch', {
        workoutId: workout.id,
        error: error.message,
      });
    }
  }

  logger.info('Batch conversion complete', {
    total: workouts.length,
    created,
    skipped,
    failed,
  });

  return { created, skipped, failed };
}

export default {
  isStandardTestDistance,
  convertWorkoutToErgTest,
  convertWorkoutsToErgTests,
};

/**
 * Concept2 Sync Service
 *
 * Enhanced sync pipeline that extracts and stores workout splits and machine type metadata from C2 API.
 * Handles manual sync, webhook events, and background daily sync with split-level data.
 */

import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';
import { fetchResults, fetchResultWithStrokes, getValidToken } from './concept2Service.js';

/**
 * Map C2 API machine type values to our enum
 * @param {number|string} c2Type - C2 type value
 * @returns {string} - Mapped machine type
 */
export function mapC2MachineType(c2Type) {
  // C2 API type field mapping:
  // 0 or "rower" → rower
  // 1 or "skierg" → skierg
  // 2 or "bikerg" → bikerg
  if (c2Type === 0 || c2Type === 'rower') return 'rower';
  if (c2Type === 1 || c2Type === 'skierg') return 'skierg';
  if (c2Type === 2 || c2Type === 'bikerg') return 'bikerg';

  // Default to rower (most common)
  return 'rower';
}

/**
 * Extract splits from C2 result data
 * @param {object} c2Result - C2 API result object
 * @returns {Array<object>} - Array of split objects
 */
export function extractSplits(c2Result) {
  // C2 results include 'intervals' array with per-split data
  const intervals = c2Result.intervals || [];

  return intervals.map((interval, index) => ({
    splitNumber: index + 1, // 1-indexed
    distanceM: interval.distance || null,
    timeSeconds: interval.time ? interval.time / 10 : null, // C2 stores in tenths
    pace: interval.stroke_data?.avg_pace || null, // Already in tenths
    watts: interval.stroke_data?.avg_watts || null,
    strokeRate: interval.stroke_data?.avg_stroke_rate || interval.stroke_rate || null,
    heartRate: interval.heart_rate?.average || null,
    dragFactor: interval.drag_factor || null,
    calories: interval.calories_total || null,
  }));
}

/**
 * Sync workouts for a user (athlete self-sync or coach sync)
 * Enhanced version with split data extraction
 *
 * @param {string} userId - User ID
 * @param {string} teamId - Team ID
 * @returns {Promise<{totalFetched: number, workoutsCreated: number, ergTestsCreated: number, splits: number}>}
 */
export async function syncUserWorkouts(userId, teamId) {
  // Get user's C2 auth
  const auth = await prisma.concept2Auth.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!auth) {
    throw new Error('No Concept2 connection');
  }

  // Find or create athlete record for this user in the team
  let athlete = await prisma.athlete.findFirst({
    where: {
      userId,
      teamId,
    },
  });

  // Link existing athlete to C2 account if needed
  if (athlete && !athlete.concept2UserId && auth.c2UserId) {
    athlete = await prisma.athlete.update({
      where: { id: athlete.id },
      data: { concept2UserId: auth.c2UserId },
    });
    logger.info('Linked C2 account to existing athlete', {
      athleteId: athlete.id,
      c2UserId: auth.c2UserId,
    });
  }

  // Auto-create athlete profile if user doesn't have one
  if (!athlete) {
    logger.info('Creating athlete profile for user', { userId, teamId });

    const user = auth.user;
    const nameParts = user.email.split('@')[0].split(/[._-]/);
    const firstName = nameParts[0]
      ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1)
      : 'User';
    const lastName = nameParts[1]
      ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1)
      : user.email.split('@')[0];

    athlete = await prisma.athlete.create({
      data: {
        teamId,
        userId,
        firstName,
        lastName,
        email: user.email,
        isManaged: false, // User-linked, not coach-managed
        concept2UserId: auth.c2UserId,
      },
    });

    logger.info('Created athlete profile', { athleteId: athlete.id, userId });
  }

  // Get valid access token
  const accessToken = await getValidToken(userId);

  // Fetch workouts since last sync (or last 30 days)
  const fromDate = auth.lastSyncedAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Fetch C2 user profile to get user ID (needed for fetchResults)
  const { fetchUserProfile } = await import('./concept2Service.js');
  const profile = await fetchUserProfile(accessToken);

  // Fetch results from C2 API
  const { results } = await fetchResults(accessToken, profile.id, { page: 1, perPage: 100 });

  // Filter results newer than fromDate
  const newResults = results.filter((r) => new Date(r.date) > fromDate);

  let workoutsCreated = 0;
  let ergTestsCreated = 0;
  let totalSplits = 0;

  for (const result of newResults) {
    // Check if this workout already exists (dedup by c2LogbookId)
    const existing = await prisma.workout.findUnique({
      where: { c2LogbookId: String(result.id) },
    });

    if (existing) {
      continue; // Skip duplicates
    }

    // Extract machine type
    const machineType = mapC2MachineType(result.type || result.workout_type);

    // Extract summary metrics
    const avgPace = result.stroke_data?.avg_pace || null;
    const avgWatts = result.stroke_data?.avg_watts || null;
    const avgHeartRate = result.heart_rate?.average || null;

    // Extract splits
    const splits = extractSplits(result);

    // Create Workout record with splits in a transaction
    await prisma.$transaction(async (tx) => {
      const workout = await tx.workout.create({
        data: {
          athleteId: athlete.id,
          teamId,
          source: 'concept2_sync',
          c2LogbookId: String(result.id),
          date: new Date(result.date),
          distanceM: result.distance,
          durationSeconds: result.time ? result.time / 10 : null,
          strokeRate: result.stroke_rate,
          calories: result.calories_total,
          dragFactor: result.drag_factor,
          machineType,
          avgPace,
          avgWatts,
          avgHeartRate,
          rawData: result,
        },
      });

      // Create WorkoutSplit records
      if (splits.length > 0) {
        await tx.workoutSplit.createMany({
          data: splits.map((split) => ({
            workoutId: workout.id,
            ...split,
          })),
        });
        totalSplits += splits.length;
      }

      workoutsCreated++;
    });

    // Also create ErgTest for standard test distances
    const testType = determineTestType(result.distance);
    if (testType) {
      const timeSeconds = result.time ? result.time / 10 : 0;
      const splitSeconds =
        timeSeconds > 0 && result.distance > 0 ? timeSeconds / (result.distance / 500) : null;

      await prisma.ergTest.create({
        data: {
          athleteId: athlete.id,
          teamId,
          testType,
          testDate: new Date(result.date),
          distanceM: result.distance,
          timeSeconds,
          splitSeconds,
          watts: result.stroke_data?.avg_watts || null,
          strokeRate: result.stroke_rate,
        },
      });

      ergTestsCreated++;
    }
  }

  // Update last synced timestamp
  await prisma.concept2Auth.update({
    where: { userId },
    data: { lastSyncedAt: new Date() },
  });

  return {
    totalFetched: newResults.length,
    workoutsCreated,
    ergTestsCreated,
    splits: totalSplits,
  };
}

/**
 * Sync a single result (for webhook events)
 *
 * @param {string} userId - User ID (from C2 auth lookup)
 * @param {number} resultId - C2 result ID
 * @returns {Promise<{success: boolean}>}
 */
export async function syncSingleResult(userId, resultId) {
  const auth = await prisma.concept2Auth.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!auth || !auth.syncEnabled) {
    logger.info('Sync disabled or no auth', { userId });
    return { success: false, ignored: true };
  }

  // Find athlete record
  const athlete = await prisma.athlete.findFirst({
    where: {
      concept2UserId: auth.c2UserId,
    },
  });

  if (!athlete) {
    logger.warn('No athlete found for C2 user', { c2UserId: auth.c2UserId });
    return { success: false, error: 'No athlete found' };
  }

  // Get valid access token
  const accessToken = await getValidToken(userId);

  // Fetch the result with strokes
  const result = await fetchResultWithStrokes(accessToken, auth.c2UserId, resultId);

  // Use fetchAndStoreResult to upsert
  await fetchAndStoreResult(accessToken, auth.c2UserId, resultId, athlete.id, athlete.teamId);

  return { success: true };
}

/**
 * Fetch and store a single result (low-level function)
 *
 * @param {string} accessToken - Valid C2 access token
 * @param {string} c2UserId - C2 user ID
 * @param {number} resultId - C2 result ID
 * @param {string} athleteId - RowLab athlete ID
 * @param {string} teamId - Team ID
 */
export async function fetchAndStoreResult(accessToken, c2UserId, resultId, athleteId, teamId) {
  // Fetch result from C2 API
  const result = await fetchResultWithStrokes(accessToken, c2UserId, resultId);

  // Extract machine type and metrics
  const machineType = mapC2MachineType(result.type || result.workout_type);
  const avgPace = result.stroke_data?.avg_pace || null;
  const avgWatts = result.stroke_data?.avg_watts || null;
  const avgHeartRate = result.heart_rate?.average || null;

  // Extract splits
  const splits = extractSplits(result);

  // Upsert Workout + WorkoutSplits atomically
  await prisma.$transaction(async (tx) => {
    // Upsert workout
    const workout = await tx.workout.upsert({
      where: { c2LogbookId: String(resultId) },
      create: {
        athleteId,
        teamId,
        source: 'concept2_sync',
        c2LogbookId: String(resultId),
        date: new Date(result.date),
        distanceM: result.distance,
        durationSeconds: result.time ? result.time / 10 : null,
        strokeRate: result.stroke_rate,
        calories: result.calories_total,
        dragFactor: result.drag_factor,
        machineType,
        avgPace,
        avgWatts,
        avgHeartRate,
        rawData: result,
      },
      update: {
        distanceM: result.distance,
        durationSeconds: result.time ? result.time / 10 : null,
        strokeRate: result.stroke_rate,
        calories: result.calories_total,
        dragFactor: result.drag_factor,
        machineType,
        avgPace,
        avgWatts,
        avgHeartRate,
        rawData: result,
      },
    });

    // Delete existing splits and recreate (simpler than diff)
    await tx.workoutSplit.deleteMany({
      where: { workoutId: workout.id },
    });

    if (splits.length > 0) {
      await tx.workoutSplit.createMany({
        data: splits.map((split) => ({
          workoutId: workout.id,
          ...split,
        })),
      });
    }
  });
}

/**
 * Determine test type from distance
 * @param {number} distance - Distance in meters
 * @returns {string|null} - Test type or null if not a standard test
 */
function determineTestType(distance) {
  if (distance === 2000) return '2k';
  if (distance === 6000) return '6k';
  if (distance === 500) return '500m';
  if (distance === 1000) return '1k';
  return null;
}

/**
 * Browse C2 logbook for historical import
 * Returns paginated list of workouts with import status
 *
 * @param {string} userId - User ID
 * @param {object} options - Browse options { page, perPage, fromDate, toDate }
 * @returns {Promise<{results: Array, pagination: object}>}
 */
export async function browseC2Logbook(userId, options = {}) {
  const { page = 1, perPage = 50, fromDate, toDate } = options;

  // Get valid access token
  const accessToken = await getValidToken(userId);

  // Get C2 user profile
  const { fetchUserProfile } = await import('./concept2Service.js');
  const profile = await fetchUserProfile(accessToken);

  // Fetch results from C2 API
  const { results, pagination } = await fetchResults(accessToken, profile.id, { page, perPage });

  // Filter by date range if provided
  let filteredResults = results;
  if (fromDate || toDate) {
    filteredResults = results.filter((r) => {
      const resultDate = new Date(r.date);
      if (fromDate && resultDate < new Date(fromDate)) return false;
      if (toDate && resultDate > new Date(toDate)) return false;
      return true;
    });
  }

  // Check which workouts are already imported
  const c2LogbookIds = filteredResults.map((r) => String(r.id));
  const existingWorkouts = await prisma.workout.findMany({
    where: {
      c2LogbookId: { in: c2LogbookIds },
    },
    select: { c2LogbookId: true },
  });

  const existingIds = new Set(existingWorkouts.map((w) => w.c2LogbookId));

  // Annotate results with import status
  const annotatedResults = filteredResults.map((r) => ({
    id: r.id,
    date: r.date,
    distance: r.distance,
    time: r.time ? r.time / 10 : null, // Convert to seconds
    type: mapC2MachineType(r.type || r.workout_type),
    machineType: mapC2MachineType(r.type || r.workout_type),
    alreadyImported: existingIds.has(String(r.id)),
  }));

  return {
    results: annotatedResults,
    pagination,
  };
}

/**
 * Historical import - import workouts by date range or specific IDs
 * Processes in batches to avoid memory bloat
 *
 * @param {string} userId - User ID
 * @param {string} teamId - Team ID
 * @param {object} options - Import options { fromDate, toDate, resultIds }
 * @returns {Promise<{imported: number, skipped: number, total: number}>}
 */
export async function historicalImport(userId, teamId, options = {}) {
  const { fromDate, toDate, resultIds } = options;

  if (!resultIds && (!fromDate || !toDate)) {
    throw new Error('Must provide either resultIds or date range (fromDate + toDate)');
  }

  // Get user's C2 auth
  const auth = await prisma.concept2Auth.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!auth) {
    throw new Error('No Concept2 connection');
  }

  // Find or create athlete record
  let athlete = await prisma.athlete.findFirst({
    where: { userId, teamId },
  });

  // Link existing athlete to C2 account if needed
  if (athlete && !athlete.concept2UserId && auth.c2UserId) {
    athlete = await prisma.athlete.update({
      where: { id: athlete.id },
      data: { concept2UserId: auth.c2UserId },
    });
  }

  // Auto-create athlete profile if needed
  if (!athlete) {
    const user = auth.user;
    const nameParts = user.email.split('@')[0].split(/[._-]/);
    const firstName = nameParts[0]
      ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1)
      : 'User';
    const lastName = nameParts[1]
      ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1)
      : user.email.split('@')[0];

    athlete = await prisma.athlete.create({
      data: {
        teamId,
        userId,
        firstName,
        lastName,
        email: user.email,
        isManaged: false,
        concept2UserId: auth.c2UserId,
      },
    });
  }

  // Get valid access token
  const accessToken = await getValidToken(userId);
  const { fetchUserProfile } = await import('./concept2Service.js');
  const profile = await fetchUserProfile(accessToken);

  let imported = 0;
  let skipped = 0;
  let total = 0;

  // Mode 1: Import specific result IDs (browse & select)
  if (resultIds && Array.isArray(resultIds)) {
    for (const resultId of resultIds) {
      total++;

      // Check if already imported
      const existing = await prisma.workout.findUnique({
        where: { c2LogbookId: String(resultId) },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Fetch and store this result
      try {
        await fetchAndStoreResult(accessToken, profile.id, resultId, athlete.id, teamId);
        imported++;
      } catch (error) {
        logger.error('Failed to import result', { resultId, error: error.message });
        skipped++;
      }
    }

    return { imported, skipped, total };
  }

  // Mode 2: Import by date range
  // Fetch all pages in date range, process in batches of 50
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const { results, pagination } = await fetchResults(accessToken, profile.id, {
      page: currentPage,
      perPage: 50,
    });

    // Filter by date range
    const filteredResults = results.filter((r) => {
      const resultDate = new Date(r.date);
      if (fromDate && resultDate < new Date(fromDate)) return false;
      if (toDate && resultDate > new Date(toDate)) return false;
      return true;
    });

    // Process batch
    for (const result of filteredResults) {
      total++;

      // Check if already imported (dedup)
      const existing = await prisma.workout.findUnique({
        where: { c2LogbookId: String(result.id) },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Extract machine type and metrics
      const machineType = mapC2MachineType(result.type || result.workout_type);
      const avgPace = result.stroke_data?.avg_pace || null;
      const avgWatts = result.stroke_data?.avg_watts || null;
      const avgHeartRate = result.heart_rate?.average || null;

      // Extract splits
      const splits = extractSplits(result);

      // Create Workout + WorkoutSplits atomically
      await prisma.$transaction(async (tx) => {
        const workout = await tx.workout.create({
          data: {
            athleteId: athlete.id,
            teamId,
            source: 'concept2_sync',
            c2LogbookId: String(result.id),
            date: new Date(result.date),
            distanceM: result.distance,
            durationSeconds: result.time ? result.time / 10 : null,
            strokeRate: result.stroke_rate,
            calories: result.calories_total,
            dragFactor: result.drag_factor,
            machineType,
            avgPace,
            avgWatts,
            avgHeartRate,
            rawData: result,
          },
        });

        if (splits.length > 0) {
          await tx.workoutSplit.createMany({
            data: splits.map((split) => ({ workoutId: workout.id, ...split })),
          });
        }
      });

      imported++;
    }

    // Check for more pages
    hasMore = pagination.current_page < pagination.total_pages;
    currentPage++;
  }

  return { imported, skipped, total };
}

export default {
  syncUserWorkouts,
  syncSingleResult,
  fetchAndStoreResult,
  mapC2MachineType,
  extractSplits,
  browseC2Logbook,
  historicalImport,
};

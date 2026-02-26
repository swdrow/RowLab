/**
 * Concept2 Sync Service
 *
 * Enhanced sync pipeline that extracts and stores workout splits and machine type metadata from C2 API.
 * Handles manual sync, webhook events, and background daily sync with split-level data.
 */

import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';
import { fetchResults, fetchResultWithStrokes, getValidToken } from './concept2Service.js';
import { convertWorkoutToErgTest } from './workoutToErgTest.js';

/**
 * Map C2 API machine type values to our enum
 * @param {number|string} c2Type - C2 type value
 * @returns {string} - Mapped machine type
 */
export function mapC2MachineType(c2Type) {
  // C2 API type values:
  // Numeric: 0=rower, 1=skierg, 2=bikerg
  // String: "rower", "slides", "dynamic", "skierg", "bike", "bikerg",
  //         "water", "paddle", "snow", "rollerski", "multierg"
  if (c2Type === 0 || c2Type === 'rower' || c2Type === 'slides' || c2Type === 'dynamic')
    return 'rower';
  if (c2Type === 1 || c2Type === 'skierg') return 'skierg';
  if (c2Type === 2 || c2Type === 'bikerg' || c2Type === 'bike') return 'bikerg';
  if (c2Type === 'water' || c2Type === 'paddle') return 'water';
  if (c2Type === 'snow' || c2Type === 'rollerski') return 'snow';
  if (c2Type === 'multierg') return 'multierg';

  // Default to rower (most common)
  return 'rower';
}

/**
 * Determine workout type from machine type.
 * Water/snow workouts are 'on_water', everything else is 'erg'.
 * @param {string} machineType - Mapped machine type from mapC2MachineType()
 * @returns {string} - 'on_water' or 'erg'
 */
export function getWorkoutType(machineType) {
  if (machineType === 'water' || machineType === 'snow') return 'on_water';
  return 'erg';
}

/**
 * Calculate pace in tenths of seconds per 500m from time and distance
 * C2 stores time in tenths of seconds; this returns tenths per 500m.
 * @param {number} timeTenths - Time in tenths of seconds
 * @param {number} distanceM - Distance in meters
 * @returns {number|null} - Pace in tenths of seconds per 500m, or null
 */
export function calculatePace(timeTenths, distanceM) {
  if (!timeTenths || !distanceM || distanceM <= 0) return null;
  return Math.round(timeTenths / (distanceM / 500));
}

/**
 * Calculate watts from time and distance using the C2 physics formula.
 * watts = k / (seconds_per_meter)^3
 * Rower/SkiErg/Slides: k = 2.80 (pace per 500m)
 * BikeErg: k = 0.35 (pace per 1000m, same time at same watts)
 * @param {number} timeTenths - Time in tenths of seconds
 * @param {number} distanceM - Distance in meters
 * @param {string} [machineType] - C2 type field (e.g., 'rower', 'bike', 'slides')
 * @returns {number|null} - Watts, or null
 */
export function calculateWatts(timeTenths, distanceM, machineType) {
  if (!timeTenths || !distanceM || distanceM <= 0) return null;
  const k = machineType === 'bike' || machineType === 'bikerg' ? 0.35 : 2.8;
  const timeSeconds = timeTenths / 10;
  const pacePerMeter = timeSeconds / distanceM;
  return Math.round(k / Math.pow(pacePerMeter, 3));
}

/**
 * Extract splits from C2 result data.
 * C2 API nests data under result.workout: interval workouts use "intervals",
 * non-interval workouts (JustRow, FixedTimeSplits, etc.) use "splits".
 * @param {object} c2Result - C2 API result object
 * @returns {Array<object>} - Array of split objects
 */
export function extractSplits(c2Result) {
  const workout = c2Result.workout || {};
  const machineType = c2Result.type || null;
  // Prefer intervals (for interval workouts), fall back to splits (for steady-state)
  const segments = workout.intervals || workout.splits || [];

  return segments.map((segment, index) => {
    const timeTenths = segment.time || null;
    const distanceM = segment.distance || null;
    const timeSeconds = timeTenths ? timeTenths / 10 : null;

    return {
      splitNumber: index + 1,
      distanceM,
      timeSeconds,
      pace: calculatePace(timeTenths, distanceM),
      watts: calculateWatts(timeTenths, distanceM, machineType),
      strokeRate: segment.stroke_rate || null,
      heartRate: segment.heart_rate?.average || null,
      dragFactor: null, // Not available per-segment in C2 API
      calories: segment.calories_total || null,
    };
  });
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

    // Compute summary metrics from time/distance (C2 doesn't provide them directly)
    const avgPace = calculatePace(result.time, result.distance);
    const avgWatts = calculateWatts(result.time, result.distance, result.type);
    const avgHeartRate = result.heart_rate?.average || null;

    // Extract splits from workout.intervals or workout.splits
    const splits = extractSplits(result);

    // Create Workout record with splits in a transaction
    await prisma.$transaction(async (tx) => {
      const workout = await tx.workout.create({
        data: {
          athleteId: athlete.id,
          teamId,
          userId,
          source: 'concept2_sync',
          type: getWorkoutType(machineType),
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

      // Auto-create ErgTest for standard test distances
      try {
        const ergTest = await convertWorkoutToErgTest(workout, teamId);
        if (ergTest) {
          ergTestsCreated++;
        }
      } catch (error) {
        logger.error('Failed to create ErgTest (non-blocking)', {
          workoutId: workout.id,
          error: error.message,
        });
      }
    });
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
  await fetchAndStoreResult(
    accessToken,
    auth.c2UserId,
    resultId,
    athlete.id,
    athlete.teamId,
    userId
  );

  return { success: true };
}

/**
 * Fetch and store a single result (low-level function)
 *
 * @param {string} accessToken - Valid C2 access token
 * @param {string} c2UserId - C2 user ID
 * @param {number} resultId - C2 result ID
 * @param {string} athleteId - oarbit athlete ID
 * @param {string} teamId - Team ID
 * @param {string} [userId] - User ID for user-scoped ownership
 */
export async function fetchAndStoreResult(
  accessToken,
  c2UserId,
  resultId,
  athleteId,
  teamId,
  userId
) {
  // Fetch result from C2 API
  const result = await fetchResultWithStrokes(accessToken, c2UserId, resultId);

  // Extract machine type and compute metrics
  const machineType = mapC2MachineType(result.type || result.workout_type);
  const avgPace = calculatePace(result.time, result.distance);
  const avgWatts = calculateWatts(result.time, result.distance, result.type);
  const avgHeartRate = result.heart_rate?.average || null;

  // Extract splits from workout.intervals or workout.splits
  const splits = extractSplits(result);

  // Upsert Workout + WorkoutSplits atomically
  const workout = await prisma.$transaction(async (tx) => {
    // Upsert workout
    const workout = await tx.workout.upsert({
      where: { c2LogbookId: String(resultId) },
      create: {
        athleteId,
        teamId,
        userId,
        source: 'concept2_sync',
        type: getWorkoutType(machineType),
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
        type: getWorkoutType(machineType),
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

    return workout;
  });

  // Auto-create ErgTest for standard test distances (non-blocking)
  try {
    await convertWorkoutToErgTest(workout, teamId);
  } catch (error) {
    logger.error('Failed to create ErgTest (non-blocking)', {
      workoutId: workout.id,
      error: error.message,
    });
  }

  // Run workout inference (non-blocking - errors logged but don't fail sync)
  try {
    const { inferWorkoutPattern } = await import('./workoutInferenceService.js');

    // Fetch splits from DB
    const workoutSplits = await prisma.workoutSplit.findMany({
      where: { workoutId: workout.id },
      orderBy: { splitNumber: 'asc' },
    });

    // Run inference
    const inference = inferWorkoutPattern(workout, workoutSplits);

    // Update workout if patterns detected
    if (inference) {
      await prisma.workout.update({
        where: { id: workout.id },
        data: { inferredPattern: inference },
      });
    }
  } catch (err) {
    logger.error('Workout inference failed (non-blocking)', {
      error: err.message,
      workoutId: workout.id,
    });
  }
}

/**
 * Determine test type from distance using tolerance ranges.
 * Real C2 workouts may end slightly off from exact distances due to
 * stroke timing, so we use +/- tolerance for matching.
 *
 * @param {number} distance - Distance in meters
 * @returns {string|null} - Test type or null if not a standard test
 */
function determineTestType(distance) {
  if (distance >= 475 && distance <= 525) return '500m';
  if (distance >= 950 && distance <= 1050) return '1k';
  if (distance >= 1950 && distance <= 2050) return '2k';
  if (distance >= 4950 && distance <= 5050) return '5k';
  if (distance >= 5900 && distance <= 6100) return '6k';
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
        await fetchAndStoreResult(accessToken, profile.id, resultId, athlete.id, teamId, userId);
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

      // Extract machine type and compute metrics
      const machineType = mapC2MachineType(result.type || result.workout_type);
      const avgPace = calculatePace(result.time, result.distance);
      const avgWatts = calculateWatts(result.time, result.distance, result.type);
      const avgHeartRate = result.heart_rate?.average || null;

      // Extract splits from workout.intervals or workout.splits
      const splits = extractSplits(result);

      // Create Workout + WorkoutSplits atomically
      const workout = await prisma.$transaction(async (tx) => {
        const workout = await tx.workout.create({
          data: {
            athleteId: athlete.id,
            teamId,
            userId,
            source: 'concept2_sync',
            type: getWorkoutType(machineType),
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

        return workout;
      });

      // Auto-create ErgTest for standard test distances (non-blocking)
      try {
        await convertWorkoutToErgTest(workout, teamId);
      } catch (error) {
        logger.error('Failed to create ErgTest (non-blocking)', {
          workoutId: workout.id,
          error: error.message,
        });
      }

      imported++;
    }

    // Check for more pages
    hasMore = pagination.current_page < pagination.total_pages;
    currentPage++;
  }

  return { imported, skipped, total };
}

/**
 * Coach sync - sync coach's C2 logbook with auto-match to roster athletes
 * Auto-matches workouts to athletes by concept2UserId
 * Athlete-owned connections take priority (dedup: athlete wins)
 *
 * @param {string} userId - Coach's user ID
 * @param {string} teamId - Team ID
 * @returns {Promise<{totalFetched: number, matched: number, unmatched: number, skippedAthleteOwned: number}>}
 */
export async function syncCoachWorkouts(userId, teamId) {
  // Get coach's C2 auth
  const auth = await prisma.concept2Auth.findUnique({
    where: { userId },
  });

  if (!auth) {
    throw new Error('No Concept2 connection');
  }

  // Get valid access token
  const accessToken = await getValidToken(userId);
  const { fetchUserProfile } = await import('./concept2Service.js');
  const profile = await fetchUserProfile(accessToken);

  // Fetch workouts since last sync (or last 30 days)
  const fromDate = auth.lastSyncedAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const { results } = await fetchResults(accessToken, profile.id, { page: 1, perPage: 100 });

  // Filter results newer than fromDate
  const newResults = results.filter((r) => new Date(r.date) > fromDate);

  // Get all athletes in the team with their C2 user IDs
  const teamAthletes = await prisma.athlete.findMany({
    where: { teamId },
    select: {
      id: true,
      concept2UserId: true,
      userId: true,
      firstName: true,
      lastName: true,
    },
  });

  // Get all athlete-owned C2 connections (to check for priority)
  const athleteOwnedConnections = await prisma.concept2Auth.findMany({
    where: {
      userId: { in: teamAthletes.filter((a) => a.userId).map((a) => a.userId) },
    },
    select: { c2UserId: true, userId: true },
  });

  const athleteOwnedC2Ids = new Set(athleteOwnedConnections.map((a) => a.c2UserId));

  let matched = 0;
  let unmatched = 0;
  let skippedAthleteOwned = 0;

  for (const result of newResults) {
    // Check if already imported
    const existing = await prisma.workout.findUnique({
      where: { c2LogbookId: String(result.id) },
    });

    if (existing) {
      continue; // Skip duplicates
    }

    // Try to match to athlete by C2 user ID from result
    // Note: C2 API result includes user_id field indicating which C2 account uploaded it
    const resultC2UserId = String(result.user_id || profile.id);

    // Check if this C2 user ID has an athlete-owned connection (athlete wins)
    if (athleteOwnedC2Ids.has(resultC2UserId)) {
      skippedAthleteOwned++;
      logger.info('Skipping coach-synced workout (athlete-owned wins)', {
        c2LogbookId: result.id,
        c2UserId: resultC2UserId,
      });
      continue;
    }

    // Find athlete by C2 user ID
    const matchedAthlete = teamAthletes.find((a) => a.concept2UserId === resultC2UserId);

    let athleteId = matchedAthlete?.id || null;
    const athleteUserId = matchedAthlete?.userId || null;

    // Extract machine type and compute metrics
    const machineType = mapC2MachineType(result.type || result.workout_type);
    const avgPace = calculatePace(result.time, result.distance);
    const avgWatts = calculateWatts(result.time, result.distance, result.type);
    const avgHeartRate = result.heart_rate?.average || null;

    // Extract splits from workout.intervals or workout.splits
    const splits = extractSplits(result);

    // Create Workout + WorkoutSplits atomically
    const workout = await prisma.$transaction(async (tx) => {
      const workout = await tx.workout.create({
        data: {
          athleteId, // null if unmatched
          teamId,
          userId: athleteUserId, // null if unmatched
          source: 'concept2_sync',
          type: getWorkoutType(machineType),
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

      return workout;
    });

    // Auto-create ErgTest for standard test distances (non-blocking)
    // Only if workout was matched to an athlete
    if (athleteId) {
      try {
        await convertWorkoutToErgTest(workout, teamId);
      } catch (error) {
        logger.error('Failed to create ErgTest (non-blocking)', {
          workoutId: workout.id,
          error: error.message,
        });
      }
    }

    if (athleteId) {
      matched++;
    } else {
      unmatched++;
      logger.info('Unmatched workout stored for manual assignment', {
        c2LogbookId: result.id,
        resultC2UserId,
      });
    }
  }

  // Update last synced timestamp
  await prisma.concept2Auth.update({
    where: { userId },
    data: { lastSyncedAt: new Date() },
  });

  return {
    totalFetched: newResults.length,
    matched,
    unmatched,
    skippedAthleteOwned,
  };
}

/**
 * Get unmatched workouts (athleteId null) for coach to manually resolve
 *
 * @param {string} teamId - Team ID
 * @returns {Promise<Array<object>>}
 */
export async function getUnmatchedWorkouts(teamId) {
  const unmatched = await prisma.workout.findMany({
    where: {
      teamId,
      source: 'concept2_sync',
      athleteId: null,
    },
    select: {
      id: true,
      c2LogbookId: true,
      date: true,
      distanceM: true,
      durationSeconds: true,
      machineType: true,
      avgPace: true,
      avgWatts: true,
      rawData: true,
    },
    orderBy: { date: 'desc' },
  });

  return unmatched;
}

/**
 * Assign unmatched workout to athlete
 *
 * @param {string} workoutId - Workout ID
 * @param {string} athleteId - Athlete ID
 * @param {string} teamId - Team ID for verification
 * @returns {Promise<object>}
 */
export async function assignWorkoutToAthlete(workoutId, athleteId, teamId) {
  // Verify workout belongs to team
  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
  });

  if (!workout || workout.teamId !== teamId) {
    throw new Error('Workout not found in team');
  }

  // Verify athlete belongs to team
  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
  });

  if (!athlete || athlete.teamId !== teamId) {
    throw new Error('Athlete not found in team');
  }

  // Update workout with athlete assignment
  const updated = await prisma.workout.update({
    where: { id: workoutId },
    data: { athleteId },
    include: {
      athlete: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  logger.info('Workout assigned to athlete', {
    workoutId,
    athleteId,
    athleteName: `${athlete.firstName} ${athlete.lastName}`,
  });

  return updated;
}

export default {
  syncUserWorkouts,
  syncSingleResult,
  fetchAndStoreResult,
  mapC2MachineType,
  getWorkoutType,
  extractSplits,
  browseC2Logbook,
  historicalImport,
  syncCoachWorkouts,
  getUnmatchedWorkouts,
  assignWorkoutToAthlete,
};

import { prisma } from '../db/connection.js';
import { mapSourceForApi } from '../middleware/rfc7807.js';

// ============================================
// Standard C2 distances for PR tracking
// ============================================
const STANDARD_DISTANCES = ['500m', '1k', '2k', '5k', '6k', '10k', 'hm', 'fm'];

// BikeErg benchmark distances are 2x RowErg distances (a 2k row = 4k bike)
const BIKERG_DISTANCE_METERS = {
  '500m': 1000,
  '1k': 2000,
  '2k': 4000,
  '5k': 10000,
  '6k': 12000,
  '10k': 20000,
  hm: 42195,
  fm: 84390,
};

// ============================================
// Helpers
// ============================================

/**
 * Convert a range string to a Date filter for Prisma.
 * @param {string} range - '7d' | '30d' | '90d' | 'all'
 * @returns {{ gte: Date } | undefined}
 */
function getDateFilter(range) {
  if (!range || range === 'all') return undefined;

  const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[range];
  if (!days) return undefined;

  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return { gte: d };
}

/**
 * Get all athlete IDs linked to a user.
 * A user may have multiple athlete records across different teams.
 * @param {string} userId
 * @returns {Promise<string[]>}
 */
async function getAllUserAthleteIds(userId) {
  const athletes = await prisma.athlete.findMany({
    where: { userId },
    select: { id: true },
  });
  return athletes.map((a) => a.id);
}

/**
 * Build a Prisma WHERE clause that captures all workouts belonging to a user.
 *
 * Workouts can belong to a user in two ways:
 * 1. workout.userId === userId (directly linked)
 * 2. workout.athleteId IN athleteIds AND workout.userId IS NULL
 *    (legacy data linked via athlete record before userId backfill)
 *
 * @param {string} userId
 * @param {string[]} athleteIds
 * @returns {object} Prisma WHERE clause
 */
function buildUserWorkoutWhere(userId, athleteIds) {
  return {
    OR: [
      { userId },
      ...(athleteIds.length > 0 ? [{ athleteId: { in: athleteIds }, userId: null }] : []),
    ],
  };
}

/**
 * Calculate current and longest streak from an array of workout dates.
 *
 * Current streak: consecutive calendar days (UTC) backward from today or yesterday.
 *   - If most recent workout is today -> start counting from today
 *   - If most recent workout is yesterday -> start from yesterday
 *   - If most recent workout is 2+ days ago -> current streak = 0
 *
 * Longest streak: scan all unique dates for the longest run of consecutive days.
 *
 * @param {Date[]} dates - Array of workout Date objects
 * @returns {{ current: number, longest: number, lastActivityDate: string | null }}
 */
function calculateStreak(dates) {
  if (dates.length === 0) {
    return { current: 0, longest: 0, lastActivityDate: null };
  }

  // Extract unique calendar days in UTC, sorted descending
  const uniqueDays = [...new Set(dates.map((d) => d.toISOString().split('T')[0]))].sort((a, b) =>
    a > b ? -1 : 1
  );

  const lastActivityDate = uniqueDays[0];

  // Helper: get date string for N days ago from today (UTC)
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Current streak
  let current = 0;
  if (uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr) {
    // Start counting from the most recent day backward
    current = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const prevDate = new Date(uniqueDays[i - 1] + 'T00:00:00Z');
      const currDate = new Date(uniqueDays[i] + 'T00:00:00Z');
      const diffMs = prevDate.getTime() - currDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        current++;
      } else {
        break;
      }
    }
  }

  // Longest streak (scan ascending)
  const ascending = [...uniqueDays].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < ascending.length; i++) {
    const prevDate = new Date(ascending[i - 1] + 'T00:00:00Z');
    const currDate = new Date(ascending[i] + 'T00:00:00Z');
    const diffMs = currDate.getTime() - prevDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  return { current, longest, lastActivityDate };
}

// ============================================
// getUserWorkoutById
// ============================================

/**
 * Get a single workout by ID, owned by the given user.
 * Includes splits (ordered by splitNumber asc), telemetry, and adjacent workout IDs.
 *
 * @param {string} userId
 * @param {string} workoutId
 * @returns {Promise<object>}
 */
export async function getUserWorkoutById(userId, workoutId) {
  const athleteIds = await getAllUserAthleteIds(userId);
  const baseWhere = buildUserWorkoutWhere(userId, athleteIds);

  const workout = await prisma.workout.findFirst({
    where: { AND: [baseWhere, { id: workoutId }] },
    include: {
      splits: { orderBy: { splitNumber: 'asc' } },
      telemetry: true,
    },
  });

  if (!workout) {
    throw new ApiError(404, 'not-found', 'Workout not found');
  }

  // Get adjacent workout IDs for prev/next navigation
  const [prev, next] = await Promise.all([
    prisma.workout.findFirst({
      where: { AND: [baseWhere, { date: { lt: workout.date } }] },
      orderBy: { date: 'desc' },
      select: { id: true },
    }),
    prisma.workout.findFirst({
      where: { AND: [baseWhere, { date: { gt: workout.date } }] },
      orderBy: { date: 'asc' },
      select: { id: true },
    }),
  ]);

  // Format telemetry
  const telemetry = workout.telemetry
    ? {
        timeSeriesS: workout.telemetry.timeSeriesS.map(Number),
        wattsSeries: workout.telemetry.wattsSeries,
        heartRateSeries: workout.telemetry.heartRateSeries,
        strokeRateSeries: workout.telemetry.strokeRateSeries,
        forceCurves: workout.telemetry.forceCurves,
      }
    : null;

  return {
    id: workout.id,
    date: workout.date.toISOString(),
    source: mapSourceForApi(workout.source),
    type: workout.type || null,
    machineType: workout.machineType || null,
    distanceM: workout.distanceM,
    durationSeconds: workout.durationSeconds ? Number(workout.durationSeconds) : null,
    avgPace: workout.avgPace ? Number(workout.avgPace) : null,
    avgWatts: workout.avgWatts,
    strokeRate: workout.strokeRate,
    avgHeartRate: workout.avgHeartRate,
    teamId: workout.teamId,
    notes: workout.notes || null,
    c2LogbookId: workout.c2LogbookId || null,
    workoutType: workout.rawData?.workout_type || null,
    splits: (workout.splits || []).map((s) => ({
      splitNumber: s.splitNumber,
      distanceM: s.distanceM,
      timeSeconds: s.timeSeconds ? Number(s.timeSeconds) : null,
      pace: s.pace ? Number(s.pace) : null,
      watts: s.watts,
      strokeRate: s.strokeRate,
      heartRate: s.heartRate,
    })),
    telemetry,
    createdAt: workout.createdAt.toISOString(),
    prevWorkoutId: prev?.id || null,
    nextWorkoutId: next?.id || null,
  };
}

// ============================================
// createUserWorkout
// ============================================

/**
 * Create a manual workout owned by the authenticated user.
 *
 * @param {string} userId
 * @param {object} data
 * @param {string} data.type - Workout type (required)
 * @param {string} [data.machineType] - Machine type
 * @param {string} data.date - ISO date string (required)
 * @param {number} [data.distanceM] - Distance in meters
 * @param {number} [data.durationSeconds] - Duration in seconds
 * @param {number} [data.avgPace] - Average pace in tenths of seconds per 500m
 * @param {number} [data.avgWatts] - Average watts
 * @param {string} [data.notes] - User notes
 * @returns {Promise<object>}
 */
export async function createUserWorkout(userId, data) {
  const { type, machineType, date, distanceM, durationSeconds, avgPace, avgWatts, notes } = data;

  if (!type || !date) {
    throw new ApiError(400, 'missing-fields', 'Type and date are required');
  }

  const workout = await prisma.workout.create({
    data: {
      userId,
      source: 'manual',
      type,
      machineType: machineType || null,
      date: new Date(date),
      distanceM: distanceM || null,
      durationSeconds: durationSeconds || null,
      avgPace: avgPace || null,
      avgWatts: avgWatts || null,
      notes: notes || null,
    },
  });

  return {
    id: workout.id,
    date: workout.date.toISOString(),
    source: mapSourceForApi(workout.source),
    type: workout.type || null,
    machineType: workout.machineType || null,
    distanceM: workout.distanceM,
    durationSeconds: workout.durationSeconds ? Number(workout.durationSeconds) : null,
    avgPace: workout.avgPace ? Number(workout.avgPace) : null,
    avgWatts: workout.avgWatts,
    strokeRate: workout.strokeRate,
    avgHeartRate: workout.avgHeartRate,
    teamId: workout.teamId,
    notes: workout.notes || null,
    splits: [],
    createdAt: workout.createdAt.toISOString(),
  };
}

// ============================================
// updateUserWorkout
// ============================================

/**
 * Update a workout owned by the authenticated user.
 * Only provided fields are updated.
 *
 * @param {string} userId
 * @param {string} workoutId
 * @param {object} data - Fields to update
 * @returns {Promise<object>}
 */
export async function updateUserWorkout(userId, workoutId, data) {
  const athleteIds = await getAllUserAthleteIds(userId);
  const baseWhere = buildUserWorkoutWhere(userId, athleteIds);

  const existing = await prisma.workout.findFirst({
    where: { AND: [baseWhere, { id: workoutId }] },
  });

  if (!existing) {
    throw new ApiError(404, 'not-found', 'Workout not found');
  }

  // Build update object from provided fields only
  const updateData = {};
  const allowedFields = [
    'distanceM',
    'durationSeconds',
    'avgPace',
    'avgWatts',
    'notes',
    'type',
    'machineType',
    'date',
  ];
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = field === 'date' ? new Date(data[field]) : data[field];
    }
  }

  const workout = await prisma.workout.update({
    where: { id: workoutId },
    data: updateData,
    include: {
      splits: { orderBy: { splitNumber: 'asc' } },
    },
  });

  return {
    id: workout.id,
    date: workout.date.toISOString(),
    source: mapSourceForApi(workout.source),
    type: workout.type || null,
    machineType: workout.machineType || null,
    distanceM: workout.distanceM,
    durationSeconds: workout.durationSeconds ? Number(workout.durationSeconds) : null,
    avgPace: workout.avgPace ? Number(workout.avgPace) : null,
    avgWatts: workout.avgWatts,
    strokeRate: workout.strokeRate,
    avgHeartRate: workout.avgHeartRate,
    teamId: workout.teamId,
    notes: workout.notes || null,
    splits: (workout.splits || []).map((s) => ({
      splitNumber: s.splitNumber,
      distanceM: s.distanceM,
      timeSeconds: s.timeSeconds ? Number(s.timeSeconds) : null,
      pace: s.pace ? Number(s.pace) : null,
      watts: s.watts,
      strokeRate: s.strokeRate,
      heartRate: s.heartRate,
    })),
    createdAt: workout.createdAt.toISOString(),
  };
}

// ============================================
// deleteUserWorkout
// ============================================

/**
 * Delete a manually-created workout owned by the authenticated user.
 * Rejects deletion of non-manual source workouts (e.g., C2-synced).
 *
 * @param {string} userId
 * @param {string} workoutId
 * @returns {Promise<{ deleted: boolean }>}
 */
export async function deleteUserWorkout(userId, workoutId) {
  const athleteIds = await getAllUserAthleteIds(userId);
  const baseWhere = buildUserWorkoutWhere(userId, athleteIds);

  const workout = await prisma.workout.findFirst({
    where: { AND: [baseWhere, { id: workoutId }] },
  });

  if (!workout) {
    throw new ApiError(404, 'not-found', 'Workout not found');
  }

  if (mapSourceForApi(workout.source) !== 'manual') {
    throw new ApiError(403, 'delete-forbidden', 'Only manually created workouts can be deleted');
  }

  await prisma.workout.delete({ where: { id: workoutId } });

  return { deleted: true };
}

// ============================================
// getUserStats
// ============================================

/**
 * Get user training statistics: all-time totals, range-filtered stats,
 * streak data, and per-team breakdown.
 *
 * @param {string} userId
 * @param {string} range - '7d' | '30d' | '90d' | 'all' (default 'all')
 * @returns {Promise<object>}
 */
export async function getUserStats(userId, range = 'all') {
  const athleteIds = await getAllUserAthleteIds(userId);
  const baseWhere = buildUserWorkoutWhere(userId, athleteIds);

  // Fetch all workouts for this user (all-time) with minimal fields
  const allWorkouts = await prisma.workout.findMany({
    where: baseWhere,
    select: {
      id: true,
      date: true,
      distanceM: true,
      durationSeconds: true,
      teamId: true,
    },
    orderBy: { date: 'desc' },
  });

  // Empty state
  if (allWorkouts.length === 0) {
    return {
      allTime: {
        totalMeters: 0,
        totalDurationSeconds: 0,
        workoutCount: 0,
        activeDays: 0,
        firstWorkoutDate: null,
      },
      range: { meters: 0, durationSeconds: 0, workouts: 0, activeDays: 0, period: range },
      streak: { current: 0, longest: 0, lastActivityDate: null },
      byTeam: {},
    };
  }

  // All-time stats
  const totalMeters = allWorkouts.reduce((sum, w) => sum + (w.distanceM || 0), 0);
  const totalDurationSeconds = allWorkouts.reduce(
    (sum, w) => sum + (Number(w.durationSeconds) || 0),
    0
  );
  const allDates = allWorkouts.map((w) => w.date);
  const uniqueAllDays = new Set(allDates.map((d) => d.toISOString().split('T')[0]));
  const firstWorkoutDate = allWorkouts[allWorkouts.length - 1].date.toISOString();

  // Range-filtered stats
  const dateFilter = getDateFilter(range);
  let rangeWorkouts = allWorkouts;
  if (dateFilter) {
    rangeWorkouts = allWorkouts.filter((w) => w.date >= dateFilter.gte);
  }
  const rangeMeters = rangeWorkouts.reduce((sum, w) => sum + (w.distanceM || 0), 0);
  const rangeDurationSeconds = rangeWorkouts.reduce(
    (sum, w) => sum + (Number(w.durationSeconds) || 0),
    0
  );
  const uniqueRangeDays = new Set(rangeWorkouts.map((w) => w.date.toISOString().split('T')[0]));

  // Per-team breakdown
  const byTeam = {};
  for (const w of allWorkouts) {
    if (w.teamId) {
      if (!byTeam[w.teamId]) {
        byTeam[w.teamId] = { totalMeters: 0, workoutCount: 0 };
      }
      byTeam[w.teamId].totalMeters += w.distanceM || 0;
      byTeam[w.teamId].workoutCount++;
    }
  }

  // Streak
  const streak = calculateStreak(allDates);

  return {
    allTime: {
      totalMeters,
      totalDurationSeconds,
      workoutCount: allWorkouts.length,
      activeDays: uniqueAllDays.size,
      firstWorkoutDate,
    },
    range: {
      meters: rangeMeters,
      durationSeconds: rangeDurationSeconds,
      workouts: rangeWorkouts.length,
      activeDays: uniqueRangeDays.size,
      period: range,
    },
    streak,
    byTeam,
  };
}

// ============================================
// getUserWorkouts
// ============================================

/**
 * Reverse map API source values to DB source values for filtering.
 * @param {string} apiSource - 'manual' | 'concept2' | 'strava' | 'garmin'
 * @returns {string[]} DB source values
 */
function mapSourceToDb(apiSource) {
  const mapping = {
    manual: ['manual', 'csv_import', 'bluetooth'],
    concept2: ['concept2_sync'],
    strava: ['strava_sync'],
    garmin: ['fit_import', 'garmin_sync'],
  };
  return mapping[apiSource] || [apiSource];
}

/**
 * Get paginated user workouts with full filtering.
 *
 * @param {string} userId
 * @param {object} options
 * @param {string} [options.cursor] - ID of last item from previous page
 * @param {number} [options.limit=20] - Page size (max 100)
 * @param {string} [options.source] - Filter by API source
 * @param {string} [options.type] - Filter by workout type
 * @param {string} [options.machineType] - Filter by machine type
 * @param {string} [options.dateFrom] - ISO date string, inclusive
 * @param {string} [options.dateTo] - ISO date string, inclusive
 * @param {string} [options.sortBy='date'] - 'date' | 'distance' | 'duration'
 * @param {string} [options.sortOrder='desc'] - 'asc' | 'desc'
 * @param {string} [options.q] - Text search on notes field
 * @returns {Promise<object>}
 */
export async function getUserWorkouts(userId, options = {}) {
  const {
    cursor,
    limit: rawLimit = 20,
    source,
    type,
    machineType,
    dateFrom,
    dateTo,
    sortBy = 'date',
    sortOrder = 'desc',
    q,
  } = options;

  const limit = Math.min(Math.max(1, Number(rawLimit) || 20), 100);

  const athleteIds = await getAllUserAthleteIds(userId);
  const baseWhere = buildUserWorkoutWhere(userId, athleteIds);

  // Build filter conditions
  const filters = {};
  if (source) {
    filters.source = { in: mapSourceToDb(source) };
  }
  if (type) {
    filters.type = type;
  }
  if (machineType) {
    filters.machineType = machineType;
  }
  if (dateFrom || dateTo) {
    filters.date = {};
    if (dateFrom) filters.date.gte = new Date(dateFrom);
    if (dateTo) filters.date.lte = new Date(dateTo);
  }
  if (q) {
    filters.notes = { contains: q, mode: 'insensitive' };
  }

  const where = { AND: [baseWhere, filters] };

  // Build orderBy
  const sortFieldMap = {
    date: 'date',
    distance: 'distanceM',
    duration: 'durationSeconds',
  };
  const sortField = sortFieldMap[sortBy] || 'date';
  const orderBy = [{ [sortField]: sortOrder }, { id: sortOrder }];

  // Run count, aggregate, and findMany in parallel
  const [totalCount, aggregate, items] = await Promise.all([
    prisma.workout.count({ where }),
    prisma.workout.aggregate({
      where,
      _sum: { distanceM: true },
    }),
    prisma.workout.findMany({
      where,
      orderBy,
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        splits: { orderBy: { splitNumber: 'asc' } },
      },
    }),
  ]);

  const totalMeters = aggregate._sum.distanceM || 0;

  // Format items
  const formattedItems = items.map((w) => ({
    id: w.id,
    date: w.date.toISOString(),
    source: mapSourceForApi(w.source),
    type: w.type || null,
    machineType: w.machineType || null,
    distanceM: w.distanceM,
    durationSeconds: w.durationSeconds ? Number(w.durationSeconds) : null,
    avgPace: w.avgPace ? Number(w.avgPace) : null,
    avgWatts: w.avgWatts,
    strokeRate: w.strokeRate,
    avgHeartRate: w.avgHeartRate,
    teamId: w.teamId,
    notes: w.notes || null,
    workoutType: w.rawData?.workout_type || null,
    splits: (w.splits || []).map((s) => ({
      splitNumber: s.splitNumber,
      distanceM: s.distanceM,
      timeSeconds: s.timeSeconds ? Number(s.timeSeconds) : null,
      pace: s.pace ? Number(s.pace) : null,
      watts: s.watts,
      strokeRate: s.strokeRate,
      heartRate: s.heartRate,
    })),
    createdAt: w.createdAt.toISOString(),
  }));

  // Cursor for next page
  const nextCursor =
    formattedItems.length === limit ? formattedItems[formattedItems.length - 1].id : null;

  return {
    totalCount,
    totalMeters,
    cursor: nextCursor,
    items: formattedItems,
  };
}

// ============================================
// getUserPRs
// ============================================

/**
 * Map standard distance labels to meters for workout matching.
 */
const DISTANCE_METERS = {
  '500m': 500,
  '1k': 1000,
  '2k': 2000,
  '5k': 5000,
  '6k': 6000,
  '10k': 10000,
  hm: 21097,
  fm: 42195,
};

/**
 * Compute watts from pace (tenths of seconds per 500m) using the standard formula.
 * k / (seconds_per_meter)^3 where k = 2.80 for rower/skierg/slides, 0.35 for bikerg.
 *
 * @param {number} paceTenths - Pace in tenths of seconds per 500m
 * @param {string} machineType - 'rower' | 'skierg' | 'bikerg'
 * @returns {number|null}
 */
function wattsFromPace(paceTenths, machineType) {
  if (!paceTenths || paceTenths <= 0) return null;
  const paceSeconds = paceTenths / 10; // seconds per 500m
  const secPerMeter = paceSeconds / 500;
  const k = machineType === 'bikerg' ? 0.35 : 2.8;
  return Math.round(k / Math.pow(secPerMeter, 3));
}

/**
 * Build a PR record from a list of attempts for a given testType.
 *
 * @param {string} testType
 * @param {string} machineType
 * @param {{ time: number, date: string, watts: number|null }[]} attempts - Sorted by date desc
 * @returns {object}
 */
function buildPRRecord(testType, machineType, attempts) {
  if (attempts.length === 0) {
    return {
      testType,
      machineType,
      bestTime: null,
      bestDate: null,
      avgWatts: null,
      previousBest: null,
      improvement: null,
      recentAttempts: [],
    };
  }

  const sortedByTime = [...attempts].sort((a, b) => a.time - b.time);
  const best = sortedByTime[0];
  const previousBest = sortedByTime.length > 1 ? sortedByTime[1].time : null;
  const improvement = previousBest !== null ? previousBest - best.time : null;

  return {
    testType,
    machineType,
    bestTime: best.time,
    bestDate: best.date,
    avgWatts: best.watts,
    previousBest,
    improvement,
    recentAttempts: attempts.slice(0, 3).map((t) => ({
      time: t.time,
      date: t.date,
    })),
  };
}

/**
 * Get user personal records across all teams, grouped by machine type.
 * Derives PRs from both ErgTest (rower) and Workout (all machines) models.
 * Returns both byMachine grouped format and flat records array for backward compat.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
export async function getUserPRs(userId) {
  const athleteIds = await getAllUserAthleteIds(userId);
  const baseWhere = buildUserWorkoutWhere(userId, athleteIds);

  // Initialize byMachine with all standard distances empty
  const MACHINE_TYPES = ['rower', 'skierg', 'bikerg'];
  const byMachine = {};
  for (const mt of MACHINE_TYPES) {
    byMachine[mt] = {};
    for (const dist of STANDARD_DISTANCES) {
      byMachine[mt][dist] = []; // accumulate attempts
    }
  }

  // 1. Query Workout records for erg-type workouts with exact standard distances
  // Include both RowErg/SkiErg standard distances AND BikeErg distances (2x)
  const allStandardMeters = [
    ...new Set([...Object.values(DISTANCE_METERS), ...Object.values(BIKERG_DISTANCE_METERS)]),
  ];
  const ergWorkouts = await prisma.workout.findMany({
    where: {
      AND: [
        baseWhere,
        { type: 'erg' },
        { distanceM: { in: allStandardMeters } },
        { durationSeconds: { not: null } },
      ],
    },
    select: {
      distanceM: true,
      durationSeconds: true,
      avgPace: true,
      avgWatts: true,
      machineType: true,
      date: true,
    },
    orderBy: { date: 'desc' },
  });

  // Reverse lookup: meters -> testType label (machine-specific)
  const metersToLabel = {};
  for (const [label, meters] of Object.entries(DISTANCE_METERS)) {
    metersToLabel[meters] = label;
  }
  const bikergMetersToLabel = {};
  for (const [label, meters] of Object.entries(BIKERG_DISTANCE_METERS)) {
    bikergMetersToLabel[meters] = label;
  }

  // Build a set of non-rower workout keys (date + distanceM) so we can
  // exclude ErgTest records that were created from BikeErg/SkiErg workouts.
  // Uses date+distance rather than time fingerprints for robustness.
  const nonRowerDayDistance = new Set();

  for (const w of ergWorkouts) {
    const mt = w.machineType || 'rower';
    // BikeErg uses doubled distances for PR benchmarks
    const label = mt === 'bikerg' ? bikergMetersToLabel[w.distanceM] : metersToLabel[w.distanceM];
    if (!label) continue;
    if (!byMachine[mt]) {
      byMachine[mt] = {};
      for (const dist of STANDARD_DISTANCES) {
        byMachine[mt][dist] = [];
      }
    }
    if (!byMachine[mt][label]) {
      byMachine[mt][label] = [];
    }

    // Convert durationSeconds to tenths
    const timeTenths = Math.round(Number(w.durationSeconds) * 10);
    const watts =
      w.avgWatts ||
      (w.avgPace ? wattsFromPace(Number(w.avgPace), mt) : wattsFromPace(timeTenths, mt));

    byMachine[mt][label].push({
      time: timeTenths,
      date: w.date.toISOString(),
      watts,
    });

    // Track non-rower workouts by date + distance for ErgTest filtering
    if (mt !== 'rower') {
      nonRowerDayDistance.add(`${w.date.toISOString().slice(0, 10)}-${w.distanceM}`);
    }
  }

  // 2. Query ErgTest records (rower/skierg only — ErgTest has no machineType field)
  // ErgTests were historically created from ALL erg workouts including BikeErg,
  // so we need to cross-reference each ErgTest against its source Workout to
  // exclude non-rower entries.
  if (athleteIds.length > 0) {
    const ergTests = await prisma.ergTest.findMany({
      where: { athleteId: { in: athleteIds } },
      select: {
        testType: true,
        testDate: true,
        timeSeconds: true,
        watts: true,
        distanceM: true,
        notes: true,
      },
      orderBy: { testDate: 'desc' },
    });

    // Also query ALL non-rower erg workouts (any distance) to build exclusion set
    const nonRowerWorkouts = await prisma.workout.findMany({
      where: {
        AND: [
          baseWhere,
          { type: 'erg' },
          { machineType: { not: 'rower' } },
          { machineType: { not: null } },
        ],
      },
      select: { distanceM: true, date: true, durationSeconds: true },
    });

    // Build exclusion set: date + distance of all non-rower workouts
    for (const w of nonRowerWorkouts) {
      if (w.distanceM && w.date) {
        nonRowerDayDistance.add(`${w.date.toISOString().slice(0, 10)}-${w.distanceM}`);
      }
    }

    for (const test of ergTests) {
      const tt = test.testType;
      if (!byMachine.rower[tt]) {
        byMachine.rower[tt] = [];
      }
      const timeTenths = Math.round(Number(test.timeSeconds) * 10);

      // Skip ErgTest records where a non-rower workout exists on the same day
      // at the same distance (these were incorrectly auto-created from BikeErg workouts)
      const distM = test.distanceM || DISTANCE_METERS[tt];
      if (distM) {
        const key = `${test.testDate.toISOString().slice(0, 10)}-${distM}`;
        if (nonRowerDayDistance.has(key)) {
          continue;
        }
      }

      const watts = test.watts || wattsFromPace(timeTenths, 'rower');
      byMachine.rower[tt].push({
        time: timeTenths,
        date: test.testDate.toISOString(),
        watts,
      });
    }
  }

  // 3. Build final byMachine structure with PR records
  const result = {};
  for (const mt of Object.keys(byMachine)) {
    result[mt] = [];
    for (const testType of STANDARD_DISTANCES) {
      const attempts = byMachine[mt][testType] || [];
      // Deduplicate by date+time (ErgTest and Workout might overlap for rower)
      const seen = new Set();
      const deduped = [];
      for (const a of attempts) {
        const key = `${a.date}-${a.time}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(a);
        }
      }
      // Sort by date desc for recentAttempts
      deduped.sort((a, b) => (a.date > b.date ? -1 : 1));
      result[mt].push(buildPRRecord(testType, mt, deduped));
    }

    // Add any non-standard distances that exist for this machine
    for (const testType of Object.keys(byMachine[mt])) {
      if (!STANDARD_DISTANCES.includes(testType)) {
        const attempts = byMachine[mt][testType];
        const seen = new Set();
        const deduped = [];
        for (const a of attempts) {
          const key = `${a.date}-${a.time}`;
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(a);
          }
        }
        deduped.sort((a, b) => (a.date > b.date ? -1 : 1));
        result[mt].push(buildPRRecord(testType, mt, deduped));
      }
    }
  }

  // 4. Backward-compatible flat records array (rower PRs only, same shape as before)
  const records = (result.rower || []).map((pr) => ({
    testType: pr.testType,
    machineType: 'rower',
    bestTime: pr.bestTime,
    bestDate: pr.bestDate,
    previousBest: pr.previousBest,
    improvement: pr.improvement,
    recentAttempts: pr.recentAttempts,
  }));

  return { records, byMachine: result };
}

// ============================================
// getUserTrends
// ============================================

/**
 * Get weekly-bucketed workout volume trends for a user.
 *
 * @param {string} userId
 * @param {string} range - '7d' | '30d' | '90d' | '1y' | 'all' (default '90d')
 * @returns {Promise<object>}
 */
export async function getUserTrends(userId, range = '90d') {
  const athleteIds = await getAllUserAthleteIds(userId);
  const baseWhere = buildUserWorkoutWhere(userId, athleteIds);

  const dateFilter = getDateFilter(range);

  const workouts = await prisma.workout.findMany({
    where: {
      AND: [baseWhere, ...(dateFilter ? [{ date: dateFilter }] : [])],
    },
    select: {
      date: true,
      distanceM: true,
      durationSeconds: true,
      type: true,
      machineType: true,
    },
    orderBy: { date: 'asc' },
  });

  // Bucket by ISO week
  const bucketMap = new Map();

  for (const w of workouts) {
    const weekKey = getISOWeekKey(w.date);
    if (!bucketMap.has(weekKey)) {
      bucketMap.set(weekKey, {
        week: weekKey,
        meters: 0,
        workouts: 0,
        durationSeconds: 0,
        byType: {},
      });
    }
    const bucket = bucketMap.get(weekKey);
    const meters = w.distanceM || 0;
    bucket.meters += meters;
    bucket.workouts += 1;
    bucket.durationSeconds += Number(w.durationSeconds) || 0;

    const wType = w.type || 'other';
    if (!bucket.byType[wType]) {
      bucket.byType[wType] = 0;
    }
    bucket.byType[wType] += meters;
  }

  const buckets = [...bucketMap.values()];

  return { buckets };
}

/**
 * Get ISO week key (YYYY-Www) for a date.
 * @param {Date} date
 * @returns {string}
 */
function getISOWeekKey(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  // ISO week: Thursday determines the week's year
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const weekNum = Math.ceil(((d - yearStart) / 86400000 + yearStart.getUTCDay() + 1 - 4) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// ============================================
// getDashboard
// ============================================

/**
 * Compose a dashboard response from stats, workouts, and PRs.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
export async function getDashboard(userId) {
  const [stats, workouts, prs] = await Promise.all([
    getUserStats(userId, '30d'),
    getUserWorkouts(userId, { limit: 5 }),
    getUserPRs(userId),
  ]);

  return { stats, recentWorkouts: workouts, prs };
}

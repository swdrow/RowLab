import { prisma } from '../db/connection.js';
import { mapSourceForApi } from '../middleware/rfc7807.js';

// ============================================
// Standard C2 distances for PR tracking
// ============================================
const STANDARD_DISTANCES = ['500m', '1k', '2k', '5k', '6k', '10k', 'hm', 'fm'];

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

  const days = { '7d': 7, '30d': 30, '90d': 90 }[range];
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
      teamId: true,
    },
    orderBy: { date: 'desc' },
  });

  // Empty state
  if (allWorkouts.length === 0) {
    return {
      allTime: {
        totalMeters: 0,
        workoutCount: 0,
        activeDays: 0,
        firstWorkoutDate: null,
      },
      range: { meters: 0, workouts: 0, activeDays: 0, period: range },
      streak: { current: 0, longest: 0, lastActivityDate: null },
      byTeam: {},
    };
  }

  // All-time stats
  const totalMeters = allWorkouts.reduce((sum, w) => sum + (w.distanceM || 0), 0);
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
      workoutCount: allWorkouts.length,
      activeDays: uniqueAllDays.size,
      firstWorkoutDate,
    },
    range: {
      meters: rangeMeters,
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
    garmin: ['fit_import'],
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
 * Get user personal records across all teams.
 * Returns best time per distance per machine type with last 3 attempts.
 * Always includes all 8 standard C2 distances even if empty.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
export async function getUserPRs(userId) {
  const athleteIds = await getAllUserAthleteIds(userId);

  if (athleteIds.length === 0) {
    // No athlete records -> return empty standard distances
    return {
      records: STANDARD_DISTANCES.map((testType) => ({
        testType,
        machineType: 'rower',
        bestTime: null,
        bestDate: null,
        previousBest: null,
        improvement: null,
        recentAttempts: [],
      })),
    };
  }

  // Query all erg tests for these athletes
  const ergTests = await prisma.ergTest.findMany({
    where: { athleteId: { in: athleteIds } },
    select: {
      testType: true,
      testDate: true,
      timeSeconds: true,
    },
    orderBy: { testDate: 'desc' },
  });

  // Group by testType
  const byType = {};
  for (const test of ergTests) {
    if (!byType[test.testType]) {
      byType[test.testType] = [];
    }
    byType[test.testType].push(test);
  }

  // Build records for all standard distances + any custom ones
  const allTypes = new Set([...STANDARD_DISTANCES, ...Object.keys(byType)]);
  const records = [];

  for (const testType of allTypes) {
    const tests = byType[testType] || [];

    if (tests.length === 0) {
      records.push({
        testType,
        machineType: 'rower',
        bestTime: null,
        bestDate: null,
        previousBest: null,
        improvement: null,
        recentAttempts: [],
      });
      continue;
    }

    // Convert timeSeconds (Decimal, seconds with 1 decimal) to tenths of seconds
    const testsWithTenths = tests.map((t) => ({
      time: Math.round(Number(t.timeSeconds) * 10),
      date: t.testDate.toISOString(),
    }));

    // Sort by time ascending to find best and second best
    const sortedByTime = [...testsWithTenths].sort((a, b) => a.time - b.time);
    const bestTime = sortedByTime[0].time;
    const bestDate = sortedByTime[0].date;
    const previousBest = sortedByTime.length > 1 ? sortedByTime[1].time : null;
    const improvement = previousBest !== null ? previousBest - bestTime : null;

    // Last 3 attempts (already sorted by testDate desc from query)
    const recentAttempts = testsWithTenths.slice(0, 3).map((t) => ({
      time: t.time,
      date: t.date,
    }));

    records.push({
      testType,
      machineType: 'rower', // All erg tests are on the rower by convention
      bestTime,
      bestDate,
      previousBest,
      improvement,
      recentAttempts,
    });
  }

  return { records };
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

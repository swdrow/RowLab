import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';

/**
 * Default grace period settings
 */
const DEFAULT_GRACE_CONFIG = {
  attendanceGraceDays: 2, // Allow 2 misses before breaking streak
  workoutGraceDays: 3, // Allow 3 days between workouts
  prGraceDays: 30, // 30 days to beat a PR
};

/**
 * Get team's streak configuration
 */
export async function getTeamStreakConfig(teamId) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { settings: true },
  });

  const settings = team?.settings || {};

  return {
    attendanceGraceDays: settings.attendanceGraceDays ?? DEFAULT_GRACE_CONFIG.attendanceGraceDays,
    workoutGraceDays: settings.workoutGraceDays ?? DEFAULT_GRACE_CONFIG.workoutGraceDays,
    prGraceDays: settings.prGraceDays ?? DEFAULT_GRACE_CONFIG.prGraceDays,
  };
}

/**
 * Calculate attendance streak using PostgreSQL window functions
 * Uses (date - row_number) pattern per RESEARCH.md
 */
export async function getAttendanceStreak(athleteId, graceDays = 2) {
  try {
    // Using raw query for window function efficiency
    const result = await prisma.$queryRaw`
      WITH attendance_dates AS (
        SELECT DISTINCT
          date_trunc('day', date)::DATE AS attendance_date
        FROM attendance
        WHERE athlete_id = ${athleteId}::UUID
          AND status IN ('present', 'late')
      ),
      streak_groups AS (
        SELECT
          attendance_date,
          attendance_date - (ROW_NUMBER() OVER (ORDER BY attendance_date))::INTEGER AS streak_group
        FROM attendance_dates
      ),
      streaks AS (
        SELECT
          MIN(attendance_date) AS streak_start,
          MAX(attendance_date) AS streak_end,
          COUNT(*) AS streak_length
        FROM streak_groups
        GROUP BY streak_group
      )
      SELECT
        streak_start,
        streak_end,
        streak_length::INTEGER
      FROM streaks
      WHERE streak_end >= CURRENT_DATE - (${graceDays} * INTERVAL '1 day')
      ORDER BY streak_length DESC
      LIMIT 1
    `;

    if (!result || result.length === 0) {
      return {
        category: 'attendance',
        currentLength: 0,
        longestLength: 0,
        streakStart: null,
        lastActivity: null,
        gracePeriodUsed: 0,
        gracePeriodMax: graceDays,
        isActive: false,
      };
    }

    const streak = result[0];

    // Get longest streak ever
    const longestResult = await prisma.$queryRaw`
      WITH attendance_dates AS (
        SELECT DISTINCT
          date_trunc('day', date)::DATE AS attendance_date
        FROM attendance
        WHERE athlete_id = ${athleteId}::UUID
          AND status IN ('present', 'late')
      ),
      streak_groups AS (
        SELECT
          attendance_date,
          attendance_date - (ROW_NUMBER() OVER (ORDER BY attendance_date))::INTEGER AS streak_group
        FROM attendance_dates
      ),
      streaks AS (
        SELECT COUNT(*) AS streak_length
        FROM streak_groups
        GROUP BY streak_group
      )
      SELECT MAX(streak_length)::INTEGER as longest
      FROM streaks
    `;

    const longest = longestResult[0]?.longest || 0;

    // Calculate grace period usage
    const today = new Date();
    const streakEnd = new Date(streak.streak_end);
    const daysSinceEnd = Math.floor((today - streakEnd) / (1000 * 60 * 60 * 24));

    return {
      category: 'attendance',
      currentLength: Number(streak.streak_length),
      longestLength: Number(longest),
      streakStart: streak.streak_start,
      lastActivity: streak.streak_end,
      gracePeriodUsed: Math.max(0, daysSinceEnd),
      gracePeriodMax: graceDays,
      isActive: daysSinceEnd <= graceDays,
    };
  } catch (error) {
    logger.error('Failed to calculate attendance streak', { error: error.message, athleteId });
    return {
      category: 'attendance',
      currentLength: 0,
      longestLength: 0,
      streakStart: null,
      lastActivity: null,
      gracePeriodUsed: 0,
      gracePeriodMax: graceDays,
      isActive: false,
    };
  }
}

/**
 * Calculate workout streak
 */
export async function getWorkoutStreak(athleteId, graceDays = 3) {
  try {
    const result = await prisma.$queryRaw`
      WITH workout_dates AS (
        SELECT DISTINCT
          date_trunc('day', date)::DATE AS workout_date
        FROM workouts
        WHERE athlete_id = ${athleteId}::UUID
      ),
      streak_groups AS (
        SELECT
          workout_date,
          workout_date - (ROW_NUMBER() OVER (ORDER BY workout_date))::INTEGER AS streak_group
        FROM workout_dates
      ),
      streaks AS (
        SELECT
          MIN(workout_date) AS streak_start,
          MAX(workout_date) AS streak_end,
          COUNT(*) AS streak_length
        FROM streak_groups
        GROUP BY streak_group
      )
      SELECT
        streak_start,
        streak_end,
        streak_length::INTEGER
      FROM streaks
      WHERE streak_end >= CURRENT_DATE - (${graceDays} * INTERVAL '1 day')
      ORDER BY streak_length DESC
      LIMIT 1
    `;

    if (!result || result.length === 0) {
      return {
        category: 'workout',
        currentLength: 0,
        longestLength: 0,
        streakStart: null,
        lastActivity: null,
        gracePeriodUsed: 0,
        gracePeriodMax: graceDays,
        isActive: false,
      };
    }

    const streak = result[0];

    // Get longest workout streak ever
    const longestResult = await prisma.$queryRaw`
      WITH workout_dates AS (
        SELECT DISTINCT
          date_trunc('day', date)::DATE AS workout_date
        FROM workouts
        WHERE athlete_id = ${athleteId}::UUID
      ),
      streak_groups AS (
        SELECT
          workout_date,
          workout_date - (ROW_NUMBER() OVER (ORDER BY workout_date))::INTEGER AS streak_group
        FROM workout_dates
      ),
      streaks AS (
        SELECT COUNT(*) AS streak_length
        FROM streak_groups
        GROUP BY streak_group
      )
      SELECT MAX(streak_length)::INTEGER as longest
      FROM streaks
    `;

    const longest = longestResult[0]?.longest || 0;

    // Calculate days since last workout
    const today = new Date();
    const streakEnd = new Date(streak.streak_end);
    const daysSinceEnd = Math.floor((today - streakEnd) / (1000 * 60 * 60 * 24));

    return {
      category: 'workout',
      currentLength: Number(streak.streak_length),
      longestLength: Number(longest),
      streakStart: streak.streak_start,
      lastActivity: streak.streak_end,
      gracePeriodUsed: Math.max(0, daysSinceEnd),
      gracePeriodMax: graceDays,
      isActive: daysSinceEnd <= graceDays,
    };
  } catch (error) {
    logger.error('Failed to calculate workout streak', { error: error.message, athleteId });
    return {
      category: 'workout',
      currentLength: 0,
      longestLength: 0,
      streakStart: null,
      lastActivity: null,
      gracePeriodUsed: 0,
      gracePeriodMax: graceDays,
      isActive: false,
    };
  }
}

/**
 * Calculate PR streak (consecutive tests with improvements)
 */
export async function getPRStreak(athleteId) {
  try {
    // Count recent tests that were PRs
    const recentPRs = await prisma.personalRecord.count({
      where: {
        athleteId,
        achievedAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
      },
    });

    // Get most recent PR
    const latestPR = await prisma.personalRecord.findFirst({
      where: { athleteId },
      orderBy: { achievedAt: 'desc' },
    });

    return {
      category: 'pr',
      currentLength: recentPRs,
      longestLength: recentPRs, // Simplified - would need historical tracking
      streakStart: null,
      lastActivity: latestPR?.achievedAt || null,
      gracePeriodUsed: 0,
      gracePeriodMax: 30,
      isActive: recentPRs > 0,
    };
  } catch (error) {
    logger.error('Failed to calculate PR streak', { error: error.message, athleteId });
    return {
      category: 'pr',
      currentLength: 0,
      longestLength: 0,
      streakStart: null,
      lastActivity: null,
      gracePeriodUsed: 0,
      gracePeriodMax: 30,
      isActive: false,
    };
  }
}

/**
 * Get all streaks for an athlete
 */
export async function getStreakSummary(athleteId, teamId) {
  const config = await getTeamStreakConfig(teamId);

  const [attendance, workout, pr] = await Promise.all([
    getAttendanceStreak(athleteId, config.attendanceGraceDays),
    getWorkoutStreak(athleteId, config.workoutGraceDays),
    getPRStreak(athleteId),
  ]);

  const streaks = [attendance, workout, pr];
  const activeCount = streaks.filter((s) => s.isActive).length;

  return {
    streaks,
    activeStreakCount: activeCount,
  };
}

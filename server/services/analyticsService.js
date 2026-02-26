import { prisma } from '../db/connection.js';

// ============================================
// Constants
// ============================================

const MIN_DAYS_FOR_INSIGHTS = 42;

// EMA decay constants
const CTL_DECAY = Math.exp(-1 / 42);
const ATL_DECAY = Math.exp(-1 / 7);

// Sport intensity multipliers for duration-based TSS fallback
const SPORT_MULTIPLIERS = {
  erg: 1.0,
  on_water: 0.85,
  strength: 0.7,
  cardio: 0.8,
  other: 0.5,
};

// ============================================
// Helpers (reuse from userScopedService patterns)
// ============================================

/**
 * Get all athlete IDs linked to a user.
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
 * @param {string} userId
 * @param {string[]} athleteIds
 * @returns {object}
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
 * Get ISO week key (YYYY-Www) for a date.
 * @param {Date} date
 * @returns {string}
 */
function getISOWeekKey(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const weekNum = Math.ceil(((d - yearStart) / 86400000 + yearStart.getUTCDay() + 1 - 4) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Get the date string (YYYY-MM-DD) in UTC for a Date object.
 * @param {Date} date
 * @returns {string}
 */
function toDateKey(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Get the start date (YYYY-MM-DD) for a bucket key.
 * Weekly: ISO week Monday. Monthly: first of month.
 */
function getBucketStartDate(bucketKey, granularity) {
  if (granularity === 'weekly') {
    // Parse YYYY-Www
    const [yearStr, weekStr] = bucketKey.split('-W');
    const year = parseInt(yearStr, 10);
    const week = parseInt(weekStr, 10);
    // ISO week 1 contains Jan 4. Find Monday of that week.
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const dayOfWeek = jan4.getUTCDay() || 7; // Mon=1..Sun=7
    const monday = new Date(jan4);
    monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7);
    return monday.toISOString().split('T')[0];
  }
  // Monthly: YYYY-MM
  return `${bucketKey}-01`;
}

/**
 * Get the end date (YYYY-MM-DD) for a bucket key.
 * Weekly: Sunday of that week. Monthly: last day of month.
 */
function getBucketEndDate(bucketKey, granularity) {
  if (granularity === 'weekly') {
    const start = new Date(getBucketStartDate(bucketKey, 'weekly') + 'T00:00:00Z');
    start.setUTCDate(start.getUTCDate() + 6);
    return start.toISOString().split('T')[0];
  }
  // Monthly: last day of month
  const [yearStr, monthStr] = bucketKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const lastDay = new Date(Date.UTC(year, month, 0));
  return lastDay.toISOString().split('T')[0];
}

// ============================================
// getUserAnalyticsSettings
// ============================================

/**
 * Fetch user analytics settings and compute effective thresholds.
 * @param {string} userId
 * @returns {Promise<object>}
 */
async function getUserAnalyticsSettings(userId) {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  // Compute age from dateOfBirth if available
  let age = null;
  if (settings?.dateOfBirth) {
    const dob = new Date(settings.dateOfBirth);
    const now = new Date();
    age = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
      age--;
    }
  }

  const effectiveMaxHR = settings?.maxHeartRate ?? (age !== null ? 220 - age : 185);
  const effectiveLTHR = settings?.lactateThresholdHR ?? Math.round(0.85 * effectiveMaxHR);
  const effectiveFTP = settings?.functionalThresholdPower ?? 200;

  return {
    maxHR: effectiveMaxHR,
    lthr: effectiveLTHR,
    ftp: effectiveFTP,
    tsbThreshold: settings?.tsbAlertThreshold ?? -30,
    acwrThreshold: Number(settings?.acwrAlertThreshold ?? 1.5),
  };
}

// ============================================
// calculateTSS
// ============================================

/**
 * Calculate Training Stress Score using 3-tier strategy.
 *
 * Tier 1: Power-based (avgWatts available)
 * Tier 2: HR-based (avgHeartRate available, no watts)
 * Tier 3: Duration-based fallback
 *
 * @param {object} workout - Prisma workout record
 * @param {object} settings - { ftp, lthr }
 * @returns {{ tss: number, tier: number, sport: string }}
 */
export function calculateTSS(workout, settings) {
  const durationSeconds = Number(workout.durationSeconds) || 0;
  if (durationSeconds <= 0) {
    return { tss: 0, tier: 3, sport: workout.type || 'other' };
  }

  const durationHours = durationSeconds / 3600;
  const sport = workout.type || 'other';

  // Tier 1: Power-based
  if (workout.avgWatts && workout.avgWatts > 0 && settings.ftp > 0) {
    const intensityFactor = workout.avgWatts / settings.ftp;
    const tss = durationHours * Math.pow(intensityFactor, 2) * 100;
    return { tss: Math.round(tss * 10) / 10, tier: 1, sport };
  }

  // Tier 2: Heart rate-based
  if (workout.avgHeartRate && workout.avgHeartRate > 0 && settings.lthr > 0) {
    const hrIntensityFactor = workout.avgHeartRate / settings.lthr;
    const hrTSS = durationHours * Math.pow(hrIntensityFactor, 2) * 100;
    return { tss: Math.round(hrTSS * 10) / 10, tier: 2, sport };
  }

  // Tier 3: Duration-based fallback
  const multiplier = SPORT_MULTIPLIERS[sport] ?? SPORT_MULTIPLIERS.other;
  const tssEstimate = durationHours * multiplier * 50;
  return { tss: Math.round(tssEstimate * 10) / 10, tier: 3, sport };
}

// ============================================
// getAnalyticsPMC
// ============================================

/**
 * Compute Performance Management Chart data (CTL/ATL/TSB).
 *
 * @param {string} userId
 * @param {string} range - '30d' | '90d' | '180d' | '365d' | 'all'
 * @param {string|null} sport - optional sport filter
 * @returns {Promise<object>} PMCResponse
 */
export async function getAnalyticsPMC(userId, range, sport = null) {
  const settings = await getUserAnalyticsSettings(userId);
  const athleteIds = await getAllUserAthleteIds(userId);
  const baseWhere = buildUserWorkoutWhere(userId, athleteIds);

  // Determine range days
  const rangeDays = { '30d': 30, '90d': 90, '180d': 180, '365d': 365 }[range] || null;

  // For EMA warm-up, query extra 90 days before range start
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);

  let rangeStart = null;
  let queryStart = null;

  if (rangeDays !== null) {
    rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() - rangeDays);
    queryStart = new Date(rangeStart);
    queryStart.setDate(queryStart.getDate() - 90); // 90-day warm-up buffer
  }

  // Build filter conditions
  const filters = {};
  if (queryStart) {
    filters.date = { gte: queryStart };
  }
  if (sport) {
    filters.type = sport;
  }

  const workouts = await prisma.workout.findMany({
    where: { AND: [baseWhere, filters] },
    select: {
      date: true,
      type: true,
      durationSeconds: true,
      avgWatts: true,
      avgHeartRate: true,
    },
    orderBy: { date: 'asc' },
  });

  if (workouts.length === 0) {
    return {
      points: [],
      currentCTL: 0,
      currentATL: 0,
      currentTSB: 0,
      daysWithData: 0,
      totalDays: rangeDays || 0,
      acwr: null,
      _settings: settings,
    };
  }

  // Aggregate daily TSS
  const dailyTSS = new Map(); // dateKey -> { tss, byType }
  for (const w of workouts) {
    const dateKey = toDateKey(w.date);
    const { tss, sport: wSport } = calculateTSS(w, settings);

    if (!dailyTSS.has(dateKey)) {
      dailyTSS.set(dateKey, { tss: 0, byType: {} });
    }
    const day = dailyTSS.get(dateKey);
    day.tss += tss;
    day.byType[wSport] = (day.byType[wSport] || 0) + tss;
  }

  // Determine the date range for EMA iteration
  const sortedDates = [...dailyTSS.keys()].sort();
  const firstDate = new Date(sortedDates[0] + 'T00:00:00Z');
  const lastDate = new Date(now);

  // EMA loop: iterate day by day from first workout to today
  let ctl = 0;
  let atl = 0;
  const allPoints = [];
  const current = new Date(firstDate);

  // Track recent TSS for ACWR
  const recentDailyTSS = [];

  while (current <= lastDate) {
    const dateKey = toDateKey(current);
    const dayData = dailyTSS.get(dateKey);
    const dayTSS = dayData ? dayData.tss : 0;

    ctl = ctl * CTL_DECAY + dayTSS * (1 - CTL_DECAY);
    atl = atl * ATL_DECAY + dayTSS * (1 - ATL_DECAY);
    const tsb = ctl - atl;

    recentDailyTSS.push(dayTSS);

    allPoints.push({
      date: dateKey,
      ctl: Math.round(ctl * 10) / 10,
      atl: Math.round(atl * 10) / 10,
      tsb: Math.round(tsb * 10) / 10,
      tss: Math.round(dayTSS * 10) / 10,
    });

    current.setDate(current.getDate() + 1);
  }

  // Trim EMA results to only the requested range (discard warm-up days)
  let points;
  if (rangeStart) {
    const rangeStartKey = toDateKey(rangeStart);
    points = allPoints.filter((p) => p.date >= rangeStartKey);
  } else {
    points = allPoints;
  }

  // Compute ACWR: sum of last 7 days / (sum of last 28 days / 4)
  let acwr = null;
  if (recentDailyTSS.length >= 28) {
    const last7 = recentDailyTSS.slice(-7).reduce((s, v) => s + v, 0);
    const last28 = recentDailyTSS.slice(-28).reduce((s, v) => s + v, 0);
    const chronicWeekly = last28 / 4;
    if (chronicWeekly > 0) {
      acwr = Math.round((last7 / chronicWeekly) * 100) / 100;
    }
  }

  const daysWithData = dailyTSS.size;
  const currentCTL = points.length > 0 ? points[points.length - 1].ctl : 0;
  const currentATL = points.length > 0 ? points[points.length - 1].atl : 0;
  const currentTSB = points.length > 0 ? points[points.length - 1].tsb : 0;

  return {
    points,
    currentCTL,
    currentATL,
    currentTSB,
    daysWithData,
    totalDays: points.length,
    acwr,
    _settings: settings,
  };
}

// ============================================
// getAnalyticsVolume
// ============================================

/**
 * Compute volume aggregation by period.
 *
 * @param {string} userId
 * @param {string} range - '4w' | '12w' | '6m' | '1y'
 * @param {string} granularity - 'weekly' | 'monthly'
 * @param {string} metric - 'distance' | 'duration'
 * @returns {Promise<object>} VolumeResponse
 */
export async function getAnalyticsVolume(
  userId,
  range,
  granularity = 'weekly',
  metric = 'distance'
) {
  const rangeDays = { '4w': 28, '12w': 84, '6m': 180, '1y': 365 }[range] || 84;

  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - rangeDays);
  rangeStart.setUTCHours(0, 0, 0, 0);

  const athleteIds = await getAllUserAthleteIds(userId);
  const baseWhere = buildUserWorkoutWhere(userId, athleteIds);

  const workouts = await prisma.workout.findMany({
    where: { AND: [baseWhere, { date: { gte: rangeStart } }] },
    select: {
      date: true,
      type: true,
      distanceM: true,
      durationSeconds: true,
    },
    orderBy: { date: 'asc' },
  });

  // Bucket by period
  const bucketMap = new Map();

  for (const w of workouts) {
    const bucketKey =
      granularity === 'weekly'
        ? getISOWeekKey(w.date)
        : `${w.date.getUTCFullYear()}-${String(w.date.getUTCMonth() + 1).padStart(2, '0')}`;

    if (!bucketMap.has(bucketKey)) {
      bucketMap.set(bucketKey, {
        period: bucketKey,
        startDate: getBucketStartDate(bucketKey, granularity),
        endDate: getBucketEndDate(bucketKey, granularity),
        total: 0,
        workoutCount: 0,
        byType: {},
      });
    }

    const bucket = bucketMap.get(bucketKey);
    const wType = w.type || 'other';

    let value;
    if (metric === 'distance') {
      value = w.distanceM || 0;
    } else {
      value = Number(w.durationSeconds) || 0;
    }

    bucket.total += value;
    bucket.workoutCount += 1;
    bucket.byType[wType] = (bucket.byType[wType] || 0) + value;
  }

  const buckets = [...bucketMap.values()];

  // Compute 4-period rolling average for total per bucket
  const rollingAverage = [];
  for (let i = 0; i < buckets.length; i++) {
    const windowStart = Math.max(0, i - 3);
    const window = buckets.slice(windowStart, i + 1);
    const avg = window.reduce((sum, b) => sum + b.total, 0) / window.length;
    rollingAverage.push(Math.round(avg * 10) / 10);
  }

  // Summary stats
  const totalDistance = workouts.reduce((sum, w) => sum + (w.distanceM || 0), 0);
  const totalDuration = workouts.reduce((sum, w) => sum + (Number(w.durationSeconds) || 0), 0);
  const totalSessions = workouts.length;
  const avgPerPeriod =
    buckets.length > 0
      ? Math.round((buckets.reduce((sum, b) => sum + b.total, 0) / buckets.length) * 10) / 10
      : 0;

  return {
    buckets,
    summary: {
      totalDistance,
      totalDuration,
      totalSessions,
      avgPerPeriod,
    },
    rollingAverage,
  };
}

// ============================================
// deriveInsights
// ============================================

/**
 * Derive training insights from PMC data.
 *
 * @param {object} pmcData - Result from getAnalyticsPMC
 * @param {object} settings - User analytics settings
 * @returns {Array<{ type: string, message: string, icon: string }>}
 */
export function deriveInsights(pmcData, settings) {
  if (pmcData.daysWithData < MIN_DAYS_FOR_INSIGHTS) {
    return [];
  }

  const insights = [];
  const { currentTSB, currentCTL, acwr, points } = pmcData;

  // Negative insights
  if (currentTSB < settings.tsbThreshold && acwr !== null && acwr > settings.acwrThreshold) {
    insights.push({
      type: 'warning',
      message: 'High training load detected. Consider a rest day or easy session.',
      icon: 'alert-triangle',
    });
  }

  if (currentTSB < settings.tsbThreshold - 10) {
    insights.push({
      type: 'warning',
      message: 'Deep fatigue zone. Recovery recommended.',
      icon: 'battery-low',
    });
  }

  // Positive insights: CTL trending up over last 14 days
  if (points.length >= 14) {
    const recent14 = points.slice(-14);
    const ctlStart = recent14[0].ctl;
    const ctlEnd = recent14[recent14.length - 1].ctl;
    if (ctlEnd > ctlStart && ctlEnd - ctlStart > 1) {
      insights.push({
        type: 'positive',
        message: 'Fitness trending up! Keep it consistent.',
        icon: 'trending-up',
      });
    }
  }

  // 5+ consecutive days with TSS > 0
  if (points.length >= 5) {
    const lastPoints = points.slice(-7);
    let consecutiveDays = 0;
    for (let i = lastPoints.length - 1; i >= 0; i--) {
      if (lastPoints[i].tss > 0) {
        consecutiveDays++;
      } else {
        break;
      }
    }
    if (consecutiveDays >= 5) {
      insights.push({
        type: 'positive',
        message: 'Great consistency this week!',
        icon: 'flame',
      });
    }
  }

  // Fresh zone: TSB between 5-25
  if (currentTSB >= 5 && currentTSB <= 25) {
    insights.push({
      type: 'positive',
      message: "You're in the fresh zone -- good time for a peak performance.",
      icon: 'zap',
    });
  }

  return insights;
}

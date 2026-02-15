import { mean, standardDeviation } from 'simple-statistics';
import prisma from '../db/connection.js';
import { getTeamRankings } from './eloRatingService.js';

// ============================================
// DEFAULT WEIGHT PROFILES
// ============================================

export const DEFAULT_WEIGHT_PROFILES = [
  {
    id: 'performance-first',
    name: 'Performance-First',
    weights: { onWater: 0.85, erg: 0.1, attendance: 0.05 },
    isDefault: false,
    isCustom: false,
  },
  {
    id: 'balanced',
    name: 'Balanced',
    weights: { onWater: 0.75, erg: 0.15, attendance: 0.1 },
    isDefault: true,
    isCustom: false,
  },
  {
    id: 'reliability',
    name: 'Reliability-Focus',
    weights: { onWater: 0.65, erg: 0.15, attendance: 0.2 },
    isDefault: false,
    isCustom: false,
  },
];

// ============================================
// ERG TEST TYPE WEIGHTS
// ============================================

const ERG_TEST_WEIGHTS = {
  '2000m': 1.0, // Gold standard
  '2k': 1.0,
  '6000m': 0.8, // Endurance test
  '6k': 0.8,
  '500m': 0.6, // Sprint test
  steady_state: 0.3, // Practice observation
};

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Get weight profile by ID or return default
 * @param {string} profileId - Profile ID or 'custom'
 * @param {Object} customWeights - Custom weights if profileId is 'custom'
 * @returns {Object} Weight profile
 */
export function getWeightProfile(profileId, customWeights = null) {
  if (profileId === 'custom' && customWeights) {
    return {
      id: 'custom',
      name: 'Custom',
      weights: customWeights,
      isDefault: false,
      isCustom: true,
    };
  }

  const profile = DEFAULT_WEIGHT_PROFILES.find((p) => p.id === profileId);
  if (profile) return profile;

  // Return default
  return DEFAULT_WEIGHT_PROFILES.find((p) => p.isDefault);
}

/**
 * Calculate composite rankings for a team
 * @param {string} teamId - Team UUID
 * @param {Object} options - { profileId?, customWeights?, minDataPoints? }
 * @returns {Promise<Object>} CompositeRankingsResponse
 */
export async function calculateCompositeRankings(teamId, options = {}) {
  const { profileId = 'balanced', customWeights = null, minDataPoints = 1 } = options;

  const profile = getWeightProfile(profileId, customWeights);
  const { weights } = profile;

  // Fetch all component data
  const [onWaterRatings, ergData, attendanceData, athletes] = await Promise.all([
    getOnWaterRatings(teamId),
    getErgPerformanceData(teamId),
    getAttendanceData(teamId),
    prisma.athlete.findMany({
      where: { teamId, status: 'active' },
      select: { id: true, firstName: true, lastName: true, side: true },
    }),
  ]);

  // Check for zero athletes with any data
  const allAthleteIds = new Set([
    ...Array.from(onWaterRatings.keys()),
    ...Array.from(ergData.keys()),
    ...Array.from(attendanceData.keys()),
  ]);

  if (allAthleteIds.size === 0) {
    return {
      teamId,
      profile,
      rankings: [],
      calculatedAt: new Date().toISOString(),
      message:
        'No ranking data available. Athletes need erg tests, seat race results, or attendance records.',
    };
  }

  // Normalize each component to [0, 1]
  const normalizedOnWater = normalizeScores(onWaterRatings, 'asc'); // Higher rating = better
  const normalizedErg = normalizeErgScores(ergData);
  const normalizedAttendance = normalizeScores(attendanceData, 'asc'); // Higher attendance = better

  // Calculate composite for each athlete
  const rankings = athletes.map((athlete) => {
    const onWater = normalizedOnWater.get(athlete.id) || { score: 0, dataPoints: 0, confidence: 0 };
    const erg = normalizedErg.get(athlete.id) || { score: 0, dataPoints: 0, confidence: 0 };
    const attendance = normalizedAttendance.get(athlete.id) || {
      score: 0,
      dataPoints: 0,
      confidence: 0,
    };

    const compositeScore =
      onWater.score * weights.onWater +
      erg.score * weights.erg +
      attendance.score * weights.attendance;

    const breakdown = [
      {
        source: 'onWater',
        rawScore: onWater.raw || 0,
        normalizedScore: onWater.score,
        weight: weights.onWater,
        contribution: onWater.score * weights.onWater,
        dataPoints: onWater.dataPoints,
        confidence: onWater.confidence,
      },
      {
        source: 'erg',
        rawScore: erg.raw || 0,
        normalizedScore: erg.score,
        weight: weights.erg,
        contribution: erg.score * weights.erg,
        dataPoints: erg.dataPoints,
        confidence: erg.confidence,
      },
      {
        source: 'attendance',
        rawScore: attendance.raw || 0,
        normalizedScore: attendance.score,
        weight: weights.attendance,
        contribution: attendance.score * weights.attendance,
        dataPoints: attendance.dataPoints,
        confidence: attendance.confidence,
      },
    ];

    const overallConfidence = Math.min(onWater.confidence, erg.confidence, attendance.confidence);

    return {
      athleteId: athlete.id,
      athlete: {
        id: athlete.id,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        side: athlete.side,
      },
      compositeScore,
      breakdown,
      overallConfidence,
      lastUpdated: new Date().toISOString(),
    };
  });

  // Single athlete special case: no normalization possible
  if (allAthleteIds.size === 1) {
    const singleRanking = rankings[0];
    if (singleRanking) {
      singleRanking.rank = 1;
      singleRanking.note = 'Single athlete — scores are not normalized';
    }
    return {
      teamId,
      profile,
      rankings,
      calculatedAt: new Date().toISOString(),
      message: 'Single athlete with data — normalization not applicable',
    };
  }

  // Sort by composite score (descending), tie-break by on-water
  rankings.sort((a, b) => {
    if (Math.abs(a.compositeScore - b.compositeScore) < 0.001) {
      // Tie-break by on-water contribution
      const aOnWater = a.breakdown.find((c) => c.source === 'onWater')?.rawScore || 0;
      const bOnWater = b.breakdown.find((c) => c.source === 'onWater')?.rawScore || 0;
      return bOnWater - aOnWater;
    }
    return b.compositeScore - a.compositeScore;
  });

  // Assign ranks
  rankings.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  return {
    teamId,
    profile,
    rankings,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Normalize scores to [0, 1] range using z-scores + sigmoid
 */
export function normalizeScores(dataMap, direction = 'asc') {
  const normalized = new Map();

  if (dataMap.size === 0) return normalized;

  const values = Array.from(dataMap.values()).map((d) => d.value);

  if (values.length === 0) return normalized;

  const avg = mean(values);
  const std = values.length > 1 ? standardDeviation(values) : 0;
  const insufficientData = values.length === 1;

  dataMap.forEach((data, athleteId) => {
    let z = std > 0 ? (data.value - avg) / std : 0;

    // If lower is better (like times), flip the z-score
    if (direction === 'desc') z = -z;

    // Sigmoid to [0, 1]
    const score = 1 / (1 + Math.exp(-z));

    // Confidence based on data points
    const confidence = Math.min(1, data.dataPoints / 5);

    const result = {
      score,
      raw: data.value,
      dataPoints: data.dataPoints,
      confidence,
    };

    // Add metadata for single-value normalization
    if (insufficientData) {
      result.note = 'insufficient data for normalization';
    }

    normalized.set(athleteId, result);
  });

  return normalized;
}

// ============================================
// DATA FETCHING HELPERS
// ============================================

/**
 * Get on-water (ELO) ratings for composite ranking
 */
async function getOnWaterRatings(teamId) {
  const ratings = await getTeamRankings(teamId, { ratingType: 'seat_race_elo' });

  const dataMap = new Map();
  for (const rating of ratings) {
    dataMap.set(rating.athleteId, {
      value: Number(rating.ratingValue),
      dataPoints: rating.racesCount || 0,
    });
  }

  return dataMap;
}

/**
 * Get erg performance data with test type weighting
 */
async function getErgPerformanceData(teamId) {
  // Get recent erg tests (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const ergTests = await prisma.ergTest.findMany({
    where: {
      athlete: { teamId },
      testDate: { gte: ninetyDaysAgo },
    },
    include: {
      athlete: { select: { id: true } },
    },
  });

  // Group by athlete and calculate weighted score
  const athleteData = new Map();

  for (const test of ergTests) {
    const athleteId = test.athlete.id;
    const testType = test.testType?.toLowerCase() || 'unknown';
    const weight = ERG_TEST_WEIGHTS[testType] || 0.5;

    // Convert time to watts (approximate) for comparison
    // Lower time = better = higher "score"
    const timeSeconds = Number(test.timeSeconds) || 0;
    const score = timeSeconds > 0 ? 1000 / timeSeconds : 0; // Inverse time as score

    if (!athleteData.has(athleteId)) {
      athleteData.set(athleteId, { totalWeight: 0, weightedSum: 0, dataPoints: 0 });
    }

    const data = athleteData.get(athleteId);
    data.weightedSum += score * weight;
    data.totalWeight += weight;
    data.dataPoints += 1;
  }

  // Calculate weighted average for each athlete
  const result = new Map();
  athleteData.forEach((data, athleteId) => {
    const avgScore = data.totalWeight > 0 ? data.weightedSum / data.totalWeight : 0;
    result.set(athleteId, {
      value: avgScore,
      dataPoints: data.dataPoints,
    });
  });

  return result;
}

/**
 * Get attendance data (30-day rolling window)
 */
async function getAttendanceData(teamId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const attendance = await prisma.attendance.findMany({
    where: {
      athlete: { teamId },
      date: { gte: thirtyDaysAgo },
    },
    include: {
      athlete: { select: { id: true } },
    },
  });

  // Group by athlete and calculate attendance rate
  const athleteData = new Map();

  for (const record of attendance) {
    const athleteId = record.athlete.id;

    if (!athleteData.has(athleteId)) {
      athleteData.set(athleteId, { present: 0, total: 0 });
    }

    const data = athleteData.get(athleteId);
    data.total += 1;
    if (record.status === 'present' || record.status === 'late') {
      data.present += 1;
    }
  }

  // Calculate attendance rate for each athlete
  const result = new Map();
  athleteData.forEach((data, athleteId) => {
    const rate = data.total > 0 ? data.present / data.total : 0;
    result.set(athleteId, {
      value: rate,
      dataPoints: data.total,
    });
  });

  return result;
}

/**
 * Normalize erg scores (lower time = better)
 */
function normalizeErgScores(dataMap) {
  return normalizeScores(dataMap, 'asc'); // Higher inverse-time = better
}

export default {
  DEFAULT_WEIGHT_PROFILES,
  getWeightProfile,
  calculateCompositeRankings,
  normalizeScores,
};

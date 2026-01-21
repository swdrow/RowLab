import { prisma } from '../db/connection.js';

// Constants for score normalization and weighting
const ERG_WEIGHT = 0.4;
const ELO_WEIGHT = 0.3;
const TELEMETRY_WEIGHT = 0.3;

// Test type weights for erg score calculation
const TEST_TYPE_WEIGHTS = {
  '2k': 1.0,
  '6k': 0.8,
  '30min': 0.6,
  '500m': 0.4,
};

// Reference splits for normalization (seconds per 500m)
// These represent elite-level benchmarks for 0-100 scaling
const REFERENCE_SPLITS = {
  '2k': { elite: 85, baseline: 130 },    // 1:25 elite, 2:10 baseline
  '6k': { elite: 95, baseline: 140 },    // 1:35 elite, 2:20 baseline
  '30min': { elite: 95, baseline: 140 }, // 1:35 elite, 2:20 baseline
  '500m': { elite: 75, baseline: 110 },  // 1:15 elite, 1:50 baseline
};

// Default Elo rating
const DEFAULT_ELO = 1000;

/**
 * Calculate normalized erg score for an athlete
 * @param {string} athleteId - Athlete UUID
 * @returns {Promise<Object>} { score, testCount, lastTestDate }
 */
export async function calculateErgScore(athleteId) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const tests = await prisma.ergTest.findMany({
    where: {
      athleteId,
      testDate: {
        gte: sixMonthsAgo,
      },
    },
    orderBy: { testDate: 'desc' },
  });

  if (tests.length === 0) {
    return { score: null, testCount: 0, lastTestDate: null };
  }

  let weightedSum = 0;
  let totalWeight = 0;

  for (const test of tests) {
    const testType = test.testType;
    const typeWeight = TEST_TYPE_WEIGHTS[testType] || 0.5;
    const reference = REFERENCE_SPLITS[testType] || { elite: 90, baseline: 130 };

    // Get split seconds (calculate from time if not stored)
    let splitSeconds;
    if (test.splitSeconds) {
      splitSeconds = Number(test.splitSeconds);
    } else if (test.distanceM && test.timeSeconds) {
      // Calculate split from distance and time
      splitSeconds = (Number(test.timeSeconds) / test.distanceM) * 500;
    } else {
      continue; // Skip if we can't calculate split
    }

    // Normalize split to 0-100 scale (lower split = higher score)
    // Score = 100 when split equals elite reference
    // Score = 0 when split equals baseline reference
    const normalizedScore = Math.max(
      0,
      Math.min(
        100,
        ((reference.baseline - splitSeconds) / (reference.baseline - reference.elite)) * 100
      )
    );

    // Apply recency weighting (more recent tests count more)
    const daysSinceTest = (Date.now() - new Date(test.testDate).getTime()) / (1000 * 60 * 60 * 24);
    const recencyWeight = Math.max(0.5, 1 - daysSinceTest / 180); // Decay over 6 months, minimum 0.5

    const combinedWeight = typeWeight * recencyWeight;
    weightedSum += normalizedScore * combinedWeight;
    totalWeight += combinedWeight;
  }

  const score = totalWeight > 0 ? weightedSum / totalWeight : null;

  return {
    score: score !== null ? Math.round(score * 100) / 100 : null,
    testCount: tests.length,
    lastTestDate: tests[0]?.testDate || null,
  };
}

/**
 * Get current Elo rating for an athlete from seat racing
 * @param {string} athleteId - Athlete UUID
 * @returns {Promise<Object>} { elo, confidence, racesCount }
 */
export async function getSeatRaceElo(athleteId) {
  const rating = await prisma.athleteRating.findUnique({
    where: {
      athleteId_ratingType: {
        athleteId,
        ratingType: 'seat_race_elo',
      },
    },
  });

  if (!rating) {
    return {
      elo: DEFAULT_ELO,
      confidence: 0,
      racesCount: 0,
    };
  }

  return {
    elo: Number(rating.ratingValue),
    confidence: rating.confidenceScore ? Number(rating.confidenceScore) : 0,
    racesCount: rating.racesCount,
  };
}

/**
 * Calculate telemetry-based score from recent on-water sessions
 * @param {string} athleteId - Athlete UUID
 * @returns {Promise<Object>} { score, sessionCount }
 */
export async function calculateTelemetryScore(athleteId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const telemetryData = await prisma.athleteTelemetry.findMany({
    where: {
      athleteId,
      sessionDate: {
        gte: thirtyDaysAgo,
      },
    },
    orderBy: { sessionDate: 'desc' },
  });

  if (telemetryData.length === 0) {
    return { score: null, sessionCount: 0 };
  }

  let weightedWattsSum = 0;
  let weightedTechSum = 0;
  let weightedConsistencySum = 0;
  let totalWeight = 0;

  // Collect all watts values for consistency calculation
  const allWatts = telemetryData
    .filter((t) => t.avgWatts !== null)
    .map((t) => Number(t.avgWatts));

  // Calculate consistency score based on coefficient of variation
  let consistencyScore = 50; // Default mid-range score
  if (allWatts.length >= 2) {
    const mean = allWatts.reduce((a, b) => a + b, 0) / allWatts.length;
    const variance = allWatts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allWatts.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 0;
    // Lower CV = higher consistency score (CV of 0 = 100, CV of 0.2 = 0)
    consistencyScore = Math.max(0, Math.min(100, (1 - cv / 0.2) * 100));
  }

  for (const session of telemetryData) {
    // Calculate recency weight (more recent = higher weight)
    const daysSinceSession =
      (Date.now() - new Date(session.sessionDate).getTime()) / (1000 * 60 * 60 * 24);
    const recencyWeight = Math.max(0.3, 1 - daysSinceSession / 30);

    // Normalize avgWatts to 0-100 scale (assume 100-400 watts range)
    const wattsScore =
      session.avgWatts !== null
        ? Math.max(0, Math.min(100, ((Number(session.avgWatts) - 100) / 300) * 100))
        : null;

    // Tech score is already 0-100
    const techScore = session.techScore !== null ? Number(session.techScore) : null;

    if (wattsScore !== null) {
      weightedWattsSum += wattsScore * recencyWeight;
    }
    if (techScore !== null) {
      weightedTechSum += techScore * recencyWeight;
    }
    weightedConsistencySum += consistencyScore * recencyWeight;
    totalWeight += recencyWeight;
  }

  if (totalWeight === 0) {
    return { score: null, sessionCount: telemetryData.length };
  }

  // Combine metrics with weights: avgWatts (40%), techScore (30%), consistency (30%)
  const avgWattsComponent = (weightedWattsSum / totalWeight) * 0.4;
  const techScoreComponent = (weightedTechSum / totalWeight) * 0.3;
  const consistencyComponent = (weightedConsistencySum / totalWeight) * 0.3;

  // Handle missing components by redistributing weights
  let score = 0;
  let usedWeight = 0;

  if (weightedWattsSum > 0) {
    score += avgWattsComponent;
    usedWeight += 0.4;
  }
  if (weightedTechSum > 0) {
    score += techScoreComponent;
    usedWeight += 0.3;
  }
  if (weightedConsistencySum > 0) {
    score += consistencyComponent;
    usedWeight += 0.3;
  }

  // Normalize if we're missing some components
  const finalScore = usedWeight > 0 ? (score / usedWeight) * 100 : null;

  return {
    score: finalScore !== null ? Math.round(finalScore * 100) / 100 : null,
    sessionCount: telemetryData.length,
  };
}

/**
 * Calculate combined score from all data sources
 * @param {string} athleteId - Athlete UUID
 * @returns {Promise<Object>} Combined score with breakdown
 */
export async function calculateCombinedScore(athleteId) {
  // Get the athlete to find their teamId
  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
    select: { id: true, teamId: true },
  });

  if (!athlete) {
    throw new Error('Athlete not found');
  }

  // Calculate all component scores
  const [ergResult, eloResult, telemetryResult] = await Promise.all([
    calculateErgScore(athleteId),
    getSeatRaceElo(athleteId),
    calculateTelemetryScore(athleteId),
  ]);

  // Normalize Elo to 0-100 scale (assume range of 600-1400)
  const eloScore =
    eloResult.elo !== null
      ? Math.max(0, Math.min(100, ((eloResult.elo - 600) / 800) * 100))
      : null;

  // Calculate available weights and redistribute
  let availableWeights = {
    erg: ergResult.score !== null ? ERG_WEIGHT : 0,
    elo: eloScore !== null && eloResult.racesCount > 0 ? ELO_WEIGHT : 0,
    telemetry: telemetryResult.score !== null ? TELEMETRY_WEIGHT : 0,
  };

  const totalAvailableWeight =
    availableWeights.erg + availableWeights.elo + availableWeights.telemetry;

  if (totalAvailableWeight === 0) {
    return {
      combined: null,
      ergScore: ergResult,
      eloScore: {
        score: eloScore,
        raw: eloResult,
      },
      telemetryScore: telemetryResult,
      breakdown: {
        hasData: false,
        message: 'No scoring data available',
      },
    };
  }

  // Normalize weights to sum to 1
  const normalizedWeights = {
    erg: availableWeights.erg / totalAvailableWeight,
    elo: availableWeights.elo / totalAvailableWeight,
    telemetry: availableWeights.telemetry / totalAvailableWeight,
  };

  // Calculate weighted combined score
  let combinedScore = 0;
  if (ergResult.score !== null) {
    combinedScore += ergResult.score * normalizedWeights.erg;
  }
  if (eloScore !== null && eloResult.racesCount > 0) {
    combinedScore += eloScore * normalizedWeights.elo;
  }
  if (telemetryResult.score !== null) {
    combinedScore += telemetryResult.score * normalizedWeights.telemetry;
  }

  combinedScore = Math.round(combinedScore * 100) / 100;

  // Store the combined score in AthleteRating
  await prisma.athleteRating.upsert({
    where: {
      athleteId_ratingType: {
        athleteId,
        ratingType: 'combined',
      },
    },
    create: {
      athleteId,
      teamId: athlete.teamId,
      ratingType: 'combined',
      ratingValue: combinedScore,
      confidenceScore: totalAvailableWeight,
      racesCount: 0,
      lastCalculatedAt: new Date(),
    },
    update: {
      ratingValue: combinedScore,
      confidenceScore: totalAvailableWeight,
      lastCalculatedAt: new Date(),
    },
  });

  return {
    combined: combinedScore,
    ergScore: ergResult,
    eloScore: {
      score: eloScore,
      raw: eloResult,
    },
    telemetryScore: telemetryResult,
    breakdown: {
      hasData: true,
      weights: {
        original: { erg: ERG_WEIGHT, elo: ELO_WEIGHT, telemetry: TELEMETRY_WEIGHT },
        applied: normalizedWeights,
        available: availableWeights,
      },
      contributions: {
        erg: ergResult.score !== null ? ergResult.score * normalizedWeights.erg : 0,
        elo: eloScore !== null && eloResult.racesCount > 0 ? eloScore * normalizedWeights.elo : 0,
        telemetry:
          telemetryResult.score !== null ? telemetryResult.score * normalizedWeights.telemetry : 0,
      },
    },
  };
}

/**
 * Batch recalculate combined scores for all athletes on a team
 * @param {string} teamId - Team UUID
 * @returns {Promise<Object>} { updated: number, errors: [] }
 */
export async function recalculateTeamScores(teamId) {
  const athletes = await prisma.athlete.findMany({
    where: { teamId },
    select: { id: true },
  });

  let updated = 0;
  const errors = [];

  for (const athlete of athletes) {
    try {
      await calculateCombinedScore(athlete.id);
      updated++;
    } catch (error) {
      errors.push({
        athleteId: athlete.id,
        error: error.message,
      });
    }
  }

  return { updated, errors };
}

/**
 * Get team rankings based on combined scores
 * @param {string} teamId - Team UUID
 * @returns {Promise<Array>} Ranked list of athletes with scores
 */
export async function getTeamRankingsByCombined(teamId) {
  const ratings = await prisma.athleteRating.findMany({
    where: {
      teamId,
      ratingType: 'combined',
    },
    include: {
      athlete: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          side: true,
        },
      },
    },
    orderBy: {
      ratingValue: 'desc',
    },
  });

  // Batch fetch all athlete IDs for component scores
  const athleteIds = ratings.map(r => r.athleteId);

  // Batch fetch erg scores
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const allErgTests = await prisma.ergTest.findMany({
    where: {
      athleteId: { in: athleteIds },
      testDate: { gte: sixMonthsAgo },
    },
    orderBy: { testDate: 'desc' },
  });

  // Batch fetch elo ratings
  const allEloRatings = await prisma.athleteRating.findMany({
    where: {
      athleteId: { in: athleteIds },
      ratingType: 'seat_race_elo',
    },
  });

  // Batch fetch telemetry data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const allTelemetry = await prisma.athleteTelemetry.findMany({
    where: {
      athleteId: { in: athleteIds },
      sessionDate: { gte: thirtyDaysAgo },
    },
    orderBy: { sessionDate: 'desc' },
  });

  // Group data by athlete ID
  const ergTestsByAthlete = new Map();
  const eloRatingsByAthlete = new Map();
  const telemetryByAthlete = new Map();

  allErgTests.forEach(test => {
    if (!ergTestsByAthlete.has(test.athleteId)) {
      ergTestsByAthlete.set(test.athleteId, []);
    }
    ergTestsByAthlete.get(test.athleteId).push(test);
  });

  allEloRatings.forEach(rating => {
    eloRatingsByAthlete.set(rating.athleteId, rating);
  });

  allTelemetry.forEach(telem => {
    if (!telemetryByAthlete.has(telem.athleteId)) {
      telemetryByAthlete.set(telem.athleteId, []);
    }
    telemetryByAthlete.get(telem.athleteId).push(telem);
  });

  // Process each athlete with batched data
  const rankedAthletes = ratings.map((rating, index) => {
    // Process erg score from cached data
    const tests = ergTestsByAthlete.get(rating.athleteId) || [];
    const ergResult = { score: null, testCount: tests.length, lastTestDate: tests[0]?.testDate || null };

    // Process elo from cached data
    const eloRating = eloRatingsByAthlete.get(rating.athleteId);
    const eloResult = eloRating
      ? { elo: Number(eloRating.ratingValue), confidence: Number(eloRating.confidenceScore || 0), racesCount: eloRating.racesCount }
      : { elo: 1000, confidence: 0, racesCount: 0 };

    // Process telemetry from cached data
    const telemetryData = telemetryByAthlete.get(rating.athleteId) || [];
    const telemetryResult = { score: null, sessionCount: telemetryData.length };

    // Normalize Elo to 0-100 scale
    const eloScore = eloResult.elo !== null
      ? Math.max(0, Math.min(100, ((eloResult.elo - 600) / 800) * 100))
      : null;

    return {
      rank: index + 1,
      athleteId: rating.athleteId,
      athlete: {
        id: rating.athlete.id,
        name: `${rating.athlete.firstName} ${rating.athlete.lastName}`,
        firstName: rating.athlete.firstName,
        lastName: rating.athlete.lastName,
        side: rating.athlete.side,
      },
      combinedScore: Number(rating.ratingValue),
      confidence: rating.confidenceScore ? Number(rating.confidenceScore) : null,
      lastCalculatedAt: rating.lastCalculatedAt,
      breakdown: {
        ergScore: ergResult.score,
        ergTestCount: ergResult.testCount,
        eloScore: eloScore,
        eloRaw: eloResult.elo,
        eloConfidence: eloResult.confidence,
        eloRacesCount: eloResult.racesCount,
        telemetryScore: telemetryResult.score,
        telemetrySessionCount: telemetryResult.sessionCount,
      },
    };
  });

  return rankedAthletes;
}

export default {
  calculateErgScore,
  getSeatRaceElo,
  calculateTelemetryScore,
  calculateCombinedScore,
  recalculateTeamScores,
  getTeamRankingsByCombined,
};

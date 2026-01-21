import prisma from '../db/connection.js';

// Boat class baselines for 2000m races
const BOAT_BASELINES = {
  '8+': { time2k: 360, seats: 8, hasCox: true },
  '4+': { time2k: 390, seats: 4, hasCox: true },
  '4-': { time2k: 380, seats: 4, hasCox: false },
  '2-': { time2k: 420, seats: 2, hasCox: false },
  '1x': { time2k: 450, seats: 1, hasCox: false }
};

// Course type multipliers relative to 2000m
const COURSE_FACTORS = {
  '2000m': 1.0,
  '1500m': 0.75,
  '1000m': 0.5,
  'head': 1.8  // ~3600m head race
};

/**
 * Get baseline time for a boat class and course type
 * @param {string} boatClass - Boat class (e.g., '8+', '4+')
 * @param {string} courseType - Course type (e.g., '2000m', 'head')
 * @returns {number} Baseline time in seconds
 */
export function getBaselineTime(boatClass, courseType = '2000m') {
  const baseline = BOAT_BASELINES[boatClass];
  if (!baseline) {
    throw new Error(`Unknown boat class: ${boatClass}`);
  }

  const courseFactor = COURSE_FACTORS[courseType] || 1.0;
  return baseline.time2k * courseFactor;
}

/**
 * Calculate speed factor - seconds saved per combined score point
 * @param {string} boatClass - Boat class
 * @returns {number} Speed factor (seconds per point)
 */
export function calculateSpeedFactor(boatClass) {
  const baseline = BOAT_BASELINES[boatClass];
  if (!baseline) {
    return 0.75; // Default factor
  }

  // Larger boats have more cumulative effect from athlete scores
  // but individual contribution is diluted
  // Single sculler: 1.0 sec/point (full individual impact)
  // Eight: 0.5 sec/point (diluted across 8 rowers)
  const factors = {
    '8+': 0.5,
    '4+': 0.65,
    '4-': 0.7,
    '2-': 0.85,
    '1x': 1.0
  };

  return factors[boatClass] || 0.75;
}

/**
 * Calculate confidence interval for a prediction
 * @param {number} prediction - Predicted time in seconds
 * @param {number} sampleSize - Number of data points
 * @param {number} variability - Score variability (std dev)
 * @returns {{ lower: number, upper: number }} 95% confidence interval
 */
export function getConfidenceInterval(prediction, sampleSize, variability = 5) {
  // Standard error approach for 95% CI
  // SE = variability / sqrt(n)
  // CI = prediction +/- 1.96 * SE * speedFactor

  const n = Math.max(sampleSize, 1);
  const standardError = variability / Math.sqrt(n);

  // Convert score variability to time variability
  // Assume ~0.75 seconds per point on average
  const timeVariability = standardError * 0.75;

  // 95% CI uses z-score of 1.96
  const margin = 1.96 * timeVariability;

  return {
    lower: Math.max(0, prediction - margin),
    upper: prediction + margin
  };
}

/**
 * Get combined scores for athletes
 * @param {number[]} athleteIds - Array of athlete IDs
 * @returns {Promise<{ scores: number[], average: number, variability: number }>}
 */
async function getAthleteScores(athleteIds) {
  const athletes = await prisma.athlete.findMany({
    where: {
      id: { in: athleteIds }
    },
    include: {
      ratings: {
        where: { ratingType: 'combined' },
        select: { ratingValue: true },
        take: 1
      }
    }
  });

  const scores = athletes
    .map(a => a.ratings?.[0]?.ratingValue)
    .filter(s => s !== null && s !== undefined)
    .map(s => Number(s));

  if (scores.length === 0) {
    return { scores: [], average: 50, variability: 10 }; // Default values
  }

  const average = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Calculate standard deviation for variability
  const squaredDiffs = scores.map(s => Math.pow(s - average, 2));
  const variability = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / scores.length);

  return { scores, average, variability };
}

/**
 * Predict race time for an existing lineup
 * @param {number} lineupId - Lineup ID
 * @param {string} courseType - Course type (default: '2000m')
 * @returns {Promise<{ predictedTimeSeconds: number, confidenceRange: { lower: number, upper: number }, breakdown: object }>}
 */
export async function predictRaceTime(lineupId, courseType = '2000m') {
  // Get lineup with athletes and shell info
  const lineup = await prisma.lineup.findUnique({
    where: { id: lineupId },
    include: {
      athletes: {
        include: {
          athlete: {
            select: {
              id: true,
              combinedScore: true,
              firstName: true,
              lastName: true
            }
          }
        }
      },
      shell: {
        select: {
          boatClass: true,
          name: true
        }
      }
    }
  });

  if (!lineup) {
    throw new Error(`Lineup not found: ${lineupId}`);
  }

  const boatClass = lineup.shell?.boatClass || '8+';
  const athleteIds = lineup.athletes.map(la => la.athlete.id);

  // Get scores
  const { scores, average, variability } = await getAthleteScores(athleteIds);

  // Calculate prediction
  const baseTime = getBaselineTime(boatClass, courseType);
  const speedFactor = calculateSpeedFactor(boatClass);

  // Higher combined score = faster (lower time)
  // Normalize around 50 (average score)
  const scoreAdjustment = (average - 50) * speedFactor;
  const predictedTimeSeconds = baseTime - scoreAdjustment;

  // Calculate confidence interval
  const confidenceRange = getConfidenceInterval(
    predictedTimeSeconds,
    scores.length,
    variability
  );

  return {
    predictedTimeSeconds: Math.round(predictedTimeSeconds * 10) / 10,
    confidenceRange: {
      lower: Math.round(confidenceRange.lower * 10) / 10,
      upper: Math.round(confidenceRange.upper * 10) / 10
    },
    breakdown: {
      boatClass,
      courseType,
      baseTime,
      averageCombinedScore: Math.round(average * 10) / 10,
      speedFactor,
      scoreAdjustment: Math.round(scoreAdjustment * 10) / 10,
      athleteCount: athleteIds.length,
      scoredAthleteCount: scores.length
    }
  };
}

/**
 * Predict race time from athlete IDs without existing lineup
 * @param {number[]} athleteIds - Array of athlete IDs
 * @param {string} boatClass - Boat class
 * @param {string} courseType - Course type
 * @returns {Promise<{ predictedTimeSeconds: number, confidenceRange: { lower: number, upper: number }, breakdown: object }>}
 */
export async function predictFromAthletes(athleteIds, boatClass = '8+', courseType = '2000m') {
  // Validate boat class
  if (!BOAT_BASELINES[boatClass]) {
    throw new Error(`Unknown boat class: ${boatClass}`);
  }

  // Get scores
  const { scores, average, variability } = await getAthleteScores(athleteIds);

  // Calculate prediction
  const baseTime = getBaselineTime(boatClass, courseType);
  const speedFactor = calculateSpeedFactor(boatClass);

  // Higher combined score = faster (lower time)
  const scoreAdjustment = (average - 50) * speedFactor;
  const predictedTimeSeconds = baseTime - scoreAdjustment;

  // Calculate confidence interval
  const confidenceRange = getConfidenceInterval(
    predictedTimeSeconds,
    scores.length,
    variability
  );

  return {
    predictedTimeSeconds: Math.round(predictedTimeSeconds * 10) / 10,
    confidenceRange: {
      lower: Math.round(confidenceRange.lower * 10) / 10,
      upper: Math.round(confidenceRange.upper * 10) / 10
    },
    breakdown: {
      boatClass,
      courseType,
      baseTime,
      averageCombinedScore: Math.round(average * 10) / 10,
      speedFactor,
      scoreAdjustment: Math.round(scoreAdjustment * 10) / 10,
      athleteCount: athleteIds.length,
      scoredAthleteCount: scores.length
    }
  };
}

/**
 * Compare two lineups head-to-head
 * @param {number[]} lineup1Athletes - Athlete IDs for lineup 1
 * @param {number[]} lineup2Athletes - Athlete IDs for lineup 2
 * @param {string} boatClass - Boat class
 * @param {string} courseType - Course type
 * @returns {Promise<{ lineup1Time: number, lineup2Time: number, marginSeconds: number, favoredLineup: number, confidence: string }>}
 */
export async function compareLineups(lineup1Athletes, lineup2Athletes, boatClass = '8+', courseType = '2000m') {
  // Get predictions for both lineups
  const [prediction1, prediction2] = await Promise.all([
    predictFromAthletes(lineup1Athletes, boatClass, courseType),
    predictFromAthletes(lineup2Athletes, boatClass, courseType)
  ]);

  const lineup1Time = prediction1.predictedTimeSeconds;
  const lineup2Time = prediction2.predictedTimeSeconds;
  const marginSeconds = Math.abs(lineup1Time - lineup2Time);
  const favoredLineup = lineup1Time < lineup2Time ? 1 : lineup1Time > lineup2Time ? 2 : 0;

  // Determine confidence based on margin relative to confidence intervals
  // If margin is outside both confidence intervals, high confidence
  // If margin is within intervals, lower confidence
  const avgUncertainty = (
    (prediction1.confidenceRange.upper - prediction1.confidenceRange.lower) +
    (prediction2.confidenceRange.upper - prediction2.confidenceRange.lower)
  ) / 4; // Average half-width

  let confidence;
  if (marginSeconds > avgUncertainty * 2) {
    confidence = 'high';
  } else if (marginSeconds > avgUncertainty) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    lineup1Time,
    lineup2Time,
    marginSeconds: Math.round(marginSeconds * 10) / 10,
    favoredLineup,
    confidence,
    lineup1Breakdown: prediction1.breakdown,
    lineup2Breakdown: prediction2.breakdown
  };
}

export default {
  predictRaceTime,
  predictFromAthletes,
  compareLineups,
  getConfidenceInterval,
  getBaselineTime,
  calculateSpeedFactor
};

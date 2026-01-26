import prisma from '../db/connection.js';

// Constants
const DEFAULT_RATING = 1000;
const K_FACTOR = 32;

/**
 * Calculate expected win probability using Elo formula
 * @param {number} ratingA - Rating of player A
 * @param {number} ratingB - Rating of player B
 * @returns {number} Expected score for player A (0-1)
 */
export function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate new rating using standard Elo update formula
 * @param {number} currentRating - Current rating
 * @param {number} expectedScore - Expected score (0-1)
 * @param {number} actualScore - Actual score (1=win, 0=loss, 0.5=draw)
 * @param {number} k - K-factor for rating adjustment
 * @returns {number} New rating
 */
export function calculateNewRating(currentRating, expectedScore, actualScore, k) {
  return currentRating + k * (actualScore - expectedScore);
}

/**
 * Get or create an athlete rating from the database
 * @param {string} athleteId - Athlete UUID
 * @param {string} teamId - Team UUID
 * @param {string} ratingType - Type of rating (e.g., 'seat_race_elo')
 * @returns {Promise<Object>} Rating record
 */
export async function getOrCreateRating(athleteId, teamId, ratingType = 'seat_race_elo') {
  let rating = await prisma.athleteRating.findUnique({
    where: {
      athleteId_ratingType: {
        athleteId,
        ratingType,
      },
    },
  });

  if (!rating) {
    rating = await prisma.athleteRating.create({
      data: {
        athleteId,
        teamId,
        ratingType,
        ratingValue: DEFAULT_RATING,
        confidenceScore: 0,
        racesCount: 0,
        lastCalculatedAt: new Date(),
      },
    });
  }

  return rating;
}

/**
 * Update ratings for two athletes after a seat race
 * @param {string} teamId - Team UUID
 * @param {string} athlete1Id - First athlete UUID
 * @param {string} athlete2Id - Second athlete UUID
 * @param {number} performanceDiff - Time difference in seconds (positive = athlete1 faster)
 * @param {Object|string} options - Options object or ratingType string (for backward compatibility)
 * @param {string} options.ratingType - Type of rating (default: 'seat_race_elo')
 * @param {number} options.weight - Weight factor for K adjustment (default: 1.0)
 * @returns {Promise<Object>} Object containing old and new ratings for both athletes
 */
export async function updateRatingsFromSeatRace(
  teamId,
  athlete1Id,
  athlete2Id,
  performanceDiff,
  options = {}
) {
  // Backward compatibility: if options is a string, treat it as ratingType
  const ratingType = typeof options === 'string' ? options : (options.ratingType || 'seat_race_elo');
  const weightFactor = typeof options === 'object' ? (options.weight || 1.0) : 1.0;
  // Get current ratings
  const rating1 = await getOrCreateRating(athlete1Id, teamId, ratingType);
  const rating2 = await getOrCreateRating(athlete2Id, teamId, ratingType);

  const oldRating1 = Number(rating1.ratingValue);
  const oldRating2 = Number(rating2.ratingValue);

  // Determine actual scores based on performance difference
  // Draw if difference is less than 0.5 seconds
  let score1, score2;
  if (Math.abs(performanceDiff) < 0.5) {
    score1 = 0.5;
    score2 = 0.5;
  } else if (performanceDiff > 0) {
    // Athlete 1 won (faster)
    score1 = 1;
    score2 = 0;
  } else {
    // Athlete 2 won (faster)
    score1 = 0;
    score2 = 1;
  }

  // Calculate expected scores
  const expected1 = expectedScore(oldRating1, oldRating2);
  const expected2 = expectedScore(oldRating2, oldRating1);

  // Scale K factor by margin of victory
  // marginFactor scales from 1 (close race) to 2 (5+ second margin)
  const marginFactor = Math.min(2, 1 + Math.abs(performanceDiff) / 5);
  // Apply weight factor (used for passive observations with reduced impact)
  const adjustedK = K_FACTOR * marginFactor * weightFactor;

  // Calculate new ratings
  const newRating1 = calculateNewRating(oldRating1, expected1, score1, adjustedK);
  const newRating2 = calculateNewRating(oldRating2, expected2, score2, adjustedK);

  // Update both ratings in the database
  const [updatedRating1, updatedRating2] = await prisma.$transaction([
    prisma.athleteRating.update({
      where: { id: rating1.id },
      data: {
        ratingValue: newRating1,
        racesCount: rating1.racesCount + 1,
        confidenceScore: Math.min(1, (rating1.racesCount + 1) / 10),
        lastCalculatedAt: new Date(),
      },
    }),
    prisma.athleteRating.update({
      where: { id: rating2.id },
      data: {
        ratingValue: newRating2,
        racesCount: rating2.racesCount + 1,
        confidenceScore: Math.min(1, (rating2.racesCount + 1) / 10),
        lastCalculatedAt: new Date(),
      },
    }),
  ]);

  return {
    athlete1: {
      athleteId: athlete1Id,
      oldRating: oldRating1,
      newRating: newRating1,
      score: score1,
      racesCount: updatedRating1.racesCount,
      confidenceScore: Number(updatedRating1.confidenceScore),
    },
    athlete2: {
      athleteId: athlete2Id,
      oldRating: oldRating2,
      newRating: newRating2,
      score: score2,
      racesCount: updatedRating2.racesCount,
      confidenceScore: Number(updatedRating2.confidenceScore),
    },
    performanceDiff,
    marginFactor,
    adjustedK,
  };
}

/**
 * Get ranked list of athletes with their ratings
 * @param {string} teamId - Team UUID
 * @param {Object} options - Query options
 * @param {string} options.ratingType - Type of rating to retrieve (default: 'seat_race_elo')
 * @param {number} options.minRaces - Minimum number of races to include athlete (default: 0)
 * @returns {Promise<Array>} Ranked list of athletes with ratings
 */
export async function getTeamRankings(teamId, options = {}) {
  const { ratingType = 'seat_race_elo', minRaces = 0 } = options;

  const ratings = await prisma.athleteRating.findMany({
    where: {
      teamId,
      ratingType,
      racesCount: {
        gte: minRaces,
      },
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

  return ratings.map((rating, index) => ({
    rank: index + 1,
    athleteId: rating.athleteId,
    athlete: rating.athlete,
    ratingValue: Number(rating.ratingValue),
    confidenceScore: rating.confidenceScore ? Number(rating.confidenceScore) : null,
    racesCount: rating.racesCount,
    lastCalculatedAt: rating.lastCalculatedAt,
  }));
}

/**
 * Reset and recalculate all ratings from seat race history
 * @param {string} teamId - Team UUID
 * @param {string} ratingType - Type of rating (default: 'seat_race_elo')
 * @returns {Promise<Object>} Summary of recalculation
 */
export async function recalculateAllRatings(teamId, ratingType = 'seat_race_elo') {
  // Delete all existing ratings for this team and type
  await prisma.athleteRating.deleteMany({
    where: {
      teamId,
      ratingType,
    },
  });

  // Get all seat race sessions for the team, ordered by date
  const sessions = await prisma.seatRaceSession.findMany({
    where: { teamId },
    orderBy: { date: 'asc' },
    include: {
      pieces: {
        orderBy: { sequenceOrder: 'asc' },
        include: {
          boats: {
            include: {
              assignments: true,
            },
          },
        },
      },
    },
  });

  let processedRaces = 0;
  const athleteStats = new Map();

  // Process each session
  for (const session of sessions) {
    for (const piece of session.pieces) {
      // Group boats and find head-to-head comparisons
      const boats = piece.boats;

      if (boats.length < 2) continue;

      // For each pair of boats, calculate performance difference
      for (let i = 0; i < boats.length; i++) {
        for (let j = i + 1; j < boats.length; j++) {
          const boatA = boats[i];
          const boatB = boats[j];

          // Skip if no finish times
          if (!boatA.finishTimeSeconds || !boatB.finishTimeSeconds) continue;

          // Calculate adjusted times (with handicap)
          const adjustedTimeA = Number(boatA.finishTimeSeconds) + Number(boatA.handicapSeconds);
          const adjustedTimeB = Number(boatB.finishTimeSeconds) + Number(boatB.handicapSeconds);

          // Find swapped athletes between boats
          const athletesA = boatA.assignments.map(a => a.athleteId);
          const athletesB = boatB.assignments.map(a => a.athleteId);

          // Find athletes who swapped (in one boat but not the other)
          const uniqueToA = athletesA.filter(id => !athletesB.includes(id));
          const uniqueToB = athletesB.filter(id => !athletesA.includes(id));

          // If exactly one athlete swapped in each direction, update their ratings
          if (uniqueToA.length === 1 && uniqueToB.length === 1) {
            const swappedAthleteA = uniqueToA[0];
            const swappedAthleteB = uniqueToB[0];

            // Performance diff: positive means athlete in faster boat
            // Lower time = faster = better
            const performanceDiff = adjustedTimeB - adjustedTimeA;

            await updateRatingsFromSeatRace(
              teamId,
              swappedAthleteA,
              swappedAthleteB,
              performanceDiff,
              ratingType
            );

            processedRaces++;

            // Track stats
            if (!athleteStats.has(swappedAthleteA)) athleteStats.set(swappedAthleteA, 0);
            if (!athleteStats.has(swappedAthleteB)) athleteStats.set(swappedAthleteB, 0);
            athleteStats.set(swappedAthleteA, athleteStats.get(swappedAthleteA) + 1);
            athleteStats.set(swappedAthleteB, athleteStats.get(swappedAthleteB) + 1);
          }
        }
      }
    }
  }

  // Get final rankings
  const finalRankings = await getTeamRankings(teamId, { ratingType });

  return {
    sessionsProcessed: sessions.length,
    racesProcessed: processedRaces,
    athletesRated: athleteStats.size,
    finalRankings,
  };
}

// ============================================
// SIDE-SPECIFIC RATING FUNCTIONS
// ============================================

/**
 * Get or create side-specific rating for an athlete
 * @param {string} athleteId - Athlete UUID
 * @param {string} teamId - Team UUID
 * @param {string} side - 'Port', 'Starboard', or 'Cox'
 * @param {string} baseType - Base rating type (default: 'seat_race_elo')
 * @returns {Promise<Object>} Rating record for the specific side
 */
export async function getOrCreateSideSpecificRating(athleteId, teamId, side, baseType = 'seat_race_elo') {
  const ratingType = `${baseType}_${side.toLowerCase()}`;
  return getOrCreateRating(athleteId, teamId, ratingType);
}

/**
 * Update ratings with automatic side detection from seat position
 * @param {string} teamId - Team UUID
 * @param {string} athlete1Id - First athlete UUID
 * @param {string} athlete2Id - Second athlete UUID
 * @param {string} athlete1Side - Side athlete1 was rowing ('Port', 'Starboard', 'Cox')
 * @param {string} athlete2Side - Side athlete2 was rowing
 * @param {number} performanceDiff - Time difference (positive = athlete1 faster)
 * @returns {Promise<Object>} Updated ratings for both athletes
 */
export async function updateRatingsWithSideDetection(
  teamId,
  athlete1Id,
  athlete2Id,
  athlete1Side,
  athlete2Side,
  performanceDiff
) {
  // Update side-specific ratings
  const ratingType1 = `seat_race_elo_${athlete1Side.toLowerCase()}`;
  const ratingType2 = `seat_race_elo_${athlete2Side.toLowerCase()}`;

  // Update athlete1's rating for their side
  const result1 = await updateRatingsFromSeatRace(
    teamId,
    athlete1Id,
    athlete2Id,
    performanceDiff,
    ratingType1
  );

  // If athletes are on different sides, also update athlete2's side-specific rating
  if (athlete1Side !== athlete2Side) {
    await updateRatingsFromSeatRace(
      teamId,
      athlete2Id,
      athlete1Id,
      -performanceDiff, // Reverse the diff
      ratingType2
    );
  }

  // Also update the combined (non-side-specific) rating for overall ranking
  const combinedResult = await updateRatingsFromSeatRace(
    teamId,
    athlete1Id,
    athlete2Id,
    performanceDiff,
    'seat_race_elo'
  );

  return {
    sideSpecific: result1,
    combined: combinedResult,
    athlete1Side,
    athlete2Side
  };
}

/**
 * Get all side-specific ratings for an athlete
 * @param {string} athleteId - Athlete UUID
 * @param {string} teamId - Team UUID
 * @returns {Promise<Object>} Object with port, starboard, cox ratings
 */
export async function getAthleteSideRatings(athleteId, teamId) {
  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
    select: { side: true }
  });

  const primarySide = athlete?.side || 'Port';

  const ratings = await prisma.athleteRating.findMany({
    where: {
      athleteId,
      teamId,
      ratingType: {
        startsWith: 'seat_race_elo'
      }
    }
  });

  const result = {
    athleteId,
    primarySide,
    ratings: {
      port: null,
      starboard: null,
      cox: null,
      combined: null
    },
    primaryRating: null
  };

  for (const rating of ratings) {
    if (rating.ratingType === 'seat_race_elo') {
      result.ratings.combined = rating;
    } else if (rating.ratingType === 'seat_race_elo_port') {
      result.ratings.port = rating;
    } else if (rating.ratingType === 'seat_race_elo_starboard') {
      result.ratings.starboard = rating;
    } else if (rating.ratingType === 'seat_race_elo_cox') {
      result.ratings.cox = rating;
    }
  }

  // Set primary rating based on athlete's designated side
  result.primaryRating = result.ratings[primarySide.toLowerCase()] || result.ratings.combined;

  return result;
}

/**
 * Get team rankings filtered by side
 * @param {string} teamId - Team UUID
 * @param {string} side - 'Port', 'Starboard', 'Cox', or null for combined
 * @returns {Promise<Array>} Ranked athletes for the specified side
 */
export async function getTeamRankingsBySide(teamId, side = null) {
  const ratingType = side
    ? `seat_race_elo_${side.toLowerCase()}`
    : 'seat_race_elo';

  return getTeamRankings(teamId, { ratingType });
}

export default {
  DEFAULT_RATING,
  K_FACTOR,
  expectedScore,
  calculateNewRating,
  getOrCreateRating,
  updateRatingsFromSeatRace,
  getTeamRankings,
  recalculateAllRatings,
  // New side-specific functions
  getOrCreateSideSpecificRating,
  updateRatingsWithSideDetection,
  getAthleteSideRatings,
  getTeamRankingsBySide
};

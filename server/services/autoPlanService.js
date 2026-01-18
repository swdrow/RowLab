/**
 * Auto Plan Generator Service
 * Generates optimal seat racing schedules to maximize athlete comparisons with minimum pieces
 */

/**
 * Get the number of seats for a given boat class
 * @param {string} boatClass - The boat class (e.g., '8+', '4+', '4-', '4x', '2-', '2x', '1x')
 * @returns {number} Number of seats in the boat
 */
export function getSeatsPerBoat(boatClass) {
  const seatMap = {
    '8+': 8,
    '4+': 4,
    '4-': 4,
    '4x': 4,
    '2-': 2,
    '2x': 2,
    '1x': 1
  };

  return seatMap[boatClass] || 4; // Default to 4 if unknown
}

/**
 * Generate all unique pairs from an array of athletes
 * @param {Array} athletes - Array of athlete objects or IDs
 * @returns {Array} Array of [athlete1, athlete2] pairs
 */
export function generateAllPairs(athletes) {
  const pairs = [];
  for (let i = 0; i < athletes.length; i++) {
    for (let j = i + 1; j < athletes.length; j++) {
      pairs.push([athletes[i], athletes[j]]);
    }
  }
  return pairs;
}

/**
 * Create a pair key for tracking compared athletes
 * @param {*} athlete1 - First athlete (object with id or primitive)
 * @param {*} athlete2 - Second athlete (object with id or primitive)
 * @returns {string} Unique key for the pair
 */
export function getPairKey(athlete1, athlete2) {
  const id1 = athlete1?.id || athlete1;
  const id2 = athlete2?.id || athlete2;
  return [id1, id2].sort().join('-');
}

/**
 * Fill remaining boat seats with available athletes
 * @param {Array} athletes - All athletes
 * @param {Array} excludeAthletes - Athletes already assigned (being compared)
 * @param {number} seatsNeeded - Number of seats to fill
 * @returns {Array} Athletes to fill remaining seats
 */
export function fillRemainingSeats(athletes, excludeAthletes, seatsNeeded) {
  const excludeIds = new Set(excludeAthletes.map(a => a?.id || a));
  const available = athletes.filter(a => !excludeIds.has(a?.id || a));
  return available.slice(0, seatsNeeded);
}

/**
 * Generate a round-robin schedule comparing all pairs
 * @param {Array} athletes - Array of athlete objects or IDs
 * @param {string} boatClass - The boat class for racing
 * @returns {Array} Complete schedule with all pair comparisons
 */
export function generateRoundRobin(athletes, boatClass) {
  const seatsPerBoat = getSeatsPerBoat(boatClass);
  const allPairs = generateAllPairs(athletes);
  const schedule = [];

  allPairs.forEach((pair, index) => {
    const [athlete1, athlete2] = pair;
    const remainingSeats = seatsPerBoat - 1; // One seat for the athlete being compared

    // Get other athletes to fill remaining seats
    const fillers = fillRemainingSeats(athletes, pair, remainingSeats * 2);

    // Split fillers between boats
    const boatAFillers = fillers.slice(0, remainingSeats);
    const boatBFillers = fillers.slice(remainingSeats, remainingSeats * 2);

    // If not enough fillers for boat B, reuse boat A fillers
    const actualBoatBFillers = boatBFillers.length >= remainingSeats
      ? boatBFillers
      : boatAFillers;

    schedule.push({
      sessionNumber: index + 1,
      comparing: [athlete1, athlete2],
      boats: {
        boatA: {
          piece1: [athlete1, ...boatAFillers],
          piece2: [athlete2, ...boatAFillers]
        },
        boatB: {
          piece1: [athlete2, ...actualBoatBFillers],
          piece2: [athlete1, ...actualBoatBFillers]
        }
      },
      instructions: `Swap ${athlete1?.name || athlete1} and ${athlete2?.name || athlete2} between pieces`
    });
  });

  return schedule;
}

/**
 * Generate an efficient schedule with limited sessions
 * Prioritizes comparing as many unique pairs as possible within constraints
 * @param {Array} athletes - Array of athlete objects or IDs
 * @param {string} boatClass - The boat class for racing
 * @param {number} maxSessions - Maximum number of sessions to generate
 * @returns {Object} Schedule with metadata
 */
export function generateEfficientSchedule(athletes, boatClass, maxSessions = 10) {
  const seatsPerBoat = getSeatsPerBoat(boatClass);
  const allPairs = generateAllPairs(athletes);
  const comparisonsNeeded = allPairs.length;
  const comparedPairs = new Set();
  const schedule = [];

  // Track which pairs have been compared
  let pairIndex = 0;

  while (schedule.length < maxSessions && pairIndex < allPairs.length) {
    const pair = allPairs[pairIndex];
    const [athlete1, athlete2] = pair;
    const pairKey = getPairKey(athlete1, athlete2);

    if (!comparedPairs.has(pairKey)) {
      const remainingSeats = seatsPerBoat - 1;
      const fillers = fillRemainingSeats(athletes, pair, remainingSeats * 2);

      const boatAFillers = fillers.slice(0, remainingSeats);
      const boatBFillers = fillers.slice(remainingSeats, remainingSeats * 2);
      const actualBoatBFillers = boatBFillers.length >= remainingSeats
        ? boatBFillers
        : boatAFillers;

      schedule.push({
        sessionNumber: schedule.length + 1,
        comparing: [athlete1, athlete2],
        boats: {
          boatA: {
            piece1: [athlete1, ...boatAFillers],
            piece2: [athlete2, ...boatAFillers]
          },
          boatB: {
            piece1: [athlete2, ...actualBoatBFillers],
            piece2: [athlete1, ...actualBoatBFillers]
          }
        },
        instructions: `Swap ${athlete1?.name || athlete1} and ${athlete2?.name || athlete2} between pieces`
      });

      comparedPairs.add(pairKey);
    }

    pairIndex++;
  }

  return {
    schedule,
    totalSessions: schedule.length,
    comparisonsNeeded,
    comparisonsScheduled: comparedPairs.size,
    coveragePercent: Math.round((comparedPairs.size / comparisonsNeeded) * 100)
  };
}

/**
 * Main entry point for generating a seat racing plan
 * @param {string} teamId - The team ID (for future database integration)
 * @param {Object} options - Configuration options
 * @param {Array} options.athletes - Array of athlete objects or IDs (minimum 4)
 * @param {string} options.boatClass - The boat class (e.g., '4+', '8+')
 * @param {number} options.maxSessions - Maximum sessions to generate (optional)
 * @returns {Object} Generated plan with schedule and metadata
 */
export function generatePlan(teamId, options = {}) {
  const { athletes, boatClass = '4+', maxSessions } = options;

  // Validation
  if (!athletes || !Array.isArray(athletes)) {
    throw new Error('Athletes array is required');
  }

  if (athletes.length < 4) {
    throw new Error('Minimum 4 athletes required for seat racing');
  }

  const seatsPerBoat = getSeatsPerBoat(boatClass);

  // For single sculls, we need a different approach
  if (seatsPerBoat === 1) {
    throw new Error('Single sculls (1x) not supported for seat racing - use time trials instead');
  }

  // Calculate total comparisons needed
  const totalPairs = (athletes.length * (athletes.length - 1)) / 2;

  // Generate the schedule
  const result = maxSessions
    ? generateEfficientSchedule(athletes, boatClass, maxSessions)
    : {
        schedule: generateRoundRobin(athletes, boatClass),
        totalSessions: totalPairs,
        comparisonsNeeded: totalPairs,
        comparisonsScheduled: totalPairs,
        coveragePercent: 100
      };

  return {
    teamId,
    boatClass,
    athleteCount: athletes.length,
    seatsPerBoat,
    ...result,
    generatedAt: new Date().toISOString()
  };
}

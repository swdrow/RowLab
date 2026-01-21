/**
 * Speed Calculation Service
 *
 * Implements CMAX-style speed normalization for comparing
 * race results across different conditions and courses.
 */

import { prisma } from '../db/connection.js';

// Standard 2000m course for normalization
const STANDARD_DISTANCE = 2000;

/**
 * Calculate raw speed (m/s) from distance and time
 * @param {number} distanceMeters - Distance in meters
 * @param {number} timeSeconds - Time in seconds
 * @returns {number|null} Speed in m/s
 */
export function calculateRawSpeed(distanceMeters, timeSeconds) {
  if (!Number.isFinite(distanceMeters) || !Number.isFinite(timeSeconds)) return null;
  if (!timeSeconds || timeSeconds <= 0) return null;
  if (!distanceMeters || distanceMeters <= 0) return null;
  return distanceMeters / timeSeconds;
}

/**
 * Convert time to split (per 500m)
 * @param {number} timeSeconds - Total time in seconds
 * @param {number} distanceMeters - Total distance in meters
 * @returns {number|null} Split time in seconds per 500m
 */
export function timeToSplit(timeSeconds, distanceMeters) {
  if (!timeSeconds || !distanceMeters) return null;
  return (timeSeconds / distanceMeters) * 500;
}

/**
 * Convert split to time for distance
 * @param {number} splitSeconds - Split time in seconds per 500m
 * @param {number} distanceMeters - Target distance in meters
 * @returns {number} Total time in seconds
 */
export function splitToTime(splitSeconds, distanceMeters) {
  if (!Number.isFinite(splitSeconds) || !Number.isFinite(distanceMeters)) return null;
  if (!splitSeconds || !distanceMeters) return null;
  return (splitSeconds / 500) * distanceMeters;
}

/**
 * Convert speed to split
 * @param {number} speedMs - Speed in m/s
 * @returns {number|null} Split time in seconds per 500m
 */
export function speedToSplit(speedMs) {
  if (!speedMs || speedMs <= 0) return null;
  return 500 / speedMs;
}

/**
 * Apply course correction factor
 * Head races typically have slower times due to navigation
 * @param {number} timeSeconds - Raw time in seconds
 * @param {boolean} isHeadRace - Whether this is a head race
 * @param {number} courseLength - Course length in meters
 * @returns {number} Corrected time in seconds
 */
export function applyCourseCorrection(timeSeconds, isHeadRace, courseLength) {
  if (!isHeadRace) return timeSeconds;

  // Head race correction: approximately 2-3% slower
  // Longer courses have more navigation overhead
  const baseFactor = 0.97;
  const lengthFactor = courseLength > 3000 ? 0.96 : baseFactor;

  return timeSeconds * lengthFactor;
}

/**
 * Apply conditions adjustment
 * Basic adjustment for wind/water conditions
 * @param {number} timeSeconds - Raw time in seconds
 * @param {object} conditions - Conditions object with wind and water properties
 * @returns {number} Adjusted time in seconds
 */
export function applyConditionsAdjustment(timeSeconds, conditions) {
  if (!conditions) return timeSeconds;

  let factor = 1.0;

  // Wind adjustment
  if (conditions.wind) {
    const windSpeed = conditions.wind.speed || 0;
    const windDirection = conditions.wind.direction || 'headwind';

    if (windDirection === 'headwind') {
      factor -= windSpeed * 0.005; // Headwind slows down
    } else if (windDirection === 'tailwind') {
      factor += windSpeed * 0.003; // Tailwind speeds up (less effect)
    }
  }

  // Water conditions
  if (conditions.water === 'rough') {
    factor -= 0.02; // Rough water slows down
  } else if (conditions.water === 'current') {
    factor -= 0.01; // Current affects times
  }

  return timeSeconds * factor;
}

/**
 * Normalize time to standard 2000m
 * @param {number} timeSeconds - Time in seconds
 * @param {number} distanceMeters - Distance in meters
 * @returns {number|null} Normalized time for standard distance
 */
export function normalizeToStandard(timeSeconds, distanceMeters) {
  if (!timeSeconds || !distanceMeters) return null;
  const split = timeToSplit(timeSeconds, distanceMeters);
  return splitToTime(split, STANDARD_DISTANCE);
}

/**
 * Calculate adjusted speed for ranking
 * @param {object} result - Race result with finishTimeSeconds
 * @param {object} race - Race with isHeadRace and distanceMeters
 * @param {object} regatta - Regatta with conditions
 * @returns {number} Adjusted speed in m/s
 */
export function calculateAdjustedSpeed(result, race, regatta) {
  let time = result.finishTimeSeconds;

  // Apply course correction
  time = applyCourseCorrection(time, race.isHeadRace, race.distanceMeters);

  // Apply conditions adjustment
  time = applyConditionsAdjustment(time, regatta.conditions);

  // Normalize to standard distance
  const normalizedTime = normalizeToStandard(time, race.distanceMeters);

  // Check if normalizedTime is valid before division
  if (!normalizedTime || normalizedTime <= 0) return null;

  // Convert to speed
  return STANDARD_DISTANCE / normalizedTime;
}

/**
 * Analyze race results and calculate adjusted speeds
 * @param {string} teamId - Team ID for ownership validation
 * @param {string} raceId - Race ID to analyze
 * @returns {object} Analysis results with adjusted speeds
 */
export async function analyzeRace(teamId, raceId) {
  const race = await prisma.race.findFirst({
    where: { id: raceId },
    include: {
      regatta: true,
      results: {
        orderBy: { place: 'asc' },
      },
    },
  });

  if (!race || race.regatta.teamId !== teamId) {
    throw new Error('Race not found');
  }

  const analyzed = race.results.map((result) => {
    const adjustedSpeed = calculateAdjustedSpeed(result, race, race.regatta);
    const split = timeToSplit(result.finishTimeSeconds, race.distanceMeters);

    return {
      ...result,
      split,
      adjustedSpeed,
      adjustedTime: adjustedSpeed ? STANDARD_DISTANCE / adjustedSpeed : null,
    };
  });

  // Update results with adjusted speeds
  for (const result of analyzed) {
    if (result.adjustedSpeed) {
      await prisma.raceResult.update({
        where: { id: result.id },
        data: { adjustedSpeed: result.adjustedSpeed },
      });
    }
  }

  // Calculate spread with safety checks
  let spreadSeconds = 0;
  if (analyzed.length > 1) {
    const lastSpeed = analyzed[analyzed.length - 1].adjustedSpeed;
    const firstSpeed = analyzed[0].adjustedSpeed;
    if (lastSpeed && lastSpeed > 0 && firstSpeed && firstSpeed > 0) {
      spreadSeconds = STANDARD_DISTANCE / lastSpeed - STANDARD_DISTANCE / firstSpeed;
    }
  }

  return {
    race,
    results: analyzed,
    winningSpeed: analyzed[0]?.adjustedSpeed,
    spreadSeconds,
  };
}

/**
 * Compare two race results
 * @param {object} result1 - First result with adjustedSpeed and adjustedTime
 * @param {object} result2 - Second result with adjustedSpeed and adjustedTime
 * @returns {object} Comparison with faster result, speed and time differences
 */
export function compareResults(result1, result2) {
  // Validate inputs
  if (!result1 || !result2) return null;
  if (!result1.adjustedSpeed || !result2.adjustedSpeed) return null;
  if (!result1.adjustedTime || !result2.adjustedTime) return null;

  const speedDiff = result1.adjustedSpeed - result2.adjustedSpeed;
  const timeDiff = result2.adjustedTime - result1.adjustedTime;

  const minSpeed = Math.min(result1.adjustedSpeed, result2.adjustedSpeed);
  const percentageFaster = minSpeed > 0 ? (Math.abs(speedDiff) / minSpeed) * 100 : 0;

  return {
    faster: speedDiff > 0 ? result1 : result2,
    speedDifference: Math.abs(speedDiff),
    timeDifference: Math.abs(timeDiff),
    percentageFaster,
  };
}

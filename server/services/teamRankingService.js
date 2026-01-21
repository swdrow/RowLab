/**
 * Team Speed Ranking Service
 *
 * Aggregates race results to generate team speed estimates
 * similar to CMAX rankings.
 */

import { prisma } from '../db/connection.js';
import * as speedCalc from './speedCalculationService.js';

/**
 * Parse season string into date range for filtering
 * @param {string} season - Season string like "Spring 2025" or "Fall 2024"
 * @returns {Object|null} Prisma date filter object or null
 */
function getSeasonDateRange(season) {
  if (!season) return null;

  const parts = season.split(' ');
  if (parts.length !== 2) return null;

  const [seasonName, year] = parts;
  const yearNum = parseInt(year);

  if (isNaN(yearNum)) return null;

  if (seasonName === 'Spring') {
    return {
      gte: new Date(`${yearNum}-01-01`),
      lte: new Date(`${yearNum}-06-30`),
    };
  } else if (seasonName === 'Fall') {
    return {
      gte: new Date(`${yearNum}-07-01`),
      lte: new Date(`${yearNum}-12-31`),
    };
  }

  return null;
}

/**
 * Get or create external team by name
 * @param {string} name - Team name
 * @param {Object} metadata - Optional metadata (conference, division)
 * @returns {Promise<Object>} External team record
 */
export async function getOrCreateExternalTeam(name, metadata = {}) {
  // Use upsert for atomic operation to prevent race conditions
  const team = await prisma.externalTeam.upsert({
    where: {
      name_unique: name.toLowerCase(),
    },
    update: {},
    create: {
      name,
      name_unique: name.toLowerCase(),
      conference: metadata.conference || null,
      division: metadata.division || null,
    },
  });

  return team;
}

/**
 * Calculate team speed estimate for a specific boat class
 * Uses median speed for robustness against outliers
 * @param {string} teamId - Team ID
 * @param {string} boatClass - Boat class (e.g., "8+", "4+")
 * @param {string} season - Optional season filter (e.g., "Spring 2025")
 * @returns {Promise<Object|null>} Speed estimate record or null if no data
 */
export async function calculateTeamSpeedEstimate(teamId, boatClass, season) {
  // Build date filter
  const dateRange = getSeasonDateRange(season);

  // Get all results for this team's own entries in the boat class
  const results = await prisma.raceResult.findMany({
    where: {
      isOwnTeam: true,
      race: {
        boatClass,
        regatta: {
          teamId,
          ...(dateRange && { date: dateRange }),
        },
      },
    },
    include: {
      race: {
        include: { regatta: true },
      },
    },
  });

  if (results.length === 0) return null;

  // Calculate adjusted speeds for all results
  const speeds = results
    .map((r) => {
      try {
        return speedCalc.calculateAdjustedSpeed(r, r.race, r.race.regatta);
      } catch {
        return null;
      }
    })
    .filter((s) => s !== null && s > 0);

  if (speeds.length === 0) return null;

  // Use median speed (more robust than mean for outliers)
  speeds.sort((a, b) => a - b);
  const medianIndex = Math.floor(speeds.length / 2);
  const medianSpeed =
    speeds.length % 2 === 0
      ? (speeds[medianIndex - 1] + speeds[medianIndex]) / 2
      : speeds[medianIndex];

  // Calculate mean for raw speed
  const meanSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;

  // Calculate confidence based on sample size (maxes at 1.0 with 5+ samples)
  const confidence = Math.min(1, speeds.length / 5);

  // Update or create speed estimate
  const existing = await prisma.teamSpeedEstimate.findFirst({
    where: { teamId, boatClass, season: season || null },
  });

  if (existing) {
    return prisma.teamSpeedEstimate.update({
      where: { id: existing.id },
      data: {
        rawSpeed: meanSpeed,
        adjustedSpeed: medianSpeed,
        confidenceScore: confidence,
        sampleCount: speeds.length,
        lastCalculatedAt: new Date(),
      },
    });
  }

  return prisma.teamSpeedEstimate.create({
    data: {
      teamId,
      boatClass,
      season: season || null,
      rawSpeed: meanSpeed,
      adjustedSpeed: medianSpeed,
      confidenceScore: confidence,
      sampleCount: speeds.length,
    },
  });
}

/**
 * Get ranked list of teams for a boat class
 * @param {string} teamId - Team ID (for identifying "own" team)
 * @param {string} boatClass - Boat class to rank
 * @param {string} season - Optional season filter
 * @returns {Promise<Array>} Ranked list of teams with speed data
 */
export async function getBoatClassRankings(teamId, boatClass, season) {
  // First recalculate own team estimate
  await calculateTeamSpeedEstimate(teamId, boatClass, season);

  // Build date filter
  const dateRange = getSeasonDateRange(season);

  // Get all races in this boat class for this team's regattas
  const races = await prisma.race.findMany({
    where: {
      boatClass,
      regatta: {
        teamId,
        ...(dateRange && { date: dateRange }),
      },
    },
    include: {
      results: true,
      regatta: true,
    },
  });

  // Aggregate speeds by team name
  const teamSpeeds = new Map();

  for (const race of races) {
    for (const result of race.results) {
      let speed;
      try {
        speed = speedCalc.calculateAdjustedSpeed(result, race, race.regatta);
      } catch {
        continue;
      }

      if (!speed || speed <= 0) continue;

      const teamName = result.isOwnTeam ? 'Your Team' : result.teamName;
      const existing = teamSpeeds.get(teamName) || {
        speeds: [],
        isOwnTeam: result.isOwnTeam,
      };
      existing.speeds.push(speed);
      teamSpeeds.set(teamName, existing);
    }
  }

  // Calculate median speed for each team and build rankings
  const rankings = [];
  for (const [teamName, data] of teamSpeeds) {
    const speeds = data.speeds;
    speeds.sort((a, b) => a - b);
    const medianIndex = Math.floor(speeds.length / 2);
    const medianSpeed =
      speeds.length % 2 === 0
        ? (speeds[medianIndex - 1] + speeds[medianIndex]) / 2
        : speeds[medianIndex];

    const split = speedCalc.speedToSplit(medianSpeed);
    const standardTime = medianSpeed > 0 ? 2000 / medianSpeed : null;

    rankings.push({
      teamName,
      isOwnTeam: data.isOwnTeam,
      medianSpeed,
      split,
      sampleCount: speeds.length,
      standardTime,
    });
  }

  // Sort by speed (fastest = highest speed first)
  rankings.sort((a, b) => b.medianSpeed - a.medianSpeed);

  // Add rank numbers
  return rankings.map((r, i) => ({ ...r, rank: i + 1 }));
}

/**
 * Get head-to-head comparison between own team and an external team
 * @param {string} teamId - Own team ID
 * @param {string} externalTeamName - Name of external team to compare
 * @param {string} boatClass - Boat class to compare
 * @param {string} season - Optional season filter
 * @returns {Promise<Object>} Head-to-head comparison data
 */
export async function getHeadToHead(teamId, externalTeamName, boatClass, season) {
  // Build date filter
  const dateRange = getSeasonDateRange(season);

  // Find races where both teams competed
  const races = await prisma.race.findMany({
    where: {
      boatClass,
      regatta: {
        teamId,
        ...(dateRange && { date: dateRange }),
      },
      results: {
        some: {
          teamName: { equals: externalTeamName, mode: 'insensitive' },
        },
      },
    },
    include: {
      results: true,
      regatta: true,
    },
  });

  // Build matchup history
  const matchups = [];
  for (const race of races) {
    const ownResult = race.results.find((r) => r.isOwnTeam);
    const theirResult = race.results.find(
      (r) => r.teamName.toLowerCase() === externalTeamName.toLowerCase()
    );

    if (!ownResult || !theirResult) continue;

    // Calculate margin (positive = we were faster/ahead)
    const marginSeconds = theirResult.finishTimeSeconds && ownResult.finishTimeSeconds
      ? Number(theirResult.finishTimeSeconds) - Number(ownResult.finishTimeSeconds)
      : null;

    const won = ownResult.place && theirResult.place
      ? ownResult.place < theirResult.place
      : marginSeconds !== null && marginSeconds > 0;

    matchups.push({
      regatta: race.regatta.name,
      date: race.regatta.date,
      eventName: race.eventName,
      ownPlace: ownResult.place,
      theirPlace: theirResult.place,
      ownTime: ownResult.finishTimeSeconds ? Number(ownResult.finishTimeSeconds) : null,
      theirTime: theirResult.finishTimeSeconds ? Number(theirResult.finishTimeSeconds) : null,
      marginSeconds,
      won,
    });
  }

  // Sort matchups by date (most recent first)
  matchups.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Calculate aggregate stats
  const wins = matchups.filter((m) => m.won).length;
  const losses = matchups.filter((m) => !m.won).length;
  const marginsWithValues = matchups.filter((m) => m.marginSeconds !== null);
  const avgMargin =
    marginsWithValues.length > 0
      ? marginsWithValues.reduce((sum, m) => sum + m.marginSeconds, 0) / marginsWithValues.length
      : 0;

  return {
    opponent: externalTeamName,
    totalRaces: matchups.length,
    wins,
    losses,
    avgMargin,
    matchups,
  };
}

/**
 * Get list of boat classes that have race results for a team
 * @param {string} teamId - Team ID
 * @param {string} season - Optional season filter
 * @returns {Promise<Array<string>>} List of boat class strings
 */
export async function getBoatClassesWithResults(teamId, season) {
  // Build date filter
  const dateRange = getSeasonDateRange(season);

  const races = await prisma.race.findMany({
    where: {
      regatta: {
        teamId,
        ...(dateRange && { date: dateRange }),
      },
      results: {
        some: { isOwnTeam: true },
      },
    },
    select: { boatClass: true },
    distinct: ['boatClass'],
  });

  return races.map((r) => r.boatClass);
}

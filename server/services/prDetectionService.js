import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';

/**
 * Determine current season based on date
 * Rowing seasons: Fall (Aug-Dec), Spring (Jan-May)
 */
function getCurrentSeason(date = new Date()) {
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();

  if (month >= 8) {
    return { name: `Fall ${year}`, start: new Date(year, 7, 1), end: new Date(year, 11, 31) };
  } else if (month <= 5) {
    return { name: `Spring ${year}`, start: new Date(year, 0, 1), end: new Date(year, 4, 31) };
  } else {
    // Summer (Jun-Jul) - use most recent season
    return { name: `Spring ${year}`, start: new Date(year, 0, 1), end: new Date(year, 4, 31) };
  }
}

/**
 * Detect if a result is a PR in any context
 * Returns array of PR contexts (all-time, season, training-block)
 */
export async function detectPRs(athleteId, testType, result, testDate = new Date()) {
  const contexts = [];

  // 1. Check all-time best
  const allTimeBest = await prisma.ergTest.findFirst({
    where: {
      athleteId,
      testType,
      timeSeconds: { lt: result }, // Lower time = better
    },
    orderBy: { timeSeconds: 'asc' },
  });

  // Get team rank for this test type
  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
    select: { teamId: true },
  });

  if (!athlete) {
    logger.warn('Athlete not found for PR detection', { athleteId });
    return contexts;
  }

  // Count how many athletes have better all-time bests
  const betterAthletes = await prisma.ergTest.groupBy({
    by: ['athleteId'],
    where: {
      testType,
      athlete: {
        teamId: athlete.teamId,
      },
    },
    _min: {
      timeSeconds: true,
    },
    having: {
      timeSeconds: {
        _min: {
          lt: result,
        },
      },
    },
  });

  const rank = betterAthletes.length + 1;

  contexts.push({
    scope: 'all-time',
    isPR: !allTimeBest,
    previousBest: allTimeBest?.timeSeconds ? Number(allTimeBest.timeSeconds) : null,
    improvement: allTimeBest ? Number(allTimeBest.timeSeconds) - result : null,
    rank,
  });

  // 2. Check season best
  const season = getCurrentSeason(testDate);
  const seasonBest = await prisma.ergTest.findFirst({
    where: {
      athleteId,
      testType,
      testDate: {
        gte: season.start,
        lte: season.end,
      },
      timeSeconds: { lt: result },
    },
    orderBy: { timeSeconds: 'asc' },
  });

  contexts.push({
    scope: 'season',
    scopeContext: season.name,
    isPR: !seasonBest,
    previousBest: seasonBest?.timeSeconds ? Number(seasonBest.timeSeconds) : null,
    improvement: seasonBest ? Number(seasonBest.timeSeconds) - result : null,
  });

  return contexts;
}

/**
 * Record a PR in the database
 */
export async function recordPR(athleteId, teamId, testType, scope, scopeContext, ergTestId, result, previousBest) {
  const improvement = previousBest ? previousBest - result : null;

  await prisma.personalRecord.upsert({
    where: {
      athlete_pr_unique: {
        athleteId,
        testType,
        scope,
        scopeContext: scopeContext || '',
      },
    },
    create: {
      athleteId,
      teamId,
      testType,
      scope,
      scopeContext,
      ergTestId,
      result,
      previousBest,
      improvement,
    },
    update: {
      ergTestId,
      result,
      previousBest,
      improvement,
      achievedAt: new Date(),
    },
  });

  logger.info('PR recorded', { athleteId, testType, scope, result });
}

/**
 * Process PR detection for a newly created erg test
 * Called after erg test creation
 */
export async function processNewErgTest(ergTest) {
  const { id, athleteId, teamId, testType, timeSeconds, testDate } = ergTest;
  const result = Number(timeSeconds);

  const contexts = await detectPRs(athleteId, testType, result, new Date(testDate));

  const prContexts = contexts.filter(c => c.isPR);

  // Record each PR scope
  for (const context of prContexts) {
    await recordPR(
      athleteId,
      teamId,
      testType,
      context.scope,
      context.scopeContext,
      id,
      result,
      context.previousBest
    );
  }

  return {
    testId: id,
    contexts,
    isPR: prContexts.length > 0,
    prScopes: prContexts.map(c => c.scope),
  };
}

/**
 * Get all PRs for an athlete
 */
export async function getAthletePRHistory(athleteId) {
  return prisma.personalRecord.findMany({
    where: { athleteId },
    orderBy: { achievedAt: 'desc' },
  });
}

/**
 * Get athlete's current PRs by test type
 */
export async function getAthleteCurrentPRs(athleteId) {
  // Get best all-time for each test type
  const prs = await prisma.personalRecord.findMany({
    where: {
      athleteId,
      scope: 'all-time',
    },
    orderBy: { result: 'asc' },
  });

  // Group by testType, keeping best
  const prsByType = {};
  for (const pr of prs) {
    if (!prsByType[pr.testType] || pr.result < prsByType[pr.testType].result) {
      prsByType[pr.testType] = pr;
    }
  }

  return Object.values(prsByType);
}

/**
 * Get team records for all test types
 */
export async function getTeamRecords(teamId) {
  const testTypes = ['2k', '6k', '500m', '30min'];
  const records = [];

  for (const testType of testTypes) {
    const best = await prisma.ergTest.findFirst({
      where: {
        teamId,
        testType,
      },
      orderBy: { timeSeconds: 'asc' },
      include: {
        athlete: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (best) {
      records.push({
        testType,
        athleteId: best.athleteId,
        athleteName: `${best.athlete.firstName} ${best.athlete.lastName}`,
        result: Number(best.timeSeconds),
        achievedAt: best.testDate,
      });
    }
  }

  return records;
}

/**
 * Get last N results for sparkline trend
 */
export async function getResultTrend(athleteId, testType, limit = 5) {
  const results = await prisma.ergTest.findMany({
    where: { athleteId, testType },
    orderBy: { testDate: 'desc' },
    take: limit,
    select: {
      timeSeconds: true,
      testDate: true,
    },
  });

  return results.reverse().map(r => ({
    result: Number(r.timeSeconds),
    date: r.testDate,
  }));
}

/**
 * Get PR celebration data for a specific test
 */
export async function getPRCelebrationData(testId) {
  const test = await prisma.ergTest.findUnique({
    where: { id: testId },
    include: {
      athlete: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          teamId: true,
        },
      },
    },
  });

  if (!test) return null;

  const athleteName = `${test.athlete.firstName} ${test.athlete.lastName}`;
  const result = Number(test.timeSeconds);

  // Get PR contexts
  const contexts = await detectPRs(
    test.athleteId,
    test.testType,
    result,
    test.testDate
  );

  // Get trend data
  const trendData = await getResultTrend(test.athleteId, test.testType, 5);

  return {
    testId,
    athleteId: test.athleteId,
    athleteName,
    testType: test.testType,
    result,
    contexts,
    trendData: trendData.map(t => t.result),
  };
}

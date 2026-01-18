import { prisma } from '../db/connection.js';

/**
 * Create a new erg test
 */
export async function createErgTest(teamId, data) {
  const test = await prisma.ergTest.create({
    data: {
      teamId,
      athleteId: data.athleteId,
      testType: data.testType,
      testDate: new Date(data.testDate),
      distanceM: data.distanceM || null,
      timeSeconds: data.timeSeconds,
      splitSeconds: data.splitSeconds || null,
      watts: data.watts || null,
      strokeRate: data.strokeRate || null,
      weightKg: data.weightKg || null,
      notes: data.notes || null,
    },
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  return formatErgTest(test);
}

/**
 * Get all erg tests for a team with optional filters
 */
export async function getErgTests(teamId, filters = {}) {
  const where = { teamId };

  if (filters.athleteId) {
    where.athleteId = filters.athleteId;
  }
  if (filters.testType) {
    where.testType = filters.testType;
  }
  if (filters.fromDate) {
    where.testDate = { ...where.testDate, gte: new Date(filters.fromDate) };
  }
  if (filters.toDate) {
    where.testDate = { ...where.testDate, lte: new Date(filters.toDate) };
  }

  const tests = await prisma.ergTest.findMany({
    where,
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { testDate: 'desc' },
  });

  return tests.map(formatErgTest);
}

/**
 * Get a single erg test by ID
 */
export async function getErgTestById(teamId, testId) {
  const test = await prisma.ergTest.findFirst({
    where: { id: testId, teamId },
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true, side: true },
      },
    },
  });

  if (!test) {
    throw new Error('Erg test not found');
  }

  return formatErgTest(test);
}

/**
 * Update an erg test
 */
export async function updateErgTest(teamId, testId, data) {
  // Verify test exists and belongs to team
  const existing = await prisma.ergTest.findFirst({
    where: { id: testId, teamId },
  });

  if (!existing) {
    throw new Error('Erg test not found');
  }

  const updateData = {};
  const allowedFields = [
    'testType', 'testDate', 'distanceM', 'timeSeconds',
    'splitSeconds', 'watts', 'strokeRate', 'weightKg', 'notes'
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = field === 'testDate' ? new Date(data[field]) : data[field];
    }
  }

  const test = await prisma.ergTest.update({
    where: { id: testId },
    data: updateData,
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  return formatErgTest(test);
}

/**
 * Delete an erg test
 */
export async function deleteErgTest(teamId, testId) {
  const existing = await prisma.ergTest.findFirst({
    where: { id: testId, teamId },
  });

  if (!existing) {
    throw new Error('Erg test not found');
  }

  await prisma.ergTest.delete({
    where: { id: testId },
  });

  return { deleted: true };
}

/**
 * Get athlete's test history with personal bests
 */
export async function getAthleteTestHistory(teamId, athleteId) {
  const tests = await prisma.ergTest.findMany({
    where: { teamId, athleteId },
    orderBy: { testDate: 'desc' },
  });

  // Calculate personal bests by test type
  const personalBests = {};
  for (const test of tests) {
    const type = test.testType;
    if (!personalBests[type] || test.timeSeconds < personalBests[type].timeSeconds) {
      personalBests[type] = {
        timeSeconds: test.timeSeconds,
        splitSeconds: test.splitSeconds,
        watts: test.watts,
        date: test.testDate,
      };
    }
  }

  return {
    tests: tests.map(formatErgTest),
    personalBests,
    totalTests: tests.length,
  };
}

/**
 * Get team leaderboard for a specific test type
 */
export async function getTeamLeaderboard(teamId, testType, options = {}) {
  const { limit = 20, gender } = options;

  // Get best test per athlete for the given type
  const tests = await prisma.ergTest.findMany({
    where: { teamId, testType },
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true, side: true },
      },
    },
    orderBy: { timeSeconds: 'asc' },
  });

  // Group by athlete, keep best
  const bestByAthlete = new Map();
  for (const test of tests) {
    const existing = bestByAthlete.get(test.athleteId);
    if (!existing || test.timeSeconds < existing.timeSeconds) {
      bestByAthlete.set(test.athleteId, test);
    }
  }

  const leaderboard = Array.from(bestByAthlete.values())
    .sort((a, b) => Number(a.timeSeconds) - Number(b.timeSeconds))
    .slice(0, limit)
    .map((test, index) => ({
      rank: index + 1,
      ...formatErgTest(test),
    }));

  return leaderboard;
}

/**
 * Bulk import erg tests
 */
export async function bulkImportErgTests(teamId, tests) {
  const results = { created: 0, errors: [] };

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    try {
      await createErgTest(teamId, test);
      results.created++;
    } catch (error) {
      results.errors.push({ row: i + 1, error: error.message });
    }
  }

  return results;
}

/**
 * Format erg test for API response
 */
function formatErgTest(test) {
  return {
    id: test.id,
    athleteId: test.athleteId,
    athlete: test.athlete ? {
      id: test.athlete.id,
      name: `${test.athlete.firstName} ${test.athlete.lastName}`,
      firstName: test.athlete.firstName,
      lastName: test.athlete.lastName,
      side: test.athlete.side,
    } : null,
    testType: test.testType,
    testDate: test.testDate,
    distanceM: test.distanceM,
    timeSeconds: Number(test.timeSeconds),
    splitSeconds: test.splitSeconds ? Number(test.splitSeconds) : null,
    watts: test.watts,
    strokeRate: test.strokeRate,
    weightKg: test.weightKg ? Number(test.weightKg) : null,
    notes: test.notes,
    createdAt: test.createdAt,
  };
}

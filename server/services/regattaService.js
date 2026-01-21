import { prisma } from '../db/connection.js';

/**
 * Create a new regatta
 */
export async function createRegatta(teamId, data) {
  const { name, location, date, courseType, conditions, description } = data;

  const regatta = await prisma.regatta.create({
    data: {
      teamId,
      name,
      location,
      date: new Date(date),
      courseType,
      conditions: conditions || {},
      description,
    },
  });

  return regatta;
}

/**
 * Get all regattas for a team
 */
export async function getRegattas(teamId, options = {}) {
  const { limit = 20, offset = 0, season } = options;

  const where = { teamId };
  if (season) {
    // Filter by season (e.g., "Spring 2025")
    const [seasonName, year] = season.split(' ');
    const yearNum = parseInt(year);
    if (seasonName === 'Spring') {
      where.date = {
        gte: new Date(`${yearNum}-01-01`),
        lte: new Date(`${yearNum}-06-30`),
      };
    } else if (seasonName === 'Fall') {
      where.date = {
        gte: new Date(`${yearNum}-07-01`),
        lte: new Date(`${yearNum}-12-31`),
      };
    }
  }

  const regattas = await prisma.regatta.findMany({
    where,
    include: {
      _count: { select: { races: true } },
    },
    orderBy: { date: 'desc' },
    take: limit,
    skip: offset,
  });

  return regattas;
}

/**
 * Get regatta with all races and results
 */
export async function getRegattaById(teamId, regattaId) {
  const regatta = await prisma.regatta.findFirst({
    where: { id: regattaId, teamId },
    include: {
      races: {
        orderBy: { scheduledTime: 'asc' },
        include: {
          results: {
            orderBy: { place: 'asc' },
            include: {
              lineup: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
  });

  if (!regatta) throw new Error('Regatta not found');
  return regatta;
}

/**
 * Update regatta
 */
export async function updateRegatta(teamId, regattaId, data) {
  const existing = await prisma.regatta.findFirst({
    where: { id: regattaId, teamId },
  });
  if (!existing) throw new Error('Regatta not found');

  return prisma.regatta.update({
    where: { id: regattaId },
    data: {
      name: data.name,
      location: data.location,
      date: data.date ? new Date(data.date) : undefined,
      courseType: data.courseType,
      conditions: data.conditions,
      description: data.description,
    },
  });
}

/**
 * Delete regatta and all related data
 */
export async function deleteRegatta(teamId, regattaId) {
  const existing = await prisma.regatta.findFirst({
    where: { id: regattaId, teamId },
  });
  if (!existing) throw new Error('Regatta not found');

  await prisma.regatta.delete({
    where: { id: regattaId },
  });

  return { success: true };
}

/**
 * Add a race to a regatta
 */
export async function addRace(teamId, regattaId, data) {
  const regatta = await prisma.regatta.findFirst({
    where: { id: regattaId, teamId },
  });
  if (!regatta) throw new Error('Regatta not found');

  const race = await prisma.race.create({
    data: {
      regattaId,
      eventName: data.eventName,
      boatClass: data.boatClass,
      distanceMeters: data.distanceMeters || 2000,
      isHeadRace: data.isHeadRace || false,
      scheduledTime: data.scheduledTime ? new Date(data.scheduledTime) : null,
    },
  });

  return race;
}

/**
 * Update race
 */
export async function updateRace(teamId, raceId, data) {
  const race = await prisma.race.findFirst({
    where: { id: raceId },
    include: { regatta: true },
  });
  if (!race || race.regatta.teamId !== teamId) {
    throw new Error('Race not found');
  }

  return prisma.race.update({
    where: { id: raceId },
    data: {
      eventName: data.eventName,
      boatClass: data.boatClass,
      distanceMeters: data.distanceMeters,
      isHeadRace: data.isHeadRace,
      scheduledTime: data.scheduledTime ? new Date(data.scheduledTime) : undefined,
    },
  });
}

/**
 * Delete race
 */
export async function deleteRace(teamId, raceId) {
  const race = await prisma.race.findFirst({
    where: { id: raceId },
    include: { regatta: true },
  });
  if (!race || race.regatta.teamId !== teamId) {
    throw new Error('Race not found');
  }

  await prisma.race.delete({
    where: { id: raceId },
  });

  return { success: true };
}

/**
 * Add result to a race
 */
export async function addResult(teamId, raceId, data) {
  const race = await prisma.race.findFirst({
    where: { id: raceId },
    include: { regatta: true },
  });
  if (!race || race.regatta.teamId !== teamId) {
    throw new Error('Race not found');
  }

  // Calculate raw speed if time provided
  let rawSpeed = null;
  if (data.finishTimeSeconds && race.distanceMeters) {
    rawSpeed = race.distanceMeters / data.finishTimeSeconds;
  }

  const result = await prisma.raceResult.create({
    data: {
      raceId,
      teamName: data.teamName,
      isOwnTeam: data.isOwnTeam || false,
      lineupId: data.lineupId,
      finishTimeSeconds: data.finishTimeSeconds,
      place: data.place,
      marginBackSeconds: data.marginBackSeconds,
      rawSpeed,
    },
  });

  return result;
}

/**
 * Update result
 */
export async function updateResult(teamId, resultId, data) {
  const result = await prisma.raceResult.findFirst({
    where: { id: resultId },
    include: { race: { include: { regatta: true } } },
  });
  if (!result || result.race.regatta.teamId !== teamId) {
    throw new Error('Result not found');
  }

  // Recalculate raw speed if time changed
  let rawSpeed = result.rawSpeed;
  if (data.finishTimeSeconds && result.race.distanceMeters) {
    rawSpeed = result.race.distanceMeters / data.finishTimeSeconds;
  }

  return prisma.raceResult.update({
    where: { id: resultId },
    data: {
      teamName: data.teamName,
      isOwnTeam: data.isOwnTeam,
      lineupId: data.lineupId,
      finishTimeSeconds: data.finishTimeSeconds,
      place: data.place,
      marginBackSeconds: data.marginBackSeconds,
      rawSpeed,
    },
  });
}

/**
 * Batch add results (for importing full race results)
 */
export async function batchAddResults(teamId, raceId, results) {
  const race = await prisma.race.findFirst({
    where: { id: raceId },
    include: { regatta: true },
  });
  if (!race || race.regatta.teamId !== teamId) {
    throw new Error('Race not found');
  }

  const createdResults = [];
  for (const data of results) {
    let rawSpeed = null;
    if (data.finishTimeSeconds && race.distanceMeters) {
      rawSpeed = race.distanceMeters / data.finishTimeSeconds;
    }

    const result = await prisma.raceResult.create({
      data: {
        raceId,
        teamName: data.teamName,
        isOwnTeam: data.isOwnTeam || false,
        lineupId: data.lineupId,
        finishTimeSeconds: data.finishTimeSeconds,
        place: data.place,
        marginBackSeconds: data.marginBackSeconds,
        rawSpeed,
      },
    });
    createdResults.push(result);
  }

  return createdResults;
}

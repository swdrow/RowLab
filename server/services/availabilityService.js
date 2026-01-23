import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';

/**
 * Get team-wide availability grid
 * @param {string} teamId - Team ID
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date (ISO8601)
 * @param {string} options.endDate - End date (ISO8601)
 * @returns {Promise<Array>} Array of { athleteId, athleteName, dates: [...] }
 */
export async function getTeamAvailability(teamId, { startDate, endDate }) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Get all athletes in team
  const athletes = await prisma.athlete.findMany({
    where: { teamId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
    orderBy: [
      { lastName: 'asc' },
      { firstName: 'asc' },
    ],
  });

  // Get all availability records for date range
  const availabilityRecords = await prisma.availability.findMany({
    where: {
      athlete: { teamId },
      date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { date: 'asc' },
  });

  // Build map of athleteId -> date -> availability
  const availabilityMap = new Map();
  for (const record of availabilityRecords) {
    if (!availabilityMap.has(record.athleteId)) {
      availabilityMap.set(record.athleteId, new Map());
    }
    availabilityMap.get(record.athleteId).set(
      record.date.toISOString().split('T')[0], // Just the date part
      {
        date: record.date,
        morningSlot: record.morningSlot,
        eveningSlot: record.eveningSlot,
        notes: record.notes,
      }
    );
  }

  // Build response structure
  return athletes.map(athlete => {
    const athleteAvailability = availabilityMap.get(athlete.id) || new Map();
    const dates = [];

    // Fill in all dates in range
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const availability = athleteAvailability.get(dateKey);

      dates.push({
        date: new Date(currentDate),
        morningSlot: availability?.morningSlot || 'NOT_SET',
        eveningSlot: availability?.eveningSlot || 'NOT_SET',
        notes: availability?.notes || null,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      athleteId: athlete.id,
      athleteName: `${athlete.firstName} ${athlete.lastName}`,
      dates,
    };
  });
}

/**
 * Get availability for a single athlete
 * @param {string} athleteId - Athlete ID
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date (ISO8601)
 * @param {string} options.endDate - End date (ISO8601)
 * @returns {Promise<Array>} Array of { date, morningSlot, eveningSlot, notes }
 */
export async function getAthleteAvailability(athleteId, { startDate, endDate }) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const records = await prisma.availability.findMany({
    where: {
      athleteId,
      date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { date: 'asc' },
  });

  // Build map for fast lookup
  const recordMap = new Map();
  for (const record of records) {
    const dateKey = record.date.toISOString().split('T')[0];
    recordMap.set(dateKey, record);
  }

  // Fill in all dates in range
  const availability = [];
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateKey = currentDate.toISOString().split('T')[0];
    const record = recordMap.get(dateKey);

    availability.push({
      date: new Date(currentDate),
      morningSlot: record?.morningSlot || 'NOT_SET',
      eveningSlot: record?.eveningSlot || 'NOT_SET',
      notes: record?.notes || null,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return availability;
}

/**
 * Update athlete availability
 * @param {string} athleteId - Athlete ID
 * @param {Array} availabilityArray - Array of { date, morningSlot, eveningSlot, notes? }
 * @returns {Promise<Array>} Updated availability records
 */
export async function updateAthleteAvailability(athleteId, availabilityArray) {
  // Use transaction to upsert all records atomically
  const results = await prisma.$transaction(
    availabilityArray.map(item => {
      const date = new Date(item.date);
      // Normalize to start of day UTC to ensure consistent key
      date.setUTCHours(0, 0, 0, 0);

      return prisma.availability.upsert({
        where: {
          athleteId_date: {
            athleteId,
            date,
          },
        },
        update: {
          morningSlot: item.morningSlot,
          eveningSlot: item.eveningSlot,
          notes: item.notes || null,
        },
        create: {
          athleteId,
          date,
          morningSlot: item.morningSlot,
          eveningSlot: item.eveningSlot,
          notes: item.notes || null,
        },
      });
    })
  );

  logger.info('Updated athlete availability', {
    athleteId,
    recordCount: results.length,
  });

  return results;
}

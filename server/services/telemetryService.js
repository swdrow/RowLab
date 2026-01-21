import prisma from '../db/connection.js';

/**
 * Validate and normalize source name
 * @param {string} source - Raw source name
 * @returns {string} Normalized source name
 * @throws {Error} If source is invalid
 */
export function parseSource(source) {
  if (!source || typeof source !== 'string') {
    throw new Error('Source is required');
  }

  const normalized = source.toLowerCase().trim();
  const validSources = ['empower', 'peach', 'nk'];

  if (!validSources.includes(normalized)) {
    throw new Error(`Invalid source: ${source}. Must be one of: ${validSources.join(', ')}`);
  }

  return normalized;
}

/**
 * Parse CSV row based on source format
 * @param {object} row - CSV row object with column headers as keys
 * @param {string} source - Data source (empower, peach, nk)
 * @returns {object} Normalized object with athleteName and metrics
 */
export function parseCsvRow(row, source) {
  const normalizedSource = parseSource(source);

  const parseDecimal = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  const parseInt_ = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  };

  switch (normalizedSource) {
    case 'empower':
      // Empower columns: Name, Seat, Avg Power, Peak Power, Work/Stroke, Catch, Finish, Slip, Wash
      return {
        athleteName: row['Name'] || null,
        seatNumber: parseInt_(row['Seat']),
        avgWatts: parseDecimal(row['Avg Power']),
        peakWatts: parseDecimal(row['Peak Power']),
        workPerStroke: parseDecimal(row['Work/Stroke']),
        catchAngle: parseDecimal(row['Catch']),
        finishAngle: parseDecimal(row['Finish']),
        slipDegrees: parseDecimal(row['Slip']),
        washDegrees: parseDecimal(row['Wash']),
        peakForceAngle: null,
        techScore: null,
      };

    case 'peach':
      // Peach columns: Athlete, Position, Average Watts, Max Watts, Work Per Stroke, Catch Angle, Finish Angle, Slip, Wash, Tech Score
      return {
        athleteName: row['Athlete'] || null,
        seatNumber: parseInt_(row['Position']),
        avgWatts: parseDecimal(row['Average Watts']),
        peakWatts: parseDecimal(row['Max Watts']),
        workPerStroke: parseDecimal(row['Work Per Stroke']),
        catchAngle: parseDecimal(row['Catch Angle']),
        finishAngle: parseDecimal(row['Finish Angle']),
        slipDegrees: parseDecimal(row['Slip']),
        washDegrees: parseDecimal(row['Wash']),
        peakForceAngle: null,
        techScore: parseDecimal(row['Tech Score']),
      };

    case 'nk':
      // NK columns: Name, Seat, Watts, Peak Watts
      return {
        athleteName: row['Name'] || null,
        seatNumber: parseInt_(row['Seat']),
        avgWatts: parseDecimal(row['Watts']),
        peakWatts: parseDecimal(row['Peak Watts']),
        workPerStroke: null,
        catchAngle: null,
        finishAngle: null,
        slipDegrees: null,
        washDegrees: null,
        peakForceAngle: null,
        techScore: null,
      };

    default:
      throw new Error(`Unsupported source: ${normalizedSource}`);
  }
}

/**
 * Create a single telemetry entry
 * @param {string} athleteId - Athlete UUID
 * @param {object} data - Telemetry data
 * @returns {Promise<object>} Created telemetry entry
 */
export async function createTelemetryEntry(athleteId, data) {
  const {
    sessionDate,
    source,
    seatNumber,
    avgWatts,
    peakWatts,
    workPerStroke,
    slipDegrees,
    washDegrees,
    catchAngle,
    finishAngle,
    peakForceAngle,
    techScore,
  } = data;

  if (!athleteId) {
    throw new Error('athleteId is required');
  }

  if (!sessionDate) {
    throw new Error('sessionDate is required');
  }

  const normalizedSource = parseSource(source);

  return prisma.athleteTelemetry.create({
    data: {
      athleteId,
      sessionDate: new Date(sessionDate),
      source: normalizedSource,
      seatNumber: seatNumber ?? null,
      avgWatts: avgWatts ?? null,
      peakWatts: peakWatts ?? null,
      workPerStroke: workPerStroke ?? null,
      slipDegrees: slipDegrees ?? null,
      washDegrees: washDegrees ?? null,
      catchAngle: catchAngle ?? null,
      finishAngle: finishAngle ?? null,
      peakForceAngle: peakForceAngle ?? null,
      techScore: techScore ?? null,
    },
  });
}

/**
 * Batch import telemetry with athlete matching
 * @param {string} teamId - Team UUID
 * @param {Array<object>} entries - Array of telemetry entries with athleteName
 * @returns {Promise<{imported: number, errors: Array}>} Import results
 */
export async function batchImportTelemetry(teamId, entries) {
  if (!teamId) {
    throw new Error('teamId is required');
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    return { imported: 0, errors: [] };
  }

  // Fetch all athletes for the team
  const athletes = await prisma.athlete.findMany({
    where: { teamId },
    select: { id: true, firstName: true, lastName: true },
  });

  // Build lookup map by full name (case-insensitive)
  const athleteMap = new Map();
  for (const athlete of athletes) {
    const fullName = `${athlete.firstName} ${athlete.lastName}`.toLowerCase().trim();
    athleteMap.set(fullName, athlete.id);
  }

  const errors = [];
  const toCreate = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const rowIndex = i + 1;

    try {
      const { athleteName, sessionDate, source, ...metrics } = entry;

      if (!athleteName) {
        errors.push({ row: rowIndex, error: 'Missing athlete name' });
        continue;
      }

      if (!sessionDate) {
        errors.push({ row: rowIndex, error: 'Missing session date', athleteName });
        continue;
      }

      const normalizedName = athleteName.toLowerCase().trim();
      const athleteId = athleteMap.get(normalizedName);

      if (!athleteId) {
        errors.push({ row: rowIndex, error: `Athlete not found: ${athleteName}`, athleteName });
        continue;
      }

      const normalizedSource = parseSource(source);

      toCreate.push({
        athleteId,
        sessionDate: new Date(sessionDate),
        source: normalizedSource,
        seatNumber: metrics.seatNumber ?? null,
        avgWatts: metrics.avgWatts ?? null,
        peakWatts: metrics.peakWatts ?? null,
        workPerStroke: metrics.workPerStroke ?? null,
        slipDegrees: metrics.slipDegrees ?? null,
        washDegrees: metrics.washDegrees ?? null,
        catchAngle: metrics.catchAngle ?? null,
        finishAngle: metrics.finishAngle ?? null,
        peakForceAngle: metrics.peakForceAngle ?? null,
        techScore: metrics.techScore ?? null,
      });
    } catch (err) {
      errors.push({ row: rowIndex, error: err.message, athleteName: entry.athleteName });
    }
  }

  // Batch create all valid entries
  let imported = 0;
  if (toCreate.length > 0) {
    const result = await prisma.athleteTelemetry.createMany({
      data: toCreate,
      skipDuplicates: true,
    });
    imported = result.count;
  }

  return { imported, errors };
}

/**
 * Get telemetry history for an athlete
 * @param {string} athleteId - Athlete UUID
 * @param {object} options - Query options
 * @param {Date|string} [options.startDate] - Filter start date
 * @param {Date|string} [options.endDate] - Filter end date
 * @param {number} [options.limit] - Max results to return
 * @returns {Promise<Array>} Telemetry entries
 */
export async function getTelemetryByAthlete(athleteId, options = {}) {
  if (!athleteId) {
    throw new Error('athleteId is required');
  }

  const { startDate, endDate, limit } = options;

  const where = { athleteId };

  if (startDate || endDate) {
    where.sessionDate = {};
    if (startDate) {
      where.sessionDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.sessionDate.lte = new Date(endDate);
    }
  }

  return prisma.athleteTelemetry.findMany({
    where,
    orderBy: { sessionDate: 'desc' },
    take: limit || undefined,
  });
}

/**
 * Get all telemetry for a team on a specific date
 * @param {string} teamId - Team UUID
 * @param {Date|string} sessionDate - Session date to query
 * @returns {Promise<Array>} Telemetry entries with athlete info
 */
export async function getTelemetryBySession(teamId, sessionDate) {
  if (!teamId) {
    throw new Error('teamId is required');
  }

  if (!sessionDate) {
    throw new Error('sessionDate is required');
  }

  const date = new Date(sessionDate);
  // Query for the entire day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return prisma.athleteTelemetry.findMany({
    where: {
      sessionDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      athlete: {
        teamId,
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
    orderBy: [
      { seatNumber: 'asc' },
      { athlete: { lastName: 'asc' } },
    ],
  });
}

/**
 * Delete a single telemetry entry
 * @param {string} id - Telemetry entry UUID
 * @returns {Promise<object>} Deleted entry
 */
export async function deleteTelemetry(id) {
  if (!id) {
    throw new Error('id is required');
  }

  return prisma.athleteTelemetry.delete({
    where: { id },
  });
}

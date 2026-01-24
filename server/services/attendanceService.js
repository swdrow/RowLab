import prisma from '../db/connection.js';

/**
 * Record or update attendance for an athlete on a date
 */
export async function recordAttendance(teamId, { athleteId, date, status, notes, recordedBy }) {
  // Validate status
  const validStatuses = ['present', 'late', 'excused', 'unexcused'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  // Upsert attendance record
  return prisma.attendance.upsert({
    where: {
      athleteId_date: {
        athleteId,
        date: new Date(date),
      },
    },
    update: {
      status,
      notes,
      recordedBy,
    },
    create: {
      teamId,
      athleteId,
      date: new Date(date),
      status,
      notes,
      recordedBy,
    },
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });
}

/**
 * Bulk record attendance for multiple athletes on a date
 */
export async function bulkRecordAttendance(teamId, { date, records, recordedBy }) {
  const validStatuses = ['present', 'late', 'excused', 'unexcused'];

  const operations = records.map(({ athleteId, status, notes }) => {
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status for athlete ${athleteId}`);
    }

    return prisma.attendance.upsert({
      where: {
        athleteId_date: {
          athleteId,
          date: new Date(date),
        },
      },
      update: { status, notes, recordedBy },
      create: {
        teamId,
        athleteId,
        date: new Date(date),
        status,
        notes,
        recordedBy,
      },
    });
  });

  return prisma.$transaction(operations);
}

/**
 * Get attendance for a specific date (all athletes)
 */
export async function getAttendanceByDate(teamId, date) {
  return prisma.attendance.findMany({
    where: {
      teamId,
      date: new Date(date),
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
      athlete: { lastName: 'asc' },
    },
  });
}

/**
 * Get attendance history for a specific athlete
 */
export async function getAttendanceByAthlete(teamId, athleteId, { startDate, endDate } = {}) {
  const where = { teamId, athleteId };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  return prisma.attendance.findMany({
    where,
    orderBy: { date: 'desc' },
  });
}

/**
 * Get team attendance summary for a date range
 */
export async function getTeamAttendanceSummary(teamId, { startDate, endDate }) {
  const records = await prisma.attendance.findMany({
    where: {
      teamId,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    include: {
      athlete: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  // Group by athlete and calculate stats
  const byAthlete = {};
  records.forEach((record) => {
    const { athleteId } = record;
    if (!byAthlete[athleteId]) {
      byAthlete[athleteId] = {
        athlete: record.athlete,
        present: 0,
        late: 0,
        excused: 0,
        unexcused: 0,
        total: 0,
      };
    }
    byAthlete[athleteId][record.status]++;
    byAthlete[athleteId].total++;
  });

  return Object.values(byAthlete);
}

/**
 * Delete attendance record
 */
export async function deleteAttendance(teamId, attendanceId) {
  return prisma.attendance.delete({
    where: { id: attendanceId, teamId },
  });
}

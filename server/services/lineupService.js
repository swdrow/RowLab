import { prisma } from '../db/connection.js';

/**
 * Create a new lineup
 */
export async function createLineup(teamId, data) {
  const { name, notes, assignments } = data;

  const lineup = await prisma.lineup.create({
    data: {
      teamId,
      name,
      notes: notes || null,
      assignments: assignments?.length > 0 ? {
        create: assignments.map(a => ({
          athleteId: a.athleteId,
          boatClass: a.boatClass,
          shellName: a.shellName || null,
          seatNumber: a.seatNumber,
          side: a.side,
          isCoxswain: a.isCoxswain || false,
        })),
      } : undefined,
    },
    include: {
      assignments: {
        include: {
          athlete: {
            select: { id: true, firstName: true, lastName: true, side: true },
          },
        },
      },
    },
  });

  return formatLineup(lineup);
}

/**
 * Get all lineups for a team
 */
export async function getLineups(teamId, options = {}) {
  const { includeAssignments = false } = options;

  const lineups = await prisma.lineup.findMany({
    where: { teamId },
    include: includeAssignments ? {
      assignments: {
        include: {
          athlete: {
            select: { id: true, firstName: true, lastName: true, side: true },
          },
        },
      },
    } : {
      _count: {
        select: { assignments: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return lineups.map(l => formatLineup(l, includeAssignments));
}

/**
 * Get a single lineup by ID
 */
export async function getLineupById(teamId, lineupId) {
  const lineup = await prisma.lineup.findFirst({
    where: { id: lineupId, teamId },
    include: {
      assignments: {
        include: {
          athlete: {
            select: { id: true, firstName: true, lastName: true, side: true, weightKg: true },
          },
        },
        orderBy: [
          { boatClass: 'asc' },
          { shellName: 'asc' },
          { seatNumber: 'desc' },
        ],
      },
    },
  });

  if (!lineup) {
    throw new Error('Lineup not found');
  }

  return formatLineup(lineup, true);
}

/**
 * Update a lineup
 */
export async function updateLineup(teamId, lineupId, data) {
  const existing = await prisma.lineup.findFirst({
    where: { id: lineupId, teamId },
  });

  if (!existing) {
    throw new Error('Lineup not found');
  }

  const { name, notes, assignments } = data;

  // If assignments provided, replace all
  if (assignments !== undefined) {
    // Delete existing assignments
    await prisma.lineupAssignment.deleteMany({
      where: { lineupId },
    });

    // Create new assignments
    if (assignments.length > 0) {
      await prisma.lineupAssignment.createMany({
        data: assignments.map(a => ({
          lineupId,
          athleteId: a.athleteId,
          boatClass: a.boatClass,
          shellName: a.shellName || null,
          seatNumber: a.seatNumber,
          side: a.side,
          isCoxswain: a.isCoxswain || false,
        })),
      });
    }
  }

  const lineup = await prisma.lineup.update({
    where: { id: lineupId },
    data: {
      name: name !== undefined ? name : undefined,
      notes: notes !== undefined ? notes : undefined,
    },
    include: {
      assignments: {
        include: {
          athlete: {
            select: { id: true, firstName: true, lastName: true, side: true },
          },
        },
      },
    },
  });

  return formatLineup(lineup, true);
}

/**
 * Delete a lineup
 */
export async function deleteLineup(teamId, lineupId) {
  const existing = await prisma.lineup.findFirst({
    where: { id: lineupId, teamId },
  });

  if (!existing) {
    throw new Error('Lineup not found');
  }

  await prisma.lineup.delete({
    where: { id: lineupId },
  });

  return { deleted: true };
}

/**
 * Duplicate a lineup
 */
export async function duplicateLineup(teamId, lineupId, newName) {
  const original = await prisma.lineup.findFirst({
    where: { id: lineupId, teamId },
    include: {
      assignments: true,
    },
  });

  if (!original) {
    throw new Error('Lineup not found');
  }

  const lineup = await prisma.lineup.create({
    data: {
      teamId,
      name: newName || `${original.name} (Copy)`,
      notes: original.notes,
      assignments: {
        create: original.assignments.map(a => ({
          athleteId: a.athleteId,
          boatClass: a.boatClass,
          shellName: a.shellName,
          seatNumber: a.seatNumber,
          side: a.side,
          isCoxswain: a.isCoxswain,
        })),
      },
    },
    include: {
      assignments: {
        include: {
          athlete: {
            select: { id: true, firstName: true, lastName: true, side: true },
          },
        },
      },
    },
  });

  return formatLineup(lineup, true);
}

/**
 * Export lineup data for PDF/CSV generation
 */
export async function exportLineupData(teamId, lineupId) {
  const lineup = await prisma.lineup.findFirst({
    where: { id: lineupId, teamId },
    include: {
      assignments: {
        include: {
          athlete: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              side: true,
              weightKg: true,
              ergTests: {
                where: { testType: '2k' },
                orderBy: { testDate: 'desc' },
                take: 1,
                select: { timeSeconds: true, testDate: true },
              },
            },
          },
        },
        orderBy: [
          { boatClass: 'asc' },
          { shellName: 'asc' },
          { seatNumber: 'desc' },
        ],
      },
      team: {
        select: { name: true },
      },
    },
  });

  if (!lineup) {
    throw new Error('Lineup not found');
  }

  // Group assignments by boat
  const boats = {};
  for (const assignment of lineup.assignments) {
    const boatKey = `${assignment.boatClass}-${assignment.shellName || 'default'}`;
    if (!boats[boatKey]) {
      boats[boatKey] = {
        boatClass: assignment.boatClass,
        shellName: assignment.shellName,
        seats: [],
        coxswain: null,
      };
    }

    const athleteData = {
      seatNumber: assignment.seatNumber,
      side: assignment.side,
      athlete: assignment.athlete ? {
        id: assignment.athlete.id,
        name: `${assignment.athlete.firstName} ${assignment.athlete.lastName}`,
        firstName: assignment.athlete.firstName,
        lastName: assignment.athlete.lastName,
        side: assignment.athlete.side,
        weightKg: assignment.athlete.weightKg ? Number(assignment.athlete.weightKg) : null,
        latest2k: assignment.athlete.ergTests?.[0] ? {
          timeSeconds: Number(assignment.athlete.ergTests[0].timeSeconds),
          date: assignment.athlete.ergTests[0].testDate,
        } : null,
      } : null,
    };

    if (assignment.isCoxswain) {
      boats[boatKey].coxswain = athleteData.athlete;
    } else {
      boats[boatKey].seats.push(athleteData);
    }
  }

  // Sort seats by seat number descending (8 -> 1)
  for (const boat of Object.values(boats)) {
    boat.seats.sort((a, b) => b.seatNumber - a.seatNumber);
  }

  return {
    id: lineup.id,
    name: lineup.name,
    notes: lineup.notes,
    teamName: lineup.team.name,
    createdAt: lineup.createdAt,
    updatedAt: lineup.updatedAt,
    boats: Object.values(boats),
  };
}

/**
 * Format lineup for API response
 */
function formatLineup(lineup, includeAssignments = false) {
  const base = {
    id: lineup.id,
    name: lineup.name,
    notes: lineup.notes,
    createdAt: lineup.createdAt,
    updatedAt: lineup.updatedAt,
  };

  if (includeAssignments && lineup.assignments) {
    base.assignments = lineup.assignments.map(a => ({
      id: a.id,
      athleteId: a.athleteId,
      athlete: a.athlete ? {
        id: a.athlete.id,
        name: `${a.athlete.firstName} ${a.athlete.lastName}`,
        firstName: a.athlete.firstName,
        lastName: a.athlete.lastName,
        side: a.athlete.side,
      } : null,
      boatClass: a.boatClass,
      shellName: a.shellName,
      seatNumber: a.seatNumber,
      side: a.side,
      isCoxswain: a.isCoxswain,
    }));
  } else if (lineup._count) {
    base.assignmentCount = lineup._count.assignments;
  }

  return base;
}

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
      assignments:
        assignments?.length > 0
          ? {
              create: assignments.map((a) => ({
                athleteId: a.athleteId,
                boatClass: a.boatClass,
                shellName: a.shellName || null,
                seatNumber: a.seatNumber,
                side: a.side,
                isCoxswain: a.isCoxswain || false,
              })),
            }
          : undefined,
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
    include: includeAssignments
      ? {
          assignments: {
            include: {
              athlete: {
                select: { id: true, firstName: true, lastName: true, side: true },
              },
            },
          },
        }
      : {
          _count: {
            select: { assignments: true },
          },
        },
    orderBy: { updatedAt: 'desc' },
  });

  return lineups.map((l) => formatLineup(l, includeAssignments));
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
        orderBy: [{ boatClass: 'asc' }, { shellName: 'asc' }, { seatNumber: 'desc' }],
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
        data: assignments.map((a) => ({
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
        create: original.assignments.map((a) => ({
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
        orderBy: [{ boatClass: 'asc' }, { shellName: 'asc' }, { seatNumber: 'desc' }],
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
      athlete: assignment.athlete
        ? {
            id: assignment.athlete.id,
            name: `${assignment.athlete.firstName} ${assignment.athlete.lastName}`,
            firstName: assignment.athlete.firstName,
            lastName: assignment.athlete.lastName,
            side: assignment.athlete.side,
            weightKg: assignment.athlete.weightKg ? Number(assignment.athlete.weightKg) : null,
            latest2k: assignment.athlete.ergTests?.[0]
              ? {
                  timeSeconds: Number(assignment.athlete.ergTests[0].timeSeconds),
                  date: assignment.athlete.ergTests[0].testDate,
                }
              : null,
          }
        : null,
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
 * Search lineups with multi-criteria filtering - Phase 18 LINEUP-02
 *
 * Supports:
 * - Filter by athlete IDs (any match)
 * - Minimum N athletes requirement
 * - Filter by boat classes
 * - Filter by shell names
 * - Date range filtering
 * - Name search
 * - Sorting options
 */
export async function searchLineups(teamId, filters = {}) {
  const {
    athleteIds = [],
    minAthletes = 1,
    boatClasses = [],
    shellNames = [],
    startDate,
    endDate,
    nameSearch,
    sortBy = 'createdAt',
    sortDirection = 'desc',
    limit = 50,
    offset = 0,
  } = filters;

  // Build the where clause
  const where = { teamId };

  // Date range filter
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  // Name search
  if (nameSearch) {
    where.name = {
      contains: nameSearch,
      mode: 'insensitive',
    };
  }

  // For athlete filtering, we need to handle "at least N athletes" logic
  // This is complex in Prisma, so we'll use a two-step approach:
  // 1. Filter lineups that have ANY of the specified athletes
  // 2. Post-process to check minimum count

  if (athleteIds.length > 0) {
    where.assignments = {
      some: {
        athleteId: { in: athleteIds },
      },
    };
  }

  // Boat class filter
  if (boatClasses.length > 0) {
    where.assignments = {
      ...where.assignments,
      some: {
        ...where.assignments?.some,
        boatClass: { in: boatClasses },
      },
    };
  }

  // Shell name filter
  if (shellNames.length > 0) {
    where.assignments = {
      ...where.assignments,
      some: {
        ...where.assignments?.some,
        shellName: { in: shellNames },
      },
    };
  }

  // Determine sort order
  const orderBy = {};
  if (sortBy === 'date' || sortBy === 'createdAt') {
    orderBy.createdAt = sortDirection;
  } else if (sortBy === 'name') {
    orderBy.name = sortDirection;
  } else if (sortBy === 'updatedAt') {
    orderBy.updatedAt = sortDirection;
  } else {
    orderBy.createdAt = 'desc';
  }

  // Fetch lineups with assignments
  const lineups = await prisma.lineup.findMany({
    where,
    include: {
      assignments: {
        select: {
          athleteId: true,
          boatClass: true,
          shellName: true,
        },
      },
    },
    orderBy,
    take: limit + offset, // Fetch extra for post-filtering
  });

  // Post-process to check minimum athlete count and build metadata
  let results = lineups.map((lineup) => {
    const athleteCount = lineup.assignments.length;
    const boatClassSet = new Set(lineup.assignments.map((a) => a.boatClass));
    const shellNameSet = new Set(
      lineup.assignments.filter((a) => a.shellName).map((a) => a.shellName)
    );

    // Count matched athletes if filtering
    let matchedAthleteCount = 0;
    if (athleteIds.length > 0) {
      const lineupAthleteIds = new Set(lineup.assignments.map((a) => a.athleteId));
      matchedAthleteCount = athleteIds.filter((id) => lineupAthleteIds.has(id)).length;
    }

    return {
      id: lineup.id,
      name: lineup.name,
      notes: lineup.notes,
      createdAt: lineup.createdAt.toISOString(),
      updatedAt: lineup.updatedAt.toISOString(),
      athleteCount,
      boatClasses: Array.from(boatClassSet),
      shellNames: Array.from(shellNameSet),
      matchedAthleteCount: athleteIds.length > 0 ? matchedAthleteCount : undefined,
    };
  });

  // Filter by minimum athlete count if specified
  if (athleteIds.length > 0 && minAthletes > 1) {
    results = results.filter((r) => r.matchedAthleteCount >= minAthletes);
  }

  // Apply offset and limit after filtering
  const total = results.length;
  results = results.slice(offset, offset + limit);

  return {
    lineups: results,
    total,
    limit,
    offset,
  };
}

/**
 * Update lineup draft - Phase 25-06
 * Saves draft state without publishing
 */
export async function updateDraft(teamId, lineupId, userId, data) {
  const existing = await prisma.lineup.findFirst({
    where: { id: lineupId, teamId },
  });

  if (!existing) {
    throw new Error('Lineup not found');
  }

  const { name, notes, assignments } = data;

  // Replace assignments if provided (wrapped in transaction for atomicity)
  if (assignments !== undefined) {
    await prisma.$transaction(async (tx) => {
      await tx.lineupAssignment.deleteMany({
        where: { lineupId },
      });

      if (assignments.length > 0) {
        await tx.lineupAssignment.createMany({
          data: assignments.map((a) => ({
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
    });
  }

  const lineup = await prisma.lineup.update({
    where: { id: lineupId },
    data: {
      name: name !== undefined ? name : undefined,
      notes: notes !== undefined ? notes : undefined,
      status: 'draft',
      draftedBy: userId,
    },
    include: {
      assignments: {
        include: {
          athlete: {
            select: { id: true, firstName: true, lastName: true, side: true },
          },
        },
      },
      draftedByUser: {
        select: { id: true, name: true },
      },
    },
  });

  return formatLineup(lineup, true);
}

/**
 * Publish lineup - Phase 25-06
 * Validates no conflicts and sets status to published
 */
export async function publishLineup(teamId, lineupId, lastKnownUpdatedAt) {
  const result = await prisma.$transaction(async (tx) => {
    // Atomic conditional update: check existence + conflict in one query
    const whereClause = { id: lineupId, teamId };
    if (lastKnownUpdatedAt) {
      whereClause.updatedAt = { lte: new Date(lastKnownUpdatedAt) };
    }

    const updateResult = await tx.lineup.updateMany({
      where: whereClause,
      data: { status: 'published', publishedAt: new Date() },
    });

    if (updateResult.count === 0) {
      // Determine why: not found vs conflict
      const existing = await tx.lineup.findFirst({
        where: { id: lineupId, teamId },
      });
      if (!existing) {
        throw new Error('Lineup not found');
      }
      const error = new Error('Lineup was modified by another user');
      error.code = 'CONFLICT';
      error.currentLineup = existing;
      throw error;
    }

    // Fetch the updated lineup with full includes
    return await tx.lineup.findFirst({
      where: { id: lineupId },
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
  });

  return formatLineup(result, true);
}

/**
 * Format lineup for API response
 */
function formatLineup(lineup, includeAssignments = false) {
  const base = {
    id: lineup.id,
    name: lineup.name,
    notes: lineup.notes,
    status: lineup.status,
    draftedBy: lineup.draftedBy,
    publishedAt: lineup.publishedAt,
    createdAt: lineup.createdAt,
    updatedAt: lineup.updatedAt,
  };

  // Include draftedByUser if present
  if (lineup.draftedByUser) {
    base.draftedByUser = lineup.draftedByUser;
  }

  if (includeAssignments && lineup.assignments) {
    base.assignments = lineup.assignments.map((a) => ({
      id: a.id,
      athleteId: a.athleteId,
      athlete: a.athlete
        ? {
            id: a.athlete.id,
            name: `${a.athlete.firstName} ${a.athlete.lastName}`,
            firstName: a.athlete.firstName,
            lastName: a.athlete.lastName,
            side: a.athlete.side,
          }
        : null,
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

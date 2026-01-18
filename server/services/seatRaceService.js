import { prisma } from '../db/connection.js';

/**
 * Create a new seat race session
 */
export async function createSession(teamId, data) {
  const { date, location, conditions, boatClass, description } = data;

  const session = await prisma.seatRaceSession.create({
    data: {
      teamId,
      date: new Date(date),
      location: location || null,
      conditions: conditions || null,
      boatClass,
      description: description || null,
    },
    include: {
      pieces: {
        include: {
          boats: {
            include: {
              assignments: {
                include: {
                  athlete: {
                    select: { id: true, firstName: true, lastName: true, side: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { sequenceOrder: 'asc' },
      },
    },
  });

  return formatSession(session, true);
}

/**
 * Get all seat race sessions for a team
 */
export async function getSessions(teamId, options = {}) {
  const { limit, offset } = options;

  const sessions = await prisma.seatRaceSession.findMany({
    where: { teamId },
    include: {
      _count: {
        select: { pieces: true },
      },
    },
    orderBy: { date: 'desc' },
    ...(limit && { take: limit }),
    ...(offset && { skip: offset }),
  });

  return sessions.map(s => formatSession(s, false));
}

/**
 * Get a single session by ID with full details
 */
export async function getSessionById(teamId, sessionId) {
  const session = await prisma.seatRaceSession.findFirst({
    where: { id: sessionId, teamId },
    include: {
      pieces: {
        include: {
          boats: {
            include: {
              assignments: {
                include: {
                  athlete: {
                    select: { id: true, firstName: true, lastName: true, side: true, weightKg: true },
                  },
                },
                orderBy: { seatNumber: 'desc' },
              },
            },
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { sequenceOrder: 'asc' },
      },
    },
  });

  if (!session) {
    throw new Error('Seat race session not found');
  }

  return formatSession(session, true);
}

/**
 * Update a seat race session
 */
export async function updateSession(teamId, sessionId, data) {
  const existing = await prisma.seatRaceSession.findFirst({
    where: { id: sessionId, teamId },
  });

  if (!existing) {
    throw new Error('Seat race session not found');
  }

  const { date, location, conditions, boatClass, description } = data;

  const session = await prisma.seatRaceSession.update({
    where: { id: sessionId },
    data: {
      ...(date !== undefined && { date: new Date(date) }),
      ...(location !== undefined && { location }),
      ...(conditions !== undefined && { conditions }),
      ...(boatClass !== undefined && { boatClass }),
      ...(description !== undefined && { description }),
    },
    include: {
      pieces: {
        include: {
          boats: {
            include: {
              assignments: {
                include: {
                  athlete: {
                    select: { id: true, firstName: true, lastName: true, side: true },
                  },
                },
                orderBy: { seatNumber: 'desc' },
              },
            },
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { sequenceOrder: 'asc' },
      },
    },
  });

  return formatSession(session, true);
}

/**
 * Delete a seat race session (cascades to pieces, boats, assignments)
 */
export async function deleteSession(teamId, sessionId) {
  const existing = await prisma.seatRaceSession.findFirst({
    where: { id: sessionId, teamId },
  });

  if (!existing) {
    throw new Error('Seat race session not found');
  }

  await prisma.seatRaceSession.delete({
    where: { id: sessionId },
  });

  return { deleted: true };
}

/**
 * Format session for API response
 */
function formatSession(session, includeDetails = false) {
  const base = {
    id: session.id,
    date: session.date,
    location: session.location,
    conditions: session.conditions,
    boatClass: session.boatClass,
    description: session.description,
    createdAt: session.createdAt,
  };

  if (includeDetails && session.pieces) {
    base.pieces = session.pieces.map(piece => ({
      id: piece.id,
      sequenceOrder: piece.sequenceOrder,
      distanceMeters: piece.distanceMeters,
      direction: piece.direction,
      notes: piece.notes,
      boats: piece.boats.map(boat => ({
        id: boat.id,
        name: boat.name,
        shellName: boat.shellName,
        finishTimeSeconds: boat.finishTimeSeconds ? Number(boat.finishTimeSeconds) : null,
        handicapSeconds: Number(boat.handicapSeconds),
        assignments: boat.assignments.map(a => ({
          id: a.id,
          athleteId: a.athleteId,
          athlete: a.athlete ? {
            id: a.athlete.id,
            name: `${a.athlete.firstName} ${a.athlete.lastName}`,
            firstName: a.athlete.firstName,
            lastName: a.athlete.lastName,
            side: a.athlete.side,
            weightKg: a.athlete.weightKg ? Number(a.athlete.weightKg) : null,
          } : null,
          seatNumber: a.seatNumber,
          side: a.side,
        })),
      })),
    }));
  } else if (session._count) {
    base.pieceCount = session._count.pieces;
  }

  return base;
}

// ============================================
// Piece Management
// ============================================

/**
 * Add a piece to a session with auto-incrementing sequenceOrder
 */
export async function addPiece(teamId, sessionId, data) {
  // Validate team ownership of session
  const session = await prisma.seatRaceSession.findFirst({
    where: { id: sessionId, teamId },
  });

  if (!session) {
    throw new Error('Seat race session not found');
  }

  const { distanceMeters, direction, notes } = data;

  // Get the max sequenceOrder for this session
  const maxSequence = await prisma.seatRacePiece.aggregate({
    where: { sessionId },
    _max: { sequenceOrder: true },
  });

  const nextOrder = (maxSequence._max.sequenceOrder ?? 0) + 1;

  const piece = await prisma.seatRacePiece.create({
    data: {
      sessionId,
      sequenceOrder: nextOrder,
      distanceMeters: distanceMeters || null,
      direction: direction || null,
      notes: notes || null,
    },
    include: {
      boats: {
        include: {
          assignments: {
            include: {
              athlete: {
                select: { id: true, firstName: true, lastName: true, side: true, weightKg: true },
              },
            },
            orderBy: { seatNumber: 'desc' },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
  });

  return formatPiece(piece);
}

/**
 * Update a piece's details
 */
export async function updatePiece(teamId, pieceId, data) {
  // Validate team ownership through piece -> session -> team
  const piece = await prisma.seatRacePiece.findFirst({
    where: {
      id: pieceId,
      session: { teamId },
    },
  });

  if (!piece) {
    throw new Error('Piece not found');
  }

  const { distanceMeters, direction, notes, sequenceOrder } = data;

  const updated = await prisma.seatRacePiece.update({
    where: { id: pieceId },
    data: {
      ...(distanceMeters !== undefined && { distanceMeters }),
      ...(direction !== undefined && { direction }),
      ...(notes !== undefined && { notes }),
      ...(sequenceOrder !== undefined && { sequenceOrder }),
    },
    include: {
      boats: {
        include: {
          assignments: {
            include: {
              athlete: {
                select: { id: true, firstName: true, lastName: true, side: true, weightKg: true },
              },
            },
            orderBy: { seatNumber: 'desc' },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
  });

  return formatPiece(updated);
}

/**
 * Delete a piece
 */
export async function deletePiece(teamId, pieceId) {
  // Validate team ownership through piece -> session -> team
  const piece = await prisma.seatRacePiece.findFirst({
    where: {
      id: pieceId,
      session: { teamId },
    },
  });

  if (!piece) {
    throw new Error('Piece not found');
  }

  await prisma.seatRacePiece.delete({
    where: { id: pieceId },
  });

  return { deleted: true };
}

/**
 * Format piece for API response
 */
function formatPiece(piece) {
  return {
    id: piece.id,
    sequenceOrder: piece.sequenceOrder,
    distanceMeters: piece.distanceMeters,
    direction: piece.direction,
    notes: piece.notes,
    boats: piece.boats.map(boat => formatBoat(boat)),
  };
}

// ============================================
// Boat Management
// ============================================

/**
 * Add a boat to a piece
 */
export async function addBoat(teamId, pieceId, data) {
  // Validate team ownership through piece -> session -> team
  const piece = await prisma.seatRacePiece.findFirst({
    where: {
      id: pieceId,
      session: { teamId },
    },
  });

  if (!piece) {
    throw new Error('Piece not found');
  }

  const { name, shellName, finishTimeSeconds, handicapSeconds } = data;

  const boat = await prisma.seatRaceBoat.create({
    data: {
      pieceId,
      name,
      shellName: shellName || null,
      finishTimeSeconds: finishTimeSeconds ?? null,
      handicapSeconds: handicapSeconds ?? 0,
    },
    include: {
      assignments: {
        include: {
          athlete: {
            select: { id: true, firstName: true, lastName: true, side: true, weightKg: true },
          },
        },
        orderBy: { seatNumber: 'desc' },
      },
    },
  });

  return formatBoat(boat);
}

/**
 * Update a boat's details
 */
export async function updateBoat(teamId, boatId, data) {
  // Validate team ownership through boat -> piece -> session -> team
  const boat = await prisma.seatRaceBoat.findFirst({
    where: {
      id: boatId,
      piece: {
        session: { teamId },
      },
    },
  });

  if (!boat) {
    throw new Error('Boat not found');
  }

  const { name, shellName, finishTimeSeconds, handicapSeconds } = data;

  const updated = await prisma.seatRaceBoat.update({
    where: { id: boatId },
    data: {
      ...(name !== undefined && { name }),
      ...(shellName !== undefined && { shellName }),
      ...(finishTimeSeconds !== undefined && { finishTimeSeconds }),
      ...(handicapSeconds !== undefined && { handicapSeconds }),
    },
    include: {
      assignments: {
        include: {
          athlete: {
            select: { id: true, firstName: true, lastName: true, side: true, weightKg: true },
          },
        },
        orderBy: { seatNumber: 'desc' },
      },
    },
  });

  return formatBoat(updated);
}

/**
 * Delete a boat
 */
export async function deleteBoat(teamId, boatId) {
  // Validate team ownership through boat -> piece -> session -> team
  const boat = await prisma.seatRaceBoat.findFirst({
    where: {
      id: boatId,
      piece: {
        session: { teamId },
      },
    },
  });

  if (!boat) {
    throw new Error('Boat not found');
  }

  await prisma.seatRaceBoat.delete({
    where: { id: boatId },
  });

  return { deleted: true };
}

/**
 * Format boat for API response
 */
function formatBoat(boat) {
  return {
    id: boat.id,
    name: boat.name,
    shellName: boat.shellName,
    finishTimeSeconds: boat.finishTimeSeconds ? Number(boat.finishTimeSeconds) : null,
    handicapSeconds: Number(boat.handicapSeconds),
    assignments: boat.assignments.map(a => ({
      id: a.id,
      athleteId: a.athleteId,
      athlete: a.athlete ? {
        id: a.athlete.id,
        name: `${a.athlete.firstName} ${a.athlete.lastName}`,
        firstName: a.athlete.firstName,
        lastName: a.athlete.lastName,
        side: a.athlete.side,
        weightKg: a.athlete.weightKg ? Number(a.athlete.weightKg) : null,
      } : null,
      seatNumber: a.seatNumber,
      side: a.side,
    })),
  };
}

// ============================================
// Boat Assignments
// ============================================

/**
 * Replace all assignments for a boat
 * @param {string} teamId - Team ID for ownership validation
 * @param {string} boatId - Boat ID to set assignments for
 * @param {Array<{athleteId: string, seatNumber: number, side: string}>} assignments - Array of assignments
 */
export async function setBoatAssignments(teamId, boatId, assignments) {
  // Validate team ownership through boat -> piece -> session -> team
  const boat = await prisma.seatRaceBoat.findFirst({
    where: {
      id: boatId,
      piece: {
        session: { teamId },
      },
    },
  });

  if (!boat) {
    throw new Error('Boat not found');
  }

  // Use a transaction to delete existing and create new assignments
  await prisma.$transaction(async (tx) => {
    // Delete all existing assignments for this boat
    await tx.seatRaceAssignment.deleteMany({
      where: { boatId },
    });

    // Create new assignments if any provided
    if (assignments && assignments.length > 0) {
      await tx.seatRaceAssignment.createMany({
        data: assignments.map(a => ({
          boatId,
          athleteId: a.athleteId,
          seatNumber: a.seatNumber,
          side: a.side || null,
        })),
      });
    }
  });

  // Fetch and return the updated boat with assignments
  const updated = await prisma.seatRaceBoat.findUnique({
    where: { id: boatId },
    include: {
      assignments: {
        include: {
          athlete: {
            select: { id: true, firstName: true, lastName: true, side: true, weightKg: true },
          },
        },
        orderBy: { seatNumber: 'desc' },
      },
    },
  });

  return formatBoat(updated);
}

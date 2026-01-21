import prisma from '../db/connection.js';

/**
 * Create a new boat session with pieces (coxswain workout entry)
 */
export async function createBoatSession(teamId, userId, data) {
  return await prisma.$transaction(async (tx) => {
    // Find or create a WaterSession for this date/event
    let waterSession;

    if (data.calendarEventId) {
      // Try to find existing session for this calendar event
      waterSession = await tx.waterSession.findFirst({
        where: { teamId, calendarEventId: data.calendarEventId },
      });
    }

    if (!waterSession) {
      // Create a new water session
      waterSession = await tx.waterSession.create({
        data: {
          teamId,
          date: new Date(data.date || new Date()),
          calendarEventId: data.calendarEventId || null,
          conditions: data.conditions || null,
          location: data.location || null,
          notes: data.sessionNotes || null,
        },
      });
    }

    // Create the boat session with pieces
    const boatSession = await tx.boatSession.create({
      data: {
        waterSessionId: waterSession.id,
        boatId: data.boatId || null,
        boatName: data.boatName || 'Unknown Boat',
        coxswainId: userId,
        notes: data.notes || null,
        pieces: {
          create: (data.pieces || []).map((piece, index) => ({
            pieceNumber: piece.number || index + 1,
            distance: piece.distance || null,
            timeSeconds: piece.time || null,
            strokeRate: piece.rate || piece.strokeRate || null,
            pieceType: piece.type || null,
            notes: piece.notes || null,
          })),
        },
      },
      include: {
        pieces: true,
        waterSession: true,
      },
    });

    return { waterSession, boatSession };
  });
}

/**
 * Get coxswain's session history
 */
export async function getCoxswainHistory(teamId, userId, limit = 20) {
  return await prisma.boatSession.findMany({
    where: {
      waterSession: { teamId },
      coxswainId: userId,
    },
    include: {
      waterSession: true,
      pieces: {
        orderBy: { pieceNumber: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get all water sessions for a team (coach view)
 */
export async function getTeamWaterSessions(teamId, options = {}) {
  const { startDate, endDate, limit = 50 } = options;

  const where = {
    teamId,
    ...(startDate && endDate && {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    }),
  };

  return await prisma.waterSession.findMany({
    where,
    include: {
      boatSessions: {
        include: {
          pieces: {
            orderBy: { pieceNumber: 'asc' },
          },
          coxswain: {
            select: { id: true, name: true },
          },
        },
      },
      calendarEvent: {
        select: { id: true, title: true, eventType: true },
      },
    },
    orderBy: { date: 'desc' },
    take: limit,
  });
}

/**
 * Get a specific water session by ID
 */
export async function getWaterSessionById(sessionId, teamId) {
  const session = await prisma.waterSession.findFirst({
    where: { id: sessionId, teamId },
    include: {
      boatSessions: {
        include: {
          pieces: {
            orderBy: { pieceNumber: 'asc' },
          },
          coxswain: {
            select: { id: true, name: true },
          },
        },
      },
      calendarEvent: true,
    },
  });

  if (!session) {
    throw new Error('Water session not found');
  }

  return session;
}

/**
 * Update a boat session's pieces
 */
export async function updateBoatSession(boatSessionId, teamId, data) {
  // Verify the boat session belongs to this team
  const existing = await prisma.boatSession.findFirst({
    where: {
      id: boatSessionId,
      waterSession: { teamId },
    },
  });

  if (!existing) {
    throw new Error('Boat session not found');
  }

  return await prisma.$transaction(async (tx) => {
    // Update basic fields
    const updated = await tx.boatSession.update({
      where: { id: boatSessionId },
      data: {
        notes: data.notes ?? existing.notes,
      },
    });

    // If pieces provided, replace them
    if (data.pieces) {
      // Delete existing pieces
      await tx.waterPiece.deleteMany({
        where: { boatSessionId },
      });

      // Create new pieces
      await tx.waterPiece.createMany({
        data: data.pieces.map((piece, index) => ({
          boatSessionId,
          pieceNumber: piece.number || index + 1,
          distance: piece.distance || null,
          timeSeconds: piece.time || null,
          strokeRate: piece.rate || piece.strokeRate || null,
          pieceType: piece.type || null,
          notes: piece.notes || null,
        })),
      });
    }

    return await tx.boatSession.findUnique({
      where: { id: boatSessionId },
      include: {
        pieces: { orderBy: { pieceNumber: 'asc' } },
        waterSession: true,
      },
    });
  });
}

/**
 * Delete a boat session
 */
export async function deleteBoatSession(boatSessionId, teamId) {
  const existing = await prisma.boatSession.findFirst({
    where: {
      id: boatSessionId,
      waterSession: { teamId },
    },
  });

  if (!existing) {
    throw new Error('Boat session not found');
  }

  await prisma.boatSession.delete({
    where: { id: boatSessionId },
  });

  return { success: true };
}

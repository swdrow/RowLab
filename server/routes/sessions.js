import express from 'express';
import { authenticateToken, requireTeam, requireRole } from '../middleware/auth.js';
import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';

const router = express.Router();

// All routes require authentication and team context
router.use(authenticateToken, requireTeam);

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a unique 6-character alphanumeric session code
 * Used for live session joining
 */
async function generateSessionCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars: I, O, 0, 1
  let code;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Check if code already exists
    const existing = await prisma.session.findUnique({
      where: { sessionCode: code },
    });
    if (!existing) break;
    attempts++;
  } while (attempts < maxAttempts);

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique session code');
  }

  return code;
}

// ============================================
// Session Routes
// ============================================

/**
 * GET /api/v1/sessions
 * List sessions for the active team with optional filters
 * Query params: type, status, startDate, endDate, limit, offset
 */
router.get('/', async (req, res) => {
  try {
    const { type, status, startDate, endDate, limit, offset } = req.query;

    const where = {
      teamId: req.user.activeTeamId,
    };

    // Apply filters
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const sessions = await prisma.session.findMany({
      where,
      include: {
        pieces: {
          orderBy: { order: 'asc' },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { date: 'desc' },
      ...(limit && { take: parseInt(limit, 10) }),
      ...(offset && { skip: parseInt(offset, 10) }),
    });

    res.json({ success: true, data: { sessions } });
  } catch (err) {
    logger.error('Get sessions error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch sessions' },
    });
  }
});

/**
 * GET /api/v1/sessions/active
 * Get the currently active session for the team
 */
router.get('/active', async (req, res) => {
  try {
    const session = await prisma.session.findFirst({
      where: {
        teamId: req.user.activeTeamId,
        status: 'ACTIVE',
      },
      include: {
        pieces: {
          orderBy: { order: 'asc' },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    res.json({ success: true, data: { session } });
  } catch (err) {
    logger.error('Get active session error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch active session' },
    });
  }
});

/**
 * GET /api/v1/sessions/:id
 * Get a single session with pieces
 */
router.get('/:id', async (req, res) => {
  try {
    const sessionId = req.params.id;

    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        teamId: req.user.activeTeamId,
      },
      include: {
        pieces: {
          orderBy: { order: 'asc' },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found' },
      });
    }

    res.json({ success: true, data: { session } });
  } catch (err) {
    logger.error('Get session error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch session' },
    });
  }
});

/**
 * POST /api/v1/sessions
 * Create a new session with optional nested pieces (OWNER, COACH only)
 */
router.post('/', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const { name, type, date, startTime, endTime, recurrenceRule, notes, athleteVisibility, pieces } = req.body;

    // Validate required fields
    if (!name || !type || !date) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'name, type, and date are required' },
      });
    }

    // Validate type enum
    const validTypes = ['ERG', 'ROW', 'LIFT', 'RUN', 'CROSS_TRAIN', 'RECOVERY'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `type must be one of: ${validTypes.join(', ')}` },
      });
    }

    const session = await prisma.session.create({
      data: {
        name,
        type,
        date: new Date(date),
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        recurrenceRule,
        notes,
        athleteVisibility: athleteVisibility ?? true,
        teamId: req.user.activeTeamId,
        createdById: req.user.id,
        // Create nested pieces if provided
        ...(pieces && pieces.length > 0 && {
          pieces: {
            create: pieces.map((piece, index) => ({
              name: piece.name,
              segment: piece.segment || 'MAIN',
              description: piece.description,
              order: piece.order ?? index,
              distance: piece.distance,
              duration: piece.duration,
              targetSplit: piece.targetSplit,
              targetRate: piece.targetRate,
              targetWatts: piece.targetWatts,
              targetHRZone: piece.targetHRZone,
              targetRPE: piece.targetRPE,
              notes: piece.notes,
              boatClass: piece.boatClass,
              sets: piece.sets,
              reps: piece.reps,
            })),
          },
        }),
      },
      include: {
        pieces: {
          orderBy: { order: 'asc' },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    res.status(201).json({ success: true, data: { session } });
  } catch (err) {
    logger.error('Create session error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create session' },
    });
  }
});

/**
 * PATCH /api/v1/sessions/:id
 * Update a session (OWNER, COACH only)
 * Auto-generates session code when status changes to ACTIVE
 */
router.patch('/:id', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { name, type, date, startTime, endTime, recurrenceRule, notes, status, athleteVisibility } = req.body;

    // Check session exists and belongs to team
    const existing = await prisma.session.findFirst({
      where: {
        id: sessionId,
        teamId: req.user.activeTeamId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found' },
      });
    }

    // Validate type enum if provided
    if (type) {
      const validTypes = ['ERG', 'ROW', 'LIFT', 'RUN', 'CROSS_TRAIN', 'RECOVERY'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `type must be one of: ${validTypes.join(', ')}` },
        });
      }
    }

    // Validate status enum if provided
    if (status) {
      const validStatuses = ['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `status must be one of: ${validStatuses.join(', ')}` },
        });
      }
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (date !== undefined) updateData.date = new Date(date);
    if (startTime !== undefined) updateData.startTime = startTime ? new Date(startTime) : null;
    if (endTime !== undefined) updateData.endTime = endTime ? new Date(endTime) : null;
    if (recurrenceRule !== undefined) updateData.recurrenceRule = recurrenceRule;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    if (athleteVisibility !== undefined) updateData.athleteVisibility = athleteVisibility;

    // Auto-generate session code when transitioning to ACTIVE
    if (status === 'ACTIVE' && existing.status !== 'ACTIVE' && !existing.sessionCode) {
      updateData.sessionCode = await generateSessionCode();
    }

    // Clear session code when completing or cancelling
    if ((status === 'COMPLETED' || status === 'CANCELLED') && existing.sessionCode) {
      updateData.sessionCode = null;
    }

    const session = await prisma.session.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        pieces: {
          orderBy: { order: 'asc' },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    res.json({ success: true, data: { session } });
  } catch (err) {
    logger.error('Update session error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update session' },
    });
  }
});

/**
 * DELETE /api/v1/sessions/:id
 * Delete a session and its pieces (OWNER, COACH only)
 */
router.delete('/:id', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const sessionId = req.params.id;

    // Check session exists and belongs to team
    const existing = await prisma.session.findFirst({
      where: {
        id: sessionId,
        teamId: req.user.activeTeamId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found' },
      });
    }

    // Delete session (pieces cascade due to onDelete: Cascade)
    await prisma.session.delete({
      where: { id: sessionId },
    });

    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    logger.error('Delete session error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to delete session' },
    });
  }
});

/**
 * POST /api/v1/sessions/join/:code
 * Join a live session by its 6-character code
 */
router.post('/join/:code', async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || code.length !== 6) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid session code format' },
      });
    }

    const session = await prisma.session.findFirst({
      where: {
        sessionCode: code.toUpperCase(),
        status: 'ACTIVE',
      },
      include: {
        pieces: {
          orderBy: { order: 'asc' },
        },
        team: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No active session found with this code' },
      });
    }

    res.json({ success: true, data: { session } });
  } catch (err) {
    logger.error('Join session error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to join session' },
    });
  }
});

// ============================================
// Piece Routes (nested under session)
// ============================================

/**
 * POST /api/v1/sessions/:sessionId/pieces
 * Add a piece to a session (OWNER, COACH only)
 */
router.post('/:sessionId/pieces', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const { name, segment, description, order, distance, duration, targetSplit, targetRate, targetWatts, targetHRZone, targetRPE, notes, boatClass, sets, reps } = req.body;

    // Check session exists and belongs to team
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        teamId: req.user.activeTeamId,
      },
      include: {
        pieces: true,
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found' },
      });
    }

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'name is required' },
      });
    }

    // Auto-calculate order if not provided
    const pieceOrder = order ?? session.pieces.length;

    const piece = await prisma.piece.create({
      data: {
        sessionId,
        name,
        segment: segment || 'MAIN',
        description,
        order: pieceOrder,
        distance,
        duration,
        targetSplit,
        targetRate,
        targetWatts,
        targetHRZone,
        targetRPE,
        notes,
        boatClass,
        sets,
        reps,
      },
    });

    res.status(201).json({ success: true, data: { piece } });
  } catch (err) {
    logger.error('Add piece error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to add piece' },
    });
  }
});

/**
 * PATCH /api/v1/sessions/pieces/:pieceId
 * Update a piece (OWNER, COACH only)
 */
router.patch('/pieces/:pieceId', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const pieceId = req.params.pieceId;

    // Check piece exists and belongs to team's session
    const existing = await prisma.piece.findFirst({
      where: {
        id: pieceId,
        session: {
          teamId: req.user.activeTeamId,
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Piece not found' },
      });
    }

    const { name, segment, description, order, distance, duration, targetSplit, targetRate, targetWatts, targetHRZone, targetRPE, notes, boatClass, sets, reps } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (segment !== undefined) updateData.segment = segment;
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) updateData.order = order;
    if (distance !== undefined) updateData.distance = distance;
    if (duration !== undefined) updateData.duration = duration;
    if (targetSplit !== undefined) updateData.targetSplit = targetSplit;
    if (targetRate !== undefined) updateData.targetRate = targetRate;
    if (targetWatts !== undefined) updateData.targetWatts = targetWatts;
    if (targetHRZone !== undefined) updateData.targetHRZone = targetHRZone;
    if (targetRPE !== undefined) updateData.targetRPE = targetRPE;
    if (notes !== undefined) updateData.notes = notes;
    if (boatClass !== undefined) updateData.boatClass = boatClass;
    if (sets !== undefined) updateData.sets = sets;
    if (reps !== undefined) updateData.reps = reps;

    const piece = await prisma.piece.update({
      where: { id: pieceId },
      data: updateData,
    });

    res.json({ success: true, data: { piece } });
  } catch (err) {
    logger.error('Update piece error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update piece' },
    });
  }
});

/**
 * DELETE /api/v1/sessions/pieces/:pieceId
 * Delete a piece (OWNER, COACH only)
 */
router.delete('/pieces/:pieceId', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const pieceId = req.params.pieceId;

    // Check piece exists and belongs to team's session
    const existing = await prisma.piece.findFirst({
      where: {
        id: pieceId,
        session: {
          teamId: req.user.activeTeamId,
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Piece not found' },
      });
    }

    await prisma.piece.delete({
      where: { id: pieceId },
    });

    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    logger.error('Delete piece error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to delete piece' },
    });
  }
});

export default router;

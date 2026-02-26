import express from 'express';
import { param, body, validationResult } from 'express-validator';
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
          select: { id: true, name: true },
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
          select: { id: true, name: true },
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
          select: { id: true, name: true },
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
    const {
      name,
      type,
      date,
      startTime,
      endTime,
      recurrenceRule,
      notes,
      athleteVisibility,
      pieces,
    } = req.body;

    // Validate required fields
    if (!name || !type || !date) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: 'name, type, and date are required' },
      });
    }

    // Validate type enum
    const validTypes = ['ERG', 'ROW', 'LIFT', 'RUN', 'CROSS_TRAIN', 'RECOVERY'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: `type must be one of: ${validTypes.join(', ')}`,
        },
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
        ...(pieces &&
          pieces.length > 0 && {
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
          select: { id: true, name: true },
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
    const {
      name,
      type,
      date,
      startTime,
      endTime,
      recurrenceRule,
      notes,
      status,
      athleteVisibility,
    } = req.body;

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
          error: {
            code: 'VALIDATION_FAILED',
            message: `type must be one of: ${validTypes.join(', ')}`,
          },
        });
      }
    }

    // Validate status enum if provided
    if (status) {
      const validStatuses = ['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: `status must be one of: ${validStatuses.join(', ')}`,
          },
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
          select: { id: true, name: true },
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
        error: { code: 'VALIDATION_FAILED', message: 'Invalid session code format' },
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
          select: { id: true, name: true },
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
    const {
      name,
      segment,
      description,
      order,
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
    } = req.body;

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
        error: { code: 'VALIDATION_FAILED', message: 'name is required' },
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

    const {
      name,
      segment,
      description,
      order,
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
    } = req.body;

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

// ============================================
// Live Session Data
// ============================================

/**
 * GET /api/v1/sessions/:id/live-data
 * Get live erg data for session athletes by fetching from C2 Logbook
 * Returns aggregated athlete performance data for active sessions
 */
router.get('/:id/live-data', param('id').isString(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details: errors.array() },
    });
  }

  const { id } = req.params;
  const teamId = req.user.activeTeamId;

  try {
    // Fetch session with pieces
    const session = await prisma.session.findFirst({
      where: { id, teamId },
      include: {
        pieces: { orderBy: { order: 'asc' } },
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found' },
      });
    }

    if (session.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: 'Session is not active' },
      });
    }

    // Fetch all athletes on the team with their C2 connections
    const athletes = await prisma.athlete.findMany({
      where: { teamId },
      include: {
        c2Connection: true,
      },
    });

    // Build athlete data array
    const athleteData = [];

    for (const athlete of athletes) {
      const baseData = {
        athleteId: athlete.id,
        athleteName: `${athlete.firstName} ${athlete.lastName}`,
        distance: 0,
        time: 0,
        pace: 0,
        watts: 0,
        strokeRate: 0,
        heartRate: null,
        strokeCount: null,
        status: 'pending',
        lastUpdated: new Date().toISOString(),
      };

      // If athlete has C2 connection, try to fetch their latest data
      if (athlete.c2Connection?.accessToken) {
        try {
          // Fetch latest workout from C2 Logbook
          const c2Response = await fetch(
            `https://log.concept2.com/api/users/${athlete.c2Connection.c2UserId}/results?type=rower`,
            {
              headers: {
                Authorization: `Bearer ${athlete.c2Connection.accessToken}`,
                Accept: 'application/vnd.c2logbook.v1+json',
              },
            }
          );

          if (c2Response.ok) {
            const c2Data = await c2Response.json();

            // Get most recent workout from today
            const today = new Date().toISOString().split('T')[0];
            const todayWorkouts = c2Data.data?.filter((w) => w.date?.startsWith(today)) || [];

            if (todayWorkouts.length > 0) {
              const latest = todayWorkouts[0];

              athleteData.push({
                ...baseData,
                distance: latest.distance || 0,
                time: latest.time || 0,
                pace: latest.time && latest.distance ? latest.time / (latest.distance / 500) : 0,
                watts: latest.watts_avg || 0,
                strokeRate: latest.stroke_rate || 0,
                heartRate: latest.heart_rate_avg || null,
                strokeCount: latest.stroke_count || null,
                status: latest.workout_type === 'JustRow' ? 'active' : 'finished',
                lastUpdated: latest.date || new Date().toISOString(),
              });
              continue;
            }
          }
        } catch (c2Error) {
          logger.error('C2 fetch error', { athleteId: athlete.id, error: c2Error.message });
        }
      }

      // No C2 data available, add as pending
      athleteData.push(baseData);
    }

    // Find active piece (first incomplete piece, or first if all complete)
    const activePiece = session.pieces.find((p) => !p.completedAt) || session.pieces[0];

    // Return structured response
    res.json({
      success: true,
      data: {
        sessionId: session.id,
        sessionName: session.name,
        activePieceId: activePiece?.id,
        activePieceName: activePiece?.name,
        athletes: athleteData,
        startedAt: session.updatedAt.toISOString(),
        sessionCode: session.sessionCode,
      },
    });
  } catch (error) {
    logger.error('Live data fetch error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch live erg data' },
    });
  }
});

// ============================================
// Attendance Routes
// ============================================

/**
 * POST /api/v1/sessions/:id/record-attendance
 * Record attendance from session participation
 * Automatically determines status based on participation percentage
 */
router.post(
  '/:id/record-attendance',
  [
    param('id').isString(),
    body('athleteId').isString(),
    body('participationPercent').isFloat({ min: 0, max: 100 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details: errors.array() },
      });
    }

    const { id: sessionId } = req.params;
    const { athleteId, participationPercent } = req.body;
    const teamId = req.user.activeTeamId;

    try {
      // Verify session exists and belongs to team
      const session = await prisma.session.findFirst({
        where: { id: sessionId, teamId },
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Session not found' },
        });
      }

      // Determine status based on participation threshold
      // Default thresholds: 75% = Present, 25-75% = Partial, <25% = Absent
      let status = 'Absent';
      if (participationPercent >= 75) {
        status = 'Present';
      } else if (participationPercent >= 25) {
        status = 'Partial';
      }

      // Upsert attendance record
      const attendance = await prisma.sessionAttendance.upsert({
        where: {
          sessionId_athleteId: { sessionId, athleteId },
        },
        update: {
          participationPercent,
          status,
          autoRecorded: true,
        },
        create: {
          sessionId,
          athleteId,
          participationPercent,
          status,
          autoRecorded: true,
        },
      });

      res.json({ success: true, data: { attendance } });
    } catch (error) {
      logger.error('Error recording attendance:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to record attendance' },
      });
    }
  }
);

/**
 * PATCH /api/v1/sessions/:id/attendance/:athleteId
 * Override attendance status (OWNER, COACH only)
 */
router.patch(
  '/:id/attendance/:athleteId',
  requireRole('OWNER', 'COACH'),
  [
    param('id').isString(),
    param('athleteId').isString(),
    body('status').isIn(['Present', 'Late', 'Partial', 'Absent', 'Injured', 'Class']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details: errors.array() },
      });
    }

    const { id: sessionId, athleteId } = req.params;
    const { status } = req.body;
    const teamId = req.user.activeTeamId;
    const userId = req.user.id;

    try {
      // Verify session exists and belongs to team
      const session = await prisma.session.findFirst({
        where: { id: sessionId, teamId },
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Session not found' },
        });
      }

      // Check if attendance exists
      const existing = await prisma.sessionAttendance.findUnique({
        where: {
          sessionId_athleteId: { sessionId, athleteId },
        },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Attendance record not found' },
        });
      }

      // Update attendance
      const attendance = await prisma.sessionAttendance.update({
        where: {
          sessionId_athleteId: { sessionId, athleteId },
        },
        data: {
          status,
          autoRecorded: false,
          overriddenAt: new Date(),
          overriddenById: userId,
        },
      });

      res.json({ success: true, data: { attendance } });
    } catch (error) {
      logger.error('Error overriding attendance:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to override attendance' },
      });
    }
  }
);

/**
 * GET /api/v1/sessions/:id/attendance
 * Get session attendance records
 */
router.get('/:id/attendance', param('id').isString(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details: errors.array() },
    });
  }

  const { id: sessionId } = req.params;
  const teamId = req.user.activeTeamId;

  try {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, teamId },
      include: {
        attendance: {
          include: {
            athlete: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found' },
      });
    }

    res.json({ success: true, data: { attendance: session.attendance } });
  } catch (error) {
    logger.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch attendance' },
    });
  }
});

export default router;

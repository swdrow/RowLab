import express from 'express';
import logger from '../utils/logger.js';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateToken, requireRole, teamIsolation } from '../middleware/auth.js';
import {
  createBoatSession,
  getCoxswainHistory,
  getTeamWaterSessions,
  getWaterSessionById,
  updateBoatSession,
  deleteBoatSession,
} from '../services/waterSessionService.js';

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details: errors.array() },
    });
  }
  next();
};

// All routes require authentication and team context
router.use(authenticateToken, teamIsolation);

/**
 * POST /api/v1/water-sessions/boat
 * Create a new boat session with pieces (coxswain workout entry)
 * Allowed: OWNER, COACH, COXSWAIN
 */
router.post(
  '/boat',
  requireRole('OWNER', 'COACH', 'COXSWAIN'),
  [
    body('boatName').optional().isString().isLength({ max: 100 }),
    body('boatId').optional().isUUID(),
    body('calendarEventId').optional().isUUID(),
    body('date').optional().isISO8601(),
    body('pieces').optional().isArray(),
    body('pieces.*.number').optional().isInt({ min: 1 }),
    body('pieces.*.distance').optional().isInt({ min: 0, max: 100000 }),
    body('pieces.*.time').optional().isFloat({ min: 0 }),
    body('pieces.*.rate').optional().isInt({ min: 0, max: 80 }),
    body('pieces.*.strokeRate').optional().isInt({ min: 0, max: 80 }),
    body('pieces.*.type').optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const result = await createBoatSession(req.user.activeTeamId, req.user.id, req.body);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Create boat session error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

/**
 * GET /api/v1/water-sessions/history
 * Get coxswain's session history
 */
router.get('/history', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const history = await getCoxswainHistory(req.user.activeTeamId, req.user.id, limit);

    res.json({
      success: true,
      data: { sessions: history, count: history.length },
    });
  } catch (error) {
    logger.error('Get coxswain history error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

/**
 * GET /api/v1/water-sessions
 * Get all water sessions for the team (coach view)
 */
router.get(
  '/',
  requireRole('OWNER', 'COACH'),
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 200 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const sessions = await getTeamWaterSessions(req.user.activeTeamId, {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: parseInt(req.query.limit) || 50,
      });

      res.json({
        success: true,
        data: { sessions, count: sessions.length },
      });
    } catch (error) {
      logger.error('Get team water sessions error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

/**
 * GET /api/v1/water-sessions/:id
 * Get a specific water session by ID
 */
router.get('/:id', [param('id').isUUID()], validateRequest, async (req, res) => {
  try {
    const session = await getWaterSessionById(req.params.id, req.user.activeTeamId);

    res.json({
      success: true,
      data: { session },
    });
  } catch (error) {
    if (error.message === 'Water session not found') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: error.message },
      });
    }
    logger.error('Get water session error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

/**
 * PATCH /api/v1/water-sessions/boat/:id
 * Update a boat session
 */
router.patch(
  '/boat/:id',
  [param('id').isUUID(), body('notes').optional().isString(), body('pieces').optional().isArray()],
  validateRequest,
  async (req, res) => {
    try {
      const session = await updateBoatSession(req.params.id, req.user.activeTeamId, req.body);

      res.json({
        success: true,
        data: { session },
      });
    } catch (error) {
      if (error.message === 'Boat session not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Update boat session error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

/**
 * DELETE /api/v1/water-sessions/boat/:id
 * Delete a boat session
 */
router.delete(
  '/boat/:id',
  requireRole('OWNER', 'COACH'),
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      await deleteBoatSession(req.params.id, req.user.activeTeamId);

      res.json({
        success: true,
        data: { message: 'Boat session deleted' },
      });
    } catch (error) {
      if (error.message === 'Boat session not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Delete boat session error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

export default router;

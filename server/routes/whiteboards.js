import express from 'express';
import { body, param, validationResult } from 'express-validator';
import {
  getLatestWhiteboard,
  getWhiteboardById,
  createOrUpdateWhiteboard,
  deleteWhiteboard,
} from '../services/whiteboardService.js';
import { authenticateToken, requireRole, teamIsolation } from '../middleware/auth.js';
import logger from '../utils/logger.js';

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
 * GET /api/v1/whiteboards/latest
 * Get latest whiteboard for team
 */
router.get('/latest', async (req, res) => {
  try {
    const whiteboard = await getLatestWhiteboard(req.user.activeTeamId);

    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        error: { code: 'NO_WHITEBOARD', message: 'No whiteboard found for this team' },
      });
    }

    res.json({
      success: true,
      data: { whiteboard },
    });
  } catch (error) {
    logger.error('Get latest whiteboard error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to get whiteboard' },
    });
  }
});

/**
 * GET /api/v1/whiteboards/:id
 * Get specific whiteboard by ID
 */
router.get(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const whiteboard = await getWhiteboardById(req.user.activeTeamId, req.params.id);

      res.json({
        success: true,
        data: { whiteboard },
      });
    } catch (error) {
      if (error.message === 'Whiteboard not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Whiteboard not found' },
        });
      }

      logger.error('Get whiteboard error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get whiteboard' },
      });
    }
  }
);

/**
 * POST /api/v1/whiteboards
 * Create or update whiteboard (upsert by teamId + date)
 * COACH or OWNER only
 */
router.post(
  '/',
  requireRole('OWNER', 'COACH'),
  [
    body('date').isISO8601().toDate().withMessage('date must be valid ISO8601 date (YYYY-MM-DD)'),
    body('content').isString().trim().notEmpty().isLength({ max: 50000 }).withMessage('content must be a non-empty string with max 50000 characters'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { date, content } = req.body;

      const whiteboard = await createOrUpdateWhiteboard(
        req.user.activeTeamId,
        req.user.id,
        { date, content }
      );

      res.status(201).json({
        success: true,
        data: { whiteboard },
      });
    } catch (error) {
      logger.error('Create/update whiteboard error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to save whiteboard' },
      });
    }
  }
);

/**
 * DELETE /api/v1/whiteboards/:id
 * Delete whiteboard
 * COACH or OWNER only
 */
router.delete(
  '/:id',
  requireRole('OWNER', 'COACH'),
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      await deleteWhiteboard(req.user.activeTeamId, req.params.id);

      res.json({
        success: true,
        data: { message: 'Whiteboard deleted' },
      });
    } catch (error) {
      if (error.message === 'Whiteboard not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Whiteboard not found' },
        });
      }

      logger.error('Delete whiteboard error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to delete whiteboard' },
      });
    }
  }
);

export default router;

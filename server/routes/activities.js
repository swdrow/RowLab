import express from 'express';
import logger from '../utils/logger.js';
import { query, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { getUnifiedActivityFeed } from '../services/activityService.js';

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: errors.array() },
    });
  }
  next();
};

/**
 * GET /api/v1/activities
 * Get unified activity feed for current user
 * Supports pagination and source filtering
 *
 * Query params:
 * - limit: Max activities to return (default 20, max 50)
 * - offset: Pagination offset (default 0)
 * - excludeSources: Comma-separated sources to exclude (CONCEPT2, STRAVA, MANUAL)
 */
router.get(
  '/',
  authenticateToken,
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .toInt()
      .withMessage('limit must be between 1 and 50'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .toInt()
      .withMessage('offset must be a non-negative integer'),
    query('excludeSources')
      .optional()
      .custom((value) => {
        if (!value) return true;
        const valid = ['CONCEPT2', 'STRAVA', 'MANUAL'];
        const sources = value.split(',').map(s => s.trim());
        return sources.every(s => valid.includes(s));
      })
      .withMessage('excludeSources must be comma-separated valid sources: CONCEPT2, STRAVA, MANUAL'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const limit = req.query.limit || 20;
      const offset = req.query.offset || 0;
      const excludeSources = req.query.excludeSources
        ? req.query.excludeSources.split(',').map(s => s.trim())
        : [];

      const activities = await getUnifiedActivityFeed(req.user.userId, {
        limit,
        offset,
        excludeSources,
      });

      res.json({
        success: true,
        data: {
          activities,
          pagination: {
            limit,
            offset,
            count: activities.length,
          },
        },
      });
    } catch (error) {
      logger.error('Get activities error', { error: error.message, userId: req.user.userId });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to load activities' },
      });
    }
  }
);

export default router;

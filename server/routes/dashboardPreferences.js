import express from 'express';
import logger from '../utils/logger.js';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import prisma from '../db/connection.js';

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
 * GET /api/v1/dashboard-preferences
 * Get current user's dashboard preferences
 * Returns defaults if no preferences exist
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const prefs = await prisma.dashboardPreferences.findUnique({
      where: { userId: req.user.id },
    });

    res.json({
      success: true,
      data: prefs || {
        pinnedModules: [],
        hiddenSources: [],
      },
    });
  } catch (error) {
    logger.error('Get dashboard preferences error', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to load preferences' },
    });
  }
});

/**
 * PUT /api/v1/dashboard-preferences
 * Update current user's dashboard preferences
 * Creates if not exists (upsert)
 */
router.put(
  '/',
  authenticateToken,
  [
    body('pinnedModules')
      .optional()
      .isArray()
      .withMessage('pinnedModules must be an array'),
    body('pinnedModules.*')
      .optional()
      .isString()
      .withMessage('pinnedModules items must be strings'),
    body('hiddenSources')
      .optional()
      .isArray()
      .withMessage('hiddenSources must be an array'),
    body('hiddenSources.*')
      .optional()
      .isString()
      .isIn(['CONCEPT2', 'STRAVA', 'MANUAL', 'CALENDAR', 'WATER_SESSION'])
      .withMessage('hiddenSources items must be valid ActivitySource values'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { pinnedModules, hiddenSources } = req.body;

      const updateData = {};
      if (pinnedModules !== undefined) updateData.pinnedModules = pinnedModules;
      if (hiddenSources !== undefined) updateData.hiddenSources = hiddenSources;

      const prefs = await prisma.dashboardPreferences.upsert({
        where: { userId: req.user.id },
        update: updateData,
        create: {
          userId: req.user.id,
          pinnedModules: pinnedModules || [],
          hiddenSources: hiddenSources || [],
        },
      });

      res.json({
        success: true,
        data: prefs,
      });
    } catch (error) {
      logger.error('Update dashboard preferences error', { error: error.message, userId: req.user.id });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to save preferences' },
      });
    }
  }
);

export default router;

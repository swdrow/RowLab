import { Router } from 'express';
import { param, validationResult } from 'express-validator';
import { authenticateToken, requireTeam } from '../middleware/auth.js';
import * as streakService from '../services/streakService.js';
import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';

const router = Router();

// Validation middleware for express-validator
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

router.use(authenticateToken);
router.use(requireTeam);

/**
 * GET /api/v1/streaks
 * Get current user's streaks
 */
router.get('/', async (req, res) => {
  try {
    const { activeTeamId } = req.user;

    const athlete = await prisma.athlete.findFirst({
      where: { userId: req.user.id, teamId: activeTeamId },
    });

    if (!athlete) {
      return res.status(404).json({
        success: false,
        error: { code: 'ATHLETE_NOT_FOUND', message: 'Athlete profile not found' },
      });
    }

    const summary = await streakService.getStreakSummary(athlete.id, activeTeamId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error('Failed to fetch streaks', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch streaks' },
    });
  }
});

/**
 * GET /api/v1/streaks/athlete/:athleteId
 * Get streaks for a specific athlete
 */
router.get(
  '/athlete/:athleteId',
  [param('athleteId').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const { athleteId } = req.params;
      const { activeTeamId } = req.user;

      // Verify athlete belongs to team
      const athlete = await prisma.athlete.findFirst({
        where: { id: athleteId, teamId: activeTeamId },
      });

      if (!athlete) {
        return res.status(404).json({
          success: false,
          error: { code: 'ATHLETE_NOT_FOUND', message: 'Athlete not found' },
        });
      }

      const summary = await streakService.getStreakSummary(athleteId, activeTeamId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      logger.error('Failed to fetch athlete streaks', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to fetch streaks' },
      });
    }
  }
);

/**
 * GET /api/v1/streaks/config
 * Get team's streak configuration
 */
router.get('/config', async (req, res) => {
  try {
    const { activeTeamId } = req.user;

    const config = await streakService.getTeamStreakConfig(activeTeamId);

    res.json({
      success: true,
      data: { config },
    });
  } catch (error) {
    logger.error('Failed to fetch streak config', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch config' },
    });
  }
});

export default router;

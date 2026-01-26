import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, teamIsolation } from '../middleware/auth.js';
import { validateParams, validateQuery } from '../middleware/validation.js';
import * as prService from '../services/prDetectionService.js';
import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';

const router = Router();

// Validation schemas
const athleteIdSchema = z.object({
  athleteId: z.string().uuid(),
});

const testIdSchema = z.object({
  testId: z.string().uuid(),
});

const trendParamsSchema = z.object({
  athleteId: z.string().uuid(),
  testType: z.enum(['2k', '6k', '500m', '30min']),
});

const trendQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 3 && n <= 10).optional(),
});

router.use(authenticateToken);
router.use(teamIsolation);

/**
 * GET /api/v1/personal-records
 * Get current user's PRs
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

    const prs = await prService.getAthleteCurrentPRs(athlete.id);

    res.json({
      success: true,
      data: { prs },
    });
  } catch (error) {
    logger.error('Failed to fetch PRs', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch PRs' },
    });
  }
});

/**
 * GET /api/v1/personal-records/athlete/:athleteId
 * Get PRs for specific athlete
 */
router.get(
  '/athlete/:athleteId',
  validateParams(athleteIdSchema),
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

      const prs = await prService.getAthleteCurrentPRs(athleteId);

      res.json({
        success: true,
        data: { prs },
      });
    } catch (error) {
      logger.error('Failed to fetch athlete PRs', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to fetch PRs' },
      });
    }
  }
);

/**
 * GET /api/v1/personal-records/history/:athleteId
 * Get full PR history for athlete
 */
router.get(
  '/history/:athleteId',
  validateParams(athleteIdSchema),
  async (req, res) => {
    try {
      const { athleteId } = req.params;

      const history = await prService.getAthletePRHistory(athleteId);

      res.json({
        success: true,
        data: { history },
      });
    } catch (error) {
      logger.error('Failed to fetch PR history', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to fetch PR history' },
      });
    }
  }
);

/**
 * GET /api/v1/personal-records/team-records
 * Get team records for all test types
 */
router.get('/team-records', async (req, res) => {
  try {
    const { activeTeamId } = req.user;

    const records = await prService.getTeamRecords(activeTeamId);

    res.json({
      success: true,
      data: { records },
    });
  } catch (error) {
    logger.error('Failed to fetch team records', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch team records' },
    });
  }
});

/**
 * GET /api/v1/personal-records/detect/:testId
 * Detect PRs for a specific test (for celebration UI)
 */
router.get(
  '/detect/:testId',
  validateParams(testIdSchema),
  async (req, res) => {
    try {
      const { testId } = req.params;

      const celebrationData = await prService.getPRCelebrationData(testId);

      if (!celebrationData) {
        return res.status(404).json({
          success: false,
          error: { code: 'TEST_NOT_FOUND', message: 'Test not found' },
        });
      }

      res.json({
        success: true,
        data: celebrationData,
      });
    } catch (error) {
      logger.error('Failed to detect PRs', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to detect PRs' },
      });
    }
  }
);

/**
 * GET /api/v1/personal-records/trend/:athleteId/:testType
 * Get result trend for sparkline
 */
router.get(
  '/trend/:athleteId/:testType',
  validateParams(trendParamsSchema),
  validateQuery(trendQuerySchema),
  async (req, res) => {
    try {
      const { athleteId, testType } = req.params;
      const limit = parseInt(req.query.limit) || 5;

      const trend = await prService.getResultTrend(athleteId, testType, limit);

      res.json({
        success: true,
        data: { trend },
      });
    } catch (error) {
      logger.error('Failed to fetch trend', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to fetch trend' },
      });
    }
  }
);

export default router;

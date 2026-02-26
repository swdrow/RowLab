import express from 'express';
import { z } from 'zod';
import { authenticateToken, requireTeam, requireRole } from '../middleware/auth.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.js';
import * as challengeService from '../services/challengeService.js';
import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireTeam);

// ============================================
// Validation Schemas
// ============================================

const createChallengeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum(['individual', 'collective']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  metric: z.enum(['meters', 'workouts', 'attendance', 'composite']),
  description: z.string().max(500).optional(),
  formula: z
    .object({
      weights: z
        .object({
          meters: z.number().optional(),
          workouts: z.number().optional(),
          attendance: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
  handicap: z
    .object({
      enabled: z.boolean(),
      type: z.string().optional(),
      adjustments: z.record(z.number()).optional(),
    })
    .optional(),
  templateId: z.string().optional(),
  athleteIds: z.array(z.string()).optional(),
});

const challengeIdSchema = z.object({
  id: z.string().min(1),
});

const statusQuerySchema = z.object({
  status: z.enum(['active', 'completed', 'cancelled']).optional(),
});

// ============================================
// Challenge Routes
// ============================================

/**
 * GET /api/v1/challenges
 * Get all challenges for team
 */
router.get('/', validateQuery(statusQuerySchema), async (req, res) => {
  try {
    const { activeTeamId } = req.user;
    const { status } = req.query;

    const challenges = await challengeService.getAllChallenges(activeTeamId, status);

    res.json({
      success: true,
      data: { challenges },
    });
  } catch (error) {
    logger.error('Failed to fetch challenges', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch challenges' },
    });
  }
});

/**
 * GET /api/v1/challenges/active
 * Get active challenges
 */
router.get('/active', async (req, res) => {
  try {
    const { activeTeamId } = req.user;

    const challenges = await challengeService.getActiveChallenges(activeTeamId);

    res.json({
      success: true,
      data: { challenges },
    });
  } catch (error) {
    logger.error('Failed to fetch active challenges', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch challenges' },
    });
  }
});

/**
 * GET /api/v1/challenges/templates
 * Get challenge templates
 */
router.get('/templates', async (req, res) => {
  res.json({
    success: true,
    data: { templates: challengeService.CHALLENGE_TEMPLATES },
  });
});

/**
 * GET /api/v1/challenges/:id
 * Get challenge details
 */
router.get('/:id', validateParams(challengeIdSchema), async (req, res) => {
  try {
    const { id } = req.params;

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        _count: {
          select: { participants: true },
        },
      },
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Challenge not found' },
      });
    }

    res.json({
      success: true,
      data: { challenge },
    });
  } catch (error) {
    logger.error('Failed to fetch challenge', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch challenge' },
    });
  }
});

/**
 * GET /api/v1/challenges/:id/leaderboard
 * Get challenge leaderboard
 */
router.get('/:id/leaderboard', validateParams(challengeIdSchema), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await challengeService.getLeaderboard(id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.message === 'Challenge not found') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Challenge not found' },
      });
    }

    logger.error('Failed to fetch leaderboard', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch leaderboard' },
    });
  }
});

/**
 * POST /api/v1/challenges
 * Create a new challenge (coach/captain only)
 */
router.post('/', validateBody(createChallengeSchema), async (req, res) => {
  try {
    const { activeTeamId, activeTeamRole } = req.user;

    // Check permission (per CONTEXT.md: coaches and captains)
    if (!['OWNER', 'ADMIN', 'COACH'].includes(activeTeamRole)) {
      // Check if user is a captain
      const isCaptain = await prisma.athlete.findFirst({
        where: {
          userId: req.user.id,
          teamId: activeTeamId,
          // Would need a captain field in Athlete model
        },
      });

      if (!isCaptain) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only coaches and captains can create challenges' },
        });
      }
    }

    const challenge = await challengeService.createChallenge(activeTeamId, req.user.id, req.body);

    res.status(201).json({
      success: true,
      data: { challenge },
    });
  } catch (error) {
    logger.error('Failed to create challenge', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create challenge' },
    });
  }
});

/**
 * POST /api/v1/challenges/:id/join
 * Join a challenge
 */
router.post('/:id/join', validateParams(challengeIdSchema), async (req, res) => {
  try {
    const { id } = req.params;
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

    await challengeService.joinChallenge(id, athlete.id);

    res.json({
      success: true,
      data: { joined: true },
    });
  } catch (error) {
    if (error.message === 'Already participating') {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_JOINED', message: 'Already participating in this challenge' },
      });
    }

    logger.error('Failed to join challenge', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to join challenge' },
    });
  }
});

/**
 * POST /api/v1/challenges/:id/leave
 * Leave a challenge
 */
router.post('/:id/leave', validateParams(challengeIdSchema), async (req, res) => {
  try {
    const { id } = req.params;
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

    await challengeService.leaveChallenge(id, athlete.id);

    res.json({
      success: true,
      data: { left: true },
    });
  } catch (error) {
    logger.error('Failed to leave challenge', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to leave challenge' },
    });
  }
});

/**
 * POST /api/v1/challenges/:id/refresh
 * Manually refresh leaderboard
 */
router.post('/:id/refresh', validateParams(challengeIdSchema), async (req, res) => {
  try {
    const { id } = req.params;

    await challengeService.updateLeaderboard(id);
    const result = await challengeService.getLeaderboard(id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to refresh leaderboard', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to refresh leaderboard' },
    });
  }
});

/**
 * DELETE /api/v1/challenges/:id
 * Cancel a challenge (coach only)
 */
router.delete(
  '/:id',
  validateParams(challengeIdSchema),
  requireRole('OWNER', 'COACH'),
  async (req, res) => {
    try {
      const { id } = req.params;

      await challengeService.cancelChallenge(id);

      res.json({
        success: true,
        data: { cancelled: true },
      });
    } catch (error) {
      logger.error('Failed to cancel challenge', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to cancel challenge' },
      });
    }
  }
);

export default router;

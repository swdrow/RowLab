import { Router } from 'express';
import { authenticateToken, requireTeam } from '../middleware/auth.js';
import * as achievementService from '../services/achievementService.js';
import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);
router.use(requireTeam);

/**
 * GET /api/v1/achievements
 * Get all achievements with current user's athlete progress
 */
router.get('/', async (req, res) => {
  try {
    const { activeTeamId } = req.user;

    // Get athlete record for current user
    const athlete = await prisma.athlete.findFirst({
      where: { userId: req.user.id, teamId: activeTeamId },
    });

    if (!athlete) {
      return res.status(404).json({
        success: false,
        error: { code: 'ATHLETE_NOT_FOUND', message: 'Athlete profile not found' },
      });
    }

    const achievements = await achievementService.getAchievementsWithProgress(
      athlete.id,
      activeTeamId
    );

    const unlockedCount = achievements.filter(a => a.isUnlocked).length;

    res.json({
      success: true,
      data: {
        achievements,
        unlockedCount,
        totalCount: achievements.length,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch achievements', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch achievements' },
    });
  }
});

/**
 * GET /api/v1/achievements/athlete/:athleteId
 * Get achievements for a specific athlete (coach view)
 */
router.get('/athlete/:athleteId', async (req, res) => {
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

    const achievements = await achievementService.getAchievementsWithProgress(
      athleteId,
      activeTeamId
    );

    res.json({
      success: true,
      data: {
        achievements,
        unlockedCount: achievements.filter(a => a.isUnlocked).length,
        totalCount: achievements.length,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch athlete achievements', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch achievements' },
    });
  }
});

/**
 * GET /api/v1/achievements/pinned/:athleteId
 * Get pinned achievements for display on profile
 */
router.get('/pinned/:athleteId', async (req, res) => {
  try {
    const { athleteId } = req.params;

    const pinned = await achievementService.getPinnedAchievements(athleteId);

    res.json({
      success: true,
      data: { pinned },
    });
  } catch (error) {
    logger.error('Failed to fetch pinned achievements', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch pinned achievements' },
    });
  }
});

/**
 * POST /api/v1/achievements/:achievementId/toggle-pin
 * Toggle pinned status for an achievement
 */
router.post('/:achievementId/toggle-pin', async (req, res) => {
  try {
    const { achievementId } = req.params;
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

    const result = await achievementService.togglePinned(athlete.id, achievementId);

    res.json({
      success: true,
      data: { isPinned: result.isPinned },
    });
  } catch (error) {
    if (error.message.includes('Maximum 5')) {
      return res.status(400).json({
        success: false,
        error: { code: 'MAX_PINNED', message: error.message },
      });
    }

    logger.error('Failed to toggle pin', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to toggle pin' },
    });
  }
});

/**
 * POST /api/v1/achievements/check-progress
 * Manually trigger progress check for all achievement types
 */
router.post('/check-progress', async (req, res) => {
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

    const unlocked = await achievementService.checkVolumeAchievements(
      athlete.id,
      activeTeamId
    );

    res.json({
      success: true,
      data: {
        newlyUnlocked: unlocked.map(a => ({
          id: a.id,
          name: a.name,
          rarity: a.rarity,
        })),
      },
    });
  } catch (error) {
    logger.error('Failed to check progress', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to check progress' },
    });
  }
});

export default router;

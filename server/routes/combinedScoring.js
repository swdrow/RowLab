import express from 'express';
import logger from '../utils/logger.js';
import { authenticateToken, requireRole, requireTeam } from '../middleware/auth.js';
import * as combinedScoringService from '../services/combinedScoringService.js';

const router = express.Router();

// All routes require authentication and team context
router.use(authenticateToken, requireTeam);

/**
 * GET /api/v1/combined-scoring/rankings
 * Get team rankings by combined score
 */
router.get('/rankings', async (req, res) => {
  try {
    const rankings = await combinedScoringService.getTeamRankingsByCombined(req.user.activeTeamId);

    res.json({ success: true, data: { rankings } });
  } catch (err) {
    logger.error('Get combined rankings error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch combined rankings' },
    });
  }
});

/**
 * GET /api/v1/combined-scoring/athlete/:athleteId
 * Get single athlete's score breakdown
 */
router.get('/athlete/:athleteId', async (req, res) => {
  try {
    const { athleteId } = req.params;
    const scoreBreakdown = await combinedScoringService.calculateCombinedScore(athleteId);

    res.json({ success: true, data: scoreBreakdown });
  } catch (err) {
    if (err.message === 'Athlete not found') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Athlete not found' },
      });
    }
    logger.error('Get athlete combined score error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch athlete combined score' },
    });
  }
});

/**
 * POST /api/v1/combined-scoring/recalculate
 * Trigger recalculation for entire team (COACH or OWNER only)
 */
router.post('/recalculate', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const result = await combinedScoringService.recalculateTeamScores(req.user.activeTeamId);

    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('Recalculate team scores error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to recalculate team scores' },
    });
  }
});

/**
 * POST /api/v1/combined-scoring/recalculate/:athleteId
 * Recalculate single athlete's combined score (COACH or OWNER only)
 */
router.post('/recalculate/:athleteId', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const { athleteId } = req.params;
    const scoreBreakdown = await combinedScoringService.calculateCombinedScore(athleteId);

    res.json({ success: true, data: scoreBreakdown });
  } catch (err) {
    if (err.message === 'Athlete not found') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Athlete not found' },
      });
    }
    logger.error('Recalculate athlete score error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to recalculate athlete score' },
    });
  }
});

export default router;

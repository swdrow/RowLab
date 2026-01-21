import express from 'express';
import logger from '../utils/logger.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import prisma from '../db/connection.js';
import * as aiLineupOptimizerService from '../services/aiLineupOptimizerService.js';
import * as racePredictorService from '../services/racePredictorService.js';

const router = express.Router();
router.use(authenticateToken);

// ============================================
// AI Optimizer Routes
// ============================================

/**
 * POST /api/v1/ai-lineup/optimize
 * Generate optimal lineups using genetic algorithm
 * Requires COACH or OWNER role
 *
 * Body:
 *   - boatClass: string (required) - e.g., '8+', '4+', '4-', '2-', '1x'
 *   - constraints: object (optional)
 *     - sidePreferences: { athleteId: 'port'|'starboard'|'both' }
 *     - required: number[] - athlete IDs that must be included
 *     - excluded: number[] - athlete IDs to exclude
 *     - coxswain: number - athlete ID for coxswain position
 *   - options: object (optional)
 *     - generations: number - genetic algorithm generations (default: 100)
 *     - populationSize: number - population size (default: 50)
 *     - topN: number - number of lineup suggestions to return (default: 5)
 *
 * Returns: top N lineup suggestions with fitness scores
 */
router.post('/optimize', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const { boatClass, constraints = {}, options = {} } = req.body;

    if (!boatClass) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_BOAT_CLASS', message: 'boatClass is required' },
      });
    }

    const validBoatClasses = ['8+', '4+', '4-', '2-', '1x'];
    if (!validBoatClasses.includes(boatClass)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_BOAT_CLASS',
          message: `Invalid boat class. Valid options: ${validBoatClasses.join(', ')}`,
        },
      });
    }

    const lineups = await aiLineupOptimizerService.generateOptimalLineup(
      req.user.activeTeamId,
      boatClass,
      constraints,
      options
    );

    res.json({
      success: true,
      data: {
        boatClass,
        constraints,
        options,
        lineups,
      },
    });
  } catch (err) {
    logger.error('AI lineup optimize error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message || 'Failed to generate optimal lineups' },
    });
  }
});

/**
 * POST /api/v1/ai-lineup/evaluate
 * Evaluate fitness score for a specific lineup
 *
 * Body:
 *   - athleteIds: number[] (required) - array of athlete IDs in seat order
 *   - boatClass: string (required)
 *
 * Returns: fitness score and breakdown
 */
router.post('/evaluate', async (req, res) => {
  try {
    const { athleteIds, boatClass } = req.body;

    if (!athleteIds || !Array.isArray(athleteIds)) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_ATHLETES', message: 'athleteIds array is required' },
      });
    }

    if (!boatClass) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_BOAT_CLASS', message: 'boatClass is required' },
      });
    }

    const config = aiLineupOptimizerService.getBoatConfig(boatClass);

    // Build lineup from athlete IDs
    const lineup = athleteIds.map((athleteId, index) => {
      // If first position and boat has cox, this is seat 0 (cox)
      if (index === 0 && config.hasCox) {
        return {
          athleteId,
          seatNumber: 0,
          side: 'cox',
        };
      }
      // For rowers: if boat has cox, seatNumber = index (1, 2, 3...), else seatNumber = index + 1
      return {
        athleteId,
        seatNumber: config.hasCox ? index : index + 1,
        side: index % 2 === 1 ? 'starboard' : 'port',
      };
    });

    // Get athlete scores for evaluation
    const athletes = await prisma.athlete.findMany({
      where: { id: { in: athleteIds } },
      include: {
        rankings: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const athleteScores = athletes.map((a) => ({
      id: a.id,
      name: `${a.firstName} ${a.lastName}`,
      isCoxswain: a.isCoxswain || false,
      combinedScore: a.rankings[0]?.combinedScore || 50,
    }));

    const fitness = aiLineupOptimizerService.evaluateFitness(lineup, athleteScores, { boatClass });

    // Calculate breakdown
    const totalScore = athleteScores.reduce((sum, a) => sum + (a.combinedScore || 0), 0);
    const averageScore = athleteScores.length > 0 ? totalScore / athleteScores.length : 0;

    res.json({
      success: true,
      data: {
        fitness,
        breakdown: {
          totalScore: Math.round(totalScore * 10) / 10,
          averageScore: Math.round(averageScore * 10) / 10,
          athleteCount: athleteIds.length,
        },
        athletes: athleteScores,
      },
    });
  } catch (err) {
    logger.error('AI lineup evaluate error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message || 'Failed to evaluate lineup' },
    });
  }
});

// ============================================
// Race Predictor Routes
// ============================================

/**
 * POST /api/v1/ai-lineup/predict
 * Predict race time for a set of athletes
 *
 * Body:
 *   - athleteIds: number[] (required) - array of athlete IDs
 *   - boatClass: string (required) - e.g., '8+', '4+'
 *   - courseType: string (optional) - '2000m', '1500m', '1000m', 'head' (default: '2000m')
 *
 * Returns: predicted time, confidence range, and breakdown
 */
router.post('/predict', async (req, res) => {
  try {
    const { athleteIds, boatClass, courseType = '2000m' } = req.body;

    if (!athleteIds || !Array.isArray(athleteIds)) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_ATHLETES', message: 'athleteIds array is required' },
      });
    }

    if (!boatClass) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_BOAT_CLASS', message: 'boatClass is required' },
      });
    }

    const prediction = await racePredictorService.predictFromAthletes(athleteIds, boatClass, courseType);

    res.json({
      success: true,
      data: prediction,
    });
  } catch (err) {
    logger.error('Race predict error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message || 'Failed to predict race time' },
    });
  }
});

/**
 * POST /api/v1/ai-lineup/predict/lineup/:lineupId
 * Predict race time for an existing lineup
 *
 * Params:
 *   - lineupId: number (required)
 *
 * Query:
 *   - courseType: string (optional) - '2000m', '1500m', '1000m', 'head' (default: '2000m')
 *
 * Returns: predicted time, confidence range, and breakdown
 */
router.post('/predict/lineup/:lineupId', async (req, res) => {
  try {
    const lineupId = parseInt(req.params.lineupId, 10);
    const { courseType = '2000m' } = req.query;

    if (isNaN(lineupId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_LINEUP_ID', message: 'Invalid lineup ID' },
      });
    }

    const prediction = await racePredictorService.predictRaceTime(lineupId, courseType);

    res.json({
      success: true,
      data: prediction,
    });
  } catch (err) {
    if (err.message?.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lineup not found' },
      });
    }
    logger.error('Race predict lineup error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message || 'Failed to predict race time' },
    });
  }
});

/**
 * POST /api/v1/ai-lineup/compare
 * Compare race times between two lineups
 *
 * Body:
 *   - lineup1Athletes: number[] (required) - athlete IDs for lineup 1
 *   - lineup2Athletes: number[] (required) - athlete IDs for lineup 2
 *   - boatClass: string (required)
 *   - courseType: string (optional) - default: '2000m'
 *
 * Returns: comparison with times, margin, favored lineup, and confidence
 */
router.post('/compare', async (req, res) => {
  try {
    const { lineup1Athletes, lineup2Athletes, boatClass, courseType = '2000m' } = req.body;

    if (!lineup1Athletes || !Array.isArray(lineup1Athletes)) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_LINEUP1', message: 'lineup1Athletes array is required' },
      });
    }

    if (!lineup2Athletes || !Array.isArray(lineup2Athletes)) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_LINEUP2', message: 'lineup2Athletes array is required' },
      });
    }

    if (!boatClass) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_BOAT_CLASS', message: 'boatClass is required' },
      });
    }

    const comparison = await racePredictorService.compareLineups(
      lineup1Athletes,
      lineup2Athletes,
      boatClass,
      courseType
    );

    res.json({
      success: true,
      data: comparison,
    });
  } catch (err) {
    logger.error('Compare lineups error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message || 'Failed to compare lineups' },
    });
  }
});

export default router;

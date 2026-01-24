import express from 'express';
import { authenticateToken, requireTeam, requireRole } from '../middleware/auth.js';
import * as eloService from '../services/eloRatingService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// All routes require authentication and team context
router.use(authenticateToken, requireTeam);

// ============================================
// Rating Routes
// ============================================

/**
 * GET /api/v1/ratings
 * Get athlete ratings for the active team
 * Query params:
 *   - type: Rating type (default: 'seat_race_elo')
 *   - minRaces: Minimum number of races (default: 0)
 *   - side: Filter by side (Port/Starboard/Both) - optional
 */
router.get('/', async (req, res) => {
  try {
    const { type = 'seat_race_elo', minRaces = 0, side } = req.query;

    const options = {
      ratingType: type,
      minRaces: parseInt(minRaces, 10),
    };

    let ratings = await eloService.getTeamRankings(req.user.activeTeamId, options);

    // Client-side filtering by side (if specified)
    if (side && side !== 'Both') {
      ratings = ratings.filter((rating) => rating.athlete.side === side);
    }

    res.json({ success: true, data: { ratings } });
  } catch (err) {
    logger.error('Get ratings error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch ratings' },
    });
  }
});

/**
 * GET /api/v1/ratings/parameters
 * Get current rating parameters (K-factor, default rating, etc.)
 */
router.get('/parameters', async (req, res) => {
  try {
    // Constants from eloRatingService
    const parameters = {
      kFactor: eloService.K_FACTOR,
      defaultRating: eloService.DEFAULT_RATING,
      drawThreshold: 0.5, // seconds
      marginScaling: true,
      maxMarginFactor: 2.0,
    };

    res.json({ success: true, data: { parameters } });
  } catch (err) {
    logger.error('Get parameters error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch parameters' },
    });
  }
});

/**
 * POST /api/v1/ratings/recalculate
 * Recalculate all ratings from seat race history (OWNER, COACH only)
 */
router.post('/recalculate', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const { type = 'seat_race_elo' } = req.body;

    const result = await eloService.recalculateAllRatings(
      req.user.activeTeamId,
      type
    );

    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('Recalculate ratings error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to recalculate ratings' },
    });
  }
});

/**
 * GET /api/v1/ratings/:athleteId
 * Get rating for a specific athlete
 */
router.get('/:athleteId', async (req, res) => {
  try {
    const { athleteId } = req.params;
    const { type = 'seat_race_elo' } = req.query;

    const rating = await eloService.getOrCreateRating(
      athleteId,
      req.user.activeTeamId,
      type
    );

    res.json({ success: true, data: { rating } });
  } catch (err) {
    logger.error('Get athlete rating error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch athlete rating' },
    });
  }
});

export default router;

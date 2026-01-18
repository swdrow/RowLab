import express from 'express';
import { authenticateToken, requireTeam, requireRole } from '../middleware/auth.js';
import * as eloRatingService from '../services/eloRatingService.js';

const router = express.Router();

// All routes require authentication and team context
router.use(authenticateToken, requireTeam);

/**
 * GET /api/v1/rankings
 * Get team rankings
 * Query params:
 *   - type: rating type (e.g., 'overall', 'port', 'starboard')
 *   - minRaces: minimum number of races to include athlete in rankings
 */
router.get('/', async (req, res) => {
  try {
    const { type, minRaces } = req.query;
    const options = {};

    if (type) options.type = type;
    if (minRaces) options.minRaces = parseInt(minRaces, 10);

    const rankings = await eloRatingService.getTeamRankings(req.user.activeTeamId, options);

    res.json({ success: true, data: { rankings } });
  } catch (err) {
    console.error('Get rankings error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch rankings' },
    });
  }
});

/**
 * GET /api/v1/rankings/athlete/:athleteId
 * Get individual athlete rating
 */
router.get('/athlete/:athleteId', async (req, res) => {
  try {
    const { athleteId } = req.params;
    const rating = await eloRatingService.getAthleteRating(req.user.activeTeamId, athleteId);

    if (!rating) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Athlete rating not found' },
      });
    }

    res.json({ success: true, data: { rating } });
  } catch (err) {
    if (err.message === 'Athlete not found') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Athlete not found' },
      });
    }
    console.error('Get athlete rating error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch athlete rating' },
    });
  }
});

/**
 * POST /api/v1/rankings/recalculate
 * Recalculate all ratings from scratch (OWNER, COACH only)
 */
router.post('/recalculate', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const result = await eloRatingService.recalculateAllRatings(req.user.activeTeamId);

    res.json({ success: true, data: { result } });
  } catch (err) {
    console.error('Recalculate ratings error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to recalculate ratings' },
    });
  }
});

export default router;

import express from 'express';
import { authenticateToken, requireTeam } from '../middleware/auth.js';
import * as teamRankingService from '../services/teamRankingService.js';
import * as speedCalcService from '../services/speedCalculationService.js';

const router = express.Router();

// All routes require authentication and team context
router.use(authenticateToken);
router.use(requireTeam);

/**
 * GET /boat-classes
 * Get all boat classes that have race results
 * Query params: season (optional)
 */
router.get('/boat-classes', async (req, res) => {
  try {
    const boatClasses = await teamRankingService.getBoatClassesWithResults(
      req.teamId,
      req.query.season
    );
    res.json({ success: true, data: { boatClasses } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /rankings/:boatClass
 * Get rankings for a specific boat class
 * Query params: season (optional)
 */
router.get('/rankings/:boatClass', async (req, res) => {
  try {
    const rankings = await teamRankingService.getBoatClassRankings(
      req.teamId,
      req.params.boatClass,
      req.query.season
    );
    res.json({ success: true, data: { rankings } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /head-to-head
 * Get head-to-head comparison with another team
 * Query params: opponent (required), boatClass (required), season (optional)
 */
router.get('/head-to-head', async (req, res) => {
  try {
    const { opponent, boatClass, season } = req.query;

    if (!opponent || !boatClass) {
      return res.status(400).json({
        success: false,
        error: 'opponent and boatClass are required',
      });
    }

    const comparison = await teamRankingService.getHeadToHead(
      req.teamId,
      opponent,
      boatClass,
      season
    );
    res.json({ success: true, data: { comparison } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /calculate/:boatClass
 * Calculate or recalculate team speed estimate for a boat class
 * Body: { season } (optional)
 */
router.post('/calculate/:boatClass', async (req, res) => {
  try {
    const estimate = await teamRankingService.calculateTeamSpeedEstimate(
      req.teamId,
      req.params.boatClass,
      req.body.season
    );
    res.json({ success: true, data: { estimate } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /analyze-race/:raceId
 * Analyze a specific race with speed calculations
 */
router.get('/analyze-race/:raceId', async (req, res) => {
  try {
    const analysis = await speedCalcService.analyzeRace(
      req.teamId,
      req.params.raceId
    );
    res.json({ success: true, data: { analysis } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;

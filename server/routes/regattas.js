import express from 'express';
import { authenticateToken, requireTeam, requireRole } from '../middleware/auth.js';
import * as regattaService from '../services/regattaService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// All routes require authentication and team context
router.use(authenticateToken, requireTeam);

// ============================================
// Regatta Routes
// ============================================

/**
 * GET /api/v1/regattas
 * List all regattas for the active team
 * Query params: limit, offset, season
 */
router.get('/', async (req, res) => {
  try {
    const { limit, offset, season } = req.query;
    const options = {};

    if (limit) options.limit = parseInt(limit, 10);
    if (offset) options.offset = parseInt(offset, 10);
    if (season) options.season = season;

    const regattas = await regattaService.getRegattas(req.user.activeTeamId, options);

    res.json({ success: true, data: { regattas } });
  } catch (err) {
    logger.error('Get regattas error', { error: err.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch regattas',
    });
  }
});

/**
 * POST /api/v1/regattas
 * Create a new regatta (OWNER, COACH only)
 */
router.post('/', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const regatta = await regattaService.createRegatta(req.user.activeTeamId, req.body);

    res.status(201).json({ success: true, data: { regatta } });
  } catch (err) {
    logger.error('Create regatta error', { error: err.message });
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to create regatta',
    });
  }
});

/**
 * GET /api/v1/regattas/:id
 * Get a single regatta with races and results
 */
router.get('/:id', async (req, res) => {
  try {
    const regattaId = req.params.id;
    const regatta = await regattaService.getRegattaById(req.user.activeTeamId, regattaId);

    res.json({ success: true, data: { regatta } });
  } catch (err) {
    if (err.message === 'Regatta not found') {
      return res.status(404).json({
        success: false,
        error: 'Regatta not found',
      });
    }
    logger.error('Get regatta error', { error: err.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch regatta',
    });
  }
});

/**
 * PATCH /api/v1/regattas/:id
 * Update a regatta (OWNER, COACH only)
 */
router.patch('/:id', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const regattaId = req.params.id;
    const regatta = await regattaService.updateRegatta(req.user.activeTeamId, regattaId, req.body);

    res.json({ success: true, data: { regatta } });
  } catch (err) {
    if (err.message === 'Regatta not found') {
      return res.status(404).json({
        success: false,
        error: 'Regatta not found',
      });
    }
    logger.error('Update regatta error', { error: err.message });
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to update regatta',
    });
  }
});

/**
 * DELETE /api/v1/regattas/:id
 * Delete a regatta and all related data (OWNER, COACH only)
 */
router.delete('/:id', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const regattaId = req.params.id;
    await regattaService.deleteRegatta(req.user.activeTeamId, regattaId);

    res.json({ success: true });
  } catch (err) {
    if (err.message === 'Regatta not found') {
      return res.status(404).json({
        success: false,
        error: 'Regatta not found',
      });
    }
    logger.error('Delete regatta error', { error: err.message });
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to delete regatta',
    });
  }
});

// ============================================
// Race Routes
// ============================================

/**
 * POST /api/v1/regattas/:regattaId/races
 * Add a race to a regatta (OWNER, COACH only)
 */
router.post('/:regattaId/races', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const regattaId = req.params.regattaId;
    const race = await regattaService.addRace(req.user.activeTeamId, regattaId, req.body);

    res.status(201).json({ success: true, data: { race } });
  } catch (err) {
    if (err.message === 'Regatta not found') {
      return res.status(404).json({
        success: false,
        error: 'Regatta not found',
      });
    }
    logger.error('Add race error', { error: err.message });
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to add race',
    });
  }
});

/**
 * PATCH /api/v1/regattas/races/:raceId
 * Update a race (OWNER, COACH only)
 */
router.patch('/races/:raceId', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const raceId = req.params.raceId;
    const race = await regattaService.updateRace(req.user.activeTeamId, raceId, req.body);

    res.json({ success: true, data: { race } });
  } catch (err) {
    if (err.message === 'Race not found') {
      return res.status(404).json({
        success: false,
        error: 'Race not found',
      });
    }
    logger.error('Update race error', { error: err.message });
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to update race',
    });
  }
});

/**
 * DELETE /api/v1/regattas/races/:raceId
 * Delete a race (OWNER, COACH only)
 */
router.delete('/races/:raceId', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const raceId = req.params.raceId;
    await regattaService.deleteRace(req.user.activeTeamId, raceId);

    res.json({ success: true });
  } catch (err) {
    if (err.message === 'Race not found') {
      return res.status(404).json({
        success: false,
        error: 'Race not found',
      });
    }
    logger.error('Delete race error', { error: err.message });
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to delete race',
    });
  }
});

// ============================================
// Result Routes
// ============================================

/**
 * POST /api/v1/regattas/races/:raceId/results
 * Add a single result to a race (OWNER, COACH only)
 */
router.post('/races/:raceId/results', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const raceId = req.params.raceId;
    const result = await regattaService.addResult(req.user.activeTeamId, raceId, req.body);

    res.status(201).json({ success: true, data: { result } });
  } catch (err) {
    if (err.message === 'Race not found') {
      return res.status(404).json({
        success: false,
        error: 'Race not found',
      });
    }
    logger.error('Add result error', { error: err.message });
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to add result',
    });
  }
});

/**
 * POST /api/v1/regattas/races/:raceId/results/batch
 * Batch add results to a race (OWNER, COACH only)
 */
router.post('/races/:raceId/results/batch', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const raceId = req.params.raceId;
    const { results } = req.body;

    if (!results || !Array.isArray(results)) {
      return res.status(400).json({
        success: false,
        error: 'results must be an array',
      });
    }

    const createdResults = await regattaService.batchAddResults(
      req.user.activeTeamId,
      raceId,
      results
    );

    res.status(201).json({ success: true, data: { results: createdResults } });
  } catch (err) {
    if (err.message === 'Race not found') {
      return res.status(404).json({
        success: false,
        error: 'Race not found',
      });
    }
    logger.error('Batch add results error', { error: err.message });
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to add results',
    });
  }
});

/**
 * PATCH /api/v1/regattas/results/:resultId
 * Update a result (OWNER, COACH only)
 */
router.patch('/results/:resultId', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const resultId = req.params.resultId;
    const result = await regattaService.updateResult(req.user.activeTeamId, resultId, req.body);

    res.json({ success: true, data: { result } });
  } catch (err) {
    if (err.message === 'Result not found') {
      return res.status(404).json({
        success: false,
        error: 'Result not found',
      });
    }
    logger.error('Update result error', { error: err.message });
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to update result',
    });
  }
});

export default router;

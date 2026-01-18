import express from 'express';
import { authenticateToken, requireTeam, requireRole } from '../middleware/auth.js';
import * as seatRaceService from '../services/seatRaceService.js';
import * as marginService from '../services/marginCalculationService.js';
import * as eloService from '../services/eloRatingService.js';

const router = express.Router();

// All routes require authentication and team context
router.use(authenticateToken, requireTeam);

// ============================================
// Session Routes
// ============================================

/**
 * GET /api/v1/seat-races
 * List all seat race sessions for the active team
 */
router.get('/', async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const options = {};

    if (limit) options.limit = parseInt(limit, 10);
    if (offset) options.offset = parseInt(offset, 10);

    const sessions = await seatRaceService.getSessions(req.user.activeTeamId, options);

    res.json({ success: true, data: { sessions } });
  } catch (err) {
    console.error('Get seat race sessions error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch seat race sessions' },
    });
  }
});

/**
 * POST /api/v1/seat-races
 * Create a new seat race session (OWNER, COACH only)
 */
router.post('/', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const session = await seatRaceService.createSession(req.user.activeTeamId, req.body);

    res.status(201).json({ success: true, data: { session } });
  } catch (err) {
    console.error('Create seat race session error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create seat race session' },
    });
  }
});

/**
 * GET /api/v1/seat-races/:id
 * Get a specific session with full details
 */
router.get('/:id', async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await seatRaceService.getSessionById(req.user.activeTeamId, sessionId);

    res.json({ success: true, data: { session } });
  } catch (err) {
    if (err.message === 'Seat race session not found') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Seat race session not found' },
      });
    }
    console.error('Get seat race session error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch seat race session' },
    });
  }
});

/**
 * PATCH /api/v1/seat-races/:id
 * Update a seat race session (OWNER, COACH only)
 */
router.patch('/:id', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await seatRaceService.updateSession(req.user.activeTeamId, sessionId, req.body);

    res.json({ success: true, data: { session } });
  } catch (err) {
    if (err.message === 'Seat race session not found') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Seat race session not found' },
      });
    }
    console.error('Update seat race session error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update seat race session' },
    });
  }
});

/**
 * DELETE /api/v1/seat-races/:id
 * Delete a seat race session (OWNER, COACH only)
 */
router.delete('/:id', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const sessionId = req.params.id;
    await seatRaceService.deleteSession(req.user.activeTeamId, sessionId);

    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    if (err.message === 'Seat race session not found') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Seat race session not found' },
      });
    }
    console.error('Delete seat race session error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to delete seat race session' },
    });
  }
});

// ============================================
// Piece Routes
// ============================================

/**
 * POST /api/v1/seat-races/:sessionId/pieces
 * Add a piece to a session (OWNER, COACH only)
 */
router.post('/:sessionId/pieces', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const piece = await seatRaceService.addPiece(req.user.activeTeamId, sessionId, req.body);

    res.status(201).json({ success: true, data: { piece } });
  } catch (err) {
    if (err.message === 'Seat race session not found') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Seat race session not found' },
      });
    }
    console.error('Add piece error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to add piece' },
    });
  }
});

/**
 * PATCH /api/v1/seat-races/pieces/:pieceId
 * Update a piece (OWNER, COACH only)
 */
router.patch('/pieces/:pieceId', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const pieceId = req.params.pieceId;
    const piece = await seatRaceService.updatePiece(req.user.activeTeamId, pieceId, req.body);

    res.json({ success: true, data: { piece } });
  } catch (err) {
    if (err.message === 'Piece not found') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Piece not found' },
      });
    }
    console.error('Update piece error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update piece' },
    });
  }
});

/**
 * DELETE /api/v1/seat-races/pieces/:pieceId
 * Delete a piece (OWNER, COACH only)
 */
router.delete('/pieces/:pieceId', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const pieceId = req.params.pieceId;
    await seatRaceService.deletePiece(req.user.activeTeamId, pieceId);

    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    if (err.message === 'Piece not found') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Piece not found' },
      });
    }
    console.error('Delete piece error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to delete piece' },
    });
  }
});

// ============================================
// Boat Routes
// ============================================

/**
 * POST /api/v1/seat-races/pieces/:pieceId/boats
 * Add a boat to a piece (OWNER, COACH only)
 */
router.post('/pieces/:pieceId/boats', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const pieceId = req.params.pieceId;
    const boat = await seatRaceService.addBoat(req.user.activeTeamId, pieceId, req.body);

    res.status(201).json({ success: true, data: { boat } });
  } catch (err) {
    if (err.message === 'Piece not found') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Piece not found' },
      });
    }
    console.error('Add boat error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to add boat' },
    });
  }
});

/**
 * PATCH /api/v1/seat-races/boats/:boatId
 * Update a boat (OWNER, COACH only)
 */
router.patch('/boats/:boatId', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const boatId = req.params.boatId;
    const boat = await seatRaceService.updateBoat(req.user.activeTeamId, boatId, req.body);

    res.json({ success: true, data: { boat } });
  } catch (err) {
    if (err.message === 'Boat not found') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Boat not found' },
      });
    }
    console.error('Update boat error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update boat' },
    });
  }
});

/**
 * DELETE /api/v1/seat-races/boats/:boatId
 * Delete a boat (OWNER, COACH only)
 */
router.delete('/boats/:boatId', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const boatId = req.params.boatId;
    await seatRaceService.deleteBoat(req.user.activeTeamId, boatId);

    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    if (err.message === 'Boat not found') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Boat not found' },
      });
    }
    console.error('Delete boat error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to delete boat' },
    });
  }
});

/**
 * PUT /api/v1/seat-races/boats/:boatId/assignments
 * Set boat assignments (OWNER, COACH only)
 */
router.put('/boats/:boatId/assignments', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const boatId = req.params.boatId;
    const { assignments } = req.body;
    const boat = await seatRaceService.setBoatAssignments(req.user.activeTeamId, boatId, assignments);

    res.json({ success: true, data: { boat } });
  } catch (err) {
    if (err.message === 'Boat not found') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Boat not found' },
      });
    }
    console.error('Set boat assignments error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to set boat assignments' },
    });
  }
});

// ============================================
// Analysis Routes
// ============================================

/**
 * GET /api/v1/seat-races/:id/analysis
 * Analyze a seat race session
 */
router.get('/:id/analysis', async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await seatRaceService.getSessionById(req.user.activeTeamId, sessionId);
    const analysis = marginService.analyzeSession(session);

    res.json({ success: true, data: { session, analysis } });
  } catch (err) {
    if (err.message === 'Seat race session not found') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Seat race session not found' },
      });
    }
    console.error('Analyze seat race session error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to analyze seat race session' },
    });
  }
});

/**
 * POST /api/v1/seat-races/:id/process
 * Process session and update ratings (OWNER, COACH only)
 */
router.post('/:id/process', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await seatRaceService.getSessionById(req.user.activeTeamId, sessionId);
    const analysis = marginService.analyzeSession(session);

    const ratingUpdates = [];

    // Process each result with exactly 2 swapped athletes
    for (const result of analysis.results) {
      if (result.swappedAthletes && result.swappedAthletes.length === 2) {
        const update = await eloService.updateRatingsFromSeatRace(
          result.swappedAthletes[0],
          result.swappedAthletes[1],
          result.marginSeconds,
          req.user.activeTeamId
        );
        ratingUpdates.push(update);
      }
    }

    res.json({ success: true, data: { analysis, ratingUpdates } });
  } catch (err) {
    if (err.message === 'Seat race session not found') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Seat race session not found' },
      });
    }
    console.error('Process seat race session error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to process seat race session' },
    });
  }
});

export default router;

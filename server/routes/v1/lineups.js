import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  createLineup,
  getLineups,
  getLineupById,
  updateLineup,
  deleteLineup,
  duplicateLineup,
  exportLineupData,
} from '../../services/lineupService.js';
import { authenticateToken, requireRole, teamIsolation } from '../../middleware/auth.js';

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: errors.array() },
    });
  }
  next();
};

/**
 * GET /api/v1/lineups
 * List all lineups for the team
 */
router.get(
  '/',
  authenticateToken,
  teamIsolation,
  [
    query('includeAssignments').optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const lineups = await getLineups(req.user.activeTeamId, {
        includeAssignments: req.query.includeAssignments === 'true',
      });
      res.json({
        success: true,
        data: { lineups },
      });
    } catch (error) {
      console.error('Get lineups error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get lineups' },
      });
    }
  }
);

/**
 * GET /api/v1/lineups/:id
 * Get single lineup with assignments
 */
router.get(
  '/:id',
  authenticateToken,
  teamIsolation,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const lineup = await getLineupById(req.user.activeTeamId, req.params.id);
      res.json({
        success: true,
        data: { lineup },
      });
    } catch (error) {
      if (error.message === 'Lineup not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      console.error('Get lineup error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get lineup' },
      });
    }
  }
);

/**
 * GET /api/v1/lineups/:id/export
 * Get lineup data for export (includes erg times, weights)
 */
router.get(
  '/:id/export',
  authenticateToken,
  teamIsolation,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const data = await exportLineupData(req.user.activeTeamId, req.params.id);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      if (error.message === 'Lineup not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      console.error('Export lineup error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to export lineup' },
      });
    }
  }
);

/**
 * POST /api/v1/lineups
 * Create new lineup
 */
router.post(
  '/',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    body('name').trim().isLength({ min: 1, max: 100 }),
    body('notes').optional().trim().isLength({ max: 500 }),
    body('assignments').optional().isArray(),
    body('assignments.*.athleteId').isUUID(),
    body('assignments.*.boatClass').trim().isLength({ min: 1, max: 20 }),
    body('assignments.*.seatNumber').isInt({ min: 1, max: 8 }),
    body('assignments.*.side').isIn(['Port', 'Starboard']),
    body('assignments.*.isCoxswain').optional().isBoolean(),
    body('assignments.*.shellName').optional().trim().isLength({ max: 100 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const lineup = await createLineup(req.user.activeTeamId, req.body);
      res.status(201).json({
        success: true,
        data: { lineup },
      });
    } catch (error) {
      console.error('Create lineup error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to create lineup' },
      });
    }
  }
);

/**
 * POST /api/v1/lineups/:id/duplicate
 * Duplicate an existing lineup
 */
router.post(
  '/:id/duplicate',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const lineup = await duplicateLineup(
        req.user.activeTeamId,
        req.params.id,
        req.body.name
      );
      res.status(201).json({
        success: true,
        data: { lineup },
      });
    } catch (error) {
      if (error.message === 'Lineup not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      console.error('Duplicate lineup error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to duplicate lineup' },
      });
    }
  }
);

/**
 * PATCH /api/v1/lineups/:id
 * Update lineup
 */
router.patch(
  '/:id',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('notes').optional().trim().isLength({ max: 500 }),
    body('assignments').optional().isArray(),
    body('assignments.*.athleteId').optional().isUUID(),
    body('assignments.*.boatClass').optional().trim().isLength({ min: 1, max: 20 }),
    body('assignments.*.seatNumber').optional().isInt({ min: 1, max: 8 }),
    body('assignments.*.side').optional().isIn(['Port', 'Starboard']),
    body('assignments.*.isCoxswain').optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const lineup = await updateLineup(req.user.activeTeamId, req.params.id, req.body);
      res.json({
        success: true,
        data: { lineup },
      });
    } catch (error) {
      if (error.message === 'Lineup not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      console.error('Update lineup error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update lineup' },
      });
    }
  }
);

/**
 * DELETE /api/v1/lineups/:id
 * Delete lineup
 */
router.delete(
  '/:id',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      await deleteLineup(req.user.activeTeamId, req.params.id);
      res.json({
        success: true,
        data: { message: 'Lineup deleted' },
      });
    } catch (error) {
      if (error.message === 'Lineup not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      console.error('Delete lineup error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to delete lineup' },
      });
    }
  }
);

export default router;

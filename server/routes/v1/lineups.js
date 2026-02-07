import express from 'express';
import logger from '../../utils/logger.js';
import { body, param, query, validationResult } from 'express-validator';
import {
  createLineup,
  getLineups,
  getLineupById,
  updateLineup,
  deleteLineup,
  duplicateLineup,
  exportLineupData,
  searchLineups,
  updateDraft,
  publishLineup,
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
  [query('includeAssignments').optional().isBoolean()],
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
      logger.error('Get lineups error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get lineups' },
      });
    }
  }
);

/**
 * GET /api/v1/lineups/search
 * Search historical lineups with multi-criteria filtering
 *
 * Query params:
 * - athleteIds: comma-separated athlete IDs (any match)
 * - minAthletes: minimum number of specified athletes (default: 1)
 * - boatClasses: comma-separated boat classes
 * - shellNames: comma-separated shell names
 * - startDate: ISO date for range start
 * - endDate: ISO date for range end
 * - nameSearch: partial name match
 * - sortBy: 'date' | 'name' | 'createdAt' | 'updatedAt' (default: createdAt)
 * - sortDirection: 'asc' | 'desc' (default: desc)
 * - limit: max results (default: 50)
 * - offset: pagination offset (default: 0)
 */
router.get(
  '/search',
  authenticateToken,
  teamIsolation,
  [
    query('athleteIds').optional().isString(),
    query('minAthletes').optional().isInt({ min: 1 }),
    query('boatClasses').optional().isString(),
    query('shellNames').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('nameSearch').optional().isString(),
    query('sortBy').optional().isIn(['date', 'name', 'createdAt', 'updatedAt']),
    query('sortDirection').optional().isIn(['asc', 'desc']),
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const filters = {
        athleteIds: req.query.athleteIds ? req.query.athleteIds.split(',').filter(Boolean) : [],
        minAthletes: req.query.minAthletes ? parseInt(req.query.minAthletes, 10) : 1,
        boatClasses: req.query.boatClasses ? req.query.boatClasses.split(',').filter(Boolean) : [],
        shellNames: req.query.shellNames ? req.query.shellNames.split(',').filter(Boolean) : [],
        startDate: req.query.startDate || null,
        endDate: req.query.endDate || null,
        nameSearch: req.query.nameSearch || null,
        sortBy: req.query.sortBy || 'createdAt',
        sortDirection: req.query.sortDirection || 'desc',
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
        offset: req.query.offset ? parseInt(req.query.offset, 10) : 0,
      };

      const result = await searchLineups(req.user.activeTeamId, filters);

      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error searching lineups:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
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
      logger.error('Get lineup error', { error: error.message });
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
      logger.error('Export lineup error', { error: error.message });
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
      logger.error('Create lineup error', { error: error.message });
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
  [param('id').isUUID(), body('name').optional().trim().isLength({ min: 1, max: 100 })],
  validateRequest,
  async (req, res) => {
    try {
      const lineup = await duplicateLineup(req.user.activeTeamId, req.params.id, req.body.name);
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
      logger.error('Duplicate lineup error', { error: error.message });
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
      logger.error('Update lineup error', { error: error.message });
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
      logger.error('Delete lineup error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to delete lineup' },
      });
    }
  }
);

/**
 * PATCH /api/v1/lineups/:id/draft
 * Update lineup draft - Phase 25-06
 */
router.patch(
  '/:id/draft',
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
      const lineup = await updateDraft(
        req.user.activeTeamId,
        req.params.id,
        req.user.userId,
        req.body
      );
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
      logger.error('Update draft error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update draft' },
      });
    }
  }
);

/**
 * POST /api/v1/lineups/:id/publish
 * Publish lineup with conflict detection - Phase 25-06
 */
router.post(
  '/:id/publish',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [param('id').isUUID(), body('lastKnownUpdatedAt').optional().isISO8601()],
  validateRequest,
  async (req, res) => {
    try {
      const lineup = await publishLineup(
        req.user.activeTeamId,
        req.params.id,
        req.body.lastKnownUpdatedAt
      );
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
      if (error.code === 'CONFLICT') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: error.message,
            currentLineup: error.currentLineup,
          },
        });
      }
      logger.error('Publish lineup error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to publish lineup' },
      });
    }
  }
);

export default router;

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  createAthlete,
  getAthletes,
  getAthleteById,
  updateAthlete,
  deleteAthlete,
  bulkImportAthletes,
  searchAthletes,
  getAthletesBySide,
} from '../services/athleteService.js';
import { authenticateToken, requireRole, teamIsolation } from '../middleware/auth.js';

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

// All routes require authentication and team context
router.use(authenticateToken, teamIsolation);

/**
 * POST /api/v1/athletes
 * Create a new athlete
 */
router.post(
  '/',
  requireRole('OWNER', 'COACH'),
  [
    body('firstName').trim().isLength({ min: 1, max: 50 }),
    body('lastName').trim().isLength({ min: 1, max: 50 }),
    body('email').optional({ nullable: true }).isEmail().normalizeEmail(),
    body('side').optional().isIn(['Port', 'Starboard', 'Both', 'Cox']),
    body('weightKg').optional().isFloat({ min: 30, max: 200 }),
    body('heightCm').optional().isInt({ min: 100, max: 250 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const athlete = await createAthlete(req.user.activeTeamId, req.body);

      res.status(201).json({
        success: true,
        data: { athlete },
      });
    } catch (error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE', message: error.message },
        });
      }
      console.error('Create athlete error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to create athlete' },
      });
    }
  }
);

/**
 * GET /api/v1/athletes
 * Get all athletes for the team
 */
router.get(
  '/',
  [query('includeStats').optional().isBoolean()],
  validateRequest,
  async (req, res) => {
    try {
      const includeStats = req.query.includeStats === 'true';
      const athletes = await getAthletes(req.user.activeTeamId, { includeStats });

      res.json({
        success: true,
        data: { athletes, count: athletes.length },
      });
    } catch (error) {
      console.error('Get athletes error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get athletes' },
      });
    }
  }
);

/**
 * GET /api/v1/athletes/search
 * Search athletes
 */
router.get(
  '/search',
  [query('q').trim().isLength({ min: 1 })],
  validateRequest,
  async (req, res) => {
    try {
      const athletes = await searchAthletes(req.user.activeTeamId, req.query.q);

      res.json({
        success: true,
        data: { athletes },
      });
    } catch (error) {
      console.error('Search athletes error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Search failed' },
      });
    }
  }
);

/**
 * GET /api/v1/athletes/by-side/:side
 * Get athletes by side preference
 */
router.get(
  '/by-side/:side',
  [param('side').isIn(['Port', 'Starboard', 'Cox'])],
  validateRequest,
  async (req, res) => {
    try {
      const athletes = await getAthletesBySide(req.user.activeTeamId, req.params.side);

      res.json({
        success: true,
        data: { athletes },
      });
    } catch (error) {
      console.error('Get by side error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get athletes' },
      });
    }
  }
);

/**
 * GET /api/v1/athletes/:id
 * Get single athlete
 */
router.get(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const athlete = await getAthleteById(req.params.id, req.user.activeTeamId);

      res.json({
        success: true,
        data: { athlete },
      });
    } catch (error) {
      if (error.message === 'Athlete not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      console.error('Get athlete error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get athlete' },
      });
    }
  }
);

/**
 * PATCH /api/v1/athletes/:id
 * Update athlete
 */
router.patch(
  '/:id',
  requireRole('OWNER', 'COACH'),
  [
    param('id').isUUID(),
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
    body('email').optional({ nullable: true }).isEmail().normalizeEmail(),
    body('side').optional().isIn(['Port', 'Starboard', 'Both', 'Cox', null]),
    body('weightKg').optional({ nullable: true }).isFloat({ min: 30, max: 200 }),
    body('heightCm').optional({ nullable: true }).isInt({ min: 100, max: 250 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const athlete = await updateAthlete(req.params.id, req.user.activeTeamId, req.body);

      res.json({
        success: true,
        data: { athlete },
      });
    } catch (error) {
      if (error.message === 'Athlete not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE', message: error.message },
        });
      }
      console.error('Update athlete error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update athlete' },
      });
    }
  }
);

/**
 * DELETE /api/v1/athletes/:id
 * Delete athlete
 */
router.delete(
  '/:id',
  requireRole('OWNER', 'COACH'),
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      await deleteAthlete(req.params.id, req.user.activeTeamId);

      res.json({
        success: true,
        data: { message: 'Athlete deleted' },
      });
    } catch (error) {
      if (error.message === 'Athlete not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      if (error.message === 'Cannot delete linked athlete account') {
        return res.status(400).json({
          success: false,
          error: { code: 'LINKED_ACCOUNT', message: error.message },
        });
      }
      console.error('Delete athlete error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to delete athlete' },
      });
    }
  }
);

/**
 * POST /api/v1/athletes/bulk-import
 * Bulk import athletes
 */
router.post(
  '/bulk-import',
  requireRole('OWNER', 'COACH'),
  [
    body('athletes').isArray({ min: 1, max: 100 }),
    body('athletes.*.firstName').trim().isLength({ min: 1, max: 50 }),
    body('athletes.*.lastName').trim().isLength({ min: 1, max: 50 }),
    body('athletes.*.email').optional({ nullable: true }).isEmail(),
    body('athletes.*.side').optional().isIn(['Port', 'Starboard', 'Both', 'Cox']),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const results = await bulkImportAthletes(req.user.activeTeamId, req.body.athletes);

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error('Bulk import error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Bulk import failed' },
      });
    }
  }
);

export default router;

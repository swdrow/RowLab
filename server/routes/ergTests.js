import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  createErgTest,
  getErgTests,
  getErgTestById,
  updateErgTest,
  deleteErgTest,
  getAthleteTestHistory,
  getTeamLeaderboard,
  bulkImportErgTests,
} from '../services/ergTestService.js';
import { authenticateToken, requireRole, teamIsolation } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details: errors.array() },
    });
  }
  next();
};

/**
 * GET /api/v1/erg-tests
 * List all erg tests for the team
 */
router.get(
  '/',
  authenticateToken,
  teamIsolation,
  [
    query('athleteId').optional().isUUID(),
    query('testType').optional().isIn(['500m', '1k', '2k', '5k', '6k', '30min']),
    query('fromDate').optional().isISO8601(),
    query('toDate').optional().isISO8601(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const tests = await getErgTests(req.user.activeTeamId, req.query);
      res.json({
        success: true,
        data: { tests },
      });
    } catch (error) {
      logger.error('Get erg tests error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get erg tests' },
      });
    }
  }
);

/**
 * GET /api/v1/erg-tests/leaderboard
 * Get team leaderboard for a test type
 */
router.get(
  '/leaderboard',
  authenticateToken,
  teamIsolation,
  [
    query('testType').isIn(['500m', '1k', '2k', '5k', '6k', '30min']),
    query('limit').optional().isInt({ min: 1, max: 200 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { testType, limit } = req.query;
      const leaderboard = await getTeamLeaderboard(req.user.activeTeamId, testType, {
        limit: limit ? parseInt(limit) : 20,
      });
      res.json({
        success: true,
        data: { leaderboard },
      });
    } catch (error) {
      logger.error('Get leaderboard error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get leaderboard' },
      });
    }
  }
);

/**
 * GET /api/v1/erg-tests/athlete/:athleteId/history
 * Get test history for an athlete
 */
router.get(
  '/athlete/:athleteId/history',
  authenticateToken,
  teamIsolation,
  [param('athleteId').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const history = await getAthleteTestHistory(req.user.activeTeamId, req.params.athleteId);
      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      logger.error('Get athlete history error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get athlete history' },
      });
    }
  }
);

/**
 * GET /api/v1/erg-tests/:id
 * Get single erg test
 */
router.get(
  '/:id',
  authenticateToken,
  teamIsolation,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const test = await getErgTestById(req.user.activeTeamId, req.params.id);
      res.json({
        success: true,
        data: { test },
      });
    } catch (error) {
      if (error.message === 'Erg test not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Get erg test error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get erg test' },
      });
    }
  }
);

/**
 * POST /api/v1/erg-tests
 * Create new erg test
 */
router.post(
  '/',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    body('athleteId').isUUID(),
    body('testType').isIn(['500m', '1k', '2k', '5k', '6k', '30min']),
    body('testDate').isISO8601(),
    body('timeSeconds').isFloat({ min: 0 }),
    body('distanceM').optional().isInt({ min: 0 }),
    body('splitSeconds').optional().isFloat({ min: 0 }),
    body('watts').optional().isInt({ min: 0 }),
    body('strokeRate').optional().isInt({ min: 10, max: 60 }),
    body('weightKg').optional().isFloat({ min: 30, max: 150 }),
    body('notes').optional().trim().isLength({ max: 500 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const test = await createErgTest(req.user.activeTeamId, req.body);
      res.status(201).json({
        success: true,
        data: { test },
      });
    } catch (error) {
      logger.error('Create erg test error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to create erg test' },
      });
    }
  }
);

/**
 * POST /api/v1/erg-tests/bulk-import
 * Bulk import erg tests
 */
router.post(
  '/bulk-import',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    body('tests').isArray({ min: 1, max: 500 }),
    body('tests.*.athleteId').isUUID(),
    body('tests.*.testType').isIn(['500m', '1k', '2k', '5k', '6k', '30min']),
    body('tests.*.testDate').isISO8601(),
    body('tests.*.timeSeconds').isFloat({ min: 0 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const result = await bulkImportErgTests(req.user.activeTeamId, req.body.tests);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Bulk import error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to import erg tests' },
      });
    }
  }
);

/**
 * PATCH /api/v1/erg-tests/:id
 * Update erg test
 */
router.patch(
  '/:id',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    param('id').isUUID(),
    body('testType').optional().isIn(['500m', '1k', '2k', '5k', '6k', '30min']),
    body('testDate').optional().isISO8601(),
    body('timeSeconds').optional().isFloat({ min: 0 }),
    body('distanceM').optional().isInt({ min: 0 }),
    body('splitSeconds').optional().isFloat({ min: 0 }),
    body('watts').optional().isInt({ min: 0 }),
    body('strokeRate').optional().isInt({ min: 10, max: 60 }),
    body('weightKg').optional().isFloat({ min: 30, max: 150 }),
    body('notes').optional().trim().isLength({ max: 500 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const test = await updateErgTest(req.user.activeTeamId, req.params.id, req.body);
      res.json({
        success: true,
        data: { test },
      });
    } catch (error) {
      if (error.message === 'Erg test not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Update erg test error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update erg test' },
      });
    }
  }
);

/**
 * DELETE /api/v1/erg-tests/:id
 * Delete erg test
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
      await deleteErgTest(req.user.activeTeamId, req.params.id);
      res.json({
        success: true,
        data: { message: 'Erg test deleted' },
      });
    } catch (error) {
      if (error.message === 'Erg test not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Delete erg test error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to delete erg test' },
      });
    }
  }
);

export default router;

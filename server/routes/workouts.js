import express from 'express';
import logger from '../utils/logger.js';
import { body, param, query, validationResult } from 'express-validator';
import {
  createWorkout,
  getWorkouts,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
  getAthleteWorkoutSummary,
} from '../services/workoutService.js';
import { authenticateToken, requireRole, teamIsolation } from '../middleware/auth.js';

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
 * GET /api/v1/workouts
 * List workouts with filters
 */
router.get(
  '/',
  authenticateToken,
  teamIsolation,
  [
    query('athleteId').optional().isUUID(),
    query('source').optional().isIn(['manual', 'concept2_sync', 'csv_import', 'bluetooth']),
    query('fromDate').optional().isISO8601(),
    query('toDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 500 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const workouts = await getWorkouts(req.user.activeTeamId, req.query);
      res.json({
        success: true,
        data: { workouts },
      });
    } catch (error) {
      logger.error('Get workouts error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get workouts' },
      });
    }
  }
);

/**
 * GET /api/v1/workouts/athlete/:athleteId/summary
 * Get athlete workout summary
 */
router.get(
  '/athlete/:athleteId/summary',
  authenticateToken,
  teamIsolation,
  [
    param('athleteId').isUUID(),
    query('days').optional().isInt({ min: 1, max: 365 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const summary = await getAthleteWorkoutSummary(
        req.user.activeTeamId,
        req.params.athleteId,
        req.query.days ? parseInt(req.query.days) : 30
      );
      res.json({
        success: true,
        data: { summary },
      });
    } catch (error) {
      logger.error('Get workout summary error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get workout summary' },
      });
    }
  }
);

/**
 * GET /api/v1/workouts/:id
 * Get single workout
 */
router.get(
  '/:id',
  authenticateToken,
  teamIsolation,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const workout = await getWorkoutById(req.user.activeTeamId, req.params.id);
      res.json({
        success: true,
        data: { workout },
      });
    } catch (error) {
      if (error.message === 'Workout not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Get workout error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get workout' },
      });
    }
  }
);

/**
 * POST /api/v1/workouts
 * Create manual workout
 */
router.post(
  '/',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    body('athleteId').isUUID(),
    body('date').isISO8601(),
    body('distanceM').optional().isInt({ min: 0 }),
    body('durationSeconds').optional().isFloat({ min: 0 }),
    body('strokeRate').optional().isInt({ min: 10, max: 60 }),
    body('calories').optional().isInt({ min: 0 }),
    body('dragFactor').optional().isInt({ min: 50, max: 250 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const workout = await createWorkout(req.user.activeTeamId, {
        ...req.body,
        source: 'manual',
      });
      res.status(201).json({
        success: true,
        data: { workout },
      });
    } catch (error) {
      logger.error('Create workout error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to create workout' },
      });
    }
  }
);

/**
 * PATCH /api/v1/workouts/:id
 * Update workout
 */
router.patch(
  '/:id',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    param('id').isUUID(),
    body('date').optional().isISO8601(),
    body('distanceM').optional().isInt({ min: 0 }),
    body('durationSeconds').optional().isFloat({ min: 0 }),
    body('strokeRate').optional().isInt({ min: 10, max: 60 }),
    body('calories').optional().isInt({ min: 0 }),
    body('dragFactor').optional().isInt({ min: 50, max: 250 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const workout = await updateWorkout(req.user.activeTeamId, req.params.id, req.body);
      res.json({
        success: true,
        data: { workout },
      });
    } catch (error) {
      if (error.message === 'Workout not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Update workout error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update workout' },
      });
    }
  }
);

/**
 * DELETE /api/v1/workouts/:id
 * Delete workout
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
      await deleteWorkout(req.user.activeTeamId, req.params.id);
      res.json({
        success: true,
        data: { message: 'Workout deleted' },
      });
    } catch (error) {
      if (error.message === 'Workout not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Delete workout error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to delete workout' },
      });
    }
  }
);

export default router;

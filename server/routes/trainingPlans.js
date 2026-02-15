import express from 'express';
import logger from '../utils/logger.js';
import { body, param, query, validationResult } from 'express-validator';
import {
  createPlan,
  getPlanById,
  updatePlan,
  deletePlan,
  listPlans,
  addWorkoutToPlan,
  updatePlannedWorkout,
  deletePlannedWorkout,
  assignPlanToAthletes,
  removeAssignment,
  getAthletePlans,
  recordCompletion,
  calculateCompliance,
  getTrainingLoad,
  getTemplates,
  createFromTemplate,
} from '../services/trainingPlanService.js';
import {
  getWeeklyCompliance,
  getComplianceReport,
  getTrainingLoad as getNCAATrainingLoad,
  linkAttendanceToTraining,
} from '../services/ncaaComplianceService.js';
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

// ============================================
// TRAINING PLAN CRUD
// ============================================

/**
 * GET /api/v1/training-plans
 * List training plans for the team
 */
router.get(
  '/',
  authenticateToken,
  teamIsolation,
  [
    query('isTemplate').optional().isBoolean(),
    query('phase').optional().isIn(['Base', 'Build', 'Peak', 'Taper', 'Recovery']),
    query('limit').optional().isInt({ min: 1, max: 200 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const filters = {
        isTemplate: req.query.isTemplate === 'true' ? true : req.query.isTemplate === 'false' ? false : undefined,
        phase: req.query.phase,
        limit: req.query.limit,
      };
      const plans = await listPlans(req.user.activeTeamId, filters);
      res.json({
        success: true,
        data: { plans },
      });
    } catch (error) {
      logger.error('List training plans error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to list training plans' },
      });
    }
  }
);

/**
 * POST /api/v1/training-plans
 * Create a new training plan
 */
router.post(
  '/',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    body('name').trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().isLength({ max: 2000 }),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('phase').optional().isIn(['Base', 'Build', 'Peak', 'Taper', 'Recovery']),
    body('isTemplate').optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const plan = await createPlan(req.user.activeTeamId, req.user.userId, req.body);
      res.status(201).json({
        success: true,
        data: { plan },
      });
    } catch (error) {
      logger.error('Create training plan error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to create training plan' },
      });
    }
  }
);

/**
 * GET /api/v1/training-plans/templates
 * Get available periodization templates
 */
router.get(
  '/templates',
  authenticateToken,
  async (req, res) => {
    try {
      const templates = getTemplates();
      res.json({
        success: true,
        data: { templates },
      });
    } catch (error) {
      logger.error('Get templates error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get templates' },
      });
    }
  }
);

/**
 * POST /api/v1/training-plans/from-template
 * Create a plan from a template
 */
router.post(
  '/from-template',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    body('templateId').trim().notEmpty(),
    body('name').optional().trim().isLength({ max: 200 }),
    body('startDate').optional().isISO8601(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const plan = await createFromTemplate(
        req.body.templateId,
        req.user.activeTeamId,
        req.user.userId,
        {
          name: req.body.name,
          startDate: req.body.startDate,
        }
      );
      res.status(201).json({
        success: true,
        data: { plan },
      });
    } catch (error) {
      if (error.message === 'Template not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Create from template error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to create plan from template' },
      });
    }
  }
);

/**
 * GET /api/v1/training-plans/athlete/:athleteId
 * Get plans assigned to a specific athlete
 */
router.get(
  '/athlete/:athleteId',
  authenticateToken,
  teamIsolation,
  [param('athleteId').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const plans = await getAthletePlans(req.params.athleteId, req.user.activeTeamId);
      res.json({
        success: true,
        data: { plans },
      });
    } catch (error) {
      logger.error('Get athlete plans error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get athlete plans' },
      });
    }
  }
);

/**
 * GET /api/v1/training-plans/athlete/:athleteId/load
 * Get training load for an athlete
 */
router.get(
  '/athlete/:athleteId/load',
  authenticateToken,
  teamIsolation,
  [
    param('athleteId').isUUID(),
    query('startDate').isISO8601(),
    query('endDate').isISO8601(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const load = await getTrainingLoad(
        req.params.athleteId,
        req.user.activeTeamId,
        {
          startDate: req.query.startDate,
          endDate: req.query.endDate,
        }
      );
      res.json({
        success: true,
        data: { load },
      });
    } catch (error) {
      logger.error('Get training load error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get training load' },
      });
    }
  }
);

// ============================================
// NCAA COMPLIANCE ENDPOINTS
// ============================================

/**
 * GET /api/v1/training-plans/compliance/weekly
 * Get weekly NCAA compliance data
 */
router.get(
  '/compliance/weekly',
  authenticateToken,
  teamIsolation,
  [
    query('weekStart').isISO8601(),
    query('athleteId').optional().isUUID(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const entries = await getWeeklyCompliance(
        req.user.activeTeamId,
        req.query.weekStart,
        req.query.athleteId
      );
      res.json({
        success: true,
        data: { entries },
      });
    } catch (error) {
      logger.error('Get weekly compliance error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get weekly compliance' },
      });
    }
  }
);

/**
 * GET /api/v1/training-plans/compliance/report
 * Get compliance audit report for a week
 */
router.get(
  '/compliance/report',
  authenticateToken,
  teamIsolation,
  [query('weekStart').isISO8601()],
  validateRequest,
  async (req, res) => {
    try {
      const report = await getComplianceReport(
        req.user.activeTeamId,
        req.query.weekStart
      );
      res.json({
        success: true,
        data: { report },
      });
    } catch (error) {
      logger.error('Get compliance report error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get compliance report' },
      });
    }
  }
);

/**
 * GET /api/v1/training-plans/load
 * Get training load (TSS/volume) over date range for team or athlete
 */
router.get(
  '/load',
  authenticateToken,
  teamIsolation,
  [
    query('startDate').isISO8601(),
    query('endDate').isISO8601(),
    query('athleteId').optional().isUUID(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const weeks = await getNCAATrainingLoad(
        req.user.activeTeamId,
        req.query.startDate,
        req.query.endDate,
        req.query.athleteId
      );
      res.json({
        success: true,
        data: { weeks },
      });
    } catch (error) {
      logger.error('Get NCAA training load error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get training load' },
      });
    }
  }
);

/**
 * GET /api/v1/training-plans/attendance-link
 * Link attendance records to training sessions for a date
 */
router.get(
  '/attendance-link',
  authenticateToken,
  teamIsolation,
  [query('date').isISO8601()],
  validateRequest,
  async (req, res) => {
    try {
      const linkedData = await linkAttendanceToTraining(
        req.user.activeTeamId,
        req.query.date
      );
      res.json({
        success: true,
        data: linkedData,
      });
    } catch (error) {
      logger.error('Link attendance to training error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to link attendance to training' },
      });
    }
  }
);

/**
 * GET /api/v1/training-plans/:id
 * Get a specific training plan with all details
 */
router.get(
  '/:id',
  authenticateToken,
  teamIsolation,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const plan = await getPlanById(req.params.id, req.user.activeTeamId);
      res.json({
        success: true,
        data: { plan },
      });
    } catch (error) {
      if (error.message === 'Training plan not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Get training plan error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get training plan' },
      });
    }
  }
);

/**
 * PUT /api/v1/training-plans/:id
 * Update a training plan
 */
router.put(
  '/:id',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    param('id').isUUID(),
    body('name').optional().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().isLength({ max: 2000 }),
    body('startDate').optional({ nullable: true }).isISO8601(),
    body('endDate').optional({ nullable: true }).isISO8601(),
    body('phase').optional().isIn(['Base', 'Build', 'Peak', 'Taper', 'Recovery']),
    body('isTemplate').optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const plan = await updatePlan(req.params.id, req.user.activeTeamId, req.body);
      res.json({
        success: true,
        data: { plan },
      });
    } catch (error) {
      if (error.message === 'Training plan not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Update training plan error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update training plan' },
      });
    }
  }
);

/**
 * DELETE /api/v1/training-plans/:id
 * Delete a training plan
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
      await deletePlan(req.params.id, req.user.activeTeamId);
      res.json({
        success: true,
        data: { message: 'Training plan deleted' },
      });
    } catch (error) {
      if (error.message === 'Training plan not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Delete training plan error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to delete training plan' },
      });
    }
  }
);

// ============================================
// PLANNED WORKOUT MANAGEMENT
// ============================================

/**
 * POST /api/v1/training-plans/:id/workouts
 * Add a workout to a plan
 */
router.post(
  '/:id/workouts',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    param('id').isUUID(),
    body('name').trim().notEmpty().isLength({ max: 200 }),
    body('type').isIn(['erg', 'row', 'cross_train', 'strength', 'rest']),
    body('description').optional().isLength({ max: 2000 }),
    body('scheduledDate').optional().isISO8601(),
    body('dayOfWeek').optional().isInt({ min: 0, max: 6 }),
    body('weekNumber').optional().isInt({ min: 1 }),
    body('duration').optional().isInt({ min: 0 }),
    body('distance').optional().isInt({ min: 0 }),
    body('targetPace').optional().isFloat({ min: 0 }),
    body('targetHeartRate').optional().isInt({ min: 0, max: 250 }),
    body('intensity').optional().isIn(['easy', 'moderate', 'hard', 'max']),
    body('order').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const workout = await addWorkoutToPlan(req.params.id, req.user.activeTeamId, req.body);
      res.status(201).json({
        success: true,
        data: { workout },
      });
    } catch (error) {
      if (error.message === 'Training plan not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Add workout to plan error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to add workout to plan' },
      });
    }
  }
);

/**
 * PUT /api/v1/training-plans/:id/workouts/:workoutId
 * Update a planned workout
 */
router.put(
  '/:id/workouts/:workoutId',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    param('id').isUUID(),
    param('workoutId').isUUID(),
    body('name').optional().trim().notEmpty().isLength({ max: 200 }),
    body('type').optional().isIn(['erg', 'row', 'cross_train', 'strength', 'rest']),
    body('description').optional().isLength({ max: 2000 }),
    body('scheduledDate').optional({ nullable: true }).isISO8601(),
    body('dayOfWeek').optional({ nullable: true }).isInt({ min: 0, max: 6 }),
    body('weekNumber').optional({ nullable: true }).isInt({ min: 1 }),
    body('duration').optional({ nullable: true }).isInt({ min: 0 }),
    body('distance').optional({ nullable: true }).isInt({ min: 0 }),
    body('targetPace').optional({ nullable: true }).isFloat({ min: 0 }),
    body('targetHeartRate').optional({ nullable: true }).isInt({ min: 0, max: 250 }),
    body('intensity').optional().isIn(['easy', 'moderate', 'hard', 'max']),
    body('order').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const workout = await updatePlannedWorkout(req.params.workoutId, req.user.activeTeamId, req.body);
      res.json({
        success: true,
        data: { workout },
      });
    } catch (error) {
      if (error.message === 'Planned workout not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Update planned workout error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update planned workout' },
      });
    }
  }
);

/**
 * DELETE /api/v1/training-plans/:id/workouts/:workoutId
 * Delete a planned workout
 */
router.delete(
  '/:id/workouts/:workoutId',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    param('id').isUUID(),
    param('workoutId').isUUID(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      await deletePlannedWorkout(req.params.workoutId, req.user.activeTeamId);
      res.json({
        success: true,
        data: { message: 'Planned workout deleted' },
      });
    } catch (error) {
      if (error.message === 'Planned workout not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Delete planned workout error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to delete planned workout' },
      });
    }
  }
);

// ============================================
// ATHLETE ASSIGNMENTS
// ============================================

/**
 * POST /api/v1/training-plans/:id/assign
 * Assign a plan to athletes
 */
router.post(
  '/:id/assign',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    param('id').isUUID(),
    body('athleteIds').isArray({ min: 1 }),
    body('athleteIds.*').isUUID(),
    body('startDate').isISO8601(),
    body('endDate').optional().isISO8601(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const assignments = await assignPlanToAthletes(
        req.params.id,
        req.user.activeTeamId,
        req.body.athleteIds,
        req.user.userId,
        {
          startDate: req.body.startDate,
          endDate: req.body.endDate,
        }
      );
      res.status(201).json({
        success: true,
        data: { assignments },
      });
    } catch (error) {
      if (error.message === 'Training plan not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      if (error.message === 'One or more athletes not found in team') {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ATHLETES', message: error.message },
        });
      }
      logger.error('Assign plan error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to assign plan to athletes' },
      });
    }
  }
);

/**
 * DELETE /api/v1/training-plans/:id/assignments/:assignmentId
 * Remove an assignment
 */
router.delete(
  '/:id/assignments/:assignmentId',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    param('id').isUUID(),
    param('assignmentId').isUUID(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      await removeAssignment(req.params.assignmentId, req.user.activeTeamId);
      res.json({
        success: true,
        data: { message: 'Assignment removed' },
      });
    } catch (error) {
      if (error.message === 'Assignment not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Remove assignment error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to remove assignment' },
      });
    }
  }
);

/**
 * GET /api/v1/training-plans/:id/assignments/:assignmentId/compliance
 * Calculate compliance for an assignment
 */
router.get(
  '/:id/assignments/:assignmentId/compliance',
  authenticateToken,
  teamIsolation,
  [
    param('id').isUUID(),
    param('assignmentId').isUUID(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const compliance = await calculateCompliance(req.params.assignmentId, req.user.activeTeamId);
      res.json({
        success: true,
        data: { compliance },
      });
    } catch (error) {
      if (error.message === 'Assignment not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Calculate compliance error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to calculate compliance' },
      });
    }
  }
);

// ============================================
// WORKOUT COMPLETION
// ============================================

/**
 * POST /api/v1/training-plans/:id/workouts/:workoutId/complete
 * Record a workout completion
 */
router.post(
  '/:id/workouts/:workoutId/complete',
  authenticateToken,
  teamIsolation,
  [
    param('id').isUUID(),
    param('workoutId').isUUID(),
    body('athleteId').isUUID(),
    body('workoutId').optional().isUUID(),
    body('compliance').optional().isFloat({ min: 0, max: 1 }),
    body('notes').optional().isLength({ max: 1000 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const completion = await recordCompletion(
        req.params.workoutId,
        req.body.athleteId,
        req.user.activeTeamId,
        {
          workoutId: req.body.workoutId,
          compliance: req.body.compliance,
          notes: req.body.notes,
        }
      );
      res.status(201).json({
        success: true,
        data: { completion },
      });
    } catch (error) {
      if (error.message === 'Planned workout not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Record completion error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to record completion' },
      });
    }
  }
);

export default router;

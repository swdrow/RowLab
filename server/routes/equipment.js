/**
 * Equipment Assignment Routes - Phase 18 BOAT-03, BOAT-04
 *
 * Endpoints:
 * GET    /api/v1/equipment/availability       - Get equipment availability for a date
 * GET    /api/v1/equipment/assignments        - Get assignments for a date
 * GET    /api/v1/equipment/assignments/lineup/:lineupId - Get assignments for a lineup
 * POST   /api/v1/equipment/assignments        - Create assignment
 * DELETE /api/v1/equipment/assignments/:id    - Delete assignment
 * POST   /api/v1/equipment/check-conflicts    - Check for conflicts
 */

import express from 'express';
import { param, body, query, validationResult } from 'express-validator';
import { authenticateToken, requireTeam } from '../middleware/auth.js';
import * as equipmentService from '../services/equipmentService.js';
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
 * GET /api/v1/equipment/availability
 * Get all equipment with availability status for a date
 */
router.get(
  '/availability',
  authenticateToken,
  requireTeam,
  [
    query('date').isISO8601().withMessage('date must be a valid ISO date'),
    query('excludeLineupId').optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const availability = await equipmentService.getEquipmentAvailability(
        req.user.activeTeamId,
        req.query.date,
        req.query.excludeLineupId || null
      );
      res.json({ success: true, data: availability });
    } catch (error) {
      logger.error('Error fetching equipment availability:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

/**
 * GET /api/v1/equipment/assignments
 * Get assignments for a specific date
 */
router.get(
  '/assignments',
  authenticateToken,
  requireTeam,
  [query('date').isISO8601().withMessage('date must be a valid ISO date')],
  validateRequest,
  async (req, res) => {
    try {
      const assignments = await equipmentService.getAssignments(
        req.user.activeTeamId,
        req.query.date
      );
      res.json({ success: true, data: { assignments } });
    } catch (error) {
      logger.error('Error fetching assignments:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

/**
 * GET /api/v1/equipment/assignments/lineup/:lineupId
 * Get assignments for a specific lineup
 */
router.get(
  '/assignments/lineup/:lineupId',
  authenticateToken,
  requireTeam,
  [param('lineupId').isString().notEmpty()],
  validateRequest,
  async (req, res) => {
    try {
      const assignments = await equipmentService.getLineupAssignments(
        req.params.lineupId,
        req.user.activeTeamId
      );
      res.json({ success: true, data: { assignments } });
    } catch (error) {
      logger.error('Error fetching lineup assignments:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

/**
 * POST /api/v1/equipment/assignments
 * Create an equipment assignment
 */
router.post(
  '/assignments',
  authenticateToken,
  requireTeam,
  [
    body('lineupId').optional().isString(),
    body('sessionId').optional().isString(),
    body('shellId').optional().isString(),
    body('oarSetId').optional().isString(),
    body('assignedDate').isISO8601().withMessage('assignedDate must be a valid ISO date'),
    body('notes').optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      // Validate that at least one equipment type is specified
      if (!req.body.shellId && !req.body.oarSetId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'At least one of shellId or oarSetId is required',
          },
        });
      }

      const assignment = await equipmentService.createAssignment(
        req.user.activeTeamId,
        req.body
      );
      res.status(201).json({ success: true, data: { assignment } });
    } catch (error) {
      logger.error('Error creating assignment:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

/**
 * DELETE /api/v1/equipment/assignments/:id
 * Delete an equipment assignment
 */
router.delete(
  '/assignments/:id',
  authenticateToken,
  requireTeam,
  [param('id').isString().notEmpty()],
  validateRequest,
  async (req, res) => {
    try {
      await equipmentService.deleteAssignment(
        req.params.id,
        req.user.activeTeamId
      );
      res.json({ success: true, data: { message: 'Assignment deleted' } });
    } catch (error) {
      logger.error('Error deleting assignment:', error);
      if (error.message === 'Assignment not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Assignment not found' },
        });
      }
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

/**
 * POST /api/v1/equipment/check-conflicts
 * Check for equipment conflicts
 */
router.post(
  '/check-conflicts',
  authenticateToken,
  requireTeam,
  [
    body('date').isISO8601().withMessage('date must be a valid ISO date'),
    body('shellIds').optional().isArray(),
    body('oarSetIds').optional().isArray(),
    body('excludeLineupId').optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const conflicts = await equipmentService.checkConflicts(
        req.user.activeTeamId,
        req.body.date,
        req.body.shellIds || [],
        req.body.oarSetIds || [],
        req.body.excludeLineupId || null
      );
      res.json({
        success: true,
        data: {
          conflicts,
          hasConflicts: conflicts.length > 0,
        },
      });
    } catch (error) {
      logger.error('Error checking conflicts:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

export default router;

import express from 'express';
import logger from '../utils/logger.js';
import { query, param, body, validationResult } from 'express-validator';
import { authenticateToken, teamIsolation } from '../middleware/auth.js';
import {
  getTeamAvailability,
  getAthleteAvailability,
  updateAthleteAvailability,
} from '../services/availabilityService.js';
import { prisma } from '../db/connection.js';

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
 * GET /api/v1/availability
 * Base route - requires auth, returns 405
 */
router.get('/', authenticateToken, (req, res) => {
  res.status(405).json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'Use GET /api/v1/availability/team or /api/v1/availability/:athleteId',
    },
  });
});

/**
 * GET /api/v1/availability/team
 * Get team-wide availability grid
 *
 * Query params:
 * - startDate: ISO8601 date (required)
 * - endDate: ISO8601 date (required)
 *
 * Returns: { success: true, data: { availability: [...] } }
 */
router.get(
  '/team',
  authenticateToken,
  teamIsolation,
  [
    query('startDate').isISO8601().withMessage('startDate must be ISO8601 format'),
    query('endDate').isISO8601().withMessage('endDate must be ISO8601 format'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const availability = await getTeamAvailability(req.user.activeTeamId, {
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data: { availability },
      });
    } catch (error) {
      logger.error('Get team availability error', {
        error: error.message,
        teamId: req.user.activeTeamId,
      });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to load team availability' },
      });
    }
  }
);

/**
 * GET /api/v1/availability/:athleteId
 * Get athlete's availability for date range
 *
 * Params:
 * - athleteId: UUID
 *
 * Query params:
 * - startDate: ISO8601 date (required)
 * - endDate: ISO8601 date (required)
 *
 * Returns: { success: true, data: { availability: [...] } }
 */
router.get(
  '/:athleteId',
  authenticateToken,
  teamIsolation,
  [
    param('athleteId').isUUID().withMessage('athleteId must be a valid UUID'),
    query('startDate').isISO8601().withMessage('startDate must be ISO8601 format'),
    query('endDate').isISO8601().withMessage('endDate must be ISO8601 format'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { athleteId } = req.params;
      const { startDate, endDate } = req.query;

      // Verify athlete belongs to user's team
      const athlete = await prisma.athlete.findFirst({
        where: {
          id: athleteId,
          teamId: req.user.activeTeamId,
        },
      });

      if (!athlete) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Athlete not found in team' },
        });
      }

      const availability = await getAthleteAvailability(athleteId, {
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data: { availability },
      });
    } catch (error) {
      logger.error('Get athlete availability error', {
        error: error.message,
        athleteId: req.params.athleteId,
        teamId: req.user.activeTeamId,
      });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to load athlete availability' },
      });
    }
  }
);

/**
 * PUT /api/v1/availability/:athleteId
 * Update athlete's availability
 *
 * Authorization:
 * - Athletes can only edit their own availability
 * - Coaches/owners can edit any athlete's availability
 *
 * Params:
 * - athleteId: UUID
 *
 * Body:
 * {
 *   availability: [
 *     {
 *       date: "2026-01-23",
 *       morningSlot: "AVAILABLE",
 *       eveningSlot: "UNAVAILABLE",
 *       notes?: "Optional note"
 *     },
 *     ...
 *   ]
 * }
 *
 * Returns: { success: true, data: { availability: [...] } }
 */
router.put(
  '/:athleteId',
  authenticateToken,
  teamIsolation,
  [
    param('athleteId').isUUID().withMessage('athleteId must be a valid UUID'),
    body('availability').isArray().withMessage('availability must be an array'),
    body('availability.*.date')
      .isISO8601()
      .withMessage('Each availability date must be ISO8601 format'),
    body('availability.*.morningSlot')
      .isIn(['AVAILABLE', 'UNAVAILABLE', 'MAYBE', 'NOT_SET'])
      .withMessage('morningSlot must be a valid AvailabilitySlot value'),
    body('availability.*.eveningSlot')
      .isIn(['AVAILABLE', 'UNAVAILABLE', 'MAYBE', 'NOT_SET'])
      .withMessage('eveningSlot must be a valid AvailabilitySlot value'),
    body('availability.*.notes')
      .optional()
      .isString()
      .isLength({ max: 200 })
      .withMessage('notes must be a string with max 200 characters'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { athleteId } = req.params;
      const { availability } = req.body;

      // Verify athlete belongs to user's team
      const athlete = await prisma.athlete.findFirst({
        where: {
          id: athleteId,
          teamId: req.user.activeTeamId,
        },
      });

      if (!athlete) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Athlete not found in team' },
        });
      }

      // Authorization check: Athletes can only edit their own availability
      // Coaches/owners can edit any athlete's availability
      const isCoachOrOwner = ['COACH', 'OWNER'].includes(req.user.activeTeamRole);
      const isOwnAthlete = athlete.userId === req.user.id;

      if (!isCoachOrOwner && !isOwnAthlete) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: "Cannot edit other athletes' availability" },
        });
      }

      const updated = await updateAthleteAvailability(athleteId, availability);

      res.json({
        success: true,
        data: { availability: updated },
      });
    } catch (error) {
      logger.error('Update athlete availability error', {
        error: error.message,
        athleteId: req.params.athleteId,
        teamId: req.user.activeTeamId,
      });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update availability' },
      });
    }
  }
);

export default router;

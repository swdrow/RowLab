import express from 'express';
import logger from '../utils/logger.js';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateToken, requireRole, teamIsolation } from '../middleware/auth.js';
import prisma from '../db/connection.js';

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

// All routes require authentication and team context
router.use(authenticateToken, teamIsolation);

/**
 * GET /api/v1/calendar/events
 * List calendar events for team with optional date range filter
 * Role-based filtering: Athletes only see visibility='all' events
 */
router.get(
  '/events',
  [
    query('start').optional().isISO8601(),
    query('end').optional().isISO8601(),
    query('type').optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { start, end, type } = req.query;
      const userRole = req.user.activeTeamRole;

      const where = {
        teamId: req.user.activeTeamId,
      };

      // Filter by date range if provided
      if (start || end) {
        where.date = {};
        if (start) where.date.gte = new Date(start);
        if (end) where.date.lte = new Date(end);
      }

      // Filter by event type if provided
      if (type) {
        where.eventType = type;
      }

      // Role-based visibility filtering
      // Athletes and Coxswains only see events marked as 'all'
      // Coaches and Owners see everything
      if (userRole === 'ATHLETE' || userRole === 'COXSWAIN') {
        where.visibility = 'all';
      }

      const events = await prisma.calendarEvent.findMany({
        where,
        orderBy: { date: 'asc' },
      });

      res.json({
        success: true,
        data: { events, count: events.length },
      });
    } catch (error) {
      logger.error('Get calendar events error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get calendar events' },
      });
    }
  }
);

/**
 * GET /api/v1/calendar/events/:id
 * Get single calendar event
 */
router.get(
  '/events/:id',
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const event = await prisma.calendarEvent.findFirst({
        where: {
          id: req.params.id,
          teamId: req.user.activeTeamId,
        },
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Calendar event not found' },
        });
      }

      res.json({
        success: true,
        data: { event },
      });
    } catch (error) {
      logger.error('Get calendar event error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get calendar event' },
      });
    }
  }
);

/**
 * POST /api/v1/calendar/events
 * Create calendar event (COACH or OWNER only)
 */
router.post(
  '/events',
  requireRole('OWNER', 'COACH'),
  [
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('eventType').isIn([
      'erg-test',
      'erg-pieces',
      'steady-state',
      'water',
      'lift',
      'rest',
      'meeting',
      'regatta',
    ]),
    body('date').isISO8601(),
    body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('location').optional().trim().isLength({ max: 200 }),
    body('notes').optional().trim().isLength({ max: 2000 }),
    body('visibility').optional().isIn(['all', 'coaches']),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { title, description, eventType, date, startTime, endTime, location, notes, visibility } =
        req.body;

      const event = await prisma.calendarEvent.create({
        data: {
          teamId: req.user.activeTeamId,
          createdById: req.user.id,
          title,
          description,
          eventType,
          date: new Date(date),
          startTime,
          endTime,
          location,
          notes,
          visibility: visibility || 'all',
        },
      });

      res.status(201).json({
        success: true,
        data: { event },
      });
    } catch (error) {
      logger.error('Create calendar event error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to create calendar event' },
      });
    }
  }
);

/**
 * PATCH /api/v1/calendar/events/:id
 * Update calendar event (COACH or OWNER only)
 */
router.patch(
  '/events/:id',
  requireRole('OWNER', 'COACH'),
  [
    param('id').isUUID(),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('eventType')
      .optional()
      .isIn([
        'erg-test',
        'erg-pieces',
        'steady-state',
        'water',
        'lift',
        'rest',
        'meeting',
        'regatta',
      ]),
    body('date').optional().isISO8601(),
    body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('location').optional().trim().isLength({ max: 200 }),
    body('notes').optional().trim().isLength({ max: 2000 }),
    body('completed').optional().isBoolean(),
    body('visibility').optional().isIn(['all', 'coaches']),
  ],
  validateRequest,
  async (req, res) => {
    try {
      // Check if event exists and belongs to team
      const existing = await prisma.calendarEvent.findFirst({
        where: {
          id: req.params.id,
          teamId: req.user.activeTeamId,
        },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Calendar event not found' },
        });
      }

      const { title, description, eventType, date, startTime, endTime, location, notes, completed, visibility } =
        req.body;

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (eventType !== undefined) updateData.eventType = eventType;
      if (date !== undefined) updateData.date = new Date(date);
      if (startTime !== undefined) updateData.startTime = startTime;
      if (endTime !== undefined) updateData.endTime = endTime;
      if (location !== undefined) updateData.location = location;
      if (notes !== undefined) updateData.notes = notes;
      if (completed !== undefined) updateData.completed = completed;
      if (visibility !== undefined) updateData.visibility = visibility;

      const event = await prisma.calendarEvent.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json({
        success: true,
        data: { event },
      });
    } catch (error) {
      logger.error('Update calendar event error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update calendar event' },
      });
    }
  }
);

/**
 * DELETE /api/v1/calendar/events/:id
 * Delete calendar event (COACH or OWNER only)
 */
router.delete(
  '/events/:id',
  requireRole('OWNER', 'COACH'),
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      // Check if event exists and belongs to team
      const existing = await prisma.calendarEvent.findFirst({
        where: {
          id: req.params.id,
          teamId: req.user.activeTeamId,
        },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Calendar event not found' },
        });
      }

      await prisma.calendarEvent.delete({
        where: { id: req.params.id },
      });

      res.json({
        success: true,
        data: { message: 'Calendar event deleted' },
      });
    } catch (error) {
      logger.error('Delete calendar event error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to delete calendar event' },
      });
    }
  }
);

/**
 * POST /api/v1/calendar/events/:id/complete
 * Mark calendar event as completed
 */
router.post(
  '/events/:id/complete',
  requireRole('OWNER', 'COACH'),
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const existing = await prisma.calendarEvent.findFirst({
        where: {
          id: req.params.id,
          teamId: req.user.activeTeamId,
        },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Calendar event not found' },
        });
      }

      const event = await prisma.calendarEvent.update({
        where: { id: req.params.id },
        data: { completed: true },
      });

      res.json({
        success: true,
        data: { event },
      });
    } catch (error) {
      logger.error('Complete calendar event error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to complete calendar event' },
      });
    }
  }
);

export default router;

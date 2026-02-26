import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  recordAttendance,
  bulkRecordAttendance,
  getAttendanceByDate,
  getAttendanceByAthlete,
  getTeamAttendanceSummary,
  deleteAttendance,
} from '../services/attendanceService.js';
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

router.use(authenticateToken, teamIsolation);

/**
 * GET /api/v1/attendance?date=YYYY-MM-DD
 * Get attendance for a specific date
 */
router.get(
  '/',
  [query('date').isISO8601().withMessage('Valid date required')],
  validateRequest,
  async (req, res) => {
    try {
      const attendance = await getAttendanceByDate(req.user.activeTeamId, req.query.date);
      res.json({ success: true, data: { attendance } });
    } catch (error) {
      logger.error('Failed to fetch attendance', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

/**
 * GET /api/v1/attendance/athlete/:athleteId
 * Get attendance history for a specific athlete
 */
router.get(
  '/athlete/:athleteId',
  [
    param('athleteId').isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const attendance = await getAttendanceByAthlete(
        req.user.activeTeamId,
        req.params.athleteId,
        { startDate: req.query.startDate, endDate: req.query.endDate }
      );
      res.json({ success: true, data: { attendance } });
    } catch (error) {
      logger.error('Failed to fetch athlete attendance', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

/**
 * GET /api/v1/attendance/summary
 * Get team attendance summary for date range
 */
router.get(
  '/summary',
  requireRole('COACH', 'ADMIN', 'OWNER'),
  [
    query('startDate').isISO8601(),
    query('endDate').isISO8601(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const summary = await getTeamAttendanceSummary(
        req.user.activeTeamId,
        { startDate: req.query.startDate, endDate: req.query.endDate }
      );
      res.json({ success: true, data: { summary } });
    } catch (error) {
      logger.error('Failed to fetch attendance summary', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

/**
 * POST /api/v1/attendance
 * Record attendance for a single athlete
 */
router.post(
  '/',
  requireRole('COACH', 'ADMIN', 'OWNER'),
  [
    body('athleteId').isUUID(),
    body('date').isISO8601(),
    body('status').isIn(['present', 'late', 'excused', 'unexcused']),
    body('notes').optional().isString().trim(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const attendance = await recordAttendance(req.user.activeTeamId, {
        ...req.body,
        recordedBy: req.user.id,
      });
      res.status(201).json({ success: true, data: attendance });
    } catch (error) {
      logger.error('Failed to record attendance', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

/**
 * POST /api/v1/attendance/bulk
 * Bulk record attendance for multiple athletes
 */
router.post(
  '/bulk',
  requireRole('COACH', 'ADMIN', 'OWNER'),
  [
    body('date').isISO8601(),
    body('records').isArray({ min: 1 }),
    body('records.*.athleteId').isUUID(),
    body('records.*.status').isIn(['present', 'late', 'excused', 'unexcused']),
    body('records.*.notes').optional().isString().trim(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const results = await bulkRecordAttendance(req.user.activeTeamId, {
        ...req.body,
        recordedBy: req.user.id,
      });
      res.status(201).json({ success: true, data: { count: results.length } });
    } catch (error) {
      logger.error('Failed to bulk record attendance', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

/**
 * DELETE /api/v1/attendance/:id
 * Delete an attendance record
 */
router.delete(
  '/:id',
  requireRole('COACH', 'ADMIN', 'OWNER'),
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      await deleteAttendance(req.user.activeTeamId, req.params.id);
      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to delete attendance', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message },
      });
    }
  }
);

export default router;

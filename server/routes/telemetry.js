import express from 'express';
import logger from '../utils/logger.js';
import { authenticateToken, requireRole, requireTeam } from '../middleware/auth.js';
import * as telemetryService from '../services/telemetryService.js';
import prisma from '../db/connection.js';

const router = express.Router();

// All routes require authentication and team context
router.use(authenticateToken, requireTeam);

/**
 * GET /api/v1/telemetry/athlete/:athleteId
 * Get telemetry history for a specific athlete
 * Query params: startDate?, endDate?, limit?
 */
router.get('/athlete/:athleteId', async (req, res) => {
  try {
    const { athleteId } = req.params;
    const { startDate, endDate, limit } = req.query;

    // Verify athlete belongs to user's team
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: { teamId: true },
    });

    if (!athlete) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Athlete not found' },
      });
    }

    if (athlete.teamId !== req.user.activeTeamId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to access this athlete' },
      });
    }

    const options = {};
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;
    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (!Number.isNaN(parsedLimit)) {
        options.limit = parsedLimit;
      }
    }

    const telemetry = await telemetryService.getTelemetryByAthlete(athleteId, options);

    res.json({ success: true, data: { telemetry } });
  } catch (err) {
    logger.error('Get athlete telemetry error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch athlete telemetry' },
    });
  }
});

/**
 * GET /api/v1/telemetry/session/:date
 * Get team's telemetry for a specific date
 * date format: YYYY-MM-DD
 */
router.get('/session/:date', async (req, res) => {
  try {
    const { date } = req.params;

    const telemetry = await telemetryService.getTelemetryBySession(req.user.activeTeamId, date);

    res.json({ success: true, data: { telemetry } });
  } catch (err) {
    logger.error('Get session telemetry error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch session telemetry' },
    });
  }
});

/**
 * POST /api/v1/telemetry
 * Create a single telemetry entry (OWNER, COACH only)
 * Body: { athleteId, sessionDate, source, seatNumber?, avgWatts?, ... }
 */
router.post('/', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const { athleteId, ...data } = req.body;

    if (!athleteId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: 'athleteId is required' },
      });
    }

    // Verify athlete belongs to user's team
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: { teamId: true },
    });

    if (!athlete) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Athlete not found' },
      });
    }

    if (athlete.teamId !== req.user.activeTeamId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to create telemetry for this athlete' },
      });
    }

    const entry = await telemetryService.createTelemetryEntry(athleteId, data);

    res.status(201).json({ success: true, data: { entry } });
  } catch (err) {
    if (err.message.includes('required') || err.message.includes('Invalid source')) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: err.message },
      });
    }
    logger.error('Create telemetry error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create telemetry entry' },
    });
  }
});

/**
 * POST /api/v1/telemetry/import
 * Batch import telemetry from parsed CSV data (OWNER, COACH only)
 * Body: { sessionDate, source, entries: [{ athleteName, ...metrics }] }
 * Note: CSV parsing happens client-side; this receives parsed data
 */
router.post('/import', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const { sessionDate, source, entries } = req.body;

    if (!sessionDate) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: 'sessionDate is required' },
      });
    }

    if (!source) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: 'source is required' },
      });
    }

    if (!Array.isArray(entries)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: 'entries must be an array' },
      });
    }

    // Attach sessionDate and source to each entry
    const entriesWithMeta = entries.map((entry) => ({
      ...entry,
      sessionDate,
      source,
    }));

    const result = await telemetryService.batchImportTelemetry(
      req.user.activeTeamId,
      entriesWithMeta
    );

    res.json({ success: true, data: result });
  } catch (err) {
    if (err.message.includes('Invalid source')) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: err.message },
      });
    }
    logger.error('Import telemetry error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to import telemetry data' },
    });
  }
});

/**
 * DELETE /api/v1/telemetry/:id
 * Delete a single telemetry entry (OWNER, COACH only)
 */
router.delete('/:id', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch telemetry and verify team ownership
    const telemetry = await prisma.athleteTelemetry.findUnique({
      where: { id },
      include: {
        athlete: {
          select: { teamId: true },
        },
      },
    });

    if (!telemetry) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Telemetry entry not found' },
      });
    }

    if (telemetry.athlete.teamId !== req.user.activeTeamId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to delete this telemetry entry' },
      });
    }

    await telemetryService.deleteTelemetry(id);

    res.json({ success: true, data: { message: 'Telemetry entry deleted successfully' } });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Telemetry entry not found' },
      });
    }
    logger.error('Delete telemetry error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to delete telemetry entry' },
    });
  }
});

export default router;

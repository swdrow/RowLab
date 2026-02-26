/**
 * @deprecated V1 Legacy erg data routes — replaced by /api/v1/erg-tests (server/routes/ergTest.js)
 * Mounted at /api/erg-tests (non-namespaced legacy path)
 * Removal planned: Phase 36 (V1/V2 Cleanup)
 */
import express from 'express';
import logger from '../utils/logger.js';
import prisma from '../db/connection.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/erg-tests
 * Get all erg tests (optionally filtered by athlete)
 */
router.get('/', async (req, res) => {
  try {
    const { athleteId } = req.query;

    const where = athleteId ? { athleteId: parseInt(athleteId) } : {};

    const tests = await prisma.ergTest.findMany({
      where,
      include: {
        athlete: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { testDate: 'desc' },
    });

    res.json({ success: true, data: { tests } });
  } catch (err) {
    logger.error('Get erg tests error', { error: err.message });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch erg tests' } });
  }
});

/**
 * GET /api/erg-tests/:id
 * Get a specific erg test
 */
router.get('/:id', async (req, res) => {
  try {
    const test = await prisma.ergTest.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        athlete: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!test) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Erg test not found' } });
    }

    res.json({ success: true, data: { test } });
  } catch (err) {
    logger.error('Get erg test error', { error: err.message });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch erg test' } });
  }
});

/**
 * POST /api/erg-tests
 * Create a new erg test (requires auth)
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const { athleteId, testDate, testType, result, split, strokeRate, watts, notes } = req.body;

    if (!athleteId || !testDate || !testType || !result) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'Athlete, date, test type, and result are required' } });
    }

    const test = await prisma.ergTest.create({
      data: {
        athleteId: parseInt(athleteId),
        testDate: new Date(testDate),
        testType,
        result,
        split: split || null,
        strokeRate: strokeRate ? parseInt(strokeRate) : null,
        watts: watts ? parseInt(watts) : null,
        notes: notes || null,
      },
      include: {
        athlete: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.status(201).json({ test });
  } catch (err) {
    logger.error('Create erg test error', { error: err.message });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create erg test' } });
  }
});

/**
 * PUT /api/erg-tests/:id
 * Update an erg test (requires auth)
 */
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const testId = parseInt(req.params.id);
    const { testDate, testType, result, split, strokeRate, watts, notes } = req.body;

    const existing = await prisma.ergTest.findUnique({
      where: { id: testId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Erg test not found' } });
    }

    const test = await prisma.ergTest.update({
      where: { id: testId },
      data: {
        testDate: testDate ? new Date(testDate) : existing.testDate,
        testType: testType || existing.testType,
        result: result || existing.result,
        split: split !== undefined ? split : existing.split,
        strokeRate:
          strokeRate !== undefined
            ? strokeRate
              ? parseInt(strokeRate)
              : null
            : existing.strokeRate,
        watts: watts !== undefined ? (watts ? parseInt(watts) : null) : existing.watts,
        notes: notes !== undefined ? notes : existing.notes,
      },
      include: {
        athlete: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({ success: true, data: { test } });
  } catch (err) {
    logger.error('Update erg test error', { error: err.message });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update erg test' } });
  }
});

/**
 * DELETE /api/erg-tests/:id
 * Delete an erg test (requires auth)
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const testId = parseInt(req.params.id);

    const existing = await prisma.ergTest.findUnique({
      where: { id: testId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Erg test not found' } });
    }

    await prisma.ergTest.delete({
      where: { id: testId },
    });

    res.json({ success: true, data: { message: 'Erg test deleted' } });
  } catch (err) {
    logger.error('Delete erg test error', { error: err.message });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to delete erg test' } });
  }
});

/**
 * GET /api/erg-tests/athlete/:athleteId/history
 * Get erg test history for an athlete (for charts)
 */
router.get('/athlete/:athleteId/history', async (req, res) => {
  try {
    const athleteId = parseInt(req.params.athleteId);
    const { testType } = req.query;

    const where = { athleteId };
    if (testType) {
      where.testType = testType;
    }

    const tests = await prisma.ergTest.findMany({
      where,
      orderBy: { testDate: 'asc' },
      select: {
        id: true,
        testDate: true,
        testType: true,
        result: true,
        split: true,
        strokeRate: true,
        watts: true,
      },
    });

    res.json({ success: true, data: { tests } });
  } catch (err) {
    logger.error('Get erg history error', { error: err.message });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch erg history' } });
  }
});

export default router;

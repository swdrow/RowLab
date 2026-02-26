import express from 'express';
import logger from '../utils/logger.js';
import prisma from '../db/connection.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/lineups
 * Get all lineups for authenticated user
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const lineups = await prisma.lineup.findMany({
      where: { userId: req.user.id },
      include: {
        assignments: {
          include: {
            athlete: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, data: { lineups } });
  } catch (err) {
    logger.error('Get lineups error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch lineups' },
    });
  }
});

/**
 * GET /api/lineups/:id
 * Get a specific lineup
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const lineup = await prisma.lineup.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: req.user.id,
      },
      include: {
        assignments: {
          include: {
            athlete: true,
          },
        },
      },
    });

    if (!lineup) {
      return res
        .status(404)
        .json({ success: false, error: { code: 'NOT_FOUND', message: 'Lineup not found' } });
    }

    res.json({ success: true, data: lineup });
  } catch (err) {
    logger.error('Get lineup error', { error: err.message });
    res
      .status(500)
      .json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch lineup' } });
  }
});

/**
 * POST /api/lineups
 * Create a new lineup
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, notes, boats } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: 'Lineup name required' },
      });
    }

    // Create lineup with assignments
    const lineup = await prisma.lineup.create({
      data: {
        name,
        notes: notes || null,
        userId: req.user.id,
        assignments: {
          create:
            boats?.flatMap((boat) =>
              boat.seats
                .filter((seat) => seat.athlete)
                .map((seat) => ({
                  athleteId: seat.athlete.id,
                  boatClass: boat.name || boat.boatClass,
                  shellName: boat.shellName || null,
                  seatNumber: seat.seatNumber,
                  side: seat.side,
                  isCoxswain: false,
                }))
                .concat(
                  boat.coxswain
                    ? [
                        {
                          athleteId: boat.coxswain.id,
                          boatClass: boat.name || boat.boatClass,
                          shellName: boat.shellName || null,
                          seatNumber: 0,
                          side: 'Cox',
                          isCoxswain: true,
                        },
                      ]
                    : []
                )
            ) || [],
        },
      },
      include: {
        assignments: {
          include: {
            athlete: true,
          },
        },
      },
    });

    res.status(201).json({ success: true, data: { lineup } });
  } catch (err) {
    logger.error('Create lineup error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create lineup' },
    });
  }
});

/**
 * PUT /api/lineups/:id
 * Update a lineup
 */
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const lineupId = parseInt(req.params.id);
    const { name, notes, boats } = req.body;

    // Verify ownership
    const existing = await prisma.lineup.findFirst({
      where: {
        id: lineupId,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, error: { code: 'NOT_FOUND', message: 'Lineup not found' } });
    }

    // Delete old assignments and create new ones
    await prisma.lineupAssignment.deleteMany({
      where: { lineupId },
    });

    const lineup = await prisma.lineup.update({
      where: { id: lineupId },
      data: {
        name: name || existing.name,
        notes: notes !== undefined ? notes : existing.notes,
        assignments: {
          create:
            boats?.flatMap((boat) =>
              boat.seats
                .filter((seat) => seat.athlete)
                .map((seat) => ({
                  athleteId: seat.athlete.id,
                  boatClass: boat.name || boat.boatClass,
                  shellName: boat.shellName || null,
                  seatNumber: seat.seatNumber,
                  side: seat.side,
                  isCoxswain: false,
                }))
                .concat(
                  boat.coxswain
                    ? [
                        {
                          athleteId: boat.coxswain.id,
                          boatClass: boat.name || boat.boatClass,
                          shellName: boat.shellName || null,
                          seatNumber: 0,
                          side: 'Cox',
                          isCoxswain: true,
                        },
                      ]
                    : []
                )
            ) || [],
        },
      },
      include: {
        assignments: {
          include: {
            athlete: true,
          },
        },
      },
    });

    res.json({ success: true, data: { lineup } });
  } catch (err) {
    logger.error('Update lineup error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update lineup' },
    });
  }
});

/**
 * DELETE /api/lineups/:id
 * Delete a lineup
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const lineupId = parseInt(req.params.id);

    // Verify ownership
    const existing = await prisma.lineup.findFirst({
      where: {
        id: lineupId,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, error: { code: 'NOT_FOUND', message: 'Lineup not found' } });
    }

    await prisma.lineup.delete({
      where: { id: lineupId },
    });

    res.json({ success: true, data: { message: 'Lineup deleted' } });
  } catch (err) {
    logger.error('Delete lineup error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to delete lineup' },
    });
  }
});

export default router;

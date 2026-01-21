import express from 'express';
import logger from '../utils/logger.js';
import { authenticateToken, requireTeam, requireRole } from '../middleware/auth.js';
import { prisma } from '../db/connection.js';

const router = express.Router();

// All routes require authentication and team context
router.use(authenticateToken, requireTeam);

// ============================================
// Search and List Routes
// ============================================

/**
 * GET /api/v1/external-teams/search
 * Search external teams by query, conference, or division
 */
router.get('/search', async (req, res) => {
  try {
    const { q, conference, division, limit = 20 } = req.query;

    const where = {};
    if (q) {
      where.name = { contains: q, mode: 'insensitive' };
    }
    if (conference) {
      where.conference = { equals: conference, mode: 'insensitive' };
    }
    if (division) {
      where.division = division;
    }

    const teams = await prisma.externalTeam.findMany({
      where,
      take: parseInt(limit, 10),
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: { teams } });
  } catch (err) {
    logger.error('Search external teams error', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to search external teams' });
  }
});

/**
 * GET /api/v1/external-teams
 * Get all external teams sorted by name
 */
router.get('/', async (req, res) => {
  try {
    const teams = await prisma.externalTeam.findMany({
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: { teams } });
  } catch (err) {
    logger.error('Get external teams error', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to fetch external teams' });
  }
});

/**
 * GET /api/v1/external-teams/conferences
 * Get distinct conferences from external teams
 */
router.get('/conferences', async (req, res) => {
  try {
    const result = await prisma.externalTeam.findMany({
      where: { conference: { not: null } },
      select: { conference: true },
      distinct: ['conference'],
    });

    const conferences = result.map((r) => r.conference).filter(Boolean).sort();

    res.json({ success: true, data: { conferences } });
  } catch (err) {
    logger.error('Get conferences error', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to fetch conferences' });
  }
});

// ============================================
// Write Operations (OWNER, COACH only)
// ============================================

/**
 * POST /api/v1/external-teams
 * Create a new external team (OWNER, COACH only)
 * Returns 400 if team already exists with case-insensitive name match
 */
router.post('/', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    const { name, conference, division } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Team name is required' });
    }

    // Check for existing team with case-insensitive name match
    const existing = await prisma.externalTeam.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Team already exists',
        data: { team: existing },
      });
    }

    const team = await prisma.externalTeam.create({
      data: { name, conference, division },
    });

    res.status(201).json({ success: true, data: { team } });
  } catch (err) {
    logger.error('Create external team error', { error: err.message });
    res.status(400).json({ success: false, error: 'Failed to create external team' });
  }
});

/**
 * PATCH /api/v1/external-teams/:id
 * Update an external team (OWNER, COACH only)
 */
router.patch('/:id', requireRole(['OWNER', 'COACH']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, conference, division } = req.body;

    // Build update data, only including provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (conference !== undefined) updateData.conference = conference;
    if (division !== undefined) updateData.division = division;

    // If name is being updated, check for case-insensitive uniqueness
    if (name !== undefined) {
      const existing = await prisma.externalTeam.findFirst({
        where: {
          name: { equals: name, mode: 'insensitive' },
          id: { not: id }, // Exclude the current team
        },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Team with this name already exists',
        });
      }
    }

    const team = await prisma.externalTeam.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, data: { team } });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'External team not found' });
    }
    logger.error('Update external team error', { error: err.message });
    res.status(400).json({ success: false, error: 'Failed to update external team' });
  }
});

export default router;

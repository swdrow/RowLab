import express from 'express';
import { param, body, validationResult } from 'express-validator';
import { authenticateToken, requireTeam, requireRole } from '../middleware/auth.js';
import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

const router = express.Router();

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a unique share token for public visit links
 * Uses URL-safe base64 encoding of random bytes
 */
async function generateShareToken() {
  const bytes = crypto.randomBytes(24); // 192 bits
  const token = bytes.toString('base64url'); // URL-safe base64

  // Verify uniqueness
  const existing = await prisma.recruitVisit.findUnique({
    where: { shareToken: token },
  });

  if (existing) {
    // Retry if collision (extremely unlikely)
    return generateShareToken();
  }

  return token;
}

// ============================================
// Public Routes (no auth required)
// ============================================

/**
 * GET /api/v1/recruit-visits/shared/:token
 * Get public view of a recruit visit via share token
 * No authentication required - for sharing with recruits/families
 */
router.get('/shared/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const visit = await prisma.recruitVisit.findFirst({
      where: {
        shareToken: token,
        shareEnabled: true,
      },
      select: {
        id: true,
        recruitName: true,
        date: true,
        startTime: true,
        endTime: true,
        scheduleType: true,
        scheduleContent: true,
        schedulePdfUrl: true,
        hostAthlete: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!visit) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Visit not found or sharing is disabled' },
      });
    }

    res.json({ success: true, data: { visit } });
  } catch (err) {
    logger.error('Get shared visit error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch visit' },
    });
  }
});

// ============================================
// Authenticated Routes
// ============================================

// All routes below require authentication and team context
router.use(authenticateToken, requireTeam);

/**
 * GET /api/v1/recruit-visits
 * List recruit visits for the active team with optional filters
 * Query params: status, hostAthleteId, startDate, endDate, limit, offset
 */
router.get('/', async (req, res) => {
  try {
    const { status, hostAthleteId, startDate, endDate, limit, offset } = req.query;

    const where = {
      teamId: req.user.activeTeamId,
    };

    // Apply filters
    if (status) {
      where.status = status;
    }
    if (hostAthleteId) {
      where.hostAthleteId = hostAthleteId;
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const [visits, total] = await Promise.all([
      prisma.recruitVisit.findMany({
        where,
        include: {
          hostAthlete: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { date: 'asc' },
        ...(limit && { take: parseInt(limit, 10) }),
        ...(offset && { skip: parseInt(offset, 10) }),
      }),
      prisma.recruitVisit.count({ where }),
    ]);

    res.json({ success: true, data: { visits, total } });
  } catch (err) {
    logger.error('Get recruit visits error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch recruit visits' },
    });
  }
});

/**
 * GET /api/v1/recruit-visits/:id
 * Get a single recruit visit
 */
router.get('/:id', async (req, res) => {
  try {
    const visitId = req.params.id;

    const visit = await prisma.recruitVisit.findFirst({
      where: {
        id: visitId,
        teamId: req.user.activeTeamId,
      },
      include: {
        hostAthlete: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!visit) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Recruit visit not found' },
      });
    }

    res.json({ success: true, data: { visit } });
  } catch (err) {
    logger.error('Get recruit visit error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch recruit visit' },
    });
  }
});

/**
 * POST /api/v1/recruit-visits
 * Create a new recruit visit (OWNER, COACH only)
 */
router.post('/', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const {
      recruitName,
      recruitEmail,
      recruitPhone,
      recruitSchool,
      recruitGradYear,
      date,
      startTime,
      endTime,
      hostAthleteId,
      scheduleType,
      scheduleContent,
      schedulePdfUrl,
      notes,
    } = req.body;

    // Validate required fields
    if (!recruitName || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'recruitName, date, startTime, and endTime are required',
        },
      });
    }

    // Validate scheduleType enum
    const validScheduleTypes = ['pdf', 'richtext'];
    if (scheduleType && !validScheduleTypes.includes(scheduleType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: `scheduleType must be one of: ${validScheduleTypes.join(', ')}`,
        },
      });
    }

    // Validate host athlete belongs to team if provided
    if (hostAthleteId) {
      const athlete = await prisma.athlete.findFirst({
        where: {
          id: hostAthleteId,
          teamId: req.user.activeTeamId,
        },
      });

      if (!athlete) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Host athlete not found or does not belong to your team',
          },
        });
      }
    }

    const visit = await prisma.recruitVisit.create({
      data: {
        recruitName,
        recruitEmail,
        recruitPhone,
        recruitSchool,
        recruitGradYear,
        date: new Date(date),
        startTime,
        endTime,
        hostAthleteId,
        scheduleType: scheduleType || 'richtext',
        scheduleContent,
        schedulePdfUrl,
        notes,
        teamId: req.user.activeTeamId,
        createdById: req.user.id,
      },
      include: {
        hostAthlete: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.status(201).json({ success: true, data: { visit } });
  } catch (err) {
    logger.error('Create recruit visit error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create recruit visit' },
    });
  }
});

/**
 * PATCH /api/v1/recruit-visits/:id
 * Update a recruit visit (OWNER, COACH only)
 */
router.patch('/:id', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const visitId = req.params.id;
    const {
      recruitName,
      recruitEmail,
      recruitPhone,
      recruitSchool,
      recruitGradYear,
      date,
      startTime,
      endTime,
      hostAthleteId,
      scheduleType,
      scheduleContent,
      schedulePdfUrl,
      notes,
      status,
      shareEnabled,
    } = req.body;

    // Check visit exists and belongs to team
    const existing = await prisma.recruitVisit.findFirst({
      where: {
        id: visitId,
        teamId: req.user.activeTeamId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Recruit visit not found' },
      });
    }

    // Validate scheduleType enum if provided
    if (scheduleType) {
      const validScheduleTypes = ['pdf', 'richtext'];
      if (!validScheduleTypes.includes(scheduleType)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: `scheduleType must be one of: ${validScheduleTypes.join(', ')}`,
          },
        });
      }
    }

    // Validate status enum if provided
    if (status) {
      const validStatuses = ['scheduled', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: `status must be one of: ${validStatuses.join(', ')}`,
          },
        });
      }
    }

    // Validate host athlete belongs to team if provided
    if (hostAthleteId) {
      const athlete = await prisma.athlete.findFirst({
        where: {
          id: hostAthleteId,
          teamId: req.user.activeTeamId,
        },
      });

      if (!athlete) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Host athlete not found or does not belong to your team',
          },
        });
      }
    }

    // Build update data
    const updateData = {};
    if (recruitName !== undefined) updateData.recruitName = recruitName;
    if (recruitEmail !== undefined) updateData.recruitEmail = recruitEmail;
    if (recruitPhone !== undefined) updateData.recruitPhone = recruitPhone;
    if (recruitSchool !== undefined) updateData.recruitSchool = recruitSchool;
    if (recruitGradYear !== undefined) updateData.recruitGradYear = recruitGradYear;
    if (date !== undefined) updateData.date = new Date(date);
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (hostAthleteId !== undefined) updateData.hostAthleteId = hostAthleteId;
    if (scheduleType !== undefined) updateData.scheduleType = scheduleType;
    if (scheduleContent !== undefined) updateData.scheduleContent = scheduleContent;
    if (schedulePdfUrl !== undefined) updateData.schedulePdfUrl = schedulePdfUrl;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    if (shareEnabled !== undefined) updateData.shareEnabled = shareEnabled;

    const visit = await prisma.recruitVisit.update({
      where: { id: visitId },
      data: updateData,
      include: {
        hostAthlete: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({ success: true, data: { visit } });
  } catch (err) {
    logger.error('Update recruit visit error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update recruit visit' },
    });
  }
});

/**
 * DELETE /api/v1/recruit-visits/:id
 * Delete a recruit visit (OWNER, COACH only)
 */
router.delete('/:id', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const visitId = req.params.id;

    // Check visit exists and belongs to team
    const existing = await prisma.recruitVisit.findFirst({
      where: {
        id: visitId,
        teamId: req.user.activeTeamId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Recruit visit not found' },
      });
    }

    await prisma.recruitVisit.delete({
      where: { id: visitId },
    });

    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    logger.error('Delete recruit visit error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to delete recruit visit' },
    });
  }
});

/**
 * POST /api/v1/recruit-visits/:id/generate-share-token
 * Generate a share token for public visit link (OWNER, COACH only)
 * Creates unique shareToken if not exists and enables sharing
 */
router.post('/:id/generate-share-token', requireRole('OWNER', 'COACH'), async (req, res) => {
  try {
    const visitId = req.params.id;

    // Check visit exists and belongs to team
    const existing = await prisma.recruitVisit.findFirst({
      where: {
        id: visitId,
        teamId: req.user.activeTeamId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Recruit visit not found' },
      });
    }

    // Generate token if doesn't exist
    let shareToken = existing.shareToken;
    if (!shareToken) {
      shareToken = await generateShareToken();
    }

    // Update visit with token and enable sharing
    const visit = await prisma.recruitVisit.update({
      where: { id: visitId },
      data: {
        shareToken,
        shareEnabled: true,
      },
      include: {
        hostAthlete: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({ success: true, data: { shareToken, visit } });
  } catch (err) {
    logger.error('Generate share token error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to generate share token' },
    });
  }
});

export default router;

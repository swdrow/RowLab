import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  togglePin,
} from '../services/announcementService.js';
import { authenticateToken, requireRole, teamIsolation } from '../middleware/auth.js';
import prisma from '../db/connection.js';
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

// All routes require authentication and team context
router.use(authenticateToken, teamIsolation);

/**
 * GET /api/v1/announcements
 * List announcements for team (filtered by user's role)
 */
router.get(
  '/',
  [
    query('priority').optional().isIn(['normal', 'important', 'urgent']),
    query('pinnedOnly').optional().isBoolean(),
    query('includeRead').optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const options = {
        userId: req.user.id,
        role: req.user.activeTeamRole,
        priority: req.query.priority,
        pinnedOnly: req.query.pinnedOnly === 'true',
        includeRead: req.query.includeRead !== 'false', // Default true
      };

      const announcements = await getAnnouncements(req.user.activeTeamId, options);

      res.json({
        success: true,
        data: { announcements, count: announcements.length },
      });
    } catch (error) {
      logger.error('Get announcements error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get announcements' },
      });
    }
  }
);

/**
 * GET /api/v1/announcements/unread-count
 * Get unread count for badge
 */
router.get('/unread-count', async (req, res) => {
  try {
    const count = await getUnreadCount(
      req.user.activeTeamId,
      req.user.id,
      req.user.activeTeamRole
    );

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    logger.error('Get unread count error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to get unread count' },
    });
  }
});

/**
 * GET /api/v1/announcements/:id
 * Get single announcement (auto-mark as read when viewed)
 */
router.get(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const announcement = await getAnnouncementById(
        req.user.activeTeamId,
        req.params.id,
        req.user.id
      );

      if (!announcement) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Announcement not found' },
        });
      }

      // Check visibility based on role (OWNERs can see all announcements)
      if (
        req.user.activeTeamRole !== 'OWNER' &&
        announcement.visibleTo !== 'all' &&
        announcement.visibleTo !== req.user.activeTeamRole
      ) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Not authorized to view this announcement' },
        });
      }

      // Auto-mark as read when viewed
      if (!announcement.isRead) {
        await markAsRead(req.params.id, req.user.id);
        announcement.isRead = true;
        announcement.readAt = new Date();
      }

      res.json({
        success: true,
        data: { announcement },
      });
    } catch (error) {
      logger.error('Get announcement error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get announcement' },
      });
    }
  }
);

/**
 * POST /api/v1/announcements
 * Create announcement (COACH or OWNER only)
 */
router.post(
  '/',
  requireRole('OWNER', 'COACH'),
  [
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('content').trim().isLength({ min: 1, max: 10000 }),
    body('priority').optional().isIn(['normal', 'important', 'urgent']),
    body('visibleTo').optional().isIn(['all', 'ATHLETE', 'COACH', 'OWNER']),
    body('pinned').optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const announcement = await createAnnouncement(
        req.user.activeTeamId,
        req.user.id,
        req.body
      );

      res.status(201).json({
        success: true,
        data: { announcement },
      });
    } catch (error) {
      logger.error('Create announcement error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to create announcement' },
      });
    }
  }
);

/**
 * PUT /api/v1/announcements/:id
 * Update announcement (must be author or OWNER)
 */
router.put(
  '/:id',
  requireRole('OWNER', 'COACH'),
  [
    param('id').isUUID(),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('content').optional().trim().isLength({ min: 1, max: 10000 }),
    body('priority').optional().isIn(['normal', 'important', 'urgent']),
    body('visibleTo').optional().isIn(['all', 'ATHLETE', 'COACH', 'OWNER']),
    body('pinned').optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      // Check if user is author or OWNER
      const existing = await prisma.announcement.findFirst({
        where: {
          id: req.params.id,
          teamId: req.user.activeTeamId,
        },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Announcement not found' },
        });
      }

      // Must be author or OWNER to update
      if (existing.authorId !== req.user.id && req.user.activeTeamRole !== 'OWNER') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Not authorized to update this announcement' },
        });
      }

      // Use the author ID for the service call (OWNER can update others' announcements)
      const announcement = await updateAnnouncement(
        req.user.activeTeamId,
        req.params.id,
        existing.authorId,
        req.body
      );

      res.json({
        success: true,
        data: { announcement },
      });
    } catch (error) {
      logger.error('Update announcement error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update announcement' },
      });
    }
  }
);

/**
 * DELETE /api/v1/announcements/:id
 * Delete announcement (must be author or OWNER)
 */
router.delete(
  '/:id',
  requireRole('OWNER', 'COACH'),
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      // Check if user is author or OWNER
      const existing = await prisma.announcement.findFirst({
        where: {
          id: req.params.id,
          teamId: req.user.activeTeamId,
        },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Announcement not found' },
        });
      }

      // Must be author or OWNER to delete
      if (existing.authorId !== req.user.id && req.user.activeTeamRole !== 'OWNER') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Not authorized to delete this announcement' },
        });
      }

      // Use the author ID for the service call (OWNER can delete others' announcements)
      await deleteAnnouncement(req.user.activeTeamId, req.params.id, existing.authorId);

      res.json({
        success: true,
        data: { message: 'Announcement deleted' },
      });
    } catch (error) {
      logger.error('Delete announcement error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to delete announcement' },
      });
    }
  }
);

/**
 * POST /api/v1/announcements/read-all
 * Mark all announcements as read
 */
router.post('/read-all', async (req, res) => {
  try {
    const result = await markAllAsRead(
      req.user.activeTeamId,
      req.user.id,
      req.user.activeTeamRole
    );

    res.json({
      success: true,
      data: { markedCount: result.count },
    });
  } catch (error) {
    logger.error('Mark all as read error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to mark all as read' },
    });
  }
});

/**
 * POST /api/v1/announcements/:id/read
 * Mark announcement as read
 */
router.post(
  '/:id/read',
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      // Verify announcement exists and is visible to user
      const announcement = await getAnnouncementById(
        req.user.activeTeamId,
        req.params.id,
        req.user.id
      );

      if (!announcement) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Announcement not found' },
        });
      }

      // Check visibility (OWNERs can see all announcements)
      if (
        req.user.activeTeamRole !== 'OWNER' &&
        announcement.visibleTo !== 'all' &&
        announcement.visibleTo !== req.user.activeTeamRole
      ) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Not authorized to access this announcement' },
        });
      }

      await markAsRead(req.params.id, req.user.id);

      res.json({
        success: true,
        data: { message: 'Marked as read' },
      });
    } catch (error) {
      logger.error('Mark as read error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to mark as read' },
      });
    }
  }
);

/**
 * POST /api/v1/announcements/:id/toggle-pin
 * Toggle pin status (COACH or OWNER only)
 */
router.post(
  '/:id/toggle-pin',
  requireRole('OWNER', 'COACH'),
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const announcement = await togglePin(req.user.activeTeamId, req.params.id);

      if (!announcement) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Announcement not found' },
        });
      }

      res.json({
        success: true,
        data: { announcement },
      });
    } catch (error) {
      logger.error('Toggle pin error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to toggle pin status' },
      });
    }
  }
);

export default router;

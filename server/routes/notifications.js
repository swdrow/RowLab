import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  dismissNotification,
} from '../services/notificationService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// All notification routes require authentication
router.use(authenticateToken);

/**
 * GET /api/v1/notifications
 * List notifications for the authenticated user
 * Query params: limit (default 50), offset (default 0)
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    const notifications = await getUserNotifications(req.user.id, { limit, offset });

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    logger.error('Failed to fetch notifications', { userId: req.user.id, error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch notifications' },
    });
  }
});

/**
 * GET /api/v1/notifications/unread-count
 * Get the unread notification count for the authenticated user
 */
router.get('/unread-count', async (req, res) => {
  try {
    const count = await getUnreadCount(req.user.id);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    logger.error('Failed to fetch unread count', { userId: req.user.id, error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch unread count' },
    });
  }
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a single notification as read
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await markAsRead(req.params.id, req.user.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found' },
      });
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    logger.error('Failed to mark notification as read', {
      notificationId: req.params.id,
      userId: req.user.id,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to mark notification as read' },
    });
  }
});

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all notifications as read for the authenticated user
 */
router.patch('/read-all', async (req, res) => {
  try {
    const count = await markAllAsRead(req.user.id);

    res.json({
      success: true,
      data: { markedCount: count },
      message: `${count} notification(s) marked as read`,
    });
  } catch (error) {
    logger.error('Failed to mark all notifications as read', {
      userId: req.user.id,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to mark all notifications as read' },
    });
  }
});

/**
 * DELETE /api/v1/notifications/:id
 * Dismiss (delete) a notification
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await dismissNotification(req.params.id, req.user.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found' },
      });
    }

    res.json({
      success: true,
      data: { message: 'Notification dismissed' },
    });
  } catch (error) {
    logger.error('Failed to dismiss notification', {
      notificationId: req.params.id,
      userId: req.user.id,
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to dismiss notification' },
    });
  }
});

export default router;

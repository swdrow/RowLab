import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';

/**
 * Create a new notification for a user
 * @param {Object} params
 * @param {string} params.userId - Target user ID
 * @param {string} params.type - Notification type: 'system', 'invite', 'team_activity', 'sync_status', 'announcement'
 * @param {string} params.title - Notification title
 * @param {string} [params.body] - Optional notification body
 * @param {Object} [params.metadata] - Optional metadata (targetUrl, teamId, inviteId, etc.)
 * @returns {Promise<Object>} Created notification
 */
export async function createNotification({ userId, type, title, body, metadata }) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body: body || null,
        metadata: metadata || null,
      },
    });

    return notification;
  } catch (error) {
    logger.error('Failed to create notification', {
      userId,
      type,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get notifications for a user with pagination
 * @param {string} userId
 * @param {Object} [options]
 * @param {number} [options.limit=50] - Max notifications to return
 * @param {number} [options.offset=0] - Offset for pagination
 * @returns {Promise<Object[]>} Array of notifications
 */
export async function getUserNotifications(userId, { limit = 50, offset = 0 } = {}) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  return notifications;
}

/**
 * Get unread notification count for a user
 * @param {string} userId
 * @returns {Promise<number>} Unread count
 */
export async function getUnreadCount(userId) {
  const count = await prisma.notification.count({
    where: {
      userId,
      readAt: null,
    },
  });

  return count;
}

/**
 * Mark a single notification as read
 * @param {string} id - Notification ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} Updated notification
 */
export async function markAsRead(id, userId) {
  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notification) {
    return null;
  }

  if (notification.readAt) {
    return notification; // Already read
  }

  return prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });
}

/**
 * Mark all notifications as read for a user
 * @param {string} userId
 * @returns {Promise<number>} Number of notifications marked as read
 */
export async function markAllAsRead(userId) {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return result.count;
}

/**
 * Dismiss (delete) a notification
 * @param {string} id - Notification ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export async function dismissNotification(id, userId) {
  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notification) {
    return false;
  }

  await prisma.notification.delete({
    where: { id },
  });

  return true;
}

import prisma from '../db/connection.js';
import logger from '../utils/logger.js';

/**
 * Settings Service
 * Handles user settings and preferences
 */

/**
 * Get user settings
 * Creates default settings if none exist
 */
export async function getSettings(userId) {
  try {
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId,
          emailNotifications: true,
          pushNotifications: false,
          darkMode: true,
          compactView: false,
          autoSave: true,
        },
      });
      logger.info('Created default user settings', { userId });
    }

    return settings;
  } catch (error) {
    logger.error('Get settings error', { userId, error: error.message });
    throw error;
  }
}

/**
 * Update user settings
 * Only updates provided fields
 */
export async function updateSettings(userId, updates) {
  try {
    // Ensure settings exist first
    await getSettings(userId);

    // Update settings
    const settings = await prisma.userSettings.update({
      where: { userId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    logger.info('Updated user settings', { userId, fields: Object.keys(updates) });
    return settings;
  } catch (error) {
    logger.error('Update settings error', { userId, error: error.message });
    throw error;
  }
}

/**
 * Delete user settings
 * Used during account deletion
 */
export async function deleteSettings(userId) {
  try {
    await prisma.userSettings.delete({
      where: { userId },
    });
    logger.info('Deleted user settings', { userId });
  } catch (error) {
    // If settings don't exist, that's fine
    if (error.code === 'P2025') {
      logger.debug('No settings to delete', { userId });
      return;
    }
    logger.error('Delete settings error', { userId, error: error.message });
    throw error;
  }
}

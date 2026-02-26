import express from 'express';
import { authenticateToken, requireRole, teamIsolation } from '../middleware/auth.js';
import { getSettings, updateSettings } from '../services/settingsService.js';
import { prisma } from '../db/connection.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/v1/settings
 * Get current user settings
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await getSettings(userId);

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logger.error('Get settings error', { error: error.message, userId: req.user?.id });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch settings',
      },
    });
  }
});

/**
 * PATCH /api/v1/settings
 * Update user settings
 * Accepts partial updates
 */
router.patch('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Validate that we have something to update
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No settings provided to update',
        },
      });
    }

    // Whitelist allowed fields to prevent updating protected fields
    // NOTE: 'role' is intentionally excluded - role changes require admin endpoint
    const allowedFields = [
      'emailNotifications',
      'pushNotifications',
      'darkMode',
      'compactView',
      'autoSave',
      'firstName',
      'lastName',
      'avatar',
      // Granular preferences stored as JSON in UserSettings
      'notificationPrefs',
      'privacyPrefs',
    ];

    const filteredUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No valid settings provided to update',
        },
      });
    }

    const settings = await updateSettings(userId, filteredUpdates);

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logger.error('Update settings error', { error: error.message, userId: req.user?.id });
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update settings',
      },
    });
  }
});

// ============================================
// TEAM SETTINGS (Visibility controls)
// ============================================

/**
 * GET /api/v1/settings/team
 * Get team visibility settings
 * Accessible by OWNER and COACH
 */
router.get(
  '/team',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  async (req, res) => {
    try {
      const team = await prisma.team.findUnique({
        where: { id: req.user.activeTeamId },
        select: { id: true, name: true, settings: true },
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Team not found' },
        });
      }

      // Extract visibility settings with defaults
      const settings = team.settings || {};
      const visibility = {
        athletesCanSeeRankings: settings.athletesCanSeeRankings !== false,
        athletesCanSeeOthersErgData: settings.athletesCanSeeOthersErgData !== false,
        athletesCanSeeOthersLineups: settings.athletesCanSeeOthersLineups !== false,
      };

      res.json({
        success: true,
        data: {
          teamId: team.id,
          teamName: team.name,
          visibility,
        },
      });
    } catch (error) {
      logger.error('Get team settings error', {
        error: error.message,
        teamId: req.user?.activeTeamId,
      });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get team settings' },
      });
    }
  }
);

/**
 * PATCH /api/v1/settings/team
 * Update team visibility settings
 * Only accessible by OWNER
 */
router.patch('/team', authenticateToken, teamIsolation, requireRole('OWNER'), async (req, res) => {
  try {
    const { visibility } = req.body;

    if (!visibility || typeof visibility !== 'object') {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_FAILED', message: 'Visibility settings required' },
      });
    }

    // Get current team settings
    const team = await prisma.team.findUnique({
      where: { id: req.user.activeTeamId },
      select: { settings: true },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Team not found' },
      });
    }

    // Merge visibility settings with existing settings
    const currentSettings = team.settings || {};
    const allowedVisibilityKeys = [
      'athletesCanSeeRankings',
      'athletesCanSeeOthersErgData',
      'athletesCanSeeOthersLineups',
    ];

    const updatedSettings = { ...currentSettings };
    for (const [key, value] of Object.entries(visibility)) {
      if (allowedVisibilityKeys.includes(key) && typeof value === 'boolean') {
        updatedSettings[key] = value;
      }
    }

    // Update team settings
    const updatedTeam = await prisma.team.update({
      where: { id: req.user.activeTeamId },
      data: { settings: updatedSettings },
      select: { id: true, name: true, settings: true },
    });

    // Extract updated visibility
    const newVisibility = {
      athletesCanSeeRankings: updatedSettings.athletesCanSeeRankings !== false,
      athletesCanSeeOthersErgData: updatedSettings.athletesCanSeeOthersErgData !== false,
      athletesCanSeeOthersLineups: updatedSettings.athletesCanSeeOthersLineups !== false,
    };

    res.json({
      success: true,
      data: {
        teamId: updatedTeam.id,
        teamName: updatedTeam.name,
        visibility: newVisibility,
      },
    });
  } catch (error) {
    logger.error('Update team settings error', {
      error: error.message,
      teamId: req.user?.activeTeamId,
    });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update team settings' },
    });
  }
});

export default router;

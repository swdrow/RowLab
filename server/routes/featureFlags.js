import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router({ mergeParams: true });

const VALID_TOOLS = [
  'lineup',
  'seat_racing',
  'fleet',
  'training',
  'attendance',
  'whiteboard',
  'recruiting',
];

/**
 * Build a full flags object from DB rows, defaulting missing tools to false.
 */
function buildFlagsObject(rows) {
  const flags = {};
  for (const tool of VALID_TOOLS) {
    flags[tool] = { athleteReadOnly: false };
  }
  for (const row of rows) {
    if (VALID_TOOLS.includes(row.tool)) {
      flags[row.tool] = { athleteReadOnly: row.athleteReadOnly };
    }
  }
  return flags;
}

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

/**
 * GET /api/v1/teams/:teamId/feature-flags
 * Get feature flags for a team. Returns all tools with defaults if no rows exist.
 * Requires authenticated user who is a member of the team.
 */
router.get(
  '/',
  authenticateToken,
  [param('teamId').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const { prisma } = await import('../db/connection.js');
      const { getTeam } = await import('../services/teamService.js');

      // Verify membership
      await getTeam(req.params.teamId, req.user.id);

      const rows = await prisma.teamFeatureFlag.findMany({
        where: { teamId: req.params.teamId },
      });

      const flags = buildFlagsObject(rows);

      res.json({
        success: true,
        data: { flags },
      });
    } catch (error) {
      if (error.message === 'Team not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      if (error.message === 'Not a member of this team') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
      }
      logger.error('Get feature flags error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get feature flags' },
      });
    }
  }
);

/**
 * PUT /api/v1/teams/:teamId/feature-flags
 * Update a tool's athlete-read-only setting.
 * Requires OWNER or ADMIN role (NOT COACH).
 * Body: { tool: string, athleteReadOnly: boolean }
 */
router.put(
  '/',
  authenticateToken,
  [param('teamId').isUUID(), body('tool').isIn(VALID_TOOLS), body('athleteReadOnly').isBoolean()],
  validateRequest,
  async (req, res) => {
    try {
      const { prisma } = await import('../db/connection.js');
      const { getTeam } = await import('../services/teamService.js');

      // Verify membership and get role
      const team = await getTeam(req.params.teamId, req.user.id);

      // Only OWNER and ADMIN can modify feature flags
      if (!['OWNER', 'ADMIN'].includes(team.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only team owner or admin can update feature flags',
          },
        });
      }

      const { tool, athleteReadOnly } = req.body;

      // Upsert the flag
      await prisma.teamFeatureFlag.upsert({
        where: {
          teamId_tool: {
            teamId: req.params.teamId,
            tool,
          },
        },
        update: { athleteReadOnly },
        create: {
          teamId: req.params.teamId,
          tool,
          athleteReadOnly,
        },
      });

      // Return full updated flags object
      const rows = await prisma.teamFeatureFlag.findMany({
        where: { teamId: req.params.teamId },
      });

      const flags = buildFlagsObject(rows);

      res.json({
        success: true,
        data: { flags },
      });
    } catch (error) {
      if (error.message === 'Team not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      if (error.message === 'Not a member of this team') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
      }
      logger.error('Update feature flags error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update feature flags' },
      });
    }
  }
);

export default router;

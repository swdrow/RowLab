import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  createTeam,
  getTeam,
  updateTeam,
  getTeamMembers,
  joinTeamByCode,
  searchTeams,
  regenerateInviteCode,
  updateMemberRole,
  removeMember,
} from '../services/teamService.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: errors.array() },
    });
  }
  next();
};

/**
 * GET /api/v1/teams
 * List teams for authenticated user
 * Returns 405 - use GET /api/v1/teams/:id instead
 */
router.get('/', authenticateToken, (req, res) => {
  res.status(405).json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'Use GET /api/v1/teams/:id to fetch a specific team',
    },
  });
});

/**
 * POST /api/v1/teams
 * Create a new team
 */
router.post(
  '/',
  authenticateToken,
  [body('name').trim().isLength({ min: 2, max: 100 }), body('isPublic').optional().isBoolean()],
  validateRequest,
  async (req, res) => {
    try {
      const { name, isPublic } = req.body;
      const team = await createTeam({ name, userId: req.user.id, isPublic });

      res.status(201).json({
        success: true,
        data: { team },
      });
    } catch (error) {
      logger.error('Create team error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to create team' },
      });
    }
  }
);

/**
 * GET /api/v1/teams/search
 * Search public teams
 */
router.get(
  '/search',
  authenticateToken,
  [query('q').trim().isLength({ min: 1 })],
  validateRequest,
  async (req, res) => {
    try {
      const teams = await searchTeams(req.query.q);
      res.json({
        success: true,
        data: { teams },
      });
    } catch (error) {
      logger.error('Search teams error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Search failed' },
      });
    }
  }
);

/**
 * POST /api/v1/teams/join/:code
 * Join team via invite code
 */
router.post(
  '/join/:code',
  authenticateToken,
  [param('code').isLength({ min: 8, max: 8 })],
  validateRequest,
  async (req, res) => {
    try {
      const team = await joinTeamByCode(req.params.code, req.user.id);
      res.json({
        success: true,
        data: { team },
      });
    } catch (error) {
      if (error.message === 'Invalid invite code') {
        return res.status(404).json({
          success: false,
          error: { code: 'INVALID_CODE', message: error.message },
        });
      }
      if (error.message === 'Already a member of this team') {
        return res.status(409).json({
          success: false,
          error: { code: 'ALREADY_MEMBER', message: error.message },
        });
      }
      logger.error('Join team error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to join team' },
      });
    }
  }
);

/**
 * GET /api/v1/teams/:id
 * Get team details
 */
router.get('/:id', authenticateToken, [param('id').isUUID()], validateRequest, async (req, res) => {
  try {
    const team = await getTeam(req.params.id, req.user.id);
    res.json({
      success: true,
      data: { team },
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
    logger.error('Get team error', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to get team' },
    });
  }
});

/**
 * PATCH /api/v1/teams/:id
 * Update team settings
 */
router.patch(
  '/:id',
  authenticateToken,
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('isPublic').optional().isBoolean(),
    body('visibilitySetting').optional().isIn(['open', 'coaches_only', 'opt_in']),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const team = await updateTeam(req.params.id, req.user.id, req.body);
      res.json({
        success: true,
        data: { team },
      });
    } catch (error) {
      if (error.message === 'Only team owner can update settings') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
      }
      logger.error('Update team error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update team' },
      });
    }
  }
);

/**
 * GET /api/v1/teams/:id/members
 * Get team members
 */
router.get(
  '/:id/members',
  authenticateToken,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      // First verify membership
      await getTeam(req.params.id, req.user.id);
      const members = await getTeamMembers(req.params.id);

      res.json({
        success: true,
        data: { members },
      });
    } catch (error) {
      if (error.message === 'Not a member of this team') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
      }
      logger.error('Get members error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get members' },
      });
    }
  }
);

/**
 * PATCH /api/v1/teams/:id/members/:userId
 * Update member role
 */
router.patch(
  '/:id/members/:userId',
  authenticateToken,
  [
    param('id').isUUID(),
    param('userId').isUUID(),
    body('role').isIn(['OWNER', 'COACH', 'COXSWAIN', 'ATHLETE']),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const member = await updateMemberRole(
        req.params.id,
        req.params.userId,
        req.body.role,
        req.user.id
      );
      res.json({
        success: true,
        data: { member },
      });
    } catch (error) {
      if (error.message.includes('Only team owner') || error.message.includes('Cannot change')) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
      }
      logger.error('Update member role error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update role' },
      });
    }
  }
);

/**
 * DELETE /api/v1/teams/:id/members/:userId
 * Remove member from team
 */
router.delete(
  '/:id/members/:userId',
  authenticateToken,
  [param('id').isUUID(), param('userId').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      await removeMember(req.params.id, req.params.userId, req.user.id);
      res.json({
        success: true,
        data: { message: 'Member removed' },
      });
    } catch (error) {
      if (error.message.includes('permissions') || error.message.includes('Cannot remove')) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
      }
      if (error.message === 'Member not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Remove member error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to remove member' },
      });
    }
  }
);

/**
 * POST /api/v1/teams/:id/regenerate-code
 * Regenerate invite code
 */
router.post(
  '/:id/regenerate-code',
  authenticateToken,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const newCode = await regenerateInviteCode(req.params.id, req.user.id);
      res.json({
        success: true,
        data: { inviteCode: newCode },
      });
    } catch (error) {
      if (error.message === 'Insufficient permissions') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
      }
      logger.error('Regenerate code error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to regenerate code' },
      });
    }
  }
);

export default router;

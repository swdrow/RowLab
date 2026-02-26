import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  createTeam,
  getTeam,
  getTeamByIdentifier,
  getTeamOverview,
  getTeamRoster,
  getTeamAnnouncements,
  createAnnouncement,
  checkSlugAvailability,
  leaveTeam,
  deleteTeam,
  updateTeam,
  getTeamMembers,
  joinTeamByCode,
  searchTeams,
  regenerateInviteCode,
  updateMemberRole,
  removeMember,
} from '../services/teamService.js';
import {
  generateInviteCode,
  listInviteCodes,
  revokeInviteCode,
  joinByInviteCode,
} from '../services/inviteCodeService.js';
import { getActivityFeed } from '../services/teamActivityService.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
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
 * GET /api/v1/teams/invite-codes/validate/:code
 * Validate an invite code without joining (no auth required).
 * Returns team name, role, and code validity for the invite preview page.
 */
router.get(
  '/invite-codes/validate/:code',
  [param('code').trim().isLength({ min: 1 })],
  validateRequest,
  async (req, res) => {
    try {
      const { prisma } = await import('../db/connection.js');
      const inviteCode = await prisma.teamInviteCode.findUnique({
        where: { code: req.params.code },
        include: {
          team: { select: { name: true } },
        },
      });

      if (!inviteCode) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Invalid invite code' },
        });
      }

      if (inviteCode.revokedAt) {
        return res.status(410).json({
          success: false,
          error: { code: 'REVOKED', message: 'Invite code has been revoked' },
        });
      }

      if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
        return res.status(410).json({
          success: false,
          error: { code: 'EXPIRED', message: 'Invite code has expired' },
        });
      }

      if (inviteCode.maxUses && inviteCode.usesCount >= inviteCode.maxUses) {
        return res.status(410).json({
          success: false,
          error: { code: 'MAX_USES', message: 'Invite code has reached maximum uses' },
        });
      }

      res.json({
        success: true,
        data: {
          teamName: inviteCode.team.name,
          role: inviteCode.role,
          code: req.params.code,
        },
      });
    } catch (error) {
      logger.error('Validate invite code error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to validate invite code' },
      });
    }
  }
);

/**
 * POST /api/v1/teams
 * Create a new team
 */
router.post(
  '/',
  authenticateToken,
  [
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('isPublic').optional().isBoolean(),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('sport').optional().trim().isLength({ max: 100 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { name, isPublic, description, sport } = req.body;
      const team = await createTeam({ name, userId: req.user.id, isPublic, description, sport });

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
 * GET /api/v1/teams/by-identifier/:identifier
 * Resolve team by slug or generatedId
 */
router.get(
  '/by-identifier/:identifier',
  authenticateToken,
  [param('identifier').trim().isLength({ min: 1, max: 100 })],
  validateRequest,
  async (req, res) => {
    try {
      const team = await getTeamByIdentifier(req.params.identifier, req.user.id);
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
      logger.error('Get team by identifier error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to resolve team' },
      });
    }
  }
);

/**
 * POST /api/v1/teams/join/:code
 * Join team via invite code (new ABC-1234 format or legacy hex format)
 */
router.post(
  '/join/:code',
  authenticateToken,
  [param('code').trim().isLength({ min: 1 })],
  validateRequest,
  async (req, res) => {
    try {
      const code = req.params.code;

      // Try new invite code system first (ABC-1234 format)
      try {
        const result = await joinByInviteCode(code, req.user.id);
        return res.json({
          success: true,
          data: result,
        });
      } catch (newCodeError) {
        // If the new system says "Invalid invite code", try legacy format as fallback
        if (newCodeError.message === 'Invalid invite code') {
          const team = await joinTeamByCode(code, req.user.id);
          return res.json({
            success: true,
            data: { team },
          });
        }
        // Re-throw other errors (expired, revoked, already member, etc.)
        throw newCodeError;
      }
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
      if (
        error.message === 'Invite code has been revoked' ||
        error.message === 'Invite code has expired' ||
        error.message === 'Invite code has reached maximum uses'
      ) {
        return res.status(410).json({
          success: false,
          error: { code: 'CODE_INVALID', message: error.message },
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
 * Update team settings (OWNER or COACH)
 */
router.patch(
  '/:id',
  authenticateToken,
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('isPublic').optional().isBoolean(),
    body('visibilitySetting').optional().isIn(['open', 'coaches_only', 'opt_in']),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('sport').optional().trim().isLength({ max: 100 }),
    body('slug').optional().trim().isLength({ min: 3, max: 50 }),
    body('welcomeMessage').optional().trim().isLength({ max: 2000 }),
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
      if (
        error.message === 'Only team owner or coach can update settings' ||
        error.message === 'Slug is already taken'
      ) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
      }
      if (error.message.includes('Invalid slug format')) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_FAILED', message: error.message },
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
 * DELETE /api/v1/teams/:id
 * Delete team (OWNER only)
 */
router.delete(
  '/:id',
  authenticateToken,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      await deleteTeam(req.params.id, req.user.id);
      res.json({
        success: true,
        data: { message: 'Team deleted' },
      });
    } catch (error) {
      if (error.message === 'Only team owner can delete the team') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
      }
      logger.error('Delete team error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to delete team' },
      });
    }
  }
);

/**
 * DELETE /api/v1/teams/:id/leave
 * Leave a team (self-remove)
 */
router.delete(
  '/:id/leave',
  authenticateToken,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      await leaveTeam(req.params.id, req.user.id);
      res.json({
        success: true,
        data: { message: 'Left team successfully' },
      });
    } catch (error) {
      if (error.message === 'Not a member of this team') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      if (error.message.includes('Cannot leave team as the only owner')) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
      }
      logger.error('Leave team error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to leave team' },
      });
    }
  }
);

/**
 * GET /api/v1/teams/:id/overview
 * Get team overview stats
 */
router.get(
  '/:id/overview',
  authenticateToken,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      // Verify membership first
      await getTeam(req.params.id, req.user.id);
      const overview = await getTeamOverview(req.params.id);
      res.json({
        success: true,
        data: { overview },
      });
    } catch (error) {
      if (error.message === 'Not a member of this team') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
      }
      logger.error('Get team overview error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get team overview' },
      });
    }
  }
);

/**
 * GET /api/v1/teams/:id/activity
 * Get paginated team activity feed
 */
router.get(
  '/:id/activity',
  authenticateToken,
  [
    param('id').isUUID(),
    query('cursor').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      // Verify membership
      await getTeam(req.params.id, req.user.id);
      const feed = await getActivityFeed(req.params.id, {
        cursor: req.query.cursor,
        limit: req.query.limit,
      });
      res.json({
        success: true,
        data: feed,
      });
    } catch (error) {
      if (error.message === 'Not a member of this team') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
      }
      logger.error('Get activity feed error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get activity feed' },
      });
    }
  }
);

/**
 * GET /api/v1/teams/:id/announcements
 * Get team announcements
 */
router.get(
  '/:id/announcements',
  authenticateToken,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      // Verify membership
      await getTeam(req.params.id, req.user.id);
      const announcements = await getTeamAnnouncements(req.params.id);
      res.json({
        success: true,
        data: { announcements },
      });
    } catch (error) {
      if (error.message === 'Not a member of this team') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
      }
      logger.error('Get announcements error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get announcements' },
      });
    }
  }
);

/**
 * POST /api/v1/teams/:id/announcements
 * Create a new announcement (OWNER or COACH only)
 */
router.post(
  '/:id/announcements',
  authenticateToken,
  [
    param('id').isUUID(),
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('content').trim().isLength({ min: 1, max: 5000 }),
    body('isPinned').optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      // Verify OWNER or COACH role
      const team = await getTeam(req.params.id, req.user.id);
      if (!['OWNER', 'ADMIN', 'COACH'].includes(team.role)) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
        });
      }

      const announcement = await createAnnouncement({
        teamId: req.params.id,
        userId: req.user.id,
        title: req.body.title,
        content: req.body.content,
        isPinned: req.body.isPinned,
      });

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
 * GET /api/v1/teams/:id/roster
 * Get team roster with member cards
 */
router.get(
  '/:id/roster',
  authenticateToken,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      // Verify membership
      await getTeam(req.params.id, req.user.id);
      const roster = await getTeamRoster(req.params.id);
      res.json({
        success: true,
        data: { roster },
      });
    } catch (error) {
      if (error.message === 'Not a member of this team') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
      }
      logger.error('Get roster error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get roster' },
      });
    }
  }
);

/**
 * GET /api/v1/teams/:id/slug-check/:slug
 * Check slug availability (OWNER only)
 */
router.get(
  '/:id/slug-check/:slug',
  authenticateToken,
  [param('id').isUUID(), param('slug').trim().isLength({ min: 3, max: 50 })],
  validateRequest,
  async (req, res) => {
    try {
      // Verify OWNER role
      const team = await getTeam(req.params.id, req.user.id);
      if (team.role !== 'OWNER') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only team owner can check slug availability' },
        });
      }

      const result = await checkSlugAvailability(req.params.slug, req.params.id);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message.includes('Invalid slug format')) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_FAILED', message: error.message },
        });
      }
      logger.error('Slug check error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to check slug availability' },
      });
    }
  }
);

/**
 * POST /api/v1/teams/:id/invite-codes
 * Generate a new invite code (OWNER or COACH)
 */
router.post(
  '/:id/invite-codes',
  authenticateToken,
  [
    param('id').isUUID(),
    body('role').isIn(['ADMIN', 'COACH', 'ATHLETE']),
    body('expiry').optional().isIn(['24h', '7d', '30d', 'never']),
    body('maxUses').optional({ nullable: true }).isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      // Verify OWNER or COACH role
      const team = await getTeam(req.params.id, req.user.id);
      if (!['OWNER', 'ADMIN', 'COACH'].includes(team.role)) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
        });
      }

      const inviteCode = await generateInviteCode({
        teamId: req.params.id,
        role: req.body.role,
        expiry: req.body.expiry || 'never',
        maxUses: req.body.maxUses,
        createdBy: req.user.id,
      });

      res.status(201).json({
        success: true,
        data: { inviteCode },
      });
    } catch (error) {
      logger.error('Generate invite code error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to generate invite code' },
      });
    }
  }
);

/**
 * GET /api/v1/teams/:id/invite-codes
 * List active invite codes (OWNER or COACH)
 */
router.get(
  '/:id/invite-codes',
  authenticateToken,
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      // Verify OWNER or COACH role
      const team = await getTeam(req.params.id, req.user.id);
      if (!['OWNER', 'ADMIN', 'COACH'].includes(team.role)) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
        });
      }

      const codes = await listInviteCodes(req.params.id);
      res.json({
        success: true,
        data: { inviteCodes: codes },
      });
    } catch (error) {
      logger.error('List invite codes error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to list invite codes' },
      });
    }
  }
);

/**
 * DELETE /api/v1/teams/:id/invite-codes/:codeId
 * Revoke an invite code (OWNER or COACH)
 */
router.delete(
  '/:id/invite-codes/:codeId',
  authenticateToken,
  [param('id').isUUID(), param('codeId').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      // Verify OWNER or COACH role
      const team = await getTeam(req.params.id, req.user.id);
      if (!['OWNER', 'ADMIN', 'COACH'].includes(team.role)) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
        });
      }

      await revokeInviteCode(req.params.codeId, req.params.id);
      res.json({
        success: true,
        data: { message: 'Invite code revoked' },
      });
    } catch (error) {
      if (error.message === 'Invite code not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      if (error.message === 'Invite code already revoked') {
        return res.status(409).json({
          success: false,
          error: { code: 'ALREADY_REVOKED', message: error.message },
        });
      }
      logger.error('Revoke invite code error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to revoke invite code' },
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
    body('role').isIn(['OWNER', 'ADMIN', 'COACH', 'COXSWAIN', 'ATHLETE']),
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
      if (
        error.message.includes('Only team owner') ||
        error.message.includes('Cannot change') ||
        error.message.includes('Insufficient permissions')
      ) {
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
 * Regenerate legacy invite code
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

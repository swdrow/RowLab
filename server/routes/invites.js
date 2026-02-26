import express from 'express';
import logger from '../utils/logger.js';
import { body, param, validationResult } from 'express-validator';
import {
  createInvitation,
  getTeamInvitations,
  validateInvitation,
  claimInvitation,
  revokeInvitation,
  resendInvitation,
} from '../services/inviteService.js';
import { authenticateToken, requireRole, teamIsolation } from '../middleware/auth.js';

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
 * POST /api/v1/invites
 * Create a new invitation (requires auth and team context)
 */
router.post(
  '/',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    body('athleteId').isUUID(),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { athleteId, email } = req.body;
      const invitation = await createInvitation(
        req.user.activeTeamId,
        athleteId,
        email,
        req.user.id
      );

      res.status(201).json({
        success: true,
        data: { invitation },
      });
    } catch (error) {
      if (error.message === 'Athlete not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      if (error.message.includes('already')) {
        return res.status(409).json({
          success: false,
          error: { code: 'CONFLICT', message: error.message },
        });
      }
      logger.error('Create invitation error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to create invitation' },
      });
    }
  }
);

/**
 * GET /api/v1/invites
 * Get all pending invitations for the team
 */
router.get(
  '/',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  async (req, res) => {
    try {
      const invitations = await getTeamInvitations(req.user.activeTeamId);

      res.json({
        success: true,
        data: { invitations },
      });
    } catch (error) {
      logger.error('Get invitations error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get invitations' },
      });
    }
  }
);

/**
 * GET /api/v1/invites/validate/:token
 * Validate invitation token (public - no auth required)
 */
router.get(
  '/validate/:token',
  [param('token').isLength({ min: 64, max: 64 })],
  validateRequest,
  async (req, res) => {
    try {
      const result = await validateInvitation(req.params.token);

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INVITATION', message: result.error },
        });
      }

      res.json({
        success: true,
        data: { invitation: result.invitation },
      });
    } catch (error) {
      logger.error('Validate invitation error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to validate invitation' },
      });
    }
  }
);

/**
 * POST /api/v1/invites/claim/:token
 * Claim invitation (requires auth)
 */
router.post(
  '/claim/:token',
  authenticateToken,
  [param('token').isLength({ min: 64, max: 64 })],
  validateRequest,
  async (req, res) => {
    try {
      const result = await claimInvitation(req.params.token, req.user.id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INVITATION', message: error.message },
        });
      }
      logger.error('Claim invitation error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to claim invitation' },
      });
    }
  }
);

/**
 * DELETE /api/v1/invites/:id
 * Revoke an invitation
 */
router.delete(
  '/:id',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      await revokeInvitation(req.params.id, req.user.activeTeamId);

      res.json({
        success: true,
        data: { message: 'Invitation revoked' },
      });
    } catch (error) {
      if (error.message === 'Invitation not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      if (error.message.includes('only revoke')) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
        });
      }
      logger.error('Revoke invitation error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to revoke invitation' },
      });
    }
  }
);

/**
 * POST /api/v1/invites/:id/resend
 * Resend invitation with new token
 */
router.post(
  '/:id/resend',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [param('id').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const invitation = await resendInvitation(req.params.id, req.user.activeTeamId);

      res.json({
        success: true,
        data: { invitation },
      });
    } catch (error) {
      if (error.message === 'Invitation not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Resend invitation error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to resend invitation' },
      });
    }
  }
);

export default router;

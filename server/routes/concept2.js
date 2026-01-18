import express from 'express';
import { param, validationResult } from 'express-validator';
import {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  storeTokens,
  getC2UserProfile,
  syncAthleteWorkouts,
  disconnectC2,
  getC2Status,
  parseState,
} from '../services/concept2Service.js';
import { authenticateToken, requireRole, teamIsolation } from '../middleware/auth.js';

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
 * GET /api/v1/concept2/auth-url/:athleteId
 * Get OAuth authorization URL for an athlete
 */
router.get(
  '/auth-url/:athleteId',
  authenticateToken,
  teamIsolation,
  [param('athleteId').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const redirectUri = process.env.CONCEPT2_REDIRECT_URI ||
        `${req.protocol}://${req.get('host')}/api/v1/concept2/callback`;

      const url = getAuthorizationUrl(req.params.athleteId, redirectUri);

      res.json({
        success: true,
        data: { url },
      });
    } catch (error) {
      console.error('Get auth URL error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to generate auth URL' },
      });
    }
  }
);

/**
 * GET /api/v1/concept2/callback
 * OAuth callback handler (no auth required - called by Concept2)
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      // Redirect to frontend with error
      return res.redirect(`/settings/integrations?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return res.redirect('/settings/integrations?error=missing_params');
    }

    // Parse state to get athleteId
    const { athleteId } = parseState(state);

    const redirectUri = process.env.CONCEPT2_REDIRECT_URI ||
      `${req.protocol}://${req.get('host')}/api/v1/concept2/callback`;

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Get C2 user profile
    const profile = await getC2UserProfile(tokens.accessToken);

    // Store tokens
    await storeTokens(athleteId, String(profile.id), tokens);

    // Redirect to frontend with success
    res.redirect(`/settings/integrations?c2_connected=true`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`/settings/integrations?error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * GET /api/v1/concept2/status/:athleteId
 * Get connection status for an athlete
 */
router.get(
  '/status/:athleteId',
  authenticateToken,
  teamIsolation,
  [param('athleteId').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const status = await getC2Status(req.params.athleteId);
      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      console.error('Get status error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get status' },
      });
    }
  }
);

/**
 * POST /api/v1/concept2/sync/:athleteId
 * Sync workouts for an athlete
 */
router.post(
  '/sync/:athleteId',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [param('athleteId').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const result = await syncAthleteWorkouts(
        req.params.athleteId,
        req.user.activeTeamId
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message === 'No Concept2 connection') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_CONNECTED', message: error.message },
        });
      }
      console.error('Sync error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to sync workouts' },
      });
    }
  }
);

/**
 * DELETE /api/v1/concept2/disconnect/:athleteId
 * Disconnect Concept2 account
 */
router.delete(
  '/disconnect/:athleteId',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [param('athleteId').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      await disconnectC2(req.params.athleteId, req.user.activeTeamId);
      res.json({
        success: true,
        data: { message: 'Concept2 disconnected' },
      });
    } catch (error) {
      if (error.message === 'No Concept2 connection') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_CONNECTED', message: error.message },
        });
      }
      console.error('Disconnect error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to disconnect' },
      });
    }
  }
);

export default router;

/**
 * Strava Integration Routes
 *
 * Handles OAuth flow, connection management, and activity syncing.
 * Following the same patterns as concept2.js
 */

import { Router } from 'express';
import { authenticateToken as authenticate, optionalAuth } from '../middleware/auth.js';
import stravaService from '../services/stravaService.js';

const router = Router();

// ============================================
// OAuth Flow
// ============================================

/**
 * GET /api/v1/strava/auth-url
 * Get OAuth authorization URL for current user
 */
router.get('/auth-url', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const authUrl = stravaService.generateAuthUrl(userId);

    res.json({
      success: true,
      data: { authUrl },
    });
  } catch (error) {
    console.error('Failed to generate Strava auth URL:', error);
    res.status(500).json({
      success: false,
      error: { code: 'AUTH_URL_FAILED', message: error.message },
    });
  }
});

/**
 * GET /api/v1/strava/callback
 * OAuth callback handler
 */
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  // Handle OAuth errors
  if (error) {
    console.error('Strava OAuth error:', error);
    return res.redirect(`${process.env.APP_URL || 'http://localhost:5173'}/app/settings?tab=integrations&strava=error&message=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return res.redirect(`${process.env.APP_URL || 'http://localhost:5173'}/app/settings?tab=integrations&strava=error&message=missing_params`);
  }

  try {
    // Decode state to get user ID
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { userId } = stateData;

    if (!userId) {
      throw new Error('Invalid state parameter');
    }

    // Exchange code for tokens
    const tokens = await stravaService.exchangeCodeForTokens(code);

    // Store tokens
    await stravaService.storeTokens(userId, tokens);

    // Redirect to success
    res.redirect(`${process.env.APP_URL || 'http://localhost:5173'}/app/settings?tab=integrations&strava=success`);
  } catch (error) {
    console.error('Strava callback error:', error);
    res.redirect(`${process.env.APP_URL || 'http://localhost:5173'}/app/settings?tab=integrations&strava=error&message=${encodeURIComponent(error.message)}`);
  }
});

// ============================================
// Connection Status
// ============================================

/**
 * GET /api/v1/strava/status/me
 * Get connection status for current user
 */
router.get('/status/me', authenticate, async (req, res) => {
  try {
    const status = await stravaService.getStatus(req.user.id);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Failed to get Strava status:', error);
    res.status(500).json({
      success: false,
      error: { code: 'STATUS_FAILED', message: error.message },
    });
  }
});

// ============================================
// Sync Operations
// ============================================

/**
 * POST /api/v1/strava/sync/me
 * Trigger manual sync for current user
 */
router.post('/sync/me', authenticate, async (req, res) => {
  try {
    const { after } = req.body;

    const result = await stravaService.syncActivities(req.user.id, {
      after: after ? new Date(after) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Strava sync failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SYNC_FAILED', message: error.message },
    });
  }
});

/**
 * GET /api/v1/strava/activities
 * Fetch activities from Strava (without syncing to workouts)
 */
router.get('/activities', authenticate, async (req, res) => {
  try {
    const { page = 1, perPage = 30, after, before } = req.query;

    const activities = await stravaService.fetchActivities(req.user.id, {
      page: parseInt(page, 10),
      perPage: parseInt(perPage, 10),
      after: after ? new Date(after) : undefined,
      before: before ? new Date(before) : undefined,
    });

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error('Failed to fetch Strava activities:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: error.message },
    });
  }
});

// ============================================
// C2 to Strava Sync
// ============================================

/**
 * GET /api/v1/strava/c2-sync/config
 * Get C2 to Strava sync configuration
 */
router.get('/c2-sync/config', authenticate, async (req, res) => {
  try {
    const config = await stravaService.getC2SyncConfig(req.user.id);

    res.json({
      success: true,
      data: {
        ...config,
        availableTypes: stravaService.C2_WORKOUT_TYPES,
      },
    });
  } catch (error) {
    console.error('Failed to get C2 sync config:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CONFIG_FAILED', message: error.message },
    });
  }
});

/**
 * PATCH /api/v1/strava/c2-sync/config
 * Update C2 to Strava sync configuration
 */
router.patch('/c2-sync/config', authenticate, async (req, res) => {
  try {
    const { enabled, types } = req.body;

    const config = await stravaService.updateC2SyncConfig(req.user.id, {
      enabled,
      types,
    });

    res.json({
      success: true,
      data: {
        ...config,
        availableTypes: stravaService.C2_WORKOUT_TYPES,
      },
    });
  } catch (error) {
    console.error('Failed to update C2 sync config:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_FAILED', message: error.message },
    });
  }
});

/**
 * POST /api/v1/strava/c2-sync/trigger
 * Manually trigger C2 to Strava sync
 */
router.post('/c2-sync/trigger', authenticate, async (req, res) => {
  try {
    const { after } = req.body;

    const result = await stravaService.syncC2ToStrava(req.user.id, {
      after: after ? new Date(after) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('C2 to Strava sync failed:', error);
    res.status(400).json({
      success: false,
      error: { code: 'SYNC_FAILED', message: error.message },
    });
  }
});

// ============================================
// Disconnect
// ============================================

/**
 * DELETE /api/v1/strava/disconnect/me
 * Disconnect Strava for current user
 */
router.delete('/disconnect/me', authenticate, async (req, res) => {
  try {
    const result = await stravaService.disconnect(req.user.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Strava disconnect failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DISCONNECT_FAILED', message: error.message },
    });
  }
});

export default router;

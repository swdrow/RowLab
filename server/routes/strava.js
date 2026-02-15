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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
 * OAuth callback handler (no auth required - called by Strava)
 * Returns HTML that sends postMessage to opener window for popup flow
 */
router.get('/callback', async (req, res) => {
  // Helper to send response HTML that communicates with opener
  const sendPopupResponse = (success, data = {}) => {
    const message = success
      ? { type: 'strava_oauth_success', ...data }
      : { type: 'strava_oauth_error', error: data.error || 'Unknown error' };

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Strava Connection</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #0a0a0f;
              color: #ffffff;
            }
            .container {
              text-align: center;
              padding: 40px;
            }
            .icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
            h1 { font-size: 24px; margin-bottom: 10px; }
            p { color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">${success ? '✓' : '✗'}</div>
            <h1>${success ? 'Connected!' : 'Connection Failed'}</h1>
            <p>${success ? 'You can close this window.' : escapeHtml(data.error) || 'Please try again.'}</p>
          </div>
          <script>
            // Send message to opener window
            // Message is base64 encoded to prevent XSS
            if (window.opener) {
              try {
                const encoded = '${Buffer.from(JSON.stringify(message)).toString('base64')}';
                const message = JSON.parse(atob(encoded));
                window.opener.postMessage(message, window.location.origin);
              } catch (e) {
                console.error('Failed to send OAuth message:', e);
              }
              // Auto-close after a short delay
              setTimeout(() => window.close(), 1500);
            } else {
              // If no opener (direct navigation), redirect
              setTimeout(() => {
                window.location.href = '/app/settings?tab=integrations${success ? '&strava_connected=true' : ''}';
              }, 2000);
            }
          </script>
        </body>
      </html>
    `);
  };

  try {
    const { code, state, error } = req.query;

    if (error) {
      return sendPopupResponse(false, { error });
    }

    if (!code || !state) {
      return sendPopupResponse(false, { error: 'Missing required parameters' });
    }

    // Decode state to get user ID
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { userId } = stateData;

    if (!userId) {
      return sendPopupResponse(false, { error: 'Invalid state parameter' });
    }

    // Exchange code for tokens
    const tokens = await stravaService.exchangeCodeForTokens(code);

    // Store tokens
    await stravaService.storeTokens(userId, tokens);

    // Send success response
    sendPopupResponse(true, { username: tokens.athlete?.username });
  } catch (error) {
    console.error('Strava callback error:', error);
    sendPopupResponse(false, { error: error.message });
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

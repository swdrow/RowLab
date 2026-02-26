/**
 * Strava Integration Routes
 *
 * Handles OAuth flow, connection management, and activity syncing.
 * Following the same patterns as concept2.js
 */

import express from 'express';
import { Router } from 'express';
import { authenticateToken as authenticate, optionalAuth } from '../middleware/auth.js';
import stravaService from '../services/stravaService.js';
import { verifyOAuthState } from '../utils/oauthState.js';
import { verifyHmacSignature } from '../utils/encryption.js';
import { prisma } from '../db/connection.js';

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
          <script nonce="${res.locals.cspNonce}">
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

    // Verify HMAC-signed state to prevent CSRF via forged state parameters
    let stateData;
    try {
      stateData = verifyOAuthState(state);
    } catch (err) {
      console.warn('Strava OAuth: state verification failed:', err.message);
      return res.status(403).json({
        success: false,
        error: { code: 'INVALID_STATE', message: 'OAuth state verification failed' },
      });
    }
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
// Webhooks (no auth - called by Strava directly)
// ============================================

/**
 * GET /api/v1/strava/webhook
 * Subscription validation handler - Strava sends this to verify the endpoint
 * before creating a webhook subscription.
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.STRAVA_VERIFY_TOKEN) {
    console.log('Strava webhook validation successful');
    res.json({ 'hub.challenge': challenge });
  } else {
    console.warn('Strava webhook validation failed', { mode, hasToken: !!token });
    res.status(403).end();
  }
});

/**
 * POST /api/v1/strava/webhook
 * Event receiver - Strava sends activity create/update/delete events here.
 *
 * Security: Validates HMAC signature via STRAVA_WEBHOOK_SECRET before processing.
 * Uses express.raw() for raw body access needed by signature verification.
 * Always responds 200 after verification passes (Strava retries on non-200).
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // Verify webhook signature if secret is configured
  const webhookSecret = process.env.STRAVA_WEBHOOK_SECRET;

  if (webhookSecret) {
    const signature = req.headers['x-hub-signature'];
    if (!signature) {
      console.warn('Strava webhook: missing X-Hub-Signature header');
      return res.status(401).json({
        success: false,
        error: { code: 'MISSING_SIGNATURE', message: 'Webhook signature required' },
      });
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body);
    if (!verifyHmacSignature(rawBody, signature, webhookSecret)) {
      console.warn('Strava webhook: signature verification failed');
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_SIGNATURE', message: 'Webhook signature verification failed' },
      });
    }
  } else {
    // No secret configured -- log warning but allow processing
    // TODO(phase-54): Configure STRAVA_WEBHOOK_SECRET in production for webhook verification
    console.warn(
      'Strava webhook: STRAVA_WEBHOOK_SECRET not configured, skipping signature verification'
    );
  }

  // Parse body if it was raw
  const payload = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body;

  // Acknowledge receipt immediately after verification
  res.status(200).json({ received: true });

  const { object_type, object_id, aspect_type, owner_id } = payload;

  // Only process activity events
  if (object_type !== 'activity') {
    return;
  }

  try {
    // Look up user by Strava athlete ID
    const auth = await prisma.stravaAuth.findFirst({
      where: { stravaAthleteId: BigInt(owner_id) },
    });

    if (!auth) {
      console.warn(`Strava webhook: no user found for athlete ${owner_id}`);
      return;
    }

    if (!auth.syncEnabled) {
      console.log(`Strava webhook: sync disabled for user ${auth.userId}, skipping`);
      return;
    }

    if (aspect_type === 'create' || aspect_type === 'update') {
      console.log(`Strava webhook: ${aspect_type} activity ${object_id} for user ${auth.userId}`);
      const result = await stravaService.syncSingleActivity(auth.userId, object_id);
      console.log(`Strava webhook sync result:`, result);
    } else if (aspect_type === 'delete') {
      console.log(`Strava webhook: delete activity ${object_id} for user ${auth.userId}`);
      await prisma.workout.deleteMany({
        where: {
          userId: auth.userId,
          stravaActivityId: String(object_id),
        },
      });
      console.log(`Strava webhook: deleted workout for activity ${object_id}`);
    }
  } catch (error) {
    // Never throw - we already responded 200
    console.error('Strava webhook processing error:', error);
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

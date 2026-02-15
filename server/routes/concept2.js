import express from 'express';
import { param, validationResult } from 'express-validator';
import { verifyHmacSignature } from '../utils/encryption.js';
import logger from '../utils/logger.js';
import {
  getAuthorizationUrl,
  generateAuthUrl,
  exchangeCodeForTokens,
  storeTokens,
  fetchUserProfile,
  getC2UserProfile,
  syncAthleteWorkouts,
  disconnectC2,
  getC2Status,
  getMyC2Status,
  disconnectMyC2,
  parseState,
  handleWebhook,
  connectAthlete,
} from '../services/concept2Service.js';
import {
  syncUserWorkouts,
  browseC2Logbook,
  historicalImport,
  syncCoachWorkouts,
  getUnmatchedWorkouts,
  assignWorkoutToAthlete,
} from '../services/c2SyncService.js';
import { authenticateToken, requireRole, teamIsolation } from '../middleware/auth.js';

const router = express.Router();

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
      const redirectUri =
        process.env.CONCEPT2_REDIRECT_URI ||
        `${req.protocol}://${req.get('host')}/api/v1/concept2/callback`;

      const url = getAuthorizationUrl(req.params.athleteId, redirectUri);

      res.json({
        success: true,
        data: { url },
      });
    } catch (error) {
      logger.error('Get auth URL error:', { error: error.message, stack: error.stack });
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
 * Returns HTML that sends postMessage to opener window for popup flow
 */
router.get('/callback', async (req, res) => {
  // Helper to send response HTML that communicates with opener
  const sendPopupResponse = (success, data = {}) => {
    const message = success
      ? { type: 'c2_oauth_success', ...data }
      : { type: 'c2_oauth_error', error: data.error || 'Unknown error' };

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Concept2 Connection</title>
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
                window.location.href = '/app/settings?tab=integrations${success ? '&c2_connected=true' : ''}';
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

    // Parse state to get userId
    const { userId } = parseState(state);

    if (!userId) {
      return sendPopupResponse(false, { error: 'Invalid state parameter' });
    }

    const redirectUri =
      process.env.CONCEPT2_REDIRECT_URI ||
      `${req.protocol}://${req.get('host')}/api/v1/concept2/callback`;

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Get C2 user profile
    const profile = await getC2UserProfile(tokens.accessToken);

    // Store tokens linked to user
    await storeTokens(userId, String(profile.id), tokens, profile.username);

    // Send success response
    sendPopupResponse(true, { username: profile.username });
  } catch (error) {
    logger.error('OAuth callback error:', { error: error.message, stack: error.stack });
    sendPopupResponse(false, { error: error.message });
  }
});

/**
 * GET /api/v1/concept2/status/me
 * Get current user's Concept2 connection status
 * Used by Settings page to check/display connection status
 * NOTE: Must be declared BEFORE /status/:athleteId to avoid route collision
 */
router.get('/status/me', authenticateToken, async (req, res) => {
  try {
    const status = await getMyC2Status(req.user.id);
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('Get my C2 status error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to get status' },
    });
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
      logger.error('Get status error:', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get status' },
      });
    }
  }
);

/**
 * POST /api/v1/concept2/sync/me
 * Sync current user's Concept2 workouts
 * Athletes can sync their own data
 * NOTE: Must be declared BEFORE /sync/:athleteId to avoid route collision
 */
router.post('/sync/me', authenticateToken, teamIsolation, async (req, res) => {
  try {
    const result = await syncUserWorkouts(req.user.id, req.user.activeTeamId);
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
    if (error.message === 'No athlete profile linked to this user') {
      return res.status(404).json({
        success: false,
        error: { code: 'NO_ATHLETE_PROFILE', message: error.message },
      });
    }
    logger.error('Sync my workouts error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to sync workouts' },
    });
  }
});

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
      const result = await syncAthleteWorkouts(req.params.athleteId, req.user.activeTeamId);
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
      logger.error('Sync error:', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to sync workouts' },
      });
    }
  }
);

/**
 * DELETE /api/v1/concept2/disconnect/me
 * Disconnect current user's Concept2 account
 * NOTE: Must be declared BEFORE /disconnect/:athleteId to avoid route collision
 */
router.delete('/disconnect/me', authenticateToken, async (req, res) => {
  try {
    await disconnectMyC2(req.user.id);
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
    logger.error('Disconnect my C2 error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to disconnect' },
    });
  }
});

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
      logger.error('Disconnect error:', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to disconnect' },
      });
    }
  }
);

/**
 * POST /api/v1/concept2/webhook
 * Webhook receiver for Concept2 events (no auth - verified by signature)
 *
 * Security: Validates HMAC signature from Concept2 before processing
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Get signature from header (Concept2 uses X-Signature or similar)
    const signature = req.headers['x-concept2-signature'] || req.headers['x-signature'];
    const webhookSecret = process.env.CONCEPT2_WEBHOOK_SECRET;

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      if (!signature) {
        logger.warn('Webhook missing signature header');
        return res.status(401).json({ error: 'Missing signature' });
      }

      // Get raw body for signature verification
      const rawBody = Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body);

      if (!verifyHmacSignature(rawBody, signature, webhookSecret)) {
        logger.warn('Webhook signature verification failed');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    } else {
      logger.warn('CONCEPT2_WEBHOOK_SECRET not configured - skipping signature verification');
    }

    // Parse body if it was raw
    const payload = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body;

    // Check for replay attacks using timestamp (if provided by Concept2)
    const timestamp = req.headers['x-timestamp'] || payload.timestamp;
    if (timestamp) {
      const eventTime = new Date(timestamp).getTime();
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (Math.abs(now - eventTime) > fiveMinutes) {
        logger.error('Webhook timestamp too old/future', { timestamp });
        return res.status(401).json({ error: 'Request expired' });
      }
    }

    logger.info('Concept2 webhook received', { type: payload.type, verified: true });

    const result = await handleWebhook(payload);

    if (result.success) {
      res.status(200).json({ received: true });
    } else {
      logger.error('Webhook processing failed', { error: result.error });
      res.status(200).json({ received: true, warning: result.error });
    }
  } catch (error) {
    logger.error('Webhook handler error:', { error: error.message, stack: error.stack });
    // Always return 200 to prevent retries for processing errors
    // (signature errors return 401 above)
    res.status(200).json({ received: true, error: error.message });
  }
});

/**
 * POST /api/v1/concept2/connect
 * Start OAuth flow - returns authorization URL
 * Connects the current user's Concept2 account (coaches and athletes can both connect)
 */
router.post('/connect', authenticateToken, teamIsolation, async (req, res) => {
  try {
    const userId = req.user.id;

    // Generate state with user ID and timestamp
    const state = Buffer.from(
      JSON.stringify({
        userId,
        nonce: Date.now().toString(36),
      })
    ).toString('base64url');

    const url = generateAuthUrl(state);

    res.json({
      success: true,
      data: { url, state },
    });
  } catch (error) {
    logger.error('Connect error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to initiate connection' },
    });
  }
});

/**
 * GET /api/v1/concept2/logbook/browse
 * Browse C2 logbook for historical import
 * Returns paginated list of workouts with import status
 */
router.get('/logbook/browse', authenticateToken, async (req, res) => {
  try {
    const { page = '1', perPage = '50', fromDate, toDate } = req.query;

    // Validate perPage max
    const perPageNum = Math.min(parseInt(perPage, 10), 100);

    const result = await browseC2Logbook(req.user.id, {
      page: parseInt(page, 10),
      perPage: perPageNum,
      fromDate,
      toDate,
    });

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
    logger.error('Browse C2 logbook error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to browse logbook' },
    });
  }
});

/**
 * POST /api/v1/concept2/historical-import
 * Import historical workouts by date range or specific workout IDs
 */
router.post('/historical-import', authenticateToken, teamIsolation, async (req, res) => {
  try {
    const { fromDate, toDate, resultIds } = req.body;

    // Validate: at least one of (fromDate+toDate) or resultIds must be provided
    if (!resultIds && (!fromDate || !toDate)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Must provide either resultIds or date range (fromDate + toDate)',
        },
      });
    }

    const result = await historicalImport(req.user.id, req.user.activeTeamId, {
      fromDate,
      toDate,
      resultIds,
    });

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
    logger.error('Historical import error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to import workouts' },
    });
  }
});

/**
 * POST /api/v1/concept2/sync/coach
 * Coach sync - sync coach's C2 logbook with auto-match to roster athletes
 */
router.post(
  '/sync/coach',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  async (req, res) => {
    try {
      const result = await syncCoachWorkouts(req.user.id, req.user.activeTeamId);
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
      logger.error('Coach sync error:', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to sync coach workouts' },
      });
    }
  }
);

/**
 * GET /api/v1/concept2/unmatched/:teamId
 * Get unmatched workouts for manual assignment
 */
router.get(
  '/unmatched/:teamId',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [param('teamId').isUUID()],
  validateRequest,
  async (req, res) => {
    try {
      const workouts = await getUnmatchedWorkouts(req.params.teamId);
      res.json({
        success: true,
        data: { workouts },
      });
    } catch (error) {
      logger.error('Get unmatched workouts error:', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to get unmatched workouts' },
      });
    }
  }
);

/**
 * PUT /api/v1/concept2/assign-workout
 * Assign unmatched workout to athlete
 */
router.put(
  '/assign-workout',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  async (req, res) => {
    try {
      const { workoutId, athleteId } = req.body;

      if (!workoutId || !athleteId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'workoutId and athleteId are required',
          },
        });
      }

      const workout = await assignWorkoutToAthlete(workoutId, athleteId, req.user.activeTeamId);

      res.json({
        success: true,
        data: { workout },
      });
    } catch (error) {
      if (
        error.message === 'Workout not found in team' ||
        error.message === 'Athlete not found in team'
      ) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Assign workout error:', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to assign workout' },
      });
    }
  }
);

export default router;

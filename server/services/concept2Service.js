/**
import logger from '../utils/logger.js';
 * Concept2 Service
 *
 * Handles OAuth authentication and data sync with Concept2 Logbook API.
 * Development: https://log-dev.concept2.com
 * Production: https://log.concept2.com (requires approval)
 */

import crypto from 'crypto';
import { prisma } from '../db/connection.js';
import { bulkCreateWorkouts } from './workoutService.js';
import { encrypt, decrypt, isEncrypted } from '../utils/encryption.js';

// Configuration from environment (supports dev/prod switching)
const getConfig = () => ({
  clientId: process.env.CONCEPT2_CLIENT_ID,
  clientSecret: process.env.CONCEPT2_CLIENT_SECRET,
  redirectUri: process.env.CONCEPT2_REDIRECT_URI,
  apiUrl: process.env.CONCEPT2_API_URL || 'https://log-dev.concept2.com',
});

// OAuth Scopes (full read/write access)
const SCOPES = 'user:read,user:write,results:read,results:write';

// Legacy constants (for backward compatibility)
const C2_AUTH_URL = () => `${getConfig().apiUrl}/oauth/authorize`;
const C2_TOKEN_URL = () => `${getConfig().apiUrl}/oauth/access_token`;
const C2_API_URL = () => `${getConfig().apiUrl}/api`;

/**
 * Generate OAuth authorization URL (simple version for tests)
 * @param {string} state - CSRF protection state parameter
 * @returns {string} - Full authorization URL
 */
export function generateAuthUrl(state) {
  const config = getConfig();

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: SCOPES,
    state,
  });

  return `${config.apiUrl}/oauth/authorize?${params.toString()}`;
}

/**
 * Generate OAuth authorization URL (with athlete context)
 */
export function getAuthorizationUrl(athleteId, redirectUri) {
  const state = crypto.randomBytes(16).toString('hex');

  // Store state temporarily (in production, use Redis or DB)
  // For now, encode athleteId in state
  const stateData = Buffer.from(JSON.stringify({ athleteId, nonce: state })).toString('base64url');

  const config = getConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri || config.redirectUri,
    response_type: 'code',
    scope: SCOPES,
    state: stateData,
  });

  return `${config.apiUrl}/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code from callback
 * @param {string} [redirectUri] - Override redirect URI (optional)
 * @returns {Promise<{accessToken: string, refreshToken: string, expiresIn: number}>}
 */
export async function exchangeCodeForTokens(code, redirectUri) {
  const config = getConfig();

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: redirectUri || config.redirectUri,
  });

  const response = await fetch(`${config.apiUrl}/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Concept2 token exchange failed', {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
      requestBody: {
        grant_type: 'authorization_code',
        client_id: config.clientId ? '***set***' : '***missing***',
        client_secret: config.clientSecret ? '***set***' : '***missing***',
        redirect_uri: redirectUri || config.redirectUri,
      },
    });
    let errorData = {};
    try {
      errorData = JSON.parse(errorText);
    } catch {}
    throw new Error(
      `Failed to exchange code: ${errorData.error_description || errorData.error || response.status}`
    );
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Refresh an expired access token
 * @param {string} refreshToken - Current refresh token
 * @returns {Promise<{accessToken: string, refreshToken: string, expiresIn: number}>}
 */
export async function refreshAccessToken(refreshToken) {
  const config = getConfig();

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(`${config.apiUrl}/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to refresh token: ${error.error || response.status}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresIn: data.expires_in,
  };
}

/**
 * Store OAuth tokens for an athlete
 * Encrypts tokens at rest using AES-256-GCM
 */
export async function storeTokens(userId, c2UserId, tokens, username = null) {
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expiresIn);

  // Encrypt tokens before storage - throws error if ENCRYPTION_KEY not set
  const encryptedAccessToken = encrypt(tokens.accessToken);
  const encryptedRefreshToken = encrypt(tokens.refreshToken);

  await prisma.concept2Auth.upsert({
    where: { userId },
    update: {
      c2UserId,
      username,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiresAt: expiresAt,
    },
    create: {
      userId,
      c2UserId,
      username,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiresAt: expiresAt,
    },
  });
}

/**
 * Get valid access token (refresh if needed)
 * Handles decryption with lazy migration for plaintext tokens
 */
export async function getValidToken(userId) {
  const auth = await prisma.concept2Auth.findUnique({
    where: { userId },
  });

  if (!auth) {
    throw new Error('No Concept2 connection');
  }

  // Decrypt tokens (with lazy migration for plaintext)
  let accessToken = auth.accessToken;
  let refreshToken = auth.refreshToken;
  let needsMigration = false;

  if (isEncrypted(auth.accessToken)) {
    // Token is encrypted - decrypt it
    accessToken = decrypt(auth.accessToken);
    refreshToken = decrypt(auth.refreshToken);
  } else {
    // Token is plaintext (legacy) - flag for migration
    needsMigration = true;
    logger.info('Migrating plaintext tokens to encrypted storage', { userId });
  }

  // Check if token is expired (with 5 min buffer)
  const now = new Date();
  const expiresAt = new Date(auth.tokenExpiresAt);
  expiresAt.setMinutes(expiresAt.getMinutes() - 5);

  if (now > expiresAt) {
    // Refresh the token (storeTokens will encrypt it)
    const newTokens = await refreshAccessToken(refreshToken);
    await storeTokens(userId, auth.c2UserId, newTokens, auth.username);
    return newTokens.accessToken;
  }

  // Lazy migration: re-store with encryption if tokens were plaintext
  if (needsMigration) {
    // Calculate remaining expiry time
    const remainingSeconds = Math.floor((auth.tokenExpiresAt - now) / 1000);
    await storeTokens(
      userId,
      auth.c2UserId,
      {
        accessToken,
        refreshToken,
        expiresIn: remainingSeconds,
      },
      auth.username
    );
  }

  return accessToken;
}

/**
 * Fetch authenticated user profile
 * @param {string} accessToken - Valid access token
 * @returns {Promise<object>}
 */
export async function fetchUserProfile(accessToken) {
  const config = getConfig();

  const response = await fetch(`${config.apiUrl}/api/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.c2logbook.v1+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.status}`);
  }

  const { data } = await response.json();

  return {
    id: data.id,
    username: data.username,
    firstName: data.first_name,
    lastName: data.last_name,
    gender: data.gender,
    country: data.country,
    email: data.email,
    profileImage: data.profile_image,
  };
}

// Alias for backward compatibility
export const getC2UserProfile = fetchUserProfile;

/**
 * Fetch workout results for a user
 * @param {string} accessToken - Valid access token
 * @param {number} userId - Concept2 user ID
 * @param {object} options - Pagination options
 * @returns {Promise<{results: Array, pagination: object}>}
 */
export async function fetchResults(accessToken, userId, options = {}) {
  const config = getConfig();
  const { page = 1, perPage = 50 } = options;

  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });

  const response = await fetch(
    `${config.apiUrl}/api/users/${userId}/results?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.c2logbook.v1+json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch results: ${response.status}`);
  }

  const { data, meta } = await response.json();

  return {
    results: data || [],
    pagination: meta?.pagination || {},
  };
}

/**
 * Fetch workouts from Concept2 API
 */
export async function fetchC2Workouts(accessToken, fromDate = null) {
  const params = new URLSearchParams({
    type: 'rower',
  });

  if (fromDate) {
    params.append('from', fromDate.toISOString().split('T')[0]);
  }

  const response = await fetch(`${C2_API_URL}/users/me/results?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch C2 workouts');
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Convert C2 workout to our format
 */
export function convertC2Workout(c2Workout, athleteId) {
  return {
    athleteId,
    source: 'concept2_sync',
    c2LogbookId: String(c2Workout.id),
    date: c2Workout.date,
    distanceM: c2Workout.distance,
    durationSeconds: c2Workout.time ? c2Workout.time / 10 : null, // C2 stores in 0.1s
    strokeRate: c2Workout.stroke_rate,
    calories: c2Workout.calories_total,
    dragFactor: c2Workout.drag_factor,
    rawData: c2Workout,
  };
}

/**
 * Sync workouts for an athlete
 */
export async function syncAthleteWorkouts(athleteId, teamId) {
  const auth = await prisma.concept2Auth.findUnique({
    where: { athleteId },
    include: { athlete: true },
  });

  if (!auth) {
    throw new Error('No Concept2 connection');
  }

  // Verify athlete belongs to team
  if (auth.athlete.teamId !== teamId) {
    throw new Error('Athlete not in team');
  }

  const accessToken = await getValidToken(athleteId);

  // Fetch workouts since last sync (or last 30 days)
  const fromDate = auth.lastSyncedAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const c2Workouts = await fetchC2Workouts(accessToken, fromDate);

  // Convert and import
  const workouts = c2Workouts.map((w) => convertC2Workout(w, athleteId));
  const result = await bulkCreateWorkouts(teamId, workouts);

  // Update last synced timestamp
  await prisma.concept2Auth.update({
    where: { athleteId },
    data: { lastSyncedAt: new Date() },
  });

  return {
    ...result,
    totalFetched: c2Workouts.length,
  };
}

/**
 * Disconnect Concept2 account
 */
export async function disconnectC2(athleteId, teamId) {
  const auth = await prisma.concept2Auth.findUnique({
    where: { athleteId },
    include: { athlete: true },
  });

  if (!auth) {
    throw new Error('No Concept2 connection');
  }

  if (auth.athlete.teamId !== teamId) {
    throw new Error('Athlete not in team');
  }

  await prisma.concept2Auth.delete({
    where: { athleteId },
  });

  return { disconnected: true };
}

/**
 * Get Concept2 connection status for an athlete
 */
export async function getC2Status(athleteId) {
  const auth = await prisma.concept2Auth.findUnique({
    where: { athleteId },
  });

  if (!auth) {
    return { connected: false };
  }

  return {
    connected: true,
    c2UserId: auth.c2UserId,
    lastSyncedAt: auth.lastSyncedAt,
  };
}

/**
 * Get Concept2 connection status for current user (by userId)
 * Used by Settings page to check connection status
 */
export async function getMyC2Status(userId) {
  const auth = await prisma.concept2Auth.findUnique({
    where: { userId },
  });

  if (!auth) {
    return {
      connected: false,
      username: null,
      lastSyncedAt: null,
      syncEnabled: false,
    };
  }

  return {
    connected: true,
    username: auth.username,
    c2UserId: auth.c2UserId,
    lastSyncedAt: auth.lastSyncedAt,
    syncEnabled: auth.syncEnabled,
  };
}

/**
 * Sync workouts for the current user (athlete self-sync)
 * Different from syncAthleteWorkouts which is for coaches syncing athletes
 *
 * @deprecated Use c2SyncService.syncUserWorkouts() instead (Phase 37 - includes splits and machine type)
 */
export async function syncUserWorkouts(userId, teamId) {
  // Get user's C2 auth
  const auth = await prisma.concept2Auth.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!auth) {
    throw new Error('No Concept2 connection');
  }

  // Find athlete record for this user in the team
  let athlete = await prisma.athlete.findFirst({
    where: {
      userId,
      teamId,
    },
  });

  // Auto-create athlete profile if user doesn't have one
  // This allows coaches who are also athletes to sync their own data
  if (athlete && !athlete.concept2UserId && auth.c2UserId) {
    // Link existing athlete to C2 account
    athlete = await prisma.athlete.update({
      where: { id: athlete.id },
      data: { concept2UserId: auth.c2UserId },
    });
    logger.info('Linked C2 account to existing athlete', {
      athleteId: athlete.id,
      c2UserId: auth.c2UserId,
    });
  }

  if (!athlete) {
    logger.info('Creating athlete profile for user', { userId, teamId });

    // Parse name from user's email or use defaults
    const user = auth.user;
    const nameParts = user.email.split('@')[0].split(/[._-]/);
    const firstName = nameParts[0]
      ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1)
      : 'User';
    const lastName = nameParts[1]
      ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1)
      : user.email.split('@')[0];

    athlete = await prisma.athlete.create({
      data: {
        teamId,
        userId,
        firstName,
        lastName,
        email: user.email,
        isManaged: false, // User-linked, not coach-managed
        concept2UserId: auth.c2UserId,
      },
    });

    logger.info('Created athlete profile', { athleteId: athlete.id, userId });
  }

  // Get valid access token
  const accessToken = await getValidToken(userId);

  // Fetch workouts since last sync (or last 30 days)
  const fromDate = auth.lastSyncedAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Fetch C2 user profile to get user ID
  const profile = await fetchUserProfile(accessToken);

  // Fetch results from C2 API
  const { results } = await fetchResults(accessToken, profile.id, { page: 1, perPage: 100 });

  // Filter results newer than fromDate
  const newResults = results.filter((r) => new Date(r.date) > fromDate);

  // Convert to erg tests
  const ergTests = [];
  for (const result of newResults) {
    // Determine test type based on distance
    let testType = 'workout';
    if (result.distance === 2000) testType = '2k';
    else if (result.distance === 6000) testType = '6k';
    else if (result.distance === 500) testType = '500m';
    else if (result.distance === 1000) testType = '1k';

    // Check if this workout already exists
    const existing = await prisma.workout.findUnique({
      where: { c2LogbookId: String(result.id) },
    });

    if (!existing) {
      // Create workout record
      await prisma.workout.create({
        data: {
          athleteId: athlete.id,
          teamId,
          source: 'concept2_sync',
          c2LogbookId: String(result.id),
          date: new Date(result.date),
          distanceM: result.distance,
          durationSeconds: result.time ? result.time / 10 : null,
          strokeRate: result.stroke_rate,
          calories: result.calories_total,
          dragFactor: result.drag_factor,
          rawData: result,
        },
      });

      // Also create erg test if it's a standard test distance
      if (['2k', '6k', '500m', '1k'].includes(testType)) {
        const timeSeconds = result.time ? result.time / 10 : 0;
        const splitSeconds =
          timeSeconds > 0 && result.distance > 0 ? timeSeconds / (result.distance / 500) : null;

        await prisma.ergTest.create({
          data: {
            athleteId: athlete.id,
            teamId,
            testType,
            testDate: new Date(result.date),
            distanceM: result.distance,
            timeSeconds,
            splitSeconds,
            watts: result.stroke_data?.avg_watts || null,
            strokeRate: result.stroke_rate,
          },
        });

        ergTests.push({
          testType,
          date: result.date,
          distance: result.distance,
        });
      }
    }
  }

  // Update last synced timestamp
  await prisma.concept2Auth.update({
    where: { userId },
    data: { lastSyncedAt: new Date() },
  });

  return {
    totalFetched: newResults.length,
    ergTestsCreated: ergTests.length,
    ergTests,
  };
}

/**
 * Disconnect Concept2 for current user (by userId)
 */
export async function disconnectMyC2(userId) {
  const auth = await prisma.concept2Auth.findUnique({
    where: { userId },
  });

  if (!auth) {
    throw new Error('No Concept2 connection');
  }

  await prisma.concept2Auth.delete({
    where: { userId },
  });

  return { disconnected: true };
}

/**
 * Parse OAuth state parameter
 */
export function parseState(state) {
  try {
    const decoded = Buffer.from(state, 'base64url').toString();
    return JSON.parse(decoded);
  } catch {
    throw new Error('Invalid state parameter');
  }
}

/**
 * Convert Concept2 time (tenths of seconds) to seconds
 * @param {number} tenths - Time in tenths of seconds
 * @returns {number} - Time in seconds
 */
export function convertC2TimeToSeconds(tenths) {
  return tenths / 10;
}

/**
 * Format pace from tenths of seconds to mm:ss.t
 * @param {number} tenths - Pace in tenths of seconds per 500m
 * @returns {string} - Formatted pace string
 */
export function formatPace(tenths) {
  const totalSeconds = tenths / 10;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`;
}

/**
 * Fetch a single result with stroke data
 * @param {string} accessToken - Valid access token
 * @param {number} userId - Concept2 user ID
 * @param {number} resultId - Result ID
 * @returns {Promise<object>}
 */
export async function fetchResultWithStrokes(accessToken, userId, resultId) {
  const config = getConfig();

  // Fetch result details
  const resultRes = await fetch(`${config.apiUrl}/api/users/${userId}/results/${resultId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.c2logbook.v1+json',
    },
  });

  if (!resultRes.ok) {
    throw new Error(`Failed to fetch result: ${resultRes.status}`);
  }

  const { data: result } = await resultRes.json();

  // Try to fetch stroke data
  let strokes = null;
  try {
    const strokesRes = await fetch(
      `${config.apiUrl}/api/users/${userId}/results/${resultId}/strokes`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.c2logbook.v1+json',
        },
      }
    );

    if (strokesRes.ok) {
      const { data } = await strokesRes.json();
      strokes = data;
    }
  } catch {
    // Stroke data not available
  }

  return { ...result, strokes };
}

/**
 * Handle webhook from Concept2
 * Delegates to c2SyncService for actual sync processing
 * @param {object} payload - Webhook payload
 * @returns {Promise<{success: boolean, event?: string, ignored?: boolean}>}
 */
export async function handleWebhook(payload) {
  const { event, user_id, result_id } = payload;

  // Find auth by Concept2 user ID (now uses userId, not athleteId)
  const auth = await prisma.concept2Auth.findFirst({
    where: { c2UserId: String(user_id) },
  });

  if (!auth || !auth.syncEnabled) {
    return { success: true, ignored: true };
  }

  // Delegate to c2SyncService for processing
  const { syncSingleResult } = await import('./c2SyncService.js');

  switch (event) {
    case 'result-added':
    case 'result-updated': {
      try {
        await syncSingleResult(auth.userId, result_id);
        return { success: true, event };
      } catch (error) {
        logger.error('Webhook processing error', { error: error.message });
        return { success: false, error: error.message };
      }
    }

    case 'result-deleted': {
      // Delete the workout if it exists
      await prisma.workout.deleteMany({
        where: { c2LogbookId: String(result_id) },
      });
      return { success: true, event };
    }

    default:
      return { success: true, ignored: true };
  }
}

/**
 * Connect an athlete to Concept2
 * @param {string} athleteId - RowLab athlete ID
 * @param {string} code - OAuth authorization code
 * @returns {Promise<object>} - Connection result
 */
export async function connectAthlete(athleteId, code) {
  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code);

  // Fetch user profile
  const profile = await fetchUserProfile(tokens.accessToken);

  // Calculate token expiry
  const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

  // Store connection using storeTokens helper (handles encryption)
  // Note: athleteId is used here for athlete-initiated OAuth flow
  // For user-initiated flow, use storeTokens directly with userId
  await storeTokens(athleteId, String(profile.id), tokens, profile.username);

  // Also update athlete's concept2UserId
  await prisma.athlete.update({
    where: { id: athleteId },
    data: { concept2UserId: String(profile.id) },
  });

  return {
    connected: true,
    c2UserId: profile.id,
    username: profile.username,
    name: `${profile.firstName} ${profile.lastName}`,
  };
}

export default {
  generateAuthUrl,
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  fetchUserProfile,
  getC2UserProfile,
  fetchResults,
  fetchResultWithStrokes,
  fetchC2Workouts,
  convertC2Workout,
  convertC2TimeToSeconds,
  formatPace,
  storeTokens,
  getValidToken,
  syncAthleteWorkouts,
  disconnectC2,
  getC2Status,
  getMyC2Status,
  syncUserWorkouts,
  disconnectMyC2,
  parseState,
  handleWebhook,
  connectAthlete,
};

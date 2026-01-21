/**
 * Strava Integration Service
 *
 * Handles OAuth flow, token management, and activity syncing with Strava API.
 * Following the same patterns as concept2Service.js
 */

import crypto from 'crypto';
import { prisma } from '../db.js';

// Strava API endpoints
const STRAVA_API_URL = 'https://www.strava.com/api/v3';
const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

// Environment config
const getConfig = () => ({
  clientId: process.env.STRAVA_CLIENT_ID,
  clientSecret: process.env.STRAVA_CLIENT_SECRET,
  redirectUri: process.env.STRAVA_REDIRECT_URI || `${process.env.APP_URL || 'http://localhost:5173'}/app/strava/callback`,
  encryptionKey: process.env.ENCRYPTION_KEY,
});

// ============================================
// ENCRYPTION (same as concept2Service)
// ============================================

function encrypt(text) {
  const { encryptionKey } = getConfig();
  if (!encryptionKey) {
    console.warn('ENCRYPTION_KEY not set - storing tokens in plaintext');
    return text;
  }

  const key = Buffer.from(encryptionKey, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decrypt(encryptedText) {
  const { encryptionKey } = getConfig();

  // Handle plaintext tokens (migration case)
  if (!encryptedText.includes(':')) {
    return encryptedText;
  }

  if (!encryptionKey) {
    console.warn('Cannot decrypt - ENCRYPTION_KEY not set');
    return encryptedText;
  }

  try {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    const key = Buffer.from(encryptionKey, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err.message);
    return encryptedText;
  }
}

// ============================================
// OAuth Flow
// ============================================

/**
 * Generate Strava OAuth authorization URL
 */
export function generateAuthUrl(userId) {
  const { clientId, redirectUri } = getConfig();

  if (!clientId) {
    throw new Error('STRAVA_CLIENT_ID not configured');
  }

  // State includes user ID for callback verification
  const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read_all', // Read activities
    state,
  });

  return `${STRAVA_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code) {
  const { clientId, clientSecret } = getConfig();

  if (!clientId || !clientSecret) {
    throw new Error('Strava credentials not configured');
  }

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Strava token exchange failed:', error);
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(data.expires_at * 1000),
    athlete: data.athlete,
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken) {
  const { clientId, clientSecret } = getConfig();

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: decrypt(refreshToken),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Strava token refresh failed:', error);
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(data.expires_at * 1000),
  };
}

// ============================================
// Token Storage
// ============================================

/**
 * Store Strava tokens for a user
 */
export async function storeTokens(userId, tokenData) {
  const { accessToken, refreshToken, expiresAt, athlete } = tokenData;

  await prisma.stravaAuth.upsert({
    where: { userId },
    update: {
      stravaAthleteId: BigInt(athlete.id),
      username: `${athlete.firstname} ${athlete.lastname}`.trim() || athlete.username,
      accessToken: encrypt(accessToken),
      refreshToken: encrypt(refreshToken),
      tokenExpiresAt: expiresAt,
      updatedAt: new Date(),
    },
    create: {
      userId,
      stravaAthleteId: BigInt(athlete.id),
      username: `${athlete.firstname} ${athlete.lastname}`.trim() || athlete.username,
      accessToken: encrypt(accessToken),
      refreshToken: encrypt(refreshToken),
      tokenExpiresAt: expiresAt,
      scope: 'read,activity:read_all',
    },
  });

  return { success: true };
}

/**
 * Get valid access token (refreshing if needed)
 */
export async function getValidToken(userId) {
  const auth = await prisma.stravaAuth.findUnique({
    where: { userId },
  });

  if (!auth) {
    throw new Error('Strava not connected');
  }

  // Check if token is expired (with 5 min buffer)
  const now = new Date();
  const bufferMs = 5 * 60 * 1000;

  if (auth.tokenExpiresAt.getTime() - bufferMs <= now.getTime()) {
    console.log('Strava token expired, refreshing...');

    try {
      const newTokens = await refreshAccessToken(auth.refreshToken);

      await prisma.stravaAuth.update({
        where: { userId },
        data: {
          accessToken: encrypt(newTokens.accessToken),
          refreshToken: encrypt(newTokens.refreshToken),
          tokenExpiresAt: newTokens.expiresAt,
        },
      });

      return newTokens.accessToken;
    } catch (err) {
      console.error('Token refresh failed:', err);
      throw new Error('Strava session expired, please reconnect');
    }
  }

  return decrypt(auth.accessToken);
}

// ============================================
// Strava API Calls
// ============================================

/**
 * Fetch authenticated athlete profile
 */
export async function fetchAthlete(userId) {
  const token = await getValidToken(userId);

  const response = await fetch(`${STRAVA_API_URL}/athlete`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch athlete: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch athlete activities
 */
export async function fetchActivities(userId, { before, after, page = 1, perPage = 30 } = {}) {
  const token = await getValidToken(userId);

  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });

  if (before) params.set('before', Math.floor(new Date(before).getTime() / 1000).toString());
  if (after) params.set('after', Math.floor(new Date(after).getTime() / 1000).toString());

  const response = await fetch(`${STRAVA_API_URL}/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch activities: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch single activity details
 */
export async function fetchActivity(userId, activityId) {
  const token = await getValidToken(userId);

  const response = await fetch(`${STRAVA_API_URL}/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch activity: ${response.status}`);
  }

  return response.json();
}

// ============================================
// Sync Operations
// ============================================

/**
 * Sync activities to workouts
 */
export async function syncActivities(userId, { after, activityTypes = ['Rowing', 'Workout', 'WeightTraining'] } = {}) {
  const auth = await prisma.stravaAuth.findUnique({
    where: { userId },
    include: { user: { include: { memberships: true } } },
  });

  if (!auth) {
    throw new Error('Strava not connected');
  }

  // Default to syncing last 30 days
  const afterDate = after || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  let activities = [];
  let page = 1;
  const perPage = 100;

  // Paginate through all activities
  while (true) {
    const batch = await fetchActivities(userId, {
      after: afterDate,
      page,
      perPage,
    });

    if (!batch || batch.length === 0) break;
    activities = activities.concat(batch);
    if (batch.length < perPage) break;
    page++;
  }

  // Filter to rowing-related activities
  const rowingActivities = activities.filter((a) =>
    activityTypes.includes(a.type) || a.type.toLowerCase().includes('row')
  );

  const synced = [];
  const skipped = [];

  for (const activity of rowingActivities) {
    // Check if already imported
    const existing = await prisma.workout.findFirst({
      where: {
        OR: [
          { stravaActivityId: activity.id.toString() },
          {
            date: new Date(activity.start_date),
            durationSeconds: activity.elapsed_time,
            source: 'strava_sync',
          },
        ],
      },
    });

    if (existing) {
      skipped.push({ id: activity.id, reason: 'already_imported' });
      continue;
    }

    // Create workout record
    try {
      await prisma.workout.create({
        data: {
          userId,
          teamId: auth.user.memberships[0]?.teamId, // Use first team
          date: new Date(activity.start_date),
          distanceM: activity.distance || 0,
          durationSeconds: activity.elapsed_time,
          type: mapActivityType(activity.type),
          source: 'strava_sync',
          stravaActivityId: activity.id.toString(),
          rawData: activity,
          deviceInfo: {
            name: activity.device_name,
            type: activity.type,
          },
        },
      });
      synced.push({ id: activity.id, name: activity.name });
    } catch (err) {
      console.error(`Failed to sync activity ${activity.id}:`, err);
      skipped.push({ id: activity.id, reason: err.message });
    }
  }

  // Update last synced timestamp
  await prisma.stravaAuth.update({
    where: { userId },
    data: { lastSyncedAt: new Date() },
  });

  return {
    total: activities.length,
    rowingRelated: rowingActivities.length,
    synced: synced.length,
    skipped: skipped.length,
    details: { synced, skipped },
  };
}

/**
 * Map Strava activity type to our workout type
 */
function mapActivityType(stravaType) {
  const mapping = {
    Rowing: 'on_water',
    VirtualRide: 'erg',
    Workout: 'erg',
    WeightTraining: 'strength',
    Run: 'cardio',
    Ride: 'cardio',
  };
  return mapping[stravaType] || 'other';
}

// ============================================
// Connection Management
// ============================================

/**
 * Get Strava connection status
 */
export async function getStatus(userId) {
  const auth = await prisma.stravaAuth.findUnique({
    where: { userId },
  });

  if (!auth) {
    return { connected: false };
  }

  return {
    connected: true,
    username: auth.username,
    stravaAthleteId: auth.stravaAthleteId.toString(),
    lastSyncedAt: auth.lastSyncedAt,
    syncEnabled: auth.syncEnabled,
  };
}

/**
 * Disconnect Strava
 */
export async function disconnect(userId) {
  const auth = await prisma.stravaAuth.findUnique({
    where: { userId },
  });

  if (!auth) {
    return { success: true, message: 'Already disconnected' };
  }

  // Revoke access token with Strava (optional, best practice)
  try {
    const token = decrypt(auth.accessToken);
    await fetch(`${STRAVA_AUTH_URL}/deauthorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ access_token: token }),
    });
  } catch (err) {
    console.warn('Failed to revoke Strava token:', err.message);
  }

  await prisma.stravaAuth.delete({
    where: { userId },
  });

  return { success: true };
}

// ============================================
// Exports
// ============================================

export default {
  generateAuthUrl,
  exchangeCodeForTokens,
  storeTokens,
  getValidToken,
  fetchAthlete,
  fetchActivities,
  fetchActivity,
  syncActivities,
  getStatus,
  disconnect,
};

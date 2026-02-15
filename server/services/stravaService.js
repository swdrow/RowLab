/**
 * Strava Integration Service
 *
 * Handles OAuth flow, token management, and activity syncing with Strava API.
 * Following the same patterns as concept2Service.js
 */

import crypto from 'crypto';
import { prisma } from '../db/connection.js';
import { encrypt, decrypt } from '../utils/encryption.js';

// Strava API endpoints
const STRAVA_API_URL = 'https://www.strava.com/api/v3';
const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

// Environment config
const getConfig = () => ({
  clientId: process.env.STRAVA_CLIENT_ID,
  clientSecret: process.env.STRAVA_CLIENT_SECRET,
  redirectUri: process.env.STRAVA_REDIRECT_URI || `${process.env.APP_URL || 'http://localhost:5173'}/app/strava/callback`,
});

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
    scope: 'read,activity:read_all,activity:write', // Read activities + Write for C2 uploads
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
// Activity Upload (for C2 → Strava sync)
// ============================================

/**
 * Create an activity on Strava
 * @param {string} userId - RowLab user ID
 * @param {object} activity - Activity data to upload
 * @returns {Promise<object>} Created Strava activity
 */
export async function createActivity(userId, activity) {
  const token = await getValidToken(userId);

  const {
    name,
    type = 'Rowing',
    startDate,
    elapsedTime,
    description,
    distance,
    trainer = false,
    commute = false,
  } = activity;

  // Strava API requires these fields
  if (!name || !startDate || !elapsedTime) {
    throw new Error('Missing required fields: name, startDate, elapsedTime');
  }

  const body = {
    name,
    type,
    start_date_local: new Date(startDate).toISOString(),
    elapsed_time: Math.round(elapsedTime),
    trainer: trainer ? 1 : 0,
    commute: commute ? 1 : 0,
  };

  if (description) body.description = description;
  if (distance) body.distance = Math.round(distance);

  const response = await fetch(`${STRAVA_API_URL}/activities`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Strava create activity failed:', error);
    throw new Error(`Failed to create activity: ${response.status}`);
  }

  return response.json();
}

/**
 * Map Concept2 workout type to Strava activity type
 */
function mapC2TypeToStrava(c2Type) {
  const mapping = {
    rower: 'Rowing',
    bikeerg: 'Ride',
    skierg: 'NordicSki',
    default: 'Workout',
  };
  return mapping[c2Type?.toLowerCase()] || mapping.default;
}

/**
 * Build activity name from C2 workout
 */
function buildActivityName(workout) {
  const distance = workout.distance || workout.distanceM;
  const time = workout.time ? workout.time / 10 : workout.durationSeconds;

  if (!distance && !time) return 'Concept2 Workout';

  const parts = [];

  // Add distance if present
  if (distance >= 1000) {
    parts.push(`${(distance / 1000).toFixed(1)}km`);
  } else if (distance > 0) {
    parts.push(`${distance}m`);
  }

  // Add time if present and no distance (time-based workout)
  if (!distance && time) {
    const mins = Math.floor(time / 60);
    parts.push(`${mins} min`);
  }

  // Add workout type
  const type = workout.type?.toLowerCase() || 'rower';
  const typeLabel = {
    rower: 'Row',
    bikeerg: 'BikeErg',
    skierg: 'SkiErg',
  }[type] || 'Erg';

  parts.push(typeLabel);

  return parts.join(' ');
}

/**
 * Build description with workout details
 */
function buildActivityDescription(workout) {
  const lines = ['Synced from Concept2 Logbook via RowLab'];
  const time = workout.time ? workout.time / 10 : workout.durationSeconds;
  const distance = workout.distance || workout.distanceM;

  if (time && distance) {
    // Calculate pace (time per 500m)
    const pace500m = (time / (distance / 500));
    const paceMin = Math.floor(pace500m / 60);
    const paceSec = (pace500m % 60).toFixed(1);
    lines.push(`\nPace: ${paceMin}:${paceSec.padStart(4, '0')}/500m`);
  }

  if (workout.stroke_rate || workout.strokeRate) {
    lines.push(`Stroke Rate: ${workout.stroke_rate || workout.strokeRate} spm`);
  }

  if (workout.calories_total || workout.calories) {
    lines.push(`Calories: ${workout.calories_total || workout.calories}`);
  }

  if (workout.drag_factor || workout.dragFactor) {
    lines.push(`Drag Factor: ${workout.drag_factor || workout.dragFactor}`);
  }

  // Add stroke data if available
  const strokeData = workout.stroke_data || workout.strokeData;
  if (strokeData) {
    if (strokeData.avg_watts) lines.push(`Avg Power: ${strokeData.avg_watts}W`);
    if (strokeData.avg_heart_rate) lines.push(`Avg HR: ${strokeData.avg_heart_rate} bpm`);
  }

  return lines.join('\n');
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
// C2 to Strava Sync
// ============================================

/**
 * C2 workout types that can be synced to Strava
 */
export const C2_WORKOUT_TYPES = {
  rower: { label: 'Row Erg (Indoor Rower)', stravaType: 'Rowing' },
  bikeerg: { label: 'BikeErg', stravaType: 'Ride' },
  skierg: { label: 'SkiErg', stravaType: 'NordicSki' },
  dynamic: { label: 'Dynamic Indoor Rower', stravaType: 'Rowing' },
  slides: { label: 'RowErg with Slides', stravaType: 'Rowing' },
};

/**
 * Get C2 to Strava sync configuration
 */
export async function getC2SyncConfig(userId) {
  const auth = await prisma.stravaAuth.findUnique({
    where: { userId },
  });

  if (!auth) {
    return { enabled: false, types: {} };
  }

  return {
    enabled: auth.c2ToStravaEnabled,
    types: auth.c2ToStravaTypes || {},
    lastSyncedAt: auth.lastC2SyncedAt,
    hasWriteScope: auth.scope?.includes('activity:write'),
  };
}

/**
 * Update C2 to Strava sync configuration
 */
export async function updateC2SyncConfig(userId, config) {
  const { enabled, types } = config;

  await prisma.stravaAuth.update({
    where: { userId },
    data: {
      c2ToStravaEnabled: enabled !== undefined ? enabled : undefined,
      c2ToStravaTypes: types !== undefined ? types : undefined,
    },
  });

  return getC2SyncConfig(userId);
}

/**
 * Sync Concept2 workouts to Strava
 * @param {string} userId - RowLab user ID
 * @param {object} options - Sync options
 * @returns {Promise<object>} Sync results
 */
export async function syncC2ToStrava(userId, options = {}) {
  const auth = await prisma.stravaAuth.findUnique({
    where: { userId },
  });

  if (!auth) {
    throw new Error('Strava not connected');
  }

  if (!auth.c2ToStravaEnabled) {
    throw new Error('C2 to Strava sync is disabled');
  }

  if (!auth.scope?.includes('activity:write')) {
    throw new Error('Strava write permission required. Please reconnect Strava to grant upload permission.');
  }

  // Get allowed workout types
  const allowedTypes = auth.c2ToStravaTypes || {};
  const enabledTypes = Object.entries(allowedTypes)
    .filter(([, enabled]) => enabled)
    .map(([type]) => type);

  if (enabledTypes.length === 0) {
    return { synced: 0, skipped: 0, message: 'No workout types enabled for sync' };
  }

  // Find C2 workouts that haven't been synced to Strava yet
  const { after = auth.lastC2SyncedAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } = options;

  // Get workouts from Concept2 source that haven't been posted to Strava
  const workouts = await prisma.workout.findMany({
    where: {
      userId,
      source: 'concept2_sync',
      date: { gte: after },
      stravaActivityId: null, // Not yet synced to Strava
    },
    orderBy: { date: 'asc' },
  });

  const results = {
    synced: [],
    skipped: [],
    failed: [],
  };

  for (const workout of workouts) {
    // Determine workout type from rawData or metadata
    const rawData = workout.rawData || {};
    const workoutType = (rawData.type || rawData.workout_type || 'rower').toLowerCase();

    // Check if this type should be synced
    if (!allowedTypes[workoutType]) {
      results.skipped.push({
        id: workout.id,
        reason: `Type "${workoutType}" not enabled for sync`,
      });
      continue;
    }

    try {
      // Create activity on Strava
      const stravaActivity = await createActivity(userId, {
        name: buildActivityName(rawData),
        type: mapC2TypeToStrava(workoutType),
        startDate: workout.date,
        elapsedTime: workout.durationSeconds || (rawData.time ? rawData.time / 10 : 0),
        distance: workout.distanceM || rawData.distance,
        description: buildActivityDescription(rawData),
        trainer: true, // Indoor workout
      });

      // Update workout with Strava activity ID
      await prisma.workout.update({
        where: { id: workout.id },
        data: { stravaActivityId: stravaActivity.id.toString() },
      });

      results.synced.push({
        workoutId: workout.id,
        stravaId: stravaActivity.id,
        name: stravaActivity.name,
      });
    } catch (err) {
      console.error(`Failed to sync workout ${workout.id} to Strava:`, err);
      results.failed.push({
        id: workout.id,
        error: err.message,
      });
    }
  }

  // Update last sync timestamp
  await prisma.stravaAuth.update({
    where: { userId },
    data: { lastC2SyncedAt: new Date() },
  });

  return {
    total: workouts.length,
    synced: results.synced.length,
    skipped: results.skipped.length,
    failed: results.failed.length,
    details: results,
  };
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
  createActivity,
  syncActivities,
  getStatus,
  disconnect,
  // C2 to Strava sync
  C2_WORKOUT_TYPES,
  getC2SyncConfig,
  updateC2SyncConfig,
  syncC2ToStrava,
};

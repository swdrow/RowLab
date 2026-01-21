/**
 * Concept2 Service - Frontend service for Concept2 Logbook integration
 * Communicates with backend API for OAuth and workout syncing
 */

const API_BASE = '/api/v1/concept2';

/**
 * Get OAuth authorization URL to start connection flow
 * @param {string} athleteId - Athlete UUID
 * @returns {Promise<{url: string}>}
 */
export async function getAuthUrl(athleteId) {
  try {
    const res = await fetch(`${API_BASE}/auth-url/${athleteId}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to get authorization URL');
    }

    const data = await res.json();
    return data.data;
  } catch (err) {
    console.error('Get auth URL error:', err);
    throw err;
  }
}

/**
 * Get Concept2 connection status for an athlete
 * @param {string} athleteId - Athlete UUID
 * @returns {Promise<{connected: boolean, c2UserId?: string, lastSyncedAt?: string}>}
 */
export async function getConnectionStatus(athleteId) {
  try {
    const res = await fetch(`${API_BASE}/status/${athleteId}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to check connection status');
    }

    const data = await res.json();
    return data.data;
  } catch (err) {
    console.error('Get connection status error:', err);
    throw err;
  }
}

/**
 * Trigger workout sync for an athlete
 * @param {string} athleteId - Athlete UUID
 * @returns {Promise<{imported: number, skipped: number, totalFetched: number}>}
 */
export async function syncWorkouts(athleteId) {
  try {
    const res = await fetch(`${API_BASE}/sync/${athleteId}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to sync workouts');
    }

    const data = await res.json();
    return data.data;
  } catch (err) {
    console.error('Sync workouts error:', err);
    throw err;
  }
}

/**
 * Disconnect Concept2 account for an athlete
 * @param {string} athleteId - Athlete UUID
 * @returns {Promise<{message: string}>}
 */
export async function disconnect(athleteId) {
  try {
    const res = await fetch(`${API_BASE}/disconnect/${athleteId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to disconnect');
    }

    const data = await res.json();
    return data.data;
  } catch (err) {
    console.error('Disconnect error:', err);
    throw err;
  }
}

/**
 * Open OAuth popup window
 * @param {string} url - OAuth URL
 * @param {string} title - Window title
 * @returns {Window} - Popup window reference
 */
export function openOAuthPopup(url, title = 'Connect Concept2') {
  const width = 500;
  const height = 600;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;

  return window.open(
    url,
    title,
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
  );
}

export default {
  getAuthUrl,
  getConnectionStatus,
  syncWorkouts,
  disconnect,
  openOAuthPopup,
};

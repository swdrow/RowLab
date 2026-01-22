/**
 * Strava Integration Service (Frontend)
 *
 * Handles OAuth flow, connection management, and activity syncing.
 * Following the same patterns as concept2Service.js
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';

/**
 * Get OAuth authorization URL
 */
export async function getAuthUrl() {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}/strava/auth-url`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get Strava auth URL');
  }

  const data = await response.json();
  return data.data.authUrl;
}

/**
 * Get connection status
 */
export async function getConnectionStatus() {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}/strava/status/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get Strava status');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Sync activities to workouts
 */
export async function syncActivities(options = {}) {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}/strava/sync/me`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Sync failed');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Fetch activities (without syncing)
 */
export async function fetchActivities(options = {}) {
  const token = localStorage.getItem('accessToken');
  const params = new URLSearchParams();

  if (options.page) params.set('page', options.page.toString());
  if (options.perPage) params.set('perPage', options.perPage.toString());
  if (options.after) params.set('after', options.after);
  if (options.before) params.set('before', options.before);

  const response = await fetch(`${API_URL}/strava/activities?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch activities');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Disconnect Strava
 */
export async function disconnect() {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}/strava/disconnect/me`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to disconnect Strava');
  }

  return true;
}

/**
 * Get C2 to Strava sync configuration
 */
export async function getC2SyncConfig() {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}/strava/c2-sync/config`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get C2 sync config');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Update C2 to Strava sync configuration
 */
export async function updateC2SyncConfig(config) {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}/strava/c2-sync/config`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update config');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Trigger C2 to Strava sync
 */
export async function syncC2ToStrava(options = {}) {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}/strava/c2-sync/trigger`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Sync failed');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Open OAuth popup for Strava connection
 */
export function openOAuthPopup(onSuccess, onError) {
  return new Promise(async (resolve, reject) => {
    try {
      const authUrl = await getAuthUrl();

      // Open popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'strava_oauth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=0,menubar=0`
      );

      if (!popup) {
        const error = new Error('Popup blocked. Please allow popups and try again.');
        onError?.(error);
        reject(error);
        return;
      }

      // Poll for popup close (redirect-based flow)
      const checkClosed = setInterval(async () => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // Check connection status after popup closes
          try {
            const status = await getConnectionStatus();
            if (status.connected) {
              onSuccess?.(status);
              resolve(status);
            } else {
              const error = new Error('Connection not completed');
              onError?.(error);
              reject(error);
            }
          } catch (err) {
            onError?.(err);
            reject(err);
          }
        }
      }, 500);
    } catch (err) {
      onError?.(err);
      reject(err);
    }
  });
}

export default {
  getAuthUrl,
  getConnectionStatus,
  syncActivities,
  fetchActivities,
  disconnect,
  openOAuthPopup,
  // C2 to Strava sync
  getC2SyncConfig,
  updateC2SyncConfig,
  syncC2ToStrava,
};

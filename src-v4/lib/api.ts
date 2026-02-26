/**
 * Axios instance with auth interceptor and refresh mutex.
 *
 * Token is stored in a module-scoped variable (NOT on window).
 * The response interceptor handles 401s by attempting a silent refresh.
 * Concurrent 401s share a single refresh promise to prevent thundering herd.
 */
import axios from 'axios';

// Module-scoped access token -- never on window
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export const api = axios.create({
  baseURL: '',
  withCredentials: true, // sends refresh token cookie
});

// Request interceptor: attach Bearer token
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor: handle 401 with refresh mutex
let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Only attempt refresh on 401 and if we haven't already retried
    if (error.response?.status === 401 && !original._retry) {
      // Never try to refresh the refresh endpoint itself
      if (original.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      original._retry = true;

      // Mutex: share a single refresh promise across concurrent 401s
      if (!refreshPromise) {
        refreshPromise = api
          .post('/api/v1/auth/refresh', null, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
          })
          .then((res) => {
            const token = res.data?.data?.accessToken as string | undefined;
            setAccessToken(token ?? null);
            return token ?? null;
          })
          .catch(() => {
            setAccessToken(null);
            // Emit event for AuthProvider to handle redirect
            window.dispatchEvent(new CustomEvent('oarbit:auth:expired'));
            return null;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }

    return Promise.reject(error);
  }
);

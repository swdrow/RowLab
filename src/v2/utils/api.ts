import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Axios instance configured for V2 API calls
 * Automatically includes Authorization header from AuthContext
 * Handles 401 responses by refreshing token and retrying
 *
 * NOTE: Access token is provided by AuthProvider via window.__rowlab_access_token
 * This allows api.ts (a non-React module) to access auth state without hooks
 */
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add auth request interceptor
api.interceptors.request.use((config) => {
  const accessToken = (window as any).__rowlab_access_token;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Refresh token mutex — ensures only one refresh call at a time.
// When multiple requests get 401s simultaneously, the first triggers a refresh
// and all others wait for that same promise.
let refreshPromise: Promise<string | null> | null = null;

function doRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = axios
    .post(`${API_URL}/api/v1/auth/refresh`, {}, { withCredentials: true })
    .then((res) => {
      const newToken = res.data?.data?.accessToken;
      if (newToken) {
        (window as any).__rowlab_access_token = newToken;
        return newToken as string;
      }
      console.error('Token refresh succeeded but response missing accessToken');
      delete (window as any).__rowlab_access_token;
      return null;
    })
    .catch((err) => {
      delete (window as any).__rowlab_access_token;
      window.dispatchEvent(new CustomEvent('rowlab:auth:expired'));
      throw err;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// Add auth response interceptor for 401 handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't retried yet, try to refresh token (deduped via mutex)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await doRefresh();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

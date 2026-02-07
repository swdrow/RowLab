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

// Add auth response interceptor for 401 handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token via API
        const refreshResponse = await axios.post(
          `${API_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (refreshResponse.data?.data?.accessToken) {
          const newToken = refreshResponse.data.data.accessToken;
          // Update global token reference
          (window as any).__rowlab_access_token = newToken;
          // Update the request header with new token and retry
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          console.error('Token refresh succeeded but response missing accessToken');
          delete (window as any).__rowlab_access_token;
        }
      } catch (refreshError) {
        // Refresh failed, clear token and notify AuthProvider
        delete (window as any).__rowlab_access_token;
        window.dispatchEvent(new CustomEvent('rowlab:auth:expired'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

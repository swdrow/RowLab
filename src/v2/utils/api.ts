import axios from 'axios';
import useAuthStore from '../../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Axios instance configured for V2 API calls
 * Automatically includes Authorization header from auth store
 * Handles 401 responses by refreshing token and retrying
 */
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add auth request interceptor
api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
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
        // Call the auth store's refresh method
        const newToken = await useAuthStore.getState().refreshAccessToken();

        if (newToken) {
          // Update the request header with new token and retry
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, let the error propagate
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

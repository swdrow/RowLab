/**
 * Axios instance with auth interceptor and refresh mutex.
 *
 * Token is stored in a module-scoped variable (NOT on window).
 * The response interceptor handles 401s by attempting a silent refresh.
 * Concurrent 401s share a single refresh promise to prevent thundering herd.
 *
 * Exports:
 *   api         -- raw axios instance (for callers that need AxiosResponse)
 *   apiClient   -- envelope-unwrapping wrapper (returns T directly, throws ApiClientError)
 */
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { ApiErrorBody } from '@/types/api';

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

// ---------------------------------------------------------------------------
// ApiClientError -- typed error thrown by apiClient on non-success responses
// ---------------------------------------------------------------------------

export class ApiClientError extends Error {
  /** HTTP status code */
  readonly status: number;
  /** Error code from the API envelope (e.g. 'NOT_FOUND', 'VALIDATION_FAILED') */
  readonly code: string;
  /** Optional validation details array */
  readonly details?: unknown[];

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }
}

// ---------------------------------------------------------------------------
// apiClient -- unwraps the standard { success, data } envelope
//
// Usage:
//   const profile = await apiClient.get<ProfileData>('/api/u/profile');
//   // profile is ProfileData directly, not { success: true, data: ProfileData }
//
// On error: throws ApiClientError with .status, .code, .message, .details
// ---------------------------------------------------------------------------

function unwrapResponse<T>(response: AxiosResponse): T {
  const body = response.data;

  // If the response has our envelope shape, unwrap it
  if (body && typeof body === 'object' && 'success' in body) {
    if (body.success === false) {
      // Server returned an error envelope with 2xx (unusual but handle it)
      throw new ApiClientError(
        response.status,
        body.error || { code: 'UNKNOWN', message: 'Request failed' }
      );
    }
    return body.data as T;
  }

  // Non-envelope response (e.g. legacy endpoint during migration) -- return as-is
  return body as T;
}

function handleError(error: unknown): never {
  if (axios.isAxiosError(error) && error.response) {
    const body = error.response.data;
    if (body && typeof body === 'object' && 'error' in body && body.error?.code) {
      throw new ApiClientError(error.response.status, body.error);
    }
    // Non-envelope error response
    throw new ApiClientError(error.response.status, {
      code: 'SERVER_ERROR',
      message:
        (typeof body === 'object' && body?.message) ||
        (typeof body === 'string' && body) ||
        error.message,
    });
  }
  // Network error or other non-response error
  throw error;
}

export const apiClient = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const res = await api.get(url, config);
      return unwrapResponse<T>(res);
    } catch (error) {
      throw handleError(error);
    }
  },

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const res = await api.post(url, data, config);
      return unwrapResponse<T>(res);
    } catch (error) {
      throw handleError(error);
    }
  },

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const res = await api.put(url, data, config);
      return unwrapResponse<T>(res);
    } catch (error) {
      throw handleError(error);
    }
  },

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const res = await api.patch(url, data, config);
      return unwrapResponse<T>(res);
    } catch (error) {
      throw handleError(error);
    }
  },

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const res = await api.delete(url, config);
      return unwrapResponse<T>(res);
    } catch (error) {
      throw handleError(error);
    }
  },
};

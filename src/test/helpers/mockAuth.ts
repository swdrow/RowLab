/**
 * Mock authentication utilities for testing
 *
 * RowLab uses window.__rowlab_access_token as the bridge between React context
 * and the axios interceptor. These helpers manage that for tests.
 */

const DEFAULT_TEST_TOKEN = 'test-token-phase35';

declare global {
  interface Window {
    __rowlab_access_token?: string;
  }
}

/**
 * Set mock authentication token
 * @param token - The token to set (defaults to test token)
 */
export function mockAuthToken(token: string = DEFAULT_TEST_TOKEN): void {
  window.__rowlab_access_token = token;
}

/**
 * Clear authentication token
 */
export function clearAuth(): void {
  delete window.__rowlab_access_token;
}

/**
 * Create mock authorization headers for API calls
 * @param token - The token to use (defaults to test token)
 * @returns Headers object with Authorization header
 */
export function createMockAuthHeaders(token: string = DEFAULT_TEST_TOKEN): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  };
}

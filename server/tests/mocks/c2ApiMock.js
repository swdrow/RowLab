/**
 * C2 API Mock Server (nock-based)
 *
 * Provides HTTP interceptors for testing Concept2 Logbook API integration
 * without making real network calls.
 */

import nock from 'nock';
import c2Fixtures from '../fixtures/c2Workouts.json' assert { type: 'json' };

const DEFAULT_BASE_URL = 'https://log-dev.concept2.com';

/**
 * Mock C2 API endpoints
 * @param {object} options - Configuration options
 * @param {string} options.baseUrl - C2 API base URL (default: log-dev.concept2.com)
 * @param {array} options.results - Custom results data (default: fixture data)
 * @param {object} options.pagination - Pagination config
 * @returns {object} - Nock scope for assertions
 */
export function mockC2Api(options = {}) {
  const {
    baseUrl = DEFAULT_BASE_URL,
    results = c2Fixtures.results,
    pagination = {
      current_page: 1,
      total_pages: 1,
      total_count: results.length,
      per_page: 50,
    },
  } = options;

  // Mock OAuth token exchange
  const tokenScope = nock(baseUrl).post('/oauth/access_token').reply(200, {
    access_token: 'mock_access_token',
    refresh_token: 'mock_refresh_token',
    token_type: 'Bearer',
    expires_in: 604800, // 7 days
  });

  // Mock user profile endpoint
  const profileScope = nock(baseUrl).get('/api/users/me').reply(200, {
    data: c2Fixtures.user,
  });

  // Mock paginated results endpoint
  const resultsScope = nock(baseUrl)
    .get(/\/api\/users\/\d+\/results/)
    .query(true) // Accept any query parameters
    .reply(200, (uri) => {
      // Parse pagination params from query string
      const url = new URL(uri, baseUrl);
      const page = parseInt(url.searchParams.get('page') || '1');
      const perPage = parseInt(url.searchParams.get('per_page') || '50');

      // Paginate results
      const startIdx = (page - 1) * perPage;
      const endIdx = startIdx + perPage;
      const pageResults = results.slice(startIdx, endIdx);

      return {
        data: pageResults,
        meta: {
          pagination: {
            ...pagination,
            current_page: page,
            per_page: perPage,
            count: pageResults.length,
          },
        },
      };
    });

  // Mock single result detail endpoint
  const resultDetailScope = nock(baseUrl)
    .get(/\/api\/users\/\d+\/results\/\d+$/)
    .reply(200, (uri) => {
      // Extract result ID from URI
      const matches = uri.match(/\/results\/(\d+)$/);
      const resultId = matches ? parseInt(matches[1]) : null;

      // Find matching result
      const result = results.find((r) => r.id === resultId);

      if (!result) {
        return [404, { error: 'Result not found' }];
      }

      return {
        data: result,
      };
    });

  return {
    tokenScope,
    profileScope,
    resultsScope,
    resultDetailScope,
  };
}

/**
 * Clean up all nock interceptors
 */
export function cleanupMocks() {
  nock.cleanAll();
}

/**
 * Reset nock recorder and activate real HTTP
 */
export function enableRealHttp() {
  nock.restore();
}

/**
 * Disable real HTTP (back to mock-only mode)
 */
export function disableRealHttp() {
  nock.activate();
}

/**
 * Get fixture data for direct use in tests
 */
export function getFixtures() {
  return c2Fixtures;
}

export default {
  mockC2Api,
  cleanupMocks,
  enableRealHttp,
  disableRealHttp,
  getFixtures,
};

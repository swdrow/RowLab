/**
 * Route mapping utility for legacy path redirects
 *
 * This module centralizes all routing logic for redirecting legacy /beta/* and /legacy/*
 * paths to their /app/* equivalents. It preserves query params, hash fragments, and
 * deep links while consolidating the application under a single route namespace.
 *
 * @module routeMapping
 */

/**
 * Map of legacy route patterns to their /app/* equivalents
 *
 * Order matters: exact matches are checked first, then prefix-based matching
 * for nested routes uses longest-prefix-first logic.
 */
export const ROUTE_MAPPINGS: Record<string, string> = {
  // Legacy V1 route mappings
  '/legacy': '/app',
  '/legacy/athlete-dashboard': '/app/me',
  '/legacy/athletes': '/app/athletes',
  '/legacy/athletes/:id': '/app/athletes', // No V2 detail route yet
  '/legacy/erg': '/app/erg-tests',
  '/legacy/lineup': '/app/coach/lineup-builder',
  '/legacy/seat-racing': '/app/coach/seat-racing',
  '/legacy/training-plans': '/app/coach/training',
  '/legacy/racing': '/app/regattas',
  '/legacy/settings': '/app/settings',
  '/legacy/analytics': '/app/coach/dashboard',
  '/legacy/communication': '/app', // No V2 equivalent
  '/legacy/advanced': '/app/coach/seat-racing/advanced-rankings',
  '/legacy/billing': '/app/settings', // Billing tab handled by settings page
  '/legacy/coxswain': '/app', // No V2 equivalent yet
  '/legacy/boat-view': '/app', // No V2 equivalent yet

  // Beta route mappings (V2 paths are identical, just replace prefix)
  '/beta': '/app',
};

/**
 * Map a legacy route path to its /app/* equivalent
 *
 * Handles both exact matches and prefix-based matching for nested routes.
 * For /beta/* paths, simply replaces the prefix (V2 paths are identical).
 * For /legacy/* paths, uses the mapping table with fallback behavior.
 *
 * @param pathname - The legacy path to map (e.g., "/beta/coach/dashboard")
 * @returns The corresponding /app/* path
 *
 * @example
 * mapLegacyRoute("/beta/coach/dashboard") // => "/app/coach/dashboard"
 * mapLegacyRoute("/legacy/erg") // => "/app/erg-tests"
 * mapLegacyRoute("/legacy/settings?tab=billing") // => "/app/settings" (query params handled by caller)
 * mapLegacyRoute("/legacy/athletes/123") // => "/app/athletes" (nested path handled)
 */
export function mapLegacyRoute(pathname: string): string {
  // Try exact match first
  if (ROUTE_MAPPINGS[pathname]) {
    return ROUTE_MAPPINGS[pathname];
  }

  // For /beta/* paths, simply replace prefix with /app
  // (V2 routes are identical under /beta and /app)
  if (pathname.startsWith('/beta/')) {
    return pathname.replace('/beta/', '/app/');
  }

  // For /legacy/* paths, try prefix-based matching (longest prefix first)
  if (pathname.startsWith('/legacy/')) {
    // Sort mapping keys by length descending to try longest prefixes first
    const sortedKeys = Object.keys(ROUTE_MAPPINGS)
      .filter((key) => key.startsWith('/legacy/'))
      .sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
      // Check if pathname starts with this mapping key
      // For exact routes like /legacy/athletes, check exact match or with trailing slash
      // For dynamic routes like /legacy/athletes/:id, check prefix
      if (pathname === key || pathname.startsWith(key + '/')) {
        return ROUTE_MAPPINGS[key];
      }
    }
  }

  // Final fallback
  return '/app';
}

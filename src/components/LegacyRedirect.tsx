import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { mapLegacyRoute } from '../utils/routeMapping';

/**
 * LegacyRedirect - Redirect guard component for legacy routes
 *
 * This component handles redirects from /beta/* and /legacy/* routes to their
 * /app/* equivalents while preserving:
 * - Query parameters (e.g., ?tab=billing)
 * - Hash fragments (e.g., #section)
 * - Deep link paths (e.g., /legacy/athletes/123)
 *
 * Uses `replace` to avoid polluting browser history with redirects.
 * Stores the original path in location state for debugging/analytics.
 *
 * @example
 * // In App.jsx:
 * <Route path="/legacy/*" element={<LegacyRedirect />} />
 * <Route path="/beta/*" element={<LegacyRedirect />} />
 */
export function LegacyRedirect(): JSX.Element {
  const location = useLocation();

  // Map the legacy path to its /app/* equivalent
  const targetPath = mapLegacyRoute(location.pathname);

  // Preserve query params and hash fragments
  const fullPath = targetPath + location.search + location.hash;

  // Use replace to avoid back button showing redirect step
  // Store original path in state for potential analytics/debugging
  return <Navigate to={fullPath} replace state={{ from: location.pathname }} />;
}

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserPreferenceStore } from '@v2/stores/userPreferenceStore';

/**
 * @deprecated Phase 26 consolidated all routes under /app/*. Legacy and beta
 * routes now redirect via LegacyRedirect component in App.jsx.
 * This hook is no longer used. Will be removed in Phase 36 (V1/V2 Cleanup).
 *
 * Redirects users based on their version preference.
 * - If useLegacyMode is true and user is on V2 routes, redirect to /legacy
 * - If useLegacyMode is false and user is on /legacy routes, redirect to /
 *
 * Call this hook in the root App component after the flip.
 */
export function useVersionRedirect() {
  const useLegacyMode = useUserPreferenceStore((state) => state.useLegacyMode);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const path = location.pathname;

    // Paths that should NOT trigger redirects
    const excludedPaths = [
      '/login',
      '/register',
      '/join',
      '/concept2/callback',
      '/settings/integrations',
    ];
    if (excludedPaths.some((excluded) => path === excluded || path.startsWith(excluded))) {
      return;
    }

    const isOnLegacy = path.startsWith('/legacy');
    const isOnV2 =
      path === '/' ||
      path.startsWith('/me') ||
      path.startsWith('/coach') ||
      path.startsWith('/admin');

    // User wants legacy but is on V2 routes
    if (useLegacyMode && isOnV2) {
      // Map V2 route to closest V1 equivalent if possible
      const legacyPath = mapToLegacyPath(path);
      navigate(legacyPath, { replace: true });
      return;
    }

    // User wants V2 but is on legacy routes
    if (!useLegacyMode && isOnLegacy) {
      // Map legacy route to closest V2 equivalent if possible
      const v2Path = mapToV2Path(path);
      navigate(v2Path, { replace: true });
      return;
    }
  }, [useLegacyMode, location.pathname, navigate]);
}

/**
 * Map V2 paths to V1 legacy equivalents
 */
function mapToLegacyPath(v2Path: string): string {
  // V2 -> V1 route mappings
  if (v2Path === '/' || v2Path === '/me') return '/legacy';
  if (v2Path.startsWith('/coach/whiteboard')) return '/legacy'; // No V1 equivalent
  if (v2Path.startsWith('/coach/fleet')) return '/legacy'; // No V1 equivalent
  if (v2Path.startsWith('/coach/availability')) return '/legacy'; // No V1 equivalent

  // Default to legacy home
  return '/legacy';
}

/**
 * Map V1 legacy paths to V2 equivalents
 */
function mapToV2Path(legacyPath: string): string {
  // Remove /legacy prefix
  const path = legacyPath.replace(/^\/legacy/, '');

  // V1 -> V2 route mappings
  if (path === '' || path === '/') return '/';
  if (path === '/athlete-dashboard') return '/me';

  // Many V1 features don't have V2 equivalents yet
  // Default to V2 home
  return '/';
}

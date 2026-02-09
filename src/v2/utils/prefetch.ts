/**
 * Route prefetching utilities
 *
 * Enables instant-feel navigation by prefetching route chunks on hover/focus.
 * Only includes the top 10 most commonly accessed routes to avoid
 * unnecessary prefetching of rarely-used pages.
 */

// Map of route paths to their lazy import functions
const routeImports: Record<string, () => Promise<unknown>> = {
  // Top athlete/coach dashboard routes
  '/app': () => import('@v2/pages/canvas/CanvasMeDashboard'),
  '/app/coach/dashboard': () => import('@v2/pages/canvas/CanvasCoachDashboardPage'),

  // Core navigation routes (most frequently accessed)
  '/app/athletes': () => import('@v2/pages/canvas/CanvasAthletesPage'),
  '/app/erg-tests': () => import('@v2/pages/canvas/CanvasErgTestsPage'),
  '/app/regattas': () => import('@v2/pages/canvas/CanvasRegattasPage'),
  '/app/rankings': () => import('@v2/pages/canvas/CanvasRankingsPage'),

  // Coach-specific high-traffic pages
  '/app/coach/training': () => import('@v2/pages/canvas/CanvasCoachTrainingPage'),
  '/app/coach/lineup-builder': () => import('@v2/pages/canvas/CanvasLineupBuilderPage'),
  '/app/coach/seat-racing': () => import('@v2/pages/canvas/CanvasSeatRacingPage'),

  // Settings (accessed regularly)
  '/app/settings': () => import('@v2/pages/canvas/CanvasSettingsPage'),
};

// Track which routes have already been prefetched
const prefetched = new Set<string>();

/**
 * Prefetch a route's code chunk
 *
 * Call this on hover/focus to download the route's JavaScript
 * before the user clicks. Makes navigation feel instant.
 *
 * @param path - Route path (e.g., '/app/athletes')
 */
export function prefetchRoute(path: string) {
  // Skip if already prefetched
  if (prefetched.has(path)) return;

  const importFn = routeImports[path];
  if (importFn) {
    prefetched.add(path);
    // Trigger the dynamic import (downloads chunk in background)
    importFn().catch(() => {
      // If prefetch fails, remove from set so it can retry on click
      prefetched.delete(path);
    });
  }
}

/**
 * React hook for link elements
 *
 * Returns props to spread onto Link/NavLink components:
 * ```tsx
 * const prefetchProps = usePrefetchProps(item.path);
 * <Link to={item.path} {...prefetchProps}>...</Link>
 * ```
 *
 * @param to - Route path to prefetch
 */
export function usePrefetchProps(to: string) {
  return {
    onMouseEnter: () => prefetchRoute(to),
    onFocus: () => prefetchRoute(to),
  };
}

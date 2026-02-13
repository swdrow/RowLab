/**
 * Responsive breakpoint detection using useSyncExternalStore.
 * Allows conditional rendering (not just CSS hiding) of sidebar vs bottom tabs.
 *
 * Breakpoints:
 *   mobile:  < 768px   - Bottom tab bar, no sidebar
 *   tablet:  768-1023  - Collapsed sidebar rail (64px)
 *   desktop: >= 1024   - Full sidebar (240px)
 */

import { useSyncExternalStore } from 'react';

function createMediaQuery(query: string) {
  function subscribe(callback: () => void) {
    if (typeof window === 'undefined') return () => {};
    const mql = window.matchMedia(query);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
  }

  function getSnapshot() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  }

  // SSR fallback
  function getServerSnapshot() {
    return false;
  }

  return { subscribe, getSnapshot, getServerSnapshot };
}

const desktopQuery = createMediaQuery('(min-width: 1024px)');
const tabletQuery = createMediaQuery('(min-width: 768px)');
const mobileQuery = createMediaQuery('(max-width: 767px)');

/** True when viewport >= 1024px */
export function useIsDesktop() {
  return useSyncExternalStore(
    desktopQuery.subscribe,
    desktopQuery.getSnapshot,
    desktopQuery.getServerSnapshot
  );
}

/** True when viewport is 768-1023px */
export function useIsTablet() {
  const isDesktop = useIsDesktop();
  const isAtLeastTablet = useSyncExternalStore(
    tabletQuery.subscribe,
    tabletQuery.getSnapshot,
    tabletQuery.getServerSnapshot
  );
  return isAtLeastTablet && !isDesktop;
}

/** True when viewport < 768px */
export function useIsMobile() {
  return useSyncExternalStore(
    mobileQuery.subscribe,
    mobileQuery.getSnapshot,
    mobileQuery.getServerSnapshot
  );
}

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

/** Returns the current breakpoint as a string */
export function useBreakpoint(): Breakpoint {
  const isDesktop = useIsDesktop();
  const isMobile = useIsMobile();

  if (isDesktop) return 'desktop';
  if (isMobile) return 'mobile';
  return 'tablet';
}

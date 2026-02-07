import { useVersionRedirect } from '@v2/hooks/useVersionRedirect';

/**
 * @deprecated Phase 26 consolidated all routes under /app/*.
 * Redirect guards are now handled by LegacyRedirect in App.jsx.
 * Will be removed in Phase 36 (V1/V2 Cleanup).
 *
 * Guard component that calls useVersionRedirect hook to handle
 * automatic redirects based on user version preference.
 */
export function VersionRedirectGuard({ children }: { children: React.ReactNode }) {
  useVersionRedirect();
  return <>{children}</>;
}

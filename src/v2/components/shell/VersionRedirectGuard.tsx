import { useVersionRedirect } from '@v2/hooks/useVersionRedirect';

/**
 * Guard component that calls useVersionRedirect hook to handle
 * automatic redirects based on user version preference.
 */
export function VersionRedirectGuard({ children }: { children: React.ReactNode }) {
  useVersionRedirect();
  return <>{children}</>;
}

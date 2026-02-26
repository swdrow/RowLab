/**
 * Breadcrumbs: clickable navigation trail built from TanStack Router matches.
 * Filters out layout routes and __root__.
 * On mobile, shows only the last 2 segments to save space.
 * Supports dynamic labels from query cache (e.g. training session names).
 */
import { useMatches, Link } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/useBreakpoint';

const SESSION_UUID_RE = /\/training\/sessions\/([a-f0-9-]{36})$/i;

export function Breadcrumbs() {
  const matches = useMatches();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Build breadcrumb trail from route matches
  const breadcrumbs = matches
    .filter((match) => {
      // Exclude layout routes (those with _ prefix in their route id)
      if (match.routeId.includes('/_')) return false;
      // Exclude root route
      if (match.routeId === '__root__') return false;
      return true;
    })
    .map((match) => {
      // Try staticData breadcrumb first
      const staticLabel = (match.staticData as Record<string, unknown> | undefined)?.breadcrumb as
        | string
        | undefined;
      if (staticLabel && staticLabel !== 'Session') {
        return { label: staticLabel, path: match.pathname };
      }

      // Dynamic label: check query cache for session names
      const sessionMatch = match.pathname.match(SESSION_UUID_RE);
      if (sessionMatch) {
        const sessionId = sessionMatch[1];
        const cached = queryClient.getQueryData(['sessions', 'detail', sessionId]) as
          | { name?: string }
          | undefined;
        if (cached?.name) {
          return { label: cached.name, path: match.pathname };
        }
        // If staticData has 'Session' as fallback, use it
        if (staticLabel) {
          return { label: staticLabel, path: match.pathname };
        }
      }

      return {
        label: staticLabel ?? formatPathSegment(match.pathname),
        path: match.pathname,
      };
    })
    // Deduplicate consecutive paths (happens with index routes)
    .filter((crumb, i, arr) => i === 0 || crumb.path !== arr[i - 1]!.path);

  // On mobile, only show last 2 segments
  const visibleCrumbs = isMobile ? breadcrumbs.slice(-2) : breadcrumbs;

  if (visibleCrumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {visibleCrumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1">
          {i > 0 && <span className="text-text-faint">/</span>}
          {i === visibleCrumbs.length - 1 ? (
            <span className="text-text-bright font-medium">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.path}
              className="text-text-dim transition-colors hover:text-text-bright"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

/**
 * Format a pathname into a human-readable breadcrumb label.
 * /team/coach/lineups -> Lineups
 * / -> Dashboard
 */
function formatPathSegment(pathname: string): string {
  if (pathname === '/') return 'Dashboard';

  const lastSegment = pathname.split('/').filter(Boolean).pop() ?? '';
  // Capitalize first letter, handle kebab-case
  return lastSegment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

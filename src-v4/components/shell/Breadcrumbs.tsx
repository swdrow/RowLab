/**
 * Breadcrumbs: clickable navigation trail built from TanStack Router matches.
 * Filters out layout routes and __root__.
 * On mobile, shows only the last 2 segments to save space.
 */
import { useMatches, Link } from '@tanstack/react-router';
import { useIsMobile } from '@/hooks/useBreakpoint';

export function Breadcrumbs() {
  const matches = useMatches();
  const isMobile = useIsMobile();

  // Build breadcrumb trail from route matches
  const breadcrumbs = matches
    .filter((match) => {
      // Exclude layout routes (those with _ prefix in their route id)
      if (match.routeId.includes('/_')) return false;
      // Exclude root route
      if (match.routeId === '__root__') return false;
      return true;
    })
    .map((match) => ({
      label:
        ((match.staticData as Record<string, unknown> | undefined)?.breadcrumb as string) ??
        formatPathSegment(match.pathname),
      path: match.pathname,
    }))
    // Deduplicate consecutive paths (happens with index routes)
    .filter((crumb, i, arr) => i === 0 || crumb.path !== arr[i - 1]!.path);

  // On mobile, only show last 2 segments
  const visibleCrumbs = isMobile ? breadcrumbs.slice(-2) : breadcrumbs;

  if (visibleCrumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {visibleCrumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1">
          {i > 0 && <span className="text-ink-muted">/</span>}
          {i === visibleCrumbs.length - 1 ? (
            <span className="text-ink-primary font-medium">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.path}
              className="text-ink-secondary transition-colors hover:text-ink-primary"
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

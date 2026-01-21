import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const routeLabels: Record<string, string> = {
  'app': 'Dashboard',
  'lineup': 'Lineup Builder',
  'athletes': 'Athletes',
  'erg': 'Erg Data',
  'analytics': 'Analytics',
  'advanced': 'Advanced',
  'communication': 'Communication',
  'billing': 'Billing',
  'settings': 'Settings',
  'racing': 'Racing',
  'boat-view': 'Boat View',
  '3d': '3D View',
};

interface BreadcrumbItem {
  label: string;
  path: string;
  isLast: boolean;
}

interface BreadcrumbsProps {
  className?: string;
  separator?: React.ReactNode;
}

export function Breadcrumbs({
  className = '',
  separator
}: BreadcrumbsProps) {
  const location = useLocation();

  const defaultSeparator = (
    <ChevronRight
      size={14}
      className="text-text-muted/50 flex-shrink-0"
    />
  );

  const separatorElement = separator ?? defaultSeparator;

  const breadcrumbs = React.useMemo(() => {
    const pathSegments = location.pathname
      .split('/')
      .filter(segment => segment !== '');

    const items: BreadcrumbItem[] = [];

    // Always start with Home
    items.push({
      label: 'Home',
      path: '/app',
      isLast: pathSegments.length <= 1 && pathSegments[0] === 'app',
    });

    // Build breadcrumbs from path segments
    let currentPath = '';

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Skip 'app' since we already have Home
      if (segment === 'app') return;

      const isLast = index === pathSegments.length - 1;
      const label = routeLabels[segment] || formatSegment(segment);

      items.push({
        label,
        path: currentPath,
        isLast,
      });
    });

    // Update isLast for Home if it's the only item
    if (items.length === 1) {
      items[0].isLast = true;
    } else {
      items[0].isLast = false;
    }

    return items;
  }, [location.pathname]);

  // Don't render if we're at the root or only have Home
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1.5 ${className}`}
    >
      <ol className="flex items-center gap-1.5">
        {breadcrumbs.map((item, index) => (
          <li key={item.path} className="flex items-center gap-1.5">
            {index > 0 && separatorElement}

            {item.isLast ? (
              <span
                className="text-sm font-medium text-text-primary"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="text-sm font-medium text-text-muted hover:text-text-secondary transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Format a URL segment into a readable label
 * Handles IDs, kebab-case, and other patterns
 */
function formatSegment(segment: string): string {
  // Check if it looks like an ID (numeric or UUID-like)
  if (/^\d+$/.test(segment) || /^[a-f0-9-]{36}$/i.test(segment)) {
    return 'Details';
  }

  // Convert kebab-case to Title Case
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default Breadcrumbs;

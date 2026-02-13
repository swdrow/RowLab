/**
 * Mobile bottom tab bar for navigation.
 * Only renders when viewport < 768px.
 * Fixed to bottom with iOS safe area padding.
 */
import { Link, useRouterState } from '@tanstack/react-router';
import { useIsMobile } from '@/hooks/useBreakpoint';
import { useAuth } from '@/features/auth/useAuth';
import { getBottomTabItems } from '@/config/navigation';
import { useMemo } from 'react';

export function BottomTabs() {
  const isMobile = useIsMobile();
  const { activeTeamRole, activeTeamId } = useAuth();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const hasTeam = activeTeamId !== null;
  const tabItems = useMemo(
    () => getBottomTabItems(activeTeamRole, hasTeam),
    [activeTeamRole, hasTeam]
  );

  if (!isMobile) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-ink-border bg-ink-base/95 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Bottom navigation"
    >
      {tabItems.map((item) => {
        const Icon = item.icon;
        const active =
          item.path === '/'
            ? currentPath === '/'
            : currentPath === item.path || currentPath.startsWith(item.path + '/');

        return (
          <Link
            key={item.id}
            to={item.path}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-colors ${
              active ? 'text-accent-copper' : 'text-ink-muted'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

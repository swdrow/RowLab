/**
 * Glass sidebar with role-adaptive navigation, favorites, and responsive collapse.
 *
 * Desktop (>=1024px): Full sidebar (240px) with grouped nav, section headers, favorites
 * Tablet (768-1023px): Collapsed rail (64px) with icon-only nav + tooltips
 * Mobile (<768px): Hidden (BottomTabs handles navigation)
 */
import { useCallback, useMemo } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { IconStar, IconPlus } from '@/components/icons';
import { DiamondMarker } from '@/components/ui/DiamondMarker';
import { useIsDesktop, useIsTablet } from '@/hooks/useBreakpoint';
import { useAuth } from '@/features/auth/useAuth';
import { getNavConfig, sidebarFooterItems } from '@/config/navigation';
import { useFavorites } from '@/hooks/useFavorites';
import type { NavItem } from '@/types/navigation';

export function Sidebar() {
  const isDesktop = useIsDesktop();
  const isTablet = useIsTablet();
  const { activeTeamRole, activeTeamId } = useAuth();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const hasTeam = activeTeamId !== null;
  const navConfig = useMemo(() => getNavConfig(activeTeamRole, hasTeam), [activeTeamRole, hasTeam]);

  // Flatten all nav items for favorites lookup
  const allItems = useMemo(() => navConfig.sections.flatMap((s) => s.items), [navConfig.sections]);

  const favoriteItems = useMemo(
    () =>
      favorites.map((id) => allItems.find((item) => item.id === id)).filter(Boolean) as NavItem[],
    [favorites, allItems]
  );

  const searchParams = routerState.location.search;

  const isActive = useCallback(
    (item: { path: string; search?: Record<string, string> }) => {
      if (item.path === '/') return currentPath === '/';
      const pathMatch = currentPath === item.path || currentPath.startsWith(item.path + '/');
      if (!pathMatch) return false;
      // If item has search params, verify they match (e.g. calendar view=calendar)
      if (item.search) {
        return Object.entries(item.search).every(
          ([k, v]) => (searchParams as Record<string, unknown>)[k] === v
        );
      }
      return true;
    },
    [currentPath, searchParams]
  );

  // Tablet: collapsed rail
  if (isTablet) {
    return (
      <aside className="relative z-10 flex h-screen w-(--spacing-sidebar-sm) shrink-0 flex-col border-r border-edge-default bg-void-surface">
        {/* App wordmark */}
        <div className="flex h-14 items-center justify-center">
          <span className="text-base font-bold text-accent-teal">R</span>
        </div>

        {/* Log Workout quick-action (rail) */}
        <div className="flex justify-center pb-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('oarbit:open-log-workout'))}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-teal text-void-deep transition-colors hover:bg-accent-teal-hover"
            title="Log Workout"
          >
            <IconPlus width={20} height={20} />
          </button>
        </div>

        {/* Nav items (icon only) */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
          {navConfig.sections.flatMap((section) =>
            section.items.map((item) => (
              <RailNavItem key={item.id} item={item} active={isActive(item)} />
            ))
          )}
        </nav>

        {/* Footer items */}
        <div className="space-y-1 border-t border-edge-default px-2 py-2">
          {sidebarFooterItems.map((item) => (
            <RailNavItem key={item.id} item={item} active={isActive(item)} />
          ))}
        </div>
      </aside>
    );
  }

  // Desktop: full sidebar
  if (isDesktop) {
    return (
      <aside className="relative z-10 flex h-screen w-(--spacing-sidebar) shrink-0 flex-col border-r border-edge-default bg-void-surface">
        {/* App wordmark */}
        <div className="flex h-14 items-center px-5">
          <span className="font-display text-lg font-bold tracking-tight text-text-bright">
            oar<span className="text-accent-teal">bit</span>
          </span>
        </div>

        {/* Log Workout quick-action */}
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('oarbit:open-log-workout'))}
            className="flex w-full items-center gap-2 rounded-lg bg-accent-teal px-3 py-1.5 text-sm font-medium text-void-deep transition-colors hover:bg-accent-teal-hover"
          >
            <IconPlus width={16} height={16} />
            <span>Log Workout</span>
          </button>
        </div>

        {/* Scrollable nav area — uses justify-between when few items to fill vertical space */}
        <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-2">
          <div className="flex-1 flex flex-col justify-start gap-4">
            {/* Favorites section */}
            {favoriteItems.length > 0 && (
              <div>
                <SectionHeader label="Favorites" />
                <div className="space-y-0.5">
                  {favoriteItems.map((item) => (
                    <FullNavItem
                      key={item.id}
                      item={item}
                      active={isActive(item)}
                      isFavorite
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Nav sections with diamond separators */}
            {navConfig.sections.map((section, index) => (
              <div key={section.id}>
                {(index > 0 || favoriteItems.length > 0) && (
                  <div className="flex justify-center py-1.5" aria-hidden="true">
                    <DiamondMarker size="sm" />
                  </div>
                )}
                <SectionHeader label={section.label} />
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <FullNavItem
                      key={item.id}
                      item={item}
                      active={isActive(item)}
                      isFavorite={isFavorite(item.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="space-y-0.5 border-t border-edge-default px-3 py-2">
          {sidebarFooterItems.map((item) => (
            <FullNavItem
              key={item.id}
              item={item}
              active={isActive(item)}
              isFavorite={isFavorite(item.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      </aside>
    );
  }

  // Mobile: render nothing (BottomTabs handles navigation)
  return null;
}

/* === Sub-components === */

function SectionHeader({ label }: { label: string }) {
  return (
    <h3 className="mb-1 px-2 text-[11px] font-display font-semibold uppercase tracking-wider text-text-faint">
      {label}
    </h3>
  );
}

interface FullNavItemProps {
  item: NavItem;
  active: boolean;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

function FullNavItem({ item, active, isFavorite: pinned, onToggleFavorite }: FullNavItemProps) {
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      search={item.search as never}
      className={`group relative flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors ${
        active
          ? 'bg-void-raised text-text-bright'
          : 'text-text-dim hover:bg-void-overlay hover:text-text-bright'
      }`}
    >
      {/* Active indicator bar */}
      {active && (
        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent-teal" />
      )}

      <Icon width={18} height={18} className={active ? 'text-accent-teal' : 'text-text-faint'} />
      <span className="flex-1 truncate">{item.label}</span>

      {/* Badge */}
      {item.badge != null && item.badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-teal px-1.5 text-[10px] font-semibold text-void-deep">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}

      {/* Favorite toggle (visible on hover) */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite(item.id);
        }}
        className={`shrink-0 rounded p-0.5 transition-opacity ${
          pinned
            ? 'text-accent-teal opacity-100'
            : 'text-text-faint opacity-0 hover:text-accent-teal group-hover:opacity-100'
        }`}
        aria-label={pinned ? `Unpin ${item.label}` : `Pin ${item.label}`}
      >
        <IconStar width={12} height={12} fill={pinned ? 'currentColor' : 'none'} />
      </button>
    </Link>
  );
}

interface RailNavItemProps {
  item: NavItem;
  active: boolean;
}

function RailNavItem({ item, active }: RailNavItemProps) {
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      search={item.search as never}
      className={`group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
        active
          ? 'bg-void-raised text-accent-teal'
          : 'text-text-faint hover:bg-void-overlay hover:text-text-bright'
      }`}
      title={item.label}
    >
      {/* Active indicator */}
      {active && (
        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent-teal" />
      )}
      <Icon width={20} height={20} />

      {/* Badge for rail */}
      {item.badge != null && item.badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-teal px-1 text-[9px] font-bold text-void-deep">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}

      {/* Tooltip */}
      <span className="pointer-events-none absolute left-full ml-2 rounded-md bg-void-overlay px-2 py-1 text-xs text-text-bright opacity-0 shadow-md transition-opacity group-hover:opacity-100">
        {item.label}
      </span>
    </Link>
  );
}

/**
 * PublicationNav - Editorial top navigation bar
 *
 * A thin, refined masthead-style navigation that replaces the
 * ContextRail + WorkspaceSidebar with a single elegant bar.
 * Feels like the table of contents at the top of a magazine.
 *
 * Design: 48px tall, glass morphism, Fraunces wordmark,
 * center-aligned text navigation links, right-side utilities.
 */

import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Search, Settings, User as UserIcon } from 'lucide-react';
import { useAuth } from '@v2/contexts/AuthContext';
import { useCommandPaletteStore } from '@v2/features/search/hooks/useGlobalSearch';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/app/publication' },
  { label: 'Team', path: '/app/publication/athletes' },
  { label: 'Training', path: '/app/publication/training' },
  { label: 'Racing', path: '/app/publication/racing' },
  { label: 'Analysis', path: '/app/publication/analysis' },
] as const;

export function PublicationNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const openCommandPalette = useCommandPaletteStore((s) => s.open);

  const isActive = (path: string) => {
    if (path === '/app/publication') {
      return location.pathname === '/app/publication' || location.pathname === '/app/publication/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center px-6 backdrop-blur-2xl bg-ink-deep/80 border-b border-ink-border">
      {/* Left: Wordmark */}
      <Link to="/app/publication" className="flex items-center gap-2 mr-12 group">
        <span className="font-display text-lg font-semibold text-ink-bright tracking-tight group-hover:text-ink-primary transition-colors">
          RowLab
        </span>
      </Link>

      {/* Center: Navigation links */}
      <div className="flex-1 flex items-center justify-center gap-8">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                relative text-sm transition-colors duration-150
                ${active ? 'text-ink-bright font-medium' : 'text-ink-secondary hover:text-ink-body'}
              `}
            >
              {item.label}
              {/* Active underline */}
              {active && (
                <span className="absolute -bottom-[14px] left-0 right-0 h-px bg-ink-bright" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right: Utilities */}
      <div className="flex items-center gap-3">
        {/* Search (Cmd+K) */}
        <button
          onClick={() => openCommandPalette()}
          className="p-2 rounded-md text-ink-secondary hover:text-ink-body hover:bg-ink-raised transition-colors"
          title="Search (Cmd+K)"
        >
          <Search size={16} />
        </button>

        {/* Settings */}
        <button
          onClick={() => navigate('/app/settings')}
          className="p-2 rounded-md text-ink-secondary hover:text-ink-body hover:bg-ink-raised transition-colors"
          title="Settings"
        >
          <Settings size={16} />
        </button>

        {/* User avatar */}
        <button
          onClick={() => navigate('/app/publication')}
          className="w-7 h-7 rounded-md bg-ink-raised border border-ink-border flex items-center justify-center text-xs font-medium text-ink-body hover:border-ink-border-strong transition-colors"
          title={user?.name || 'Profile'}
        >
          {user?.name?.[0]?.toUpperCase() || <UserIcon size={14} />}
        </button>
      </div>
    </nav>
  );
}

export default PublicationNav;

/**
 * Top bar: breadcrumbs on left, action buttons on right.
 * Height: h-14 (--spacing-topbar).
 * On mobile: hides breadcrumbs (bottom tabs handle navigation), shows only actions.
 */
import { Search, Bell } from 'lucide-react';
import { useIsMobile } from '@/hooks/useBreakpoint';
import { Breadcrumbs } from './Breadcrumbs';
import { UserMenu } from './UserMenu';
import { useCallback, useEffect } from 'react';

export function TopBar() {
  const isMobile = useIsMobile();

  const openSearch = useCallback(() => {
    window.dispatchEvent(new CustomEvent('rowlab:open-search'));
  }, []);

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openSearch]);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-ink-border/50 px-4">
      {/* Left: breadcrumbs (hidden on mobile) */}
      <div className="flex-1 min-w-0">{!isMobile && <Breadcrumbs />}</div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-1">
        {/* Search trigger */}
        <button
          type="button"
          onClick={openSearch}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-ink-muted transition-colors hover:bg-ink-hover hover:text-ink-primary"
          aria-label="Search"
        >
          <Search size={16} />
          {!isMobile && (
            <>
              <span className="text-ink-tertiary">Search</span>
              <kbd className="hidden rounded bg-ink-raised px-1.5 py-0.5 text-[10px] font-medium text-ink-muted lg:inline-block">
                {typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent)
                  ? '\u2318'
                  : 'Ctrl'}
                K
              </kbd>
            </>
          )}
        </button>

        {/* Notification bell placeholder (actual NotificationBell is Plan 05) */}
        <button
          type="button"
          className="relative rounded-lg p-2 text-ink-muted transition-colors hover:bg-ink-hover hover:text-ink-primary"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        {/* User menu */}
        <UserMenu />
      </div>
    </header>
  );
}

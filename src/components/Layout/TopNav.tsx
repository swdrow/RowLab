import { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, User, LogOut, Shield, Settings, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TopNavProps {
  /** Callback for mobile menu toggle */
  onMenuClick?: () => void;
  /** Callback to open command palette */
  onSearchClick?: () => void;
  /** Callback for notifications */
  onNotificationsClick?: () => void;
  /** Callback for user settings */
  onSettingsClick?: () => void;
  /** Callback for admin panel */
  onAdminClick?: () => void;
  /** Callback for logout */
  onLogout?: () => void;
  /** User info */
  user?: { name?: string; email?: string; username?: string; isAdmin?: boolean } | null;
  /** Additional content for center slot (breadcrumbs, title, etc.) */
  children?: React.ReactNode;
}

/**
 * TopNav - Main top navigation bar for RowLab
 *
 * Precision Instrument design system:
 * - Glass morphism with backdrop blur
 * - h-14 (56px) height
 * - Responsive: menu button only on mobile
 */
export function TopNav({
  onMenuClick,
  onSearchClick,
  onNotificationsClick,
  onSettingsClick,
  onAdminClick,
  onLogout,
  user,
  children
}: TopNavProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-sticky h-14 flex items-center justify-between px-4 bg-void-deep/80 backdrop-blur-xl saturate-[180%] border-b border-white/[0.06]">
      {/* Left section: Menu + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Mobile menu button - only visible on small screens */}
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden flex-shrink-0 w-9 h-9 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-fast"
          aria-label="Open menu"
        >
          <Menu size={18} strokeWidth={1.5} />
        </button>

        {/* Breadcrumbs / Title slot */}
        <div className="min-w-0 flex-1">
          {children}
        </div>
      </div>

      {/* Right section: Search, Notifications, User */}
      <div className="flex items-center gap-2">
        {/* Search button */}
        <button
          type="button"
          onClick={onSearchClick}
          className="flex items-center gap-2 h-9 px-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-text-muted hover:text-text-secondary hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-fast"
          aria-label="Search"
        >
          <Search size={16} strokeWidth={1.5} />
          <span className="hidden sm:inline text-sm">Search</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 ml-1 text-[10px] font-mono text-text-muted bg-white/[0.04] border border-white/[0.06] rounded">
            <span className="text-[11px]">&#8984;</span>K
          </kbd>
        </button>

        {/* Notifications button */}
        <button
          type="button"
          onClick={onNotificationsClick}
          className="relative flex-shrink-0 w-9 h-9 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-fast"
          aria-label="Notifications"
        >
          <Bell size={16} strokeWidth={1.5} />
          {/* Notification dot - uncomment when needed */}
          {/* <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blade-blue rounded-full" /> */}
        </button>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 h-9 px-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-text-secondary hover:text-text-primary hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-fast"
            aria-label="User menu"
            aria-expanded={showUserMenu}
          >
            <div className="w-6 h-6 rounded-md bg-blade-blue/20 border border-blade-blue/30 flex items-center justify-center">
              <User size={14} strokeWidth={1.5} className="text-blade-blue" />
            </div>
            {user?.isAdmin && (
              <span className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-coxswain-violet/20 border border-coxswain-violet/30 text-[10px] font-mono font-medium text-coxswain-violet uppercase tracking-wider">
                <Shield size={10} />
                Admin
              </span>
            )}
            <ChevronDown size={14} className={`transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* User dropdown menu */}
          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
                className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-void-surface/95 backdrop-blur-xl saturate-[180%] border border-white/[0.08] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)] overflow-hidden z-50"
              >
                {/* User info header */}
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {user?.name || user?.username || 'User'}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {user?.email || (user?.username ? `@${user.username}` : '')}
                  </p>
                  {user?.isAdmin && (
                    <span className="inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded bg-coxswain-violet/20 border border-coxswain-violet/30 text-[10px] font-mono font-medium text-coxswain-violet uppercase tracking-wider">
                      <Shield size={10} />
                      Administrator
                    </span>
                  )}
                </div>

                {/* Menu items */}
                <div className="py-1">
                  {user?.isAdmin && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onAdminClick?.();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-coxswain-violet hover:bg-coxswain-violet/10 transition-colors"
                    >
                      <Shield size={16} />
                      Admin Panel
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onSettingsClick?.();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors"
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                </div>

                {/* Logout */}
                <div className="py-1 border-t border-white/[0.06]">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout?.();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-red hover:bg-danger-red/10 transition-colors"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

export default TopNav;

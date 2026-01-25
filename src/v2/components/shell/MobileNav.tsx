import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import { SPRING_CONFIG, usePrefersReducedMotion } from '@v2/utils/animations';
import { useShowMobileLayout } from '@v2/hooks/useBreakpoint';
import { useContextStore, CONTEXT_CONFIGS } from '@v2/stores/contextStore';
import type { Context } from '@v2/types/context';

/**
 * Icon map for navigation items
 * Maps icon names from contextStore to Lucide React components
 */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Icons.Home,
  activity: Icons.Activity,
  'trending-up': Icons.TrendingUp,
  users: Icons.Users,
  calendar: Icons.Calendar,
  settings: Icons.Settings,
  user: Icons.User,
  shield: Icons.Shield,
  team: Icons.Users,
  boat: Icons.Ship,
  layout: Icons.LayoutGrid,
  clipboard: Icons.ClipboardList,
  trophy: Icons.Trophy,
  flag: Icons.Flag,
  'bar-chart': Icons.BarChart2,
};

/**
 * Simple className utility for conditional classes
 */
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * MobileNav Component
 *
 * Mobile-optimized navigation component with:
 * - Fixed header with hamburger menu
 * - Slide-in drawer with context switcher and navigation
 * - Bottom tab bar for quick access (first 5 items)
 * - 44px minimum tap targets per WCAG 2.1
 * - Safe area insets for notched phones
 * - Context-aware navigation based on active persona
 *
 * Layout:
 * - Header: 56px fixed at top
 * - Bottom tabs: 64px fixed at bottom
 * - Content area: between header and tabs
 *
 * Automatically hides on tablet+ viewports (768px+)
 */
export const MobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const showMobile = useShowMobileLayout();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { activeContext, setActiveContext, getActiveConfig } = useContextStore();

  // Get navigation items for the current context
  const config = getActiveConfig();
  const navItems = config?.navItems || [];

  // Close menu when location changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!showMobile) return null;

  const contextLabels: Record<Context, string> = {
    me: 'Me',
    coach: 'Coach',
    admin: 'Admin',
  };

  return (
    <>
      {/* Mobile header with hamburger */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-bg-surface border-b border-bdr-default z-50 flex items-center justify-between px-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="tap-target flex items-center justify-center -ml-2"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-txt-primary" />
          ) : (
            <Menu className="w-6 h-6 text-txt-primary" />
          )}
        </button>
        <span className="text-sm font-semibold text-txt-primary">
          RowLab
        </span>
        <span className="text-xs font-medium text-txt-secondary capitalize px-2 py-1 bg-bg-surface-elevated rounded">
          {contextLabels[activeContext]}
        </span>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Slide-in menu */}
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={prefersReducedMotion ? { duration: 0 } : SPRING_CONFIG}
              className="fixed top-14 left-0 bottom-0 w-72 max-w-[calc(100vw-3rem)] bg-bg-base border-r border-bdr-default z-50 overflow-y-auto flex flex-col"
              aria-label="Mobile navigation"
            >
              {/* Context Switcher */}
              <div className="p-4 border-b border-bdr-subtle">
                <p className="text-xs font-medium text-txt-tertiary mb-3 uppercase tracking-wider">
                  Workspace
                </p>
                <div className="flex gap-2">
                  {CONTEXT_CONFIGS.map((ctx) => {
                    const isActive = activeContext === ctx.id;
                    const IconComponent = ICON_MAP[ctx.icon];
                    return (
                      <button
                        key={ctx.id}
                        onClick={() => setActiveContext(ctx.id as Context)}
                        className={cn(
                          'flex-1 flex flex-col items-center gap-1 py-3 rounded-lg tap-target transition-colors',
                          isActive
                            ? 'bg-interactive-primary text-button-primary-text'
                            : 'bg-bg-surface-elevated text-txt-secondary hover:bg-bg-hover'
                        )}
                      >
                        {IconComponent && <IconComponent className="w-5 h-5" />}
                        <span className="text-xs font-medium">{ctx.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Items */}
              <ul className="flex-1 py-2">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.to;
                  const IconComponent = ICON_MAP[item.icon];

                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 tap-target mx-2 rounded-lg transition-colors',
                          isActive
                            ? 'bg-interactive-primary/10 text-interactive-primary'
                            : 'text-txt-secondary hover:bg-bg-hover hover:text-txt-primary'
                        )}
                      >
                        {IconComponent && <IconComponent className="w-5 h-5 flex-shrink-0" />}
                        <span className="font-medium flex-1">{item.label}</span>
                        {isActive && (
                          <ChevronRight className="w-4 h-4 text-interactive-primary" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Bottom tab bar for quick access (first 4 items + more) */}
      <nav
        className="fixed bottom-0 left-0 right-0 h-16 bg-bg-surface border-t border-bdr-default z-50 safe-area-inset-bottom"
        aria-label="Quick navigation"
      >
        <ul className="flex items-center justify-around h-full px-2">
          {navItems.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.to;
            const IconComponent = ICON_MAP[item.icon];

            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 tap-target px-3',
                    'transition-colors',
                    isActive
                      ? 'text-interactive-primary'
                      : 'text-txt-tertiary hover:text-txt-secondary'
                  )}
                >
                  {IconComponent && <IconComponent className="w-5 h-5" />}
                  <span className="text-[10px] font-medium truncate max-w-[60px]">
                    {item.label.split(' ')[0]}
                  </span>
                </Link>
              </li>
            );
          })}
          {/* More button if there are more than 4 items */}
          {navItems.length > 4 && (
            <li>
              <button
                onClick={() => setIsOpen(true)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 tap-target px-3',
                  'text-txt-tertiary hover:text-txt-secondary transition-colors'
                )}
                aria-label="More navigation options"
              >
                <Icons.MoreHorizontal className="w-5 h-5" />
                <span className="text-[10px] font-medium">More</span>
              </button>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
};

/**
 * Spacer component to prevent content from being hidden behind fixed mobile header
 * Add to the top of page content when MobileNav is used
 */
export const MobileNavSpacer: React.FC = () => {
  const showMobile = useShowMobileLayout();
  if (!showMobile) return null;
  return <div className="h-14" aria-hidden="true" />;
};

/**
 * Spacer component to prevent content from being hidden behind fixed bottom tabs
 * Add to the bottom of scrollable page content when MobileNav is used
 */
export const MobileNavBottomSpacer: React.FC = () => {
  const showMobile = useShowMobileLayout();
  if (!showMobile) return null;
  return <div className="h-16" aria-hidden="true" />;
};

export default MobileNav;

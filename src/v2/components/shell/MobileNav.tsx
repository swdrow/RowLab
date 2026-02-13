import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Calendar,
  Trophy,
  BarChart3,
  Settings,
  MoreHorizontal,
} from 'lucide-react';
import { SPRING_CONFIG, SPRING_FAST, usePrefersReducedMotion } from '@v2/utils/animations';
import { useShowMobileLayout } from '@v2/hooks/useBreakpoint';
import { ZONES, useZone, type ZoneConfig } from '@v2/components/shell/CanvasDock';
import { useAuth } from '../../contexts/AuthContext';
import {
  UserCheck,
  ClipboardList,
  Ship,
  CalendarRange,
  Briefcase,
  Dumbbell,
  LayoutGrid,
  Flag,
  BarChart2,
  Swords,
  Grid3X3,
  Timer,
  Award,
  Target,
  Gauge,
} from 'lucide-react';

interface SubNavItem {
  label: string;
  route: string;
  icon: typeof Timer;
  coachOnly?: boolean;
}

const ZONE_SUB_NAV: Record<string, SubNavItem[]> = {
  home: [
    { label: 'Coach Dashboard', route: '/app/coach/dashboard', icon: Gauge, coachOnly: true },
    { label: 'Achievements', route: '/app/achievements', icon: Award },
    { label: 'Challenges', route: '/app/challenges', icon: Target },
  ],
  team: [
    { label: 'Attendance', route: '/app/attendance', icon: UserCheck },
    { label: 'Whiteboard', route: '/app/coach/whiteboard', icon: ClipboardList, coachOnly: true },
    { label: 'Fleet', route: '/app/coach/fleet', icon: Ship, coachOnly: true },
    {
      label: 'Availability',
      route: '/app/coach/availability',
      icon: CalendarRange,
      coachOnly: true,
    },
    { label: 'Recruiting', route: '/app/recruiting', icon: Briefcase, coachOnly: true },
  ],
  training: [
    { label: 'Sessions', route: '/app/training/sessions', icon: Dumbbell },
    {
      label: 'Lineup Builder',
      route: '/app/coach/lineup-builder',
      icon: LayoutGrid,
      coachOnly: true,
    },
  ],
  racing: [
    { label: 'Rankings', route: '/app/rankings', icon: BarChart2 },
    { label: 'Seat Racing', route: '/app/coach/seat-racing', icon: Swords, coachOnly: true },
  ],
  analysis: [
    {
      label: 'Advanced Rankings',
      route: '/app/coach/seat-racing/advanced-rankings',
      icon: Swords,
      coachOnly: true,
    },
    {
      label: 'Matrix Planner',
      route: '/app/coach/seat-racing/matrix-planner',
      icon: Grid3X3,
      coachOnly: true,
    },
  ],
};

/**
 * Simple className utility for conditional classes
 */
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * MobileNav Component - Canvas Edition
 *
 * Mobile-optimized navigation component with Canvas ink styling:
 * - Fixed header with hamburger menu
 * - Slide-in drawer with zone navigation
 * - Bottom tab bar for 6 Canvas zones
 * - 44px minimum tap targets per WCAG 2.1
 * - Safe area insets for notched phones
 * - Zone accent colors on active tabs
 *
 * Layout:
 * - Header: 56px fixed at top
 * - Bottom tabs: 64px fixed at bottom
 * - Content area: between header and tabs
 *
 * Automatically hides on desktop viewports (1024px+)
 */
export const MobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const showMobile = useShowMobileLayout();
  const prefersReducedMotion = usePrefersReducedMotion();
  const zone = useZone();
  const { activeTeamRole } = useAuth();
  const isCoach =
    activeTeamRole === 'OWNER' || activeTeamRole === 'ADMIN' || activeTeamRole === 'COACH';

  // Get first 4 zones for bottom tabs, rest in "More" drawer
  const primaryZones = ZONES.slice(0, 4);
  const secondaryZones = ZONES.slice(4);

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

  const handleZoneNavigate = (z: ZoneConfig) => {
    navigate(z.route);
  };

  return (
    <>
      {/* Mobile header with hamburger - Canvas ink palette */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-ink-base/80 backdrop-blur-xl border-b border-ink-border z-50 flex items-center justify-between px-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-ink-primary" />
          ) : (
            <Menu className="w-6 h-6 text-ink-primary" />
          )}
        </button>
        <span className="text-sm font-semibold text-ink-primary">Canvas</span>
        <div
          className="text-xs font-medium px-2 py-1 rounded-md"
          style={{
            color: zone.accent,
            backgroundColor: `rgba(${zone.accentRgb}, 0.1)`,
            border: `1px solid rgba(${zone.accentRgb}, 0.2)`,
          }}
        >
          {zone.name}
        </div>
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

            {/* Slide-in menu - Canvas ink palette */}
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={prefersReducedMotion ? { duration: 0 } : SPRING_CONFIG}
              className="fixed top-14 left-0 bottom-0 w-72 max-w-[calc(100vw-3rem)] bg-ink-base border-r border-ink-border z-50 overflow-y-auto flex flex-col"
              aria-label="Mobile navigation"
            >
              {/* Zone Navigation with Sub-items */}
              <div className="p-4 border-b border-ink-border">
                <p className="text-xs font-medium text-ink-tertiary mb-3 uppercase tracking-wider">
                  Navigation
                </p>
                <div className="space-y-1">
                  {ZONES.map((z) => {
                    const isActive = zone.id === z.id;
                    const Icon = z.icon;
                    const subItems = (ZONE_SUB_NAV[z.id] || []).filter(
                      (item) => isCoach || !item.coachOnly
                    );
                    return (
                      <div key={z.id}>
                        <button
                          onClick={() => handleZoneNavigate(z)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg min-h-[44px] transition-all duration-150',
                            isActive
                              ? 'bg-ink-raised text-ink-primary'
                              : 'text-ink-secondary hover:bg-ink-hover hover:text-ink-primary'
                          )}
                          style={
                            isActive
                              ? {
                                  borderLeft: `3px solid ${z.accent}`,
                                  paddingLeft: '9px',
                                }
                              : {}
                          }
                        >
                          <Icon
                            className="w-5 h-5 flex-shrink-0"
                            style={isActive ? { color: z.accent } : {}}
                          />
                          <span className="font-medium flex-1 text-left">{z.name}</span>
                        </button>
                        {/* Sub-navigation items */}
                        {subItems.length > 0 && (
                          <div className="ml-8 mt-0.5 mb-1 space-y-0.5">
                            {subItems.map((item) => {
                              const SubIcon = item.icon;
                              const isSubActive = location.pathname === item.route;
                              return (
                                <button
                                  key={item.route}
                                  onClick={() => navigate(item.route)}
                                  className={cn(
                                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg min-h-[36px] text-sm transition-all duration-150',
                                    isSubActive
                                      ? 'text-ink-primary bg-ink-raised/50'
                                      : 'text-ink-tertiary hover:text-ink-secondary hover:bg-ink-hover'
                                  )}
                                  style={isSubActive ? { color: z.accent } : {}}
                                >
                                  <SubIcon className="w-4 h-4 flex-shrink-0" />
                                  <span className="flex-1 text-left">{item.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Bottom tab bar for quick access (first 4 zones + More) - Canvas ink with safe area */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-ink-base/80 backdrop-blur-xl border-t border-ink-border z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Quick navigation"
      >
        <ul className="flex items-center justify-around h-16 px-2">
          {primaryZones.map((z) => {
            const isActive = zone.id === z.id;
            const Icon = z.icon;

            return (
              <li key={z.id} className="relative">
                <button
                  onClick={() => handleZoneNavigate(z)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] px-3',
                    'transition-all duration-150',
                    isActive ? 'text-ink-primary' : 'text-ink-tertiary hover:text-ink-secondary'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Active indicator bar */}
                  {isActive && !prefersReducedMotion && (
                    <motion.div
                      layoutId="mobile-nav-indicator"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                      style={{ backgroundColor: z.accent }}
                      transition={SPRING_FAST}
                    />
                  )}
                  {isActive && prefersReducedMotion && (
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                      style={{ backgroundColor: z.accent }}
                    />
                  )}
                  <Icon
                    className="w-5 h-5"
                    strokeWidth={isActive ? 2.5 : 1.5}
                    style={isActive ? { color: z.accent } : {}}
                  />
                  <span className="text-[10px] font-medium truncate max-w-[60px]">{z.name}</span>
                </button>
              </li>
            );
          })}
          {/* More button for remaining zones */}
          <li>
            <button
              onClick={() => setIsOpen(true)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] px-3',
                'text-ink-tertiary hover:text-ink-secondary transition-all duration-150'
              )}
              aria-label="More navigation options"
            >
              <MoreHorizontal className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </li>
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

/**
 * CanvasToolbar - Floating contextual toolbar for The Canvas prototype
 *
 * Sits at the top of the viewport, morphs content based on current zone.
 * Shows zone identity + contextual action buttons.
 *
 * Design: design/canvas branch prototype
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Filter,
  UserPlus,
  ClipboardPlus,
  Timer,
  Bell,
  Users,
  UserCheck,
  ClipboardList,
  Ship,
  CalendarRange,
  Briefcase,
  Calendar,
  Dumbbell,
  LayoutGrid,
  Flag,
  BarChart2,
  Trophy,
  Swords,
  Grid3X3,
  Settings,
  Award,
  Target,
} from 'lucide-react';
import type { ZoneConfig } from './CanvasDock';

// ============================================
// ZONE ACTION CONFIGS
// ============================================

interface ZoneAction {
  label: string;
  icon: typeof Plus;
  onClick?: () => void;
  route?: string;
}

function getZoneActions(zoneId: string): ZoneAction[] {
  switch (zoneId) {
    case 'home':
      return [{ label: 'Notifications', icon: Bell }];
    case 'team':
      return [
        { label: 'Add Athlete', icon: UserPlus, route: '/app/athletes' },
        { label: 'Filter', icon: Filter },
      ];
    case 'training':
      return [{ label: 'New Session', icon: ClipboardPlus, route: '/app/training/sessions' }];
    case 'racing':
      return [{ label: 'New Regatta', icon: Plus, route: '/app/regattas' }];
    case 'analysis':
      return [{ label: 'Log Test', icon: Timer, route: '/app/erg-tests' }];
    case 'settings':
      return [];
    default:
      return [];
  }
}

// ============================================
// ZONE SUB-NAVIGATION
// ============================================

interface SubNavItem {
  label: string;
  route: string;
  icon: typeof Plus;
}

function getZoneSubNav(zoneId: string): SubNavItem[] {
  switch (zoneId) {
    case 'home':
      return [
        { label: 'Dashboard', route: '/canvas', icon: LayoutGrid },
        { label: 'Achievements', route: '/app/achievements', icon: Award },
        { label: 'Challenges', route: '/app/challenges', icon: Target },
      ];
    case 'team':
      return [
        { label: 'Athletes', route: '/app/athletes', icon: Users },
        { label: 'Attendance', route: '/app/attendance', icon: UserCheck },
        { label: 'Whiteboard', route: '/app/coach/whiteboard', icon: ClipboardList },
        { label: 'Fleet', route: '/app/coach/fleet', icon: Ship },
        { label: 'Availability', route: '/app/coach/availability', icon: CalendarRange },
        { label: 'Recruiting', route: '/app/recruiting', icon: Briefcase },
      ];
    case 'training':
      return [
        { label: 'Calendar', route: '/app/coach/training', icon: Calendar },
        { label: 'Sessions', route: '/app/training/sessions', icon: Dumbbell },
        { label: 'Lineup Builder', route: '/app/coach/lineup-builder', icon: LayoutGrid },
      ];
    case 'racing':
      return [
        { label: 'Regattas', route: '/app/regattas', icon: Flag },
        { label: 'Rankings', route: '/app/rankings', icon: BarChart2 },
        { label: 'Seat Racing', route: '/app/coach/seat-racing', icon: Trophy },
      ];
    case 'analysis':
      return [
        { label: 'Erg Tests', route: '/app/erg-tests', icon: Timer },
        {
          label: 'Advanced Rankings',
          route: '/app/coach/seat-racing/advanced-rankings',
          icon: Swords,
        },
        {
          label: 'Matrix Planner',
          route: '/app/coach/seat-racing/matrix-planner',
          icon: Grid3X3,
        },
      ];
    case 'settings':
      return [{ label: 'Settings', route: '/app/settings', icon: Settings }];
    default:
      return [];
  }
}

// ============================================
// TOOLBAR COMPONENT
// ============================================

interface CanvasToolbarProps {
  zone: ZoneConfig;
}

export function CanvasToolbar({ zone }: CanvasToolbarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const actions = getZoneActions(zone.id);
  const subNav = getZoneSubNav(zone.id);
  const ZoneIcon = zone.icon;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4">
      <motion.div
        className="flex items-center justify-between gap-3 px-5 py-3 rounded-2xl
                   bg-ink-base/60 backdrop-blur-2xl
                   border border-white/[0.06]
                   shadow-[0_4px_24px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.04)]"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
      >
        {/* Left: Zone identity */}
        <AnimatePresence mode="wait">
          <motion.div
            key={zone.id}
            className="flex items-center gap-2.5"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{
                backgroundColor: `rgba(${zone.accentRgb}, 0.12)`,
              }}
            >
              <ZoneIcon size={16} style={{ color: zone.accent }} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink-bright leading-none">{zone.name}</h2>
              <p className="text-[10px] text-ink-tertiary mt-0.5 uppercase tracking-wider font-medium">
                RowLab
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Center: Search trigger */}
        <motion.button
          onClick={() => setSearchOpen(!searchOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                     bg-white/[0.04] border border-white/[0.06]
                     text-ink-secondary hover:text-ink-primary
                     hover:bg-white/[0.06]
                     transition-colors duration-150
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Search size={14} />
          <span className="text-xs">Search...</span>
          <kbd className="hidden sm:inline-flex text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-ink-tertiary border border-white/[0.06] ml-2">
            /
          </kbd>
        </motion.button>

        {/* Right: Zone actions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={zone.id + '-actions'}
            className="flex items-center gap-1.5"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
          >
            {actions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  onClick={() => {
                    if (action.route) navigate(action.route);
                    if (action.onClick) action.onClick();
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                             text-xs font-medium
                             transition-colors duration-150
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                  style={{
                    color: zone.accent,
                    backgroundColor: `rgba(${zone.accentRgb}, 0.08)`,
                  }}
                  whileHover={{
                    backgroundColor: `rgba(${zone.accentRgb}, 0.15)`,
                    scale: 1.02,
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  <ActionIcon size={14} />
                  <span className="hidden sm:inline">{action.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Sub-navigation: zone pages */}
      {subNav.length > 1 && (
        <motion.div
          className="flex items-center justify-center gap-1 mt-2 px-2 py-1.5 rounded-xl
                     bg-ink-base/40 backdrop-blur-xl
                     border border-white/[0.04]"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={zone.id + '-subnav'}
              className="flex items-center gap-1 flex-wrap justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {subNav.map((item) => {
                const NavIcon = item.icon;
                const isActive =
                  pathname === item.route ||
                  (item.route !== '/canvas' && pathname.startsWith(item.route));
                return (
                  <motion.button
                    key={item.route}
                    onClick={() => navigate(item.route)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium
                               transition-colors duration-150
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                    style={{
                      color: isActive ? zone.accent : undefined,
                      backgroundColor: isActive ? `rgba(${zone.accentRgb}, 0.12)` : 'transparent',
                    }}
                    whileHover={{
                      backgroundColor: isActive
                        ? `rgba(${zone.accentRgb}, 0.15)`
                        : 'rgba(255,255,255,0.04)',
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <NavIcon size={12} className={isActive ? '' : 'text-ink-tertiary'} />
                    <span className={isActive ? '' : 'text-ink-secondary'}>{item.label}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

export default CanvasToolbar;

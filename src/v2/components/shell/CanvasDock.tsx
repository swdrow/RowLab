/**
 * CanvasDock - Floating dock navigation for The Canvas prototype
 *
 * Replaces the traditional sidebar with a minimal floating pill at the bottom
 * of the screen. 6 zone buttons with glass morphism styling.
 *
 * Design: design/canvas branch prototype
 */

import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, Calendar, Trophy, BarChart3, Settings } from 'lucide-react';

// ============================================
// ZONE CONFIGURATION
// ============================================

export interface ZoneConfig {
  id: string;
  name: string;
  icon: typeof LayoutDashboard;
  route: string;
  accent: string;
  accentRgb: string;
  bgGradient: string;
}

export const ZONES: ZoneConfig[] = [
  {
    id: 'home',
    name: 'Home',
    icon: LayoutDashboard,
    route: '/app',
    accent: '#FBBF24',
    accentRgb: '251, 191, 36',
    bgGradient:
      'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(251, 191, 36, 0.06) 0%, transparent 70%)',
  },
  {
    id: 'team',
    name: 'Team',
    icon: Users,
    route: '/app/athletes',
    accent: '#14B8A6',
    accentRgb: '20, 184, 166',
    bgGradient:
      'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(20, 184, 166, 0.06) 0%, transparent 70%)',
  },
  {
    id: 'training',
    name: 'Training',
    icon: Calendar,
    route: '/app/coach/training',
    accent: '#F59E0B',
    accentRgb: '245, 158, 11',
    bgGradient:
      'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(245, 158, 11, 0.06) 0%, transparent 70%)',
  },
  {
    id: 'racing',
    name: 'Racing',
    icon: Trophy,
    route: '/app/regattas',
    accent: '#F87171',
    accentRgb: '248, 113, 113',
    bgGradient:
      'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(248, 113, 113, 0.06) 0%, transparent 70%)',
  },
  {
    id: 'analysis',
    name: 'Analysis',
    icon: BarChart3,
    route: '/app/erg-tests',
    accent: '#818CF8',
    accentRgb: '129, 140, 248',
    bgGradient:
      'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(129, 140, 248, 0.06) 0%, transparent 70%)',
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: Settings,
    route: '/app/settings',
    accent: '#737373',
    accentRgb: '115, 115, 115',
    bgGradient:
      'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(115, 115, 115, 0.04) 0%, transparent 70%)',
  },
];

// ============================================
// useZone HOOK
// ============================================

const ZONE_HOME = ZONES[0] as ZoneConfig;
const ZONE_TEAM = ZONES[1] as ZoneConfig;
const ZONE_TRAINING = ZONES[2] as ZoneConfig;
const ZONE_RACING = ZONES[3] as ZoneConfig;
const ZONE_ANALYSIS = ZONES[4] as ZoneConfig;
const ZONE_SETTINGS = ZONES[5] as ZoneConfig;

export function useZone(): ZoneConfig {
  const { pathname } = useLocation();

  // Match route patterns to zones (order matters — most specific first)
  if (pathname.startsWith('/app/settings')) return ZONE_SETTINGS;
  if (pathname.startsWith('/app/erg-tests') || pathname.startsWith('/app/coach/seat-racing'))
    return ZONE_ANALYSIS;
  if (pathname.startsWith('/app/regattas') || pathname.startsWith('/app/rankings'))
    return ZONE_RACING;
  if (
    pathname.startsWith('/app/training') ||
    pathname.startsWith('/app/coach/training') ||
    pathname.startsWith('/app/coach/lineup-builder')
  )
    return ZONE_TRAINING;
  if (
    pathname.startsWith('/app/athletes') ||
    pathname.startsWith('/app/attendance') ||
    pathname.startsWith('/app/coach/whiteboard') ||
    pathname.startsWith('/app/coach/fleet') ||
    pathname.startsWith('/app/coach/availability') ||
    pathname.startsWith('/app/recruiting')
  )
    return ZONE_TEAM;

  // Default: home (covers /canvas, /canvas/me, /canvas/coach/dashboard,
  // /canvas/achievements, /canvas/challenges)
  return ZONE_HOME;
}

// ============================================
// DOCK COMPONENT
// ============================================

export function CanvasDock() {
  const zone = useZone();
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleNavigate = useCallback(
    (route: string) => {
      navigate(route);
    },
    [navigate]
  );

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 hidden lg:block">
      {/* Dock container */}
      <motion.div
        className="flex items-center gap-1 px-3 py-2.5 rounded-full
                   bg-ink-base/70 backdrop-blur-2xl
                   border border-white/[0.08]
                   shadow-[0_8px_24px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.04)]"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
      >
        {ZONES.map((z) => {
          const isActive = zone.id === z.id;
          const isHovered = hoveredId === z.id;
          const Icon = z.icon;

          return (
            <div key={z.id} className="relative">
              <motion.button
                onClick={() => handleNavigate(z.route)}
                onMouseEnter={() => setHoveredId(z.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="relative flex items-center justify-center w-11 h-11 rounded-full
                           transition-colors duration-200 outline-none
                           focus-visible:ring-2 focus-visible:ring-white/20"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                aria-label={z.name}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active glow background */}
                {isActive && (
                  <motion.div
                    layoutId="dock-active-bg"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `radial-gradient(circle, rgba(${z.accentRgb}, 0.12) 0%, transparent 70%)`,
                      boxShadow: `0 0 12px rgba(${z.accentRgb}, 0.15)`,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <motion.div
                  animate={{
                    color: isActive ? z.accent : 'rgba(163, 163, 163, 1)',
                    scale: isActive ? 1 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                </motion.div>

                {/* Active dot indicator */}
                {isActive && (
                  <motion.div
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full"
                    style={{ backgroundColor: z.accent }}
                    layoutId="dock-active-dot"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>

              {/* Tooltip on hover */}
              <AnimatePresence>
                {isHovered && !isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2
                               px-2.5 py-1 rounded-lg
                               bg-ink-raised/90 backdrop-blur-sm
                               border border-white/[0.06]
                               text-xs text-ink-primary font-medium
                               whitespace-nowrap pointer-events-none"
                  >
                    {z.name}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

export default CanvasDock;

/**
 * CanvasToolbar - Floating contextual toolbar for The Canvas prototype
 *
 * Sits at the top of the viewport, morphs content based on current zone.
 * Shows zone identity + contextual action buttons.
 *
 * Design: design/canvas branch prototype
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Filter, UserPlus, ClipboardPlus, Timer, Bell } from 'lucide-react';
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
        { label: 'Add Athlete', icon: UserPlus, route: '/canvas/athletes' },
        { label: 'Filter', icon: Filter },
      ];
    case 'training':
      return [{ label: 'New Session', icon: ClipboardPlus, route: '/canvas/training/sessions' }];
    case 'racing':
      return [{ label: 'New Regatta', icon: Plus, route: '/canvas/regattas' }];
    case 'analysis':
      return [{ label: 'Log Test', icon: Timer, route: '/canvas/erg-tests' }];
    case 'settings':
      return [];
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
  const [searchOpen, setSearchOpen] = useState(false);
  const actions = getZoneActions(zone.id);
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
    </div>
  );
}

export default CanvasToolbar;

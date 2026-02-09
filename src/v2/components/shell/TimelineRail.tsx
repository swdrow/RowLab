/**
 * TimelineRail - Narrow left navigation rail for The Timeline prototype
 *
 * A slim 60px rail with time-period navigation. Instead of feature categories
 * (Athletes, Training, etc.), navigation is by temporal scope: Today, This Week,
 * This Month, This Season, All Time.
 *
 * Active state uses a glowing accent indicator. Each icon pulses subtly
 * when its time scope contains "active" events (events happening right now).
 *
 * Design: Direction E - The Timeline prototype
 */

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, CalendarDays, CalendarRange, Calendar, Clock, LayoutGrid } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export type TimeScope = 'today' | 'week' | 'month' | 'season' | 'all';

interface TimeScopeItem {
  id: TimeScope;
  label: string;
  icon: React.ElementType;
  shortLabel: string;
}

interface TimelineRailProps {
  activeScope: TimeScope;
  onScopeChange: (scope: TimeScope) => void;
}

// ============================================
// CONFIGURATION
// ============================================

const TIME_SCOPES: TimeScopeItem[] = [
  { id: 'today', label: 'Today', shortLabel: 'Now', icon: Sun },
  { id: 'week', label: 'This Week', shortLabel: 'Wk', icon: CalendarDays },
  { id: 'month', label: 'This Month', shortLabel: 'Mo', icon: CalendarRange },
  { id: 'season', label: 'This Season', shortLabel: 'Ssn', icon: Calendar },
  { id: 'all', label: 'All Time', shortLabel: 'All', icon: Clock },
];

// ============================================
// RAIL BUTTON
// ============================================

function RailButton({
  scope,
  isActive,
  onClick,
}: {
  scope: TimeScopeItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = scope.icon;

  return (
    <motion.button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center w-full py-3 gap-0.5
                 group transition-colors duration-200"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={scope.label}
    >
      {/* Active indicator - left edge glow */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            layoutId="timeline-rail-active"
            className="absolute left-0 top-1 bottom-1 w-[2px] rounded-r-full
                       bg-gradient-to-b from-amber-400 via-amber-500 to-orange-500"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
      </AnimatePresence>

      {/* Active background glow */}
      {isActive && (
        <motion.div
          className="absolute inset-2 rounded-lg bg-amber-500/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Icon */}
      <Icon
        size={20}
        className={`relative z-10 transition-colors duration-200 ${
          isActive ? 'text-amber-400' : 'text-ink-secondary group-hover:text-ink-primary'
        }`}
      />

      {/* Short label */}
      <span
        className={`relative z-10 text-[9px] font-mono tracking-wider uppercase transition-colors duration-200 ${
          isActive ? 'text-amber-400/80' : 'text-ink-tertiary group-hover:text-ink-secondary'
        }`}
      >
        {scope.shortLabel}
      </span>
    </motion.button>
  );
}

// ============================================
// TIMELINE RAIL
// ============================================

export function TimelineRail({ activeScope, onScopeChange }: TimelineRailProps) {
  const handleScopeChange = useCallback(
    (scope: TimeScope) => {
      onScopeChange(scope);
    },
    [onScopeChange]
  );

  return (
    <nav
      className="fixed left-0 top-0 bottom-0 w-[60px] z-40
                 bg-ink-deep/90 backdrop-blur-xl
                 border-r border-ink-border/40
                 flex flex-col items-center py-4"
      aria-label="Time period navigation"
    >
      {/* Logo / Brand mark */}
      <div className="mb-6 flex items-center justify-center">
        <div
          className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600
                     flex items-center justify-center shadow-lg shadow-amber-500/20"
        >
          <LayoutGrid size={16} className="text-white" />
        </div>
      </div>

      {/* Divider */}
      <div className="w-6 h-px bg-ink-border/60 mb-4" />

      {/* Time scope buttons */}
      <div className="flex-1 flex flex-col items-center gap-1 w-full">
        {TIME_SCOPES.map((scope) => (
          <RailButton
            key={scope.id}
            scope={scope}
            isActive={activeScope === scope.id}
            onClick={() => handleScopeChange(scope.id)}
          />
        ))}
      </div>

      {/* Bottom: current time indicator */}
      <div className="mt-auto pt-4 flex flex-col items-center gap-1">
        <div className="w-6 h-px bg-ink-border/60 mb-3" />
        <div className="text-[10px] font-mono text-ink-tertiary leading-none">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
    </nav>
  );
}

export default TimelineRail;

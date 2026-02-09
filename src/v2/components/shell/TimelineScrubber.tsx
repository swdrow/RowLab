/**
 * TimelineScrubber - Horizontal minimap bar for The Timeline prototype
 *
 * A dense horizontal bar at the top of the page that shows a compressed
 * view of the entire timeline. Areas with many events appear brighter/taller,
 * sparse periods are dimmer. The current viewport position is highlighted.
 * Users can click to jump to different time periods.
 *
 * The scrubber doubles as the top bar, containing search and filter controls.
 *
 * Design: Direction E - The Timeline prototype
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronDown } from 'lucide-react';
import type { TimeScope } from './TimelineRail';

// ============================================
// TYPES
// ============================================

export type EventFilter = 'all' | 'training' | 'performance' | 'competitions' | 'milestones';

interface TimelineScrubberProps {
  activeScope: TimeScope;
  activeFilter: EventFilter;
  onFilterChange: (filter: EventFilter) => void;
  onScopeChange: (scope: TimeScope) => void;
}

interface FilterChip {
  id: EventFilter;
  label: string;
  color: string;
  activeColor: string;
}

// ============================================
// DEMO DATA - Timeline density for the minimap
// ============================================

/** Demo density data: each value represents event density for a time segment */
const DENSITY_DATA = [
  // Past (left) -> Present (center) -> Future (right)
  0.2, 0.3, 0.1, 0.4, 0.6, 0.3, 0.5, 0.8, 0.4, 0.2, 0.7, 0.9, 0.5, 0.3, 0.6, 0.8, 1.0, 0.7, 0.4,
  0.2, 0.5, 0.7, 0.9, 0.6, 0.3, 0.8, 1.0, 0.9, 0.7, 0.5,
  // "Now" is around index 30
  0.8, 0.6, 0.4, 0.3, 0.5, 0.2, 0.4, 0.3, 0.1, 0.2,
];

const NOW_INDEX = 30; // Where "now" sits in the density array

const FILTER_CHIPS: FilterChip[] = [
  {
    id: 'all',
    label: 'All Events',
    color: 'bg-ink-tertiary/40',
    activeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  {
    id: 'training',
    label: 'Training',
    color: 'bg-amber-500/10',
    activeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  {
    id: 'performance',
    label: 'Performance',
    color: 'bg-indigo-500/10',
    activeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  },
  {
    id: 'competitions',
    label: 'Competitions',
    color: 'bg-rose-500/10',
    activeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  },
  {
    id: 'milestones',
    label: 'Milestones',
    color: 'bg-emerald-500/10',
    activeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
];

// Map scope to how many density bars to highlight around "now"
const SCOPE_HIGHLIGHT_RANGE: Record<TimeScope, number> = {
  today: 1,
  week: 3,
  month: 6,
  season: 12,
  all: 40,
};

// ============================================
// MINIMAP BAR
// ============================================

function DensityMinimap({
  activeScope,
  onScopeChange,
}: {
  activeScope: TimeScope;
  onScopeChange: (scope: TimeScope) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightRange = SCOPE_HIGHLIGHT_RANGE[activeScope];

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = x / rect.width;

      // Map click position to a scope based on distance from "now" (center-right)
      const nowPct = NOW_INDEX / DENSITY_DATA.length;
      const dist = Math.abs(pct - nowPct);
      if (dist < 0.05) onScopeChange('today');
      else if (dist < 0.12) onScopeChange('week');
      else if (dist < 0.25) onScopeChange('month');
      else if (dist < 0.4) onScopeChange('season');
      else onScopeChange('all');
    },
    [onScopeChange]
  );

  return (
    <div
      ref={containerRef}
      className="flex items-end gap-[1px] h-6 cursor-pointer group"
      onClick={handleClick}
      title="Click to navigate the timeline"
    >
      {DENSITY_DATA.map((density, i) => {
        const distFromNow = Math.abs(i - NOW_INDEX);
        const isInRange = distFromNow <= highlightRange;
        const isNow = i === NOW_INDEX;

        return (
          <motion.div
            key={i}
            className="flex-1 rounded-t-[1px] transition-all duration-300"
            style={{
              height: `${Math.max(density * 100, 8)}%`,
              backgroundColor: isNow
                ? 'rgb(251, 191, 36)' // amber-400
                : isInRange
                  ? `rgba(251, 191, 36, ${0.2 + density * 0.5})`
                  : `rgba(115, 115, 115, ${0.1 + density * 0.25})`,
              boxShadow: isNow ? '0 0 8px rgba(251, 191, 36, 0.4)' : 'none',
            }}
            initial={false}
            animate={{
              opacity: isInRange ? 1 : 0.4,
            }}
            transition={{ duration: 0.3 }}
          />
        );
      })}
    </div>
  );
}

// ============================================
// TIMELINE SCRUBBER
// ============================================

export function TimelineScrubber({
  activeScope,
  activeFilter,
  onFilterChange,
  onScopeChange,
}: TimelineScrubberProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const scopeLabel = useMemo(() => {
    const labels: Record<TimeScope, string> = {
      today: 'Today',
      week: 'This Week',
      month: 'This Month',
      season: 'Spring 2026',
      all: 'All Time',
    };
    return labels[activeScope];
  }, [activeScope]);

  return (
    <header
      className="fixed top-0 left-[60px] right-0 z-30
                 bg-ink-deep/80 backdrop-blur-xl
                 border-b border-ink-border/30"
    >
      {/* Top section: scope label + search + filters */}
      <div className="flex items-center gap-4 px-5 h-11">
        {/* Scope label */}
        <div className="flex items-center gap-2 min-w-[140px]">
          <h2 className="font-display text-lg text-ink-bright tracking-tight">{scopeLabel}</h2>
          <ChevronDown size={14} className="text-ink-secondary" />
        </div>

        {/* Search */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 flex-1 max-w-sm ${
            isSearchFocused
              ? 'bg-ink-raised border border-amber-500/30 ring-1 ring-amber-500/10'
              : 'bg-ink-base/50 border border-ink-border/30 hover:border-ink-border/60'
          }`}
        >
          <Search size={14} className={isSearchFocused ? 'text-amber-400' : 'text-ink-tertiary'} />
          <input
            type="text"
            placeholder="Search events..."
            className="bg-transparent text-sm text-ink-primary placeholder:text-ink-tertiary
                       outline-none flex-1 font-body"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          <kbd
            className="hidden sm:inline-flex text-[10px] font-mono text-ink-tertiary px-1.5 py-0.5
                         border border-ink-border/50 rounded bg-ink-base/50"
          >
            /
          </kbd>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Filter size={14} className="text-ink-tertiary mr-1" />
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.id}
              onClick={() => onFilterChange(chip.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium tracking-wide
                         border transition-all duration-200 ${
                           activeFilter === chip.id
                             ? chip.activeColor
                             : 'border-transparent text-ink-secondary hover:text-ink-primary hover:bg-ink-raised/50'
                         }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom section: density minimap */}
      <div className="px-5 pb-1">
        <DensityMinimap activeScope={activeScope} onScopeChange={onScopeChange} />
      </div>
    </header>
  );
}

export default TimelineScrubber;

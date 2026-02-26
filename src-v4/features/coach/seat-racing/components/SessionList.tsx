/**
 * SessionList: displays a list of seat race session cards.
 *
 * Each card shows date, boat class, conditions, and description.
 * Click a card to select and open the detail slide-over.
 * Includes skeleton loading and empty state.
 */

import { motion, AnimatePresence } from 'motion/react';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatRelativeDate } from '@/lib/format';
import type { SeatRaceSession, Conditions } from '../types';
import { IconCalendar, IconClipboardList, IconMapPin } from '@/components/icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SessionListProps {
  sessions: SeatRaceSession[];
  isLoading: boolean;
  selectedId?: string | null;
  onSelect: (id: string) => void;
}

const CONDITIONS_COLOR: Record<Conditions, string> = {
  calm: 'text-data-excellent bg-data-excellent/10',
  variable: 'text-data-warning bg-data-warning/10',
  rough: 'text-data-poor bg-data-poor/10',
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SessionCardSkeleton() {
  return (
    <div className="p-4 rounded-xl panel animate-shimmer">
      <div className="flex items-start justify-between mb-2">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-void-raised rounded" />
          <div className="h-3.5 w-20 bg-void-raised rounded" />
        </div>
        <div className="h-5 w-10 bg-void-raised rounded-full" />
      </div>
      <div className="h-3.5 w-44 bg-void-raised rounded mt-2" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SessionList
// ---------------------------------------------------------------------------

export function SessionList({ sessions, isLoading, selectedId, onSelect }: SessionListProps) {
  // Sort by date descending (most recent first)
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        <SessionCardSkeleton />
        <SessionCardSkeleton />
        <SessionCardSkeleton />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="py-12 px-4">
        <EmptyState
          icon={IconClipboardList}
          title="No seat races yet"
          description="Create your first seat race session to start ranking athletes."
        />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <AnimatePresence mode="popLayout">
        {sorted.map((session) => {
          const isSelected = session.id === selectedId;

          return (
            <motion.button
              key={session.id}
              type="button"
              layout
              onClick={() => onSelect(session.id)}
              className={`
                w-full text-left p-4 rounded-xl panel transition-all
                ${
                  isSelected
                    ? 'ring-1 ring-accent-teal shadow-focus'
                    : 'hover:bg-void-overlay/30 hover:shadow-lg'
                }
              `.trim()}
            >
              {/* Top row: date + boat class */}
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <IconCalendar width={14} height={14} className="text-text-faint shrink-0" />
                  <span className="text-sm font-medium text-text-bright">
                    {formatRelativeDate(session.date)}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-data-good/10 text-data-good">
                  {session.boatClass}
                </span>
              </div>

              {/* Location */}
              {session.location && (
                <div className="flex items-center gap-2 text-xs text-text-dim mb-1.5 ml-5">
                  <IconMapPin width={12} height={12} className="shrink-0" />
                  {session.location}
                </div>
              )}

              {/* Badges + description */}
              <div className="flex items-center gap-2 flex-wrap ml-5">
                {session.conditions && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONDITIONS_COLOR[session.conditions]}`}
                  >
                    {session.conditions.charAt(0).toUpperCase() + session.conditions.slice(1)}
                  </span>
                )}
                {session.description && (
                  <span className="text-xs text-text-faint truncate max-w-[260px]">
                    {session.description}
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}

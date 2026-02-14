/**
 * SessionList: displays a list of seat race session cards.
 *
 * Each card shows date, boat class, conditions, and description.
 * Click a card to select and open the detail slide-over.
 * Includes skeleton loading and empty state.
 */

import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ClipboardList } from 'lucide-react';
import { listContainerVariants, listItemVariants, SPRING_SMOOTH } from '@/lib/animations';
import type { SeatRaceSession, Conditions } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SessionListProps {
  sessions: SeatRaceSession[];
  isLoading: boolean;
  selectedId?: string | null;
  onSelect: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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
    <div className="p-4 rounded-xl glass animate-shimmer">
      <div className="flex items-start justify-between mb-2">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-ink-raised rounded" />
          <div className="h-3.5 w-20 bg-ink-raised rounded" />
        </div>
        <div className="h-5 w-10 bg-ink-raised rounded-full" />
      </div>
      <div className="h-3.5 w-44 bg-ink-raised rounded mt-2" />
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
          icon={ClipboardList}
          title="No seat races yet"
          description="Create your first seat race session to start ranking athletes."
        />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-3"
      variants={listContainerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="popLayout">
        {sorted.map((session) => {
          const isSelected = session.id === selectedId;

          return (
            <motion.button
              key={session.id}
              type="button"
              layout
              variants={listItemVariants}
              transition={SPRING_SMOOTH}
              onClick={() => onSelect(session.id)}
              className={`
                w-full text-left p-4 rounded-xl glass transition-all
                ${
                  isSelected
                    ? 'ring-1 ring-accent-copper shadow-glow-copper/30'
                    : 'hover:bg-ink-hover/30 hover:shadow-card-hover'
                }
              `.trim()}
            >
              {/* Top row: date + boat class */}
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-ink-tertiary shrink-0" />
                  <span className="text-sm font-medium text-ink-primary">
                    {formatDate(session.date)}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-data-good/10 text-data-good">
                  {session.boatClass}
                </span>
              </div>

              {/* Location */}
              {session.location && (
                <div className="flex items-center gap-2 text-xs text-ink-secondary mb-1.5 ml-5">
                  <MapPin size={12} className="shrink-0" />
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
                  <span className="text-xs text-ink-tertiary truncate max-w-[260px]">
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

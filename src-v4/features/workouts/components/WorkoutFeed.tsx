/**
 * Main workout feed with day grouping, infinite scroll, and state handling.
 * Groups workouts by calendar day with date headers (Today, Yesterday, Feb 12, etc.)
 * and triggers pagination via IntersectionObserver sentinel.
 */

import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'motion/react';
import { IconRefresh } from '@/components/icons';

import { useWorkoutFeed } from '../hooks/useWorkoutFeed';
import { groupWorkoutsByDay, detectWorkoutSessions } from '../utils';
import type { WorkoutFilters, Workout } from '../types';
import { WorkoutRow } from './WorkoutRow';
import { WorkoutRowExpanded } from './WorkoutRowExpanded';
import { FeedSkeleton } from './FeedSkeleton';
import { WorkoutEmptyState } from './WorkoutEmptyState';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface WorkoutFeedProps {
  filters: WorkoutFilters;
  onEdit: (workout: Workout) => void;
  onDelete: (workout: Workout) => void;
  onCreateNew: () => void;
}

/* ------------------------------------------------------------------ */
/* WorkoutFeed                                                         */
/* ------------------------------------------------------------------ */

export function WorkoutFeed({ filters, onEdit, onDelete, onCreateNew }: WorkoutFeedProps) {
  const {
    workouts,
    sentinelRef,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    isError,
    error,
    refetch,
  } = useWorkoutFeed(filters);

  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleNavigateToDetail = (id: string) => {
    // Session workouts use synthetic IDs — navigate to the first piece instead
    const realId = id.startsWith('session:') ? id.slice('session:'.length) : id;
    navigate({ to: `/workouts/${realId}` as '/' });
  };

  // Loading state
  if (isLoading) {
    return <FeedSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <div className="bg-data-poor/10 border border-data-poor/30 rounded-lg p-4">
        <p className="text-data-poor text-sm font-medium mb-1">Failed to load workouts</p>
        <p className="text-text-dim text-sm mb-3">
          {error?.message ?? 'An unexpected error occurred.'}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 text-sm text-text-bright hover:text-accent-teal transition-colors"
        >
          <IconRefresh width={14} height={14} />
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (workouts.length === 0) {
    return <WorkoutEmptyState onCreateNew={onCreateNew} />;
  }

  // Detect session groups (e.g., 5 x 1500m logged as separate pieces) then group by day
  const sessionGrouped = detectWorkoutSessions(workouts);
  const groups = groupWorkoutsByDay(sessionGrouped);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="space-y-1"
    >
      {groups.map((group) => (
        <div key={group.dateKey}>
          {/* Date header */}
          <div className="flex items-center gap-3 px-3 pt-4 pb-2">
            <h3 className="text-text-dim text-sm font-display font-medium uppercase tracking-wider shrink-0">
              {group.label}
            </h3>
            <div className="flex-1 h-px bg-edge-default" />
          </div>

          {/* Workout rows */}
          <div className="space-y-0.5">
            {group.workouts.map((workout) => (
              <div key={workout.id}>
                <WorkoutRow
                  workout={workout}
                  isExpanded={expandedId === workout.id}
                  onToggle={() => handleToggle(workout.id)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
                <AnimatePresence>
                  {expandedId === workout.id && (
                    <WorkoutRowExpanded
                      workout={workout}
                      onNavigateToDetail={handleNavigateToDetail}
                    />
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} aria-hidden="true" />

      {/* Next page loading indicator */}
      {isFetchingNextPage && (
        <div className="space-y-0.5 px-3 py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="w-9 h-9 rounded-lg bg-void-raised animate-shimmer" />
              <div className="h-4 w-20 rounded bg-void-raised animate-shimmer" />
              <div className="flex-1" />
              <div className="h-4 w-14 rounded bg-void-raised animate-shimmer" />
            </div>
          ))}
        </div>
      )}

      {/* End of feed */}
      {!hasNextPage && workouts.length > 0 && (
        <p className="text-center text-text-faint text-xs py-6">You&rsquo;ve reached the end</p>
      )}
    </motion.div>
  );
}

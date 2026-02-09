// src/v2/features/activity-feed/components/ActivityFeedTimeline.tsx
// Timeline container with vertical connector and date group headers

import { useMemo } from 'react';
import { format, isToday, isYesterday, startOfDay, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';
import { ClockCounterClockwise } from '@phosphor-icons/react';
import { ActivityCard } from './ActivityCard';
import type { AnyActivity } from '../../../types/activity';
import { SPRING_CONFIG } from '../../../lib/animations';

// ============================================
// TYPES
// ============================================

interface ActivityGroup {
  date: Date;
  label: string;
  activities: AnyActivity[];
}

interface ActivityFeedTimelineProps {
  activities: AnyActivity[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onLoadMore?: () => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format date group label (Today, Yesterday, or full date)
 */
function formatDateLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

/**
 * Group activities by date
 */
function groupActivitiesByDate(activities: AnyActivity[]): ActivityGroup[] {
  const groups = new Map<string, ActivityGroup>();

  activities.forEach((activity) => {
    const date = startOfDay(new Date(activity.date));
    const key = date.toISOString();

    if (!groups.has(key)) {
      groups.set(key, {
        date,
        label: formatDateLabel(date),
        activities: [],
      });
    }

    groups.get(key)!.activities.push(activity);
  });

  // Convert to array and sort by date (newest first)
  return Array.from(groups.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
}

// ============================================
// COMPONENT
// ============================================

export function ActivityFeedTimeline({
  activities,
  isLoading = false,
  emptyState,
  onLoadMore,
}: ActivityFeedTimelineProps) {
  const groups = useMemo(() => groupActivitiesByDate(activities), [activities]);

  // Empty state
  if (!isLoading && activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        {emptyState || (
          <>
            <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mb-4">
              <ClockCounterClockwise className="w-8 h-8 text-txt-muted" weight="duotone" />
            </div>
            <h3 className="text-lg font-semibold text-txt-primary mb-1">No activity yet</h3>
            <p className="text-sm text-txt-muted text-center max-w-sm">
              Team activity will appear here as athletes complete workouts, erg tests, and training
              sessions.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group, groupIndex) => (
        <div key={group.date.toISOString()} className="relative">
          {/* Date header */}
          <div className="sticky top-0 z-10 bg-surface-base/80 backdrop-blur-sm py-2 mb-4">
            <h2 className="text-sm font-semibold text-txt-secondary uppercase tracking-wide">
              {group.label}
            </h2>
          </div>

          {/* Timeline connector (vertical line) */}
          {groupIndex < groups.length - 1 && (
            <div className="absolute left-[19px] top-14 bottom-0 w-px bg-gradient-to-b from-bdr-default to-transparent" />
          )}

          {/* Activities in this date group */}
          <div className="space-y-3">
            {group.activities.map((activity, activityIndex) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: activityIndex * 0.05,
                  ...SPRING_CONFIG,
                }}
                className="relative pl-10"
              >
                {/* Timeline dot */}
                <div className="absolute left-0 top-5 w-10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-accent-primary ring-4 ring-surface-base" />
                </div>

                {/* Activity card */}
                <ActivityCard activity={activity} />
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* Load more trigger */}
      {onLoadMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onLoadMore}
            className="px-4 py-2 text-sm font-medium text-txt-secondary hover:text-txt-primary transition-colors"
          >
            Load more activity
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="pl-10 relative">
              <div className="absolute left-0 top-5 w-10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-surface-elevated animate-pulse" />
              </div>
              <div className="bg-surface-elevated rounded-lg border border-bdr-default p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-base" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-base rounded w-3/4" />
                    <div className="h-3 bg-surface-base rounded w-1/2" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

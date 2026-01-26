// src/v2/features/activity-feed/components/ActivityFeed.tsx
// Unified activity feed with infinite scroll and date grouping

import { useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { isToday, isYesterday, startOfWeek } from 'date-fns';
import { useUnifiedActivityFeed } from '../hooks/useActivityFeed';
import { ActivityCard } from './ActivityCard';
import type { AnyActivity } from '../../../types/activity';

// ============================================
// TYPES
// ============================================

interface ActivityFeedProps {
  athleteId?: string;
}

interface ActivityGroup {
  label: string;
  activities: AnyActivity[];
}

// ============================================
// GROUPING FUNCTION
// ============================================

/**
 * Group activities by date: Today, Yesterday, This Week, Earlier
 */
function groupByDate(activities: AnyActivity[]): ActivityGroup[] {
  const groups: ActivityGroup[] = [];
  const weekStart = startOfWeek(new Date());

  const today: AnyActivity[] = [];
  const yesterday: AnyActivity[] = [];
  const thisWeek: AnyActivity[] = [];
  const earlier: AnyActivity[] = [];

  activities.forEach((activity) => {
    const date = new Date(activity.date);
    if (isToday(date)) {
      today.push(activity);
    } else if (isYesterday(date)) {
      yesterday.push(activity);
    } else if (date >= weekStart) {
      thisWeek.push(activity);
    } else {
      earlier.push(activity);
    }
  });

  if (today.length > 0) groups.push({ label: 'Today', activities: today });
  if (yesterday.length > 0)
    groups.push({ label: 'Yesterday', activities: yesterday });
  if (thisWeek.length > 0)
    groups.push({ label: 'This Week', activities: thisWeek });
  if (earlier.length > 0) groups.push({ label: 'Earlier', activities: earlier });

  return groups;
}

// ============================================
// SKELETON COMPONENT
// ============================================

function ActivitySkeleton() {
  return (
    <div className="bg-surface-elevated rounded-lg border border-bdr-default p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-default" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-surface-default rounded w-3/4" />
          <div className="h-3 bg-surface-default rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ActivityFeed({ athleteId }: ActivityFeedProps) {
  // Intersection observer for infinite scroll
  const { ref, inView } = useInView({
    threshold: 0.5,
    rootMargin: '100px',
  });

  // Fetch activity feed
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUnifiedActivityFeed(athleteId);

  // Auto-load when sentinel comes into view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all pages into single array
  const allActivities = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  // Group activities by date
  const groupedActivities = useMemo(() => {
    return groupByDate(allActivities);
  }, [allActivities]);

  // ========================================
  // Render states
  // ========================================

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <ActivitySkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500 text-center">
        Failed to load activity feed. Please try again.
      </div>
    );
  }

  if (allActivities.length === 0) {
    return (
      <div className="text-center py-12 text-txt-muted">
        <p>No activities yet.</p>
        <p className="text-sm mt-2">
          Activities will appear here as erg tests, sessions, and races are
          recorded.
        </p>
      </div>
    );
  }

  // ========================================
  // Main render
  // ========================================

  return (
    <div className="space-y-6">
      {groupedActivities.map((group) => (
        <div key={group.label}>
          <h3 className="text-sm font-medium text-txt-muted mb-3">
            {group.label}
          </h3>
          <div className="space-y-3">
            {group.activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={ref} className="py-4 text-center">
        {isFetchingNextPage ? (
          <div className="animate-spin w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full mx-auto" />
        ) : hasNextPage ? (
          <span className="text-txt-muted text-sm">Scroll for more</span>
        ) : allActivities.length > 0 ? (
          <span className="text-txt-muted text-sm">
            You&apos;ve reached the end
          </span>
        ) : null}
      </div>
    </div>
  );
}

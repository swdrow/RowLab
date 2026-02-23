/**
 * Team Activity Feed with infinite scroll and date grouping.
 *
 * Uses useTeamActivity hook for paginated data.
 * Groups events by date: Today, Yesterday, This Week, Older (with month label).
 * Stagger animation on entrance with motion variants.
 */
import { motion } from 'motion/react';
import { listContainerVariants, listItemVariants, SPRING_SMOOTH } from '@/lib/animations';
import { Card } from '@/components/ui/Card';
import { useTeamActivity } from '../hooks/useTeamActivity';
import { ActivityItem } from './ActivityItem';
import type { ActivityEvent } from '../types';

interface TeamActivityFeedProps {
  teamId: string;
  compact?: boolean;
}

function groupByDate(events: ActivityEvent[]): Array<{ label: string; events: ActivityEvent[] }> {
  const groups = new Map<string, ActivityEvent[]>();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  // Start of the current week (Monday-based)
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(today.getTime() - mondayOffset * 86_400_000);

  for (const event of events) {
    const date = new Date(event.createdAt);
    const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    let label: string;
    if (eventDay.getTime() === today.getTime()) {
      label = 'Today';
    } else if (eventDay.getTime() === yesterday.getTime()) {
      label = 'Yesterday';
    } else if (eventDay.getTime() >= weekStart.getTime()) {
      label = 'This Week';
    } else {
      // Group older events by month
      const monthLabel = eventDay.toLocaleDateString('en-US', { month: 'long' });
      if (eventDay.getFullYear() !== now.getFullYear()) {
        label = `${monthLabel} ${eventDay.getFullYear()}`;
      } else {
        label = monthLabel;
      }
    }

    const existing = groups.get(label);
    if (existing) {
      existing.push(event);
    } else {
      groups.set(label, [event]);
    }
  }

  return Array.from(groups.entries()).map(([label, groupEvents]) => ({
    label,
    events: groupEvents,
  }));
}

export function TeamActivityFeed({ teamId, compact }: TeamActivityFeedProps) {
  const { events, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useTeamActivity(teamId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 animate-shimmer rounded-lg bg-void-raised p-3"
          >
            <div className="h-10 w-10 rounded-full bg-void-deep" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 rounded bg-void-deep" />
              <div className="h-2 w-1/3 rounded bg-void-deep" />
            </div>
            <div className="h-2 w-8 rounded bg-void-deep" />
          </div>
        ))}
      </div>
    );
  }

  const displayEvents = compact ? events.slice(0, 10) : events;

  if (displayEvents.length === 0) {
    return (
      <Card padding="md">
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <svg
            className="h-10 w-10 text-text-faint"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-text-dim">No team activity yet.</p>
          <p className="text-xs text-text-faint">
            Activity will appear here as team members train and interact.
          </p>
        </div>
      </Card>
    );
  }

  const grouped = groupByDate(displayEvents);

  return (
    <motion.div
      variants={listContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {grouped.map((group) => (
        <motion.div key={group.label} variants={listItemVariants} transition={SPRING_SMOOTH}>
          <div className="mb-2 flex items-center gap-3">
            <h4 className="text-xs font-medium uppercase tracking-wider text-text-faint">
              {group.label}
            </h4>
            {group.label === 'Today' && (
              <span className="h-1.5 w-1.5 rounded-full bg-data-good animate-pulse" title="Live" />
            )}
            <div className="flex-1 border-t border-edge-default/30" />
          </div>
          <motion.div
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-1"
          >
            {group.events.map((event) => (
              <motion.div key={event.id} variants={listItemVariants} transition={SPRING_SMOOTH}>
                <ActivityItem event={event} />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      ))}

      {/* Load more (full feed only) */}
      {!compact && hasNextPage && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-lg bg-void-deep/50 px-4 py-2 text-sm text-text-dim transition-colors hover:bg-void-deep hover:text-text-bright disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading more\u2026' : 'Load more'}
          </button>
        </div>
      )}
    </motion.div>
  );
}

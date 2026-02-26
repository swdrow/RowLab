/**
 * Training Log tab for the profile page.
 * Compact read-only list of 10 recent workouts with a "View all" link.
 * No filters or editing -- just a quick glance at recent activity.
 */

import { queryOptions, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'motion/react';
import {
  IconActivity,
  IconWaves,
  IconMountain,
  IconBike,
  IconFootprints,
  IconDumbbell,
  IconHeart,
  IconChevronRight,
} from '@/components/icons';
import type { IconComponent } from '@/types/icons';

import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { getSportFromWorkout } from '@/features/workouts/utils';
import { SPORT_CONFIG, type SportType } from '@/features/workouts/constants';
import type { Workout } from '@/features/workouts/types';
import { formatDistance, formatDuration, formatPace, formatRelativeDate } from '@/lib/format';

/* ------------------------------------------------------------------ */
/* Recent workouts query (simple, no infinite scroll)                   */
/* ------------------------------------------------------------------ */

function recentWorkoutsOptions() {
  return queryOptions<Workout[]>({
    queryKey: [...queryKeys.workouts.all, 'recent-10'] as const,
    staleTime: 60_000,
    queryFn: async () => {
      const data = await apiClient.get<{ items?: Workout[] }>('/api/u/workouts', {
        params: { limit: '10' },
      });
      return data.items ?? [];
    },
  });
}

/* ------------------------------------------------------------------ */
/* Icon lookup                                                         */
/* ------------------------------------------------------------------ */

const ICON_MAP: Record<string, IconComponent> = {
  Waves: IconWaves,
  Mountain: IconMountain,
  Bike: IconBike,
  Footprints: IconFootprints,
  Dumbbell: IconDumbbell,
  Heart: IconHeart,
  Activity: IconActivity,
};

function resolveSportIcon(sport: SportType): IconComponent {
  return ICON_MAP[SPORT_CONFIG[sport].icon] ?? IconActivity;
}

/* ------------------------------------------------------------------ */
/* Shimmer loading skeleton                                            */
/* ------------------------------------------------------------------ */

function TrainingLogSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="panel rounded-lg px-3 py-2.5 flex items-center gap-3 animate-shimmer"
        >
          <div className="w-8 h-8 rounded-lg bg-void-deep shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-20 rounded bg-void-deep" />
            <div className="h-2.5 w-32 rounded bg-void-deep" />
          </div>
          <div className="h-3 w-12 rounded bg-void-deep" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

function EmptyState() {
  return (
    <div className="panel rounded-xl p-8 text-center">
      <IconActivity width={32} height={32} className="text-text-faint mx-auto mb-3" />
      <p className="text-sm font-medium text-text-dim">No workouts yet</p>
      <p className="text-xs text-text-faint mt-1">Log your first workout to see it here.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Compact workout row                                                 */
/* ------------------------------------------------------------------ */

const DASH = '\u2014';

function CompactRow({
  workout,
}: {
  workout: {
    id: string;
    date: string;
    type: string | null;
    machineType: string | null;
    distanceM: number | null;
    durationSeconds: number | null;
    avgPace: number | null;
  };
}) {
  const navigate = useNavigate();
  const sport = getSportFromWorkout(workout);
  const config = SPORT_CONFIG[sport];
  const Icon = resolveSportIcon(sport);

  const handleClick = () => {
    void navigate({ to: '/workouts/$workoutId' as string, params: { workoutId: workout.id } });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg hover:bg-void-overlay transition-colors cursor-pointer group"
    >
      {/* Sport icon */}
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-void-deep">
        <Icon width={16} height={16} className={`text-${config.color}`} />
      </div>

      {/* Sport + date */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-bright truncate">{config.label}</p>
        <p className="text-[10px] text-text-faint">{formatRelativeDate(workout.date)}</p>
      </div>

      {/* Key metrics */}
      <div className="flex items-center gap-4 shrink-0">
        <span className="font-mono text-xs text-text-dim tabular-nums">
          {formatDistance(workout.distanceM)}
        </span>
        <span className="font-mono text-xs text-text-faint tabular-nums hidden sm:inline">
          {formatDuration(workout.durationSeconds)}
        </span>
        <span className="font-mono text-xs text-text-faint tabular-nums hidden md:inline">
          {workout.avgPace ? formatPace(workout.avgPace, workout.machineType) : DASH}
        </span>
      </div>

      {/* Chevron */}
      <IconChevronRight
        width={14}
        height={14}
        className="text-text-faint shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* TrainingLogTab                                                      */
/* ------------------------------------------------------------------ */

export function TrainingLogTab() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery(recentWorkoutsOptions());

  if (isLoading) return <TrainingLogSkeleton />;
  if (!data || data.length === 0) return <EmptyState />;

  return (
    <motion.div
      className="space-y-1"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {data.map((workout) => (
        <CompactRow key={workout.id} workout={workout} />
      ))}

      {/* View all link */}
      <div className="pt-3 text-center">
        <button
          type="button"
          onClick={() => void navigate({ to: '/workouts' as string })}
          className="text-sm font-medium text-accent-teal hover:text-accent-teal/80 transition-colors inline-flex items-center gap-1"
        >
          View all workouts
          <IconChevronRight width={14} height={14} />
        </button>
      </div>
    </motion.div>
  );
}

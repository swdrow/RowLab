/**
 * Training Log tab for the profile page.
 * Compact read-only list of 10 recent workouts with a "View all" link.
 * No filters or editing -- just a quick glance at recent activity.
 */

import { queryOptions, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'motion/react';
import {
  Activity,
  Waves,
  Mountain,
  Bike,
  Footprints,
  Dumbbell,
  Heart,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { getSportFromWorkout } from '@/features/workouts/utils';
import { SPORT_CONFIG, type SportType } from '@/features/workouts/constants';
import type { Workout } from '@/features/workouts/types';
import { formatDistance, formatDuration, formatPace, formatRelativeDate } from '@/lib/format';
import { listContainerVariants, listItemVariants, SPRING_SMOOTH } from '@/lib/animations';

/* ------------------------------------------------------------------ */
/* Recent workouts query (simple, no infinite scroll)                   */
/* ------------------------------------------------------------------ */

function recentWorkoutsOptions() {
  return queryOptions<Workout[]>({
    queryKey: [...queryKeys.workouts.all, 'recent-10'] as const,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await api.get('/api/u/workouts', { params: { limit: '10' } });
      return (res.data.data?.items ?? []) as Workout[];
    },
  });
}

/* ------------------------------------------------------------------ */
/* Icon lookup                                                         */
/* ------------------------------------------------------------------ */

const ICON_MAP: Record<string, LucideIcon> = {
  Waves,
  Mountain,
  Bike,
  Footprints,
  Dumbbell,
  Heart,
  Activity,
};

function resolveSportIcon(sport: SportType): LucideIcon {
  return ICON_MAP[SPORT_CONFIG[sport].icon] ?? Activity;
}

/* ------------------------------------------------------------------ */
/* Shimmer loading skeleton                                            */
/* ------------------------------------------------------------------ */

function TrainingLogSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass rounded-lg px-3 py-2.5 flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-lg bg-ink-well shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-20 rounded bg-ink-well" />
            <div className="h-2.5 w-32 rounded bg-ink-well" />
          </div>
          <div className="h-3 w-12 rounded bg-ink-well" />
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
    <div className="glass rounded-xl p-8 text-center">
      <Activity size={32} className="text-ink-muted mx-auto mb-3" />
      <p className="text-sm font-medium text-ink-secondary">No workouts yet</p>
      <p className="text-xs text-ink-tertiary mt-1">Log your first workout to see it here.</p>
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
    <motion.button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg hover:bg-ink-hover transition-colors cursor-pointer group"
      variants={listItemVariants}
      transition={SPRING_SMOOTH}
    >
      {/* Sport icon */}
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-ink-well">
        <Icon size={16} className={`text-${config.color}`} />
      </div>

      {/* Sport + date */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-primary truncate">{config.label}</p>
        <p className="text-[10px] text-ink-tertiary">{formatRelativeDate(workout.date)}</p>
      </div>

      {/* Key metrics */}
      <div className="flex items-center gap-4 shrink-0">
        <span className="font-mono text-xs text-ink-secondary tabular-nums">
          {formatDistance(workout.distanceM)}
        </span>
        <span className="font-mono text-xs text-ink-muted tabular-nums hidden sm:inline">
          {formatDuration(workout.durationSeconds)}
        </span>
        <span className="font-mono text-xs text-ink-muted tabular-nums hidden md:inline">
          {workout.avgPace ? formatPace(workout.avgPace, workout.machineType) : DASH}
        </span>
      </div>

      {/* Chevron */}
      <ChevronRight
        size={14}
        className="text-ink-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </motion.button>
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
      variants={listContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {data.map((workout) => (
        <CompactRow key={workout.id} workout={workout} />
      ))}

      {/* View all link */}
      <motion.div
        className="pt-3 text-center"
        variants={listItemVariants}
        transition={SPRING_SMOOTH}
      >
        <button
          type="button"
          onClick={() => void navigate({ to: '/workouts' as string })}
          className="text-sm font-medium text-accent-copper hover:text-accent-copper/80 transition-colors inline-flex items-center gap-1"
        >
          View all workouts
          <ChevronRight size={14} />
        </button>
      </motion.div>
    </motion.div>
  );
}

/**
 * Recent workouts section with 5-workout list and View All link.
 * Staggered animation on mount. Section-level empty state when no workouts.
 * Ref: DASH-02 (recent workouts).
 */

import { useNavigate } from '@tanstack/react-router';
import { motion } from 'motion/react';
import { IconDumbbell } from '@/components/icons';
import { listContainerVariants, listItemVariants, SPRING_SMOOTH } from '@/lib/animations';
import { EmptyState } from '@/components/ui/EmptyState';
import { FancySectionHeader } from '@/components/ui/FancySectionHeader';
import { WorkoutCard } from './WorkoutCard';
import type { Workout } from '../types';

interface RecentWorkoutsProps {
  workouts: Workout[];
  totalCount: number;
  className?: string;
}

export function RecentWorkouts({ workouts, totalCount, className = '' }: RecentWorkoutsProps) {
  const navigate = useNavigate();

  if (workouts.length === 0) {
    return (
      <section className={className} aria-label="Recent Workouts">
        <FancySectionHeader
          label="Recent Workouts"
          icon={IconDumbbell}
          accentColor="teal"
          className="mb-4"
        />
        <EmptyState
          icon={IconDumbbell}
          title="No workouts yet"
          description="Log your first workout to start tracking your progress."
          action={{
            label: 'Log a Workout',
            onClick: () => navigate({ to: '/workouts', search: { action: 'new' } as never }),
          }}
          size="sm"
        />
      </section>
    );
  }

  return (
    <section className={className} aria-label="Recent Workouts">
      {/* Header with View All link */}
      <div className="flex items-center justify-between mb-4">
        <FancySectionHeader
          label="Recent Workouts"
          icon={IconDumbbell}
          accentColor="teal"
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => navigate({ to: '/workouts' as '/' })}
          className="shrink-0 text-sm text-accent-teal hover:text-accent-teal-hover transition-colors ml-3"
        >
          View all ({totalCount})
        </button>
      </div>

      {/* Workout cards with stagger animation */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={listContainerVariants}
        className="flex flex-col gap-3"
      >
        {workouts.map((workout) => (
          <motion.div key={workout.id} variants={listItemVariants} transition={SPRING_SMOOTH}>
            <WorkoutCard workout={workout} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

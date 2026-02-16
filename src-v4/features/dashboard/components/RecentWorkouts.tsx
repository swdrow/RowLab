/**
 * Recent workouts section with 5-workout list and View All link.
 * Staggered animation on mount. Section-level empty state when no workouts.
 * Ref: DASH-02 (recent workouts).
 */

import { useNavigate } from '@tanstack/react-router';
import { motion } from 'motion/react';
import { Dumbbell } from 'lucide-react';
import { listContainerVariants, listItemVariants, SPRING_SMOOTH } from '@/lib/animations';
import { EmptyState } from '@/components/ui/EmptyState';
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
        <h2 className="text-lg font-semibold text-ink-primary mb-4">Recent Workouts</h2>
        <EmptyState
          icon={Dumbbell}
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
        <h2 className="text-lg font-semibold text-ink-primary">Recent Workouts</h2>
        <button
          type="button"
          onClick={() => navigate({ to: '/workouts' as '/' })}
          className="text-sm text-accent-copper hover:text-accent-copper-hover transition-colors"
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

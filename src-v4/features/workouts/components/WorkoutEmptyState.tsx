/**
 * Empty state shown when the workout feed has no results.
 * Prompts first workout creation via the FAB.
 */

import { Dumbbell, Plus } from 'lucide-react';

interface WorkoutEmptyStateProps {
  onCreateNew: () => void;
}

export function WorkoutEmptyState({ onCreateNew }: WorkoutEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-14 h-14 rounded-2xl bg-ink-raised flex items-center justify-center mb-4">
        <Dumbbell size={24} className="text-ink-tertiary" />
      </div>
      <h3 className="text-ink-primary text-base font-medium mb-1">No workouts yet</h3>
      <p className="text-ink-secondary text-sm text-center max-w-xs mb-6">
        Log your first workout manually or connect a device to start syncing automatically.
      </p>
      <button
        type="button"
        onClick={onCreateNew}
        className="inline-flex items-center gap-2 bg-accent-copper hover:bg-accent-copper-hover text-ink-deep font-medium px-4 py-2.5 rounded-lg transition-colors"
      >
        <Plus size={16} />
        Log Workout
      </button>
    </div>
  );
}

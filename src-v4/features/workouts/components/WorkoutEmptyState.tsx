/**
 * Empty state shown when the workout feed has no results.
 * Prompts first workout creation via the FAB.
 */

import { IconDumbbell, IconPlus } from '@/components/icons';

interface WorkoutEmptyStateProps {
  onCreateNew: () => void;
}

export function WorkoutEmptyState({ onCreateNew }: WorkoutEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-14 h-14 rounded-2xl bg-void-raised flex items-center justify-center mb-4">
        <IconDumbbell width={24} height={24} className="text-text-faint" />
      </div>
      <h3 className="text-text-bright text-base font-display font-medium mb-1">No workouts yet</h3>
      <p className="text-text-dim text-sm text-center max-w-xs mb-6">
        Log your first workout manually or connect a device to start syncing automatically.
      </p>
      <button
        type="button"
        onClick={onCreateNew}
        className="inline-flex items-center gap-2 bg-accent-teal hover:bg-accent-teal-hover text-void-deep font-medium px-4 py-2.5 rounded-lg transition-colors"
      >
        <IconPlus width={16} height={16} />
        Log Workout
      </button>
    </div>
  );
}

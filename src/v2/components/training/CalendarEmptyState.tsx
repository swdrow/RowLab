import { Calendar, Plus, Copy } from 'lucide-react';
import { EmptyState } from '@v2/components/common/EmptyState';

/**
 * CalendarEmptyState - Display when no workouts are scheduled
 *
 * Shows helpful CTAs to add workout or apply template.
 */
export interface CalendarEmptyStateProps {
  /** Handler for Add Workout button */
  onAddWorkout?: () => void;
  /** Handler for Apply Template button */
  onApplyTemplate?: () => void;
}

export const CalendarEmptyState: React.FC<CalendarEmptyStateProps> = ({
  onAddWorkout,
  onApplyTemplate,
}) => (
  <EmptyState
    icon={Calendar}
    title="No workouts scheduled"
    description="Add your first workout to start building your training calendar. You can create individual workouts or apply a template."
    action={
      onAddWorkout
        ? { label: 'Add Workout', onClick: onAddWorkout, icon: Plus }
        : undefined
    }
    secondaryAction={
      onApplyTemplate
        ? { label: 'Apply Template', onClick: onApplyTemplate, icon: Copy }
        : undefined
    }
  />
);

/**
 * TrainingPlansEmptyState - Display when no training plans exist
 *
 * Shows CTA to create first plan.
 */
export interface TrainingPlansEmptyStateProps {
  /** Handler for Create Plan button */
  onCreatePlan?: () => void;
}

export const TrainingPlansEmptyState: React.FC<TrainingPlansEmptyStateProps> = ({
  onCreatePlan,
}) => (
  <EmptyState
    icon={Calendar}
    title="No training plans"
    description="Create your first training plan to organize workouts and assign them to athletes."
    action={
      onCreatePlan
        ? { label: 'Create Plan', onClick: onCreatePlan, icon: Plus }
        : undefined
    }
  />
);

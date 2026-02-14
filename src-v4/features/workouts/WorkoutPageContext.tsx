/**
 * Context for passing callbacks from the /workouts layout route
 * to child routes (index, calendar, detail).
 *
 * TanStack Router's Outlet doesn't support a context prop like React Router,
 * so we use a standard React context to share state between the layout and its children.
 */

import { createContext, useContext } from 'react';
import type { Workout } from './types';

export interface WorkoutPageContextValue {
  /** Open slide-over in edit mode with pre-filled data */
  onEdit: (workout: Workout) => void;
  /** Trigger delete confirmation for a workout */
  onDelete: (workout: Workout) => void;
  /** Open slide-over in create mode */
  onCreateNew: () => void;
}

export const WorkoutPageContext = createContext<WorkoutPageContextValue | null>(null);

export function useWorkoutPageContext(): WorkoutPageContextValue {
  const ctx = useContext(WorkoutPageContext);
  if (!ctx) {
    throw new Error('useWorkoutPageContext must be used within WorkoutPageContext.Provider');
  }
  return ctx;
}

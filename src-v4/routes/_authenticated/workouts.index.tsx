/**
 * /workouts (index route) -- default child of the workouts layout.
 *
 * Reads ?view= search param to switch between Feed and Calendar views.
 * Feed view renders WorkoutFeed with filters derived from URL params.
 * Calendar view placeholder renders until Plan 05 completes.
 */

import { createFileRoute } from '@tanstack/react-router';

import { useWorkoutPageContext } from '@/features/workouts/WorkoutPageContext';
import { WorkoutFeed } from '@/features/workouts/components/WorkoutFeed';
import type { WorkoutFilters } from '@/features/workouts/types';
import type { WorkoutSearch } from './workouts';

/* ------------------------------------------------------------------ */
/* Route definition                                                    */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute('/_authenticated/workouts/')({
  component: WorkoutsIndex,
});

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

function WorkoutsIndex() {
  const search = Route.useSearch() as WorkoutSearch;
  const { onEdit, onDelete, onCreateNew } = useWorkoutPageContext();

  // Derive filter object from search params
  const filters: WorkoutFilters = {
    type: search.type,
    source: search.source as WorkoutFilters['source'],
    dateFrom: search.dateFrom,
    dateTo: search.dateTo,
  };

  if (search.view === 'calendar') {
    return <CalendarPlaceholder />;
  }

  return (
    <WorkoutFeed
      filters={filters}
      onEdit={onEdit}
      onDelete={onDelete}
      onCreateNew={onCreateNew}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Calendar placeholder (Plan 05 creates the real CalendarView)        */
/* ------------------------------------------------------------------ */

function CalendarPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-14 h-14 rounded-2xl bg-ink-raised flex items-center justify-center mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-ink-tertiary"
        >
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
      </div>
      <h3 className="text-ink-primary text-base font-medium mb-1">Calendar View</h3>
      <p className="text-ink-secondary text-sm text-center max-w-xs">
        Calendar view is coming soon. Switch to Feed view to see your workouts.
      </p>
    </div>
  );
}

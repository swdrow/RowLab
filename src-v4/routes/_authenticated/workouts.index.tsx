/**
 * /workouts (index route) -- default child of the workouts layout.
 *
 * Reads ?view= search param to switch between Feed and Calendar views.
 * Feed view renders WorkoutFeed with filters derived from URL params.
 * Calendar view renders MonthlyCalendar/WeeklyTimeline via CalendarView.
 */

import { createFileRoute } from '@tanstack/react-router';
import { RouteErrorFallback } from '@/components/error/RouteErrorFallback';

import { CalendarView } from '@/features/workouts/components/CalendarView';
import { useWorkoutPageContext } from '@/features/workouts/WorkoutPageContext';
import { WorkoutFeed } from '@/features/workouts/components/WorkoutFeed';
import type { WorkoutFilters } from '@/features/workouts/types';
import type { WorkoutSearch } from './workouts';

/* ------------------------------------------------------------------ */
/* Route definition                                                    */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute('/_authenticated/workouts/')({
  errorComponent: RouteErrorFallback,
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
    return <CalendarView filters={filters} calendarMode={search.calendarMode} />;
  }

  return (
    <WorkoutFeed filters={filters} onEdit={onEdit} onDelete={onDelete} onCreateNew={onCreateNew} />
  );
}

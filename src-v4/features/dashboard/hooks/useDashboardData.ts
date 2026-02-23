/**
 * Combined dashboard data hook.
 *
 * Fetches stats, recent workouts, and PRs in parallel via useSuspenseQueries.
 * Suspense boundary must wrap any component using this hook.
 * Route loader should call ensureQueryData to start fetching before render.
 */
import { useSuspenseQueries } from '@tanstack/react-query';
import { statsQueryOptions, recentWorkoutsQueryOptions, prsQueryOptions } from '../api';
import type { DashboardData } from '../types';

export function useDashboardData(): DashboardData {
  const [statsQuery, workoutsQuery, prsQuery] = useSuspenseQueries({
    queries: [statsQueryOptions('7d'), recentWorkoutsQueryOptions(), prsQueryOptions()],
  });

  return {
    stats: statsQuery.data,
    workouts: workoutsQuery.data,
    prs: prsQuery.data,
    hasData: workoutsQuery.data.totalCount > 0,
  };
}

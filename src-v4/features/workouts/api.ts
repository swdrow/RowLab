/**
 * Workout query option factories for TanStack Query.
 *
 * workoutFeedOptions  -- infinite cursor-paginated feed
 * workoutDetailOptions -- single workout with splits + adjacency
 */
import { infiniteQueryOptions, queryOptions, type InfiniteData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { WorkoutFilters, WorkoutsData, WorkoutDetail } from './types';

// ---------------------------------------------------------------------------
// Feed (infinite scroll)
// ---------------------------------------------------------------------------

export function workoutFeedOptions(filters: WorkoutFilters) {
  return infiniteQueryOptions<
    WorkoutsData,
    Error,
    InfiniteData<WorkoutsData, string | null>,
    ReturnType<typeof queryKeys.workouts.feed>,
    string | null
  >({
    queryKey: queryKeys.workouts.feed(filters as Record<string, unknown>),
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string> = { limit: '20' };

      if (filters.type) params.type = filters.type;
      if (filters.source) params.source = filters.source;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (pageParam) params.cursor = pageParam;

      const res = await api.get('/api/u/workouts', { params });
      return res.data.data as WorkoutsData;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.cursor,
    staleTime: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Single workout detail
// ---------------------------------------------------------------------------

export function workoutDetailOptions(workoutId: string) {
  return queryOptions<WorkoutDetail>({
    queryKey: queryKeys.workouts.detail(workoutId),
    queryFn: async () => {
      const res = await api.get('/api/u/workouts/' + workoutId);
      return res.data.data as WorkoutDetail;
    },
    staleTime: 120_000,
    enabled: !!workoutId,
  });
}

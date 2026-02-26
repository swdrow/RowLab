/**
 * Dashboard query options -- real backend endpoints.
 *
 * Each queryFn calls /api/u/* and returns the data envelope.
 */
import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { StatsData, WorkoutsData, PRsData } from './types';

// ---------------------------------------------------------------------------
// Query option factories
// ---------------------------------------------------------------------------

export function statsQueryOptions(range?: string) {
  return queryOptions<StatsData>({
    queryKey: queryKeys.dashboard.stats(range),
    staleTime: 120_000,
    queryFn: async () => {
      const params = range ? { range } : undefined;
      return apiClient.get<StatsData>('/api/u/stats', { params });
    },
  });
}

export function recentWorkoutsQueryOptions(limit = 5) {
  return queryOptions<WorkoutsData>({
    queryKey: queryKeys.dashboard.workouts(limit),
    staleTime: 60_000,
    queryFn: () => apiClient.get<WorkoutsData>('/api/u/workouts', { params: { limit } }),
  });
}

export function prsQueryOptions() {
  return queryOptions<PRsData>({
    queryKey: queryKeys.dashboard.prs(),
    staleTime: 300_000,
    queryFn: () => apiClient.get<PRsData>('/api/u/prs'),
  });
}

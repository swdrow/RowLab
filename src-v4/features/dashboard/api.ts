/**
 * Dashboard query options -- real backend endpoints.
 *
 * Each queryFn calls /api/u/* and returns the data envelope.
 */
import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
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
      const res = await api.get('/api/u/stats', { params });
      return res.data.data as StatsData;
    },
  });
}

export function recentWorkoutsQueryOptions(limit = 5) {
  return queryOptions<WorkoutsData>({
    queryKey: queryKeys.dashboard.workouts(limit),
    staleTime: 60_000,
    queryFn: async () => {
      const res = await api.get('/api/u/workouts', { params: { limit } });
      return res.data.data as WorkoutsData;
    },
  });
}

export function prsQueryOptions() {
  return queryOptions<PRsData>({
    queryKey: queryKeys.dashboard.prs(),
    staleTime: 300_000,
    queryFn: async () => {
      const res = await api.get('/api/u/prs');
      return res.data.data as PRsData;
    },
  });
}

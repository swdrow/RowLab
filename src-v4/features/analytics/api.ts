/**
 * Analytics query options and hooks.
 *
 * Each queryFn calls /api/u/analytics/* and returns the data envelope.
 * Follows the exact pattern established in profile/api.ts.
 */
import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type {
  PMCResponse,
  VolumeResponse,
  AnalyticsSettings,
  PMCRange,
  VolumeRange,
  VolumeGranularity,
  VolumeMetric,
} from './types';

// ---------------------------------------------------------------------------
// Query option factories
// ---------------------------------------------------------------------------

export function pmcQueryOptions(range: PMCRange = '90d', sport: string | null = null) {
  return queryOptions<PMCResponse>({
    queryKey: queryKeys.analytics.pmc({ range, sport }),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const params = new URLSearchParams({ range });
      if (sport) params.append('sport', sport);
      const res = await api.get(`/api/u/analytics/pmc?${params}`);
      return res.data.data as PMCResponse;
    },
  });
}

export function volumeQueryOptions(
  range: VolumeRange = '12w',
  granularity: VolumeGranularity = 'weekly',
  metric: VolumeMetric = 'distance'
) {
  return queryOptions<VolumeResponse>({
    queryKey: queryKeys.analytics.volume({ range, granularity, metric }),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const params = new URLSearchParams({ range, granularity, metric });
      const res = await api.get(`/api/u/analytics/volume?${params}`);
      return res.data.data as VolumeResponse;
    },
  });
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useAnalyticsPMC(range: PMCRange = '90d', sport: string | null = null) {
  return useQuery(pmcQueryOptions(range, sport));
}

export function useAnalyticsVolume(
  range: VolumeRange = '12w',
  granularity: VolumeGranularity = 'weekly',
  metric: VolumeMetric = 'distance'
) {
  return useQuery(volumeQueryOptions(range, granularity, metric));
}

// ---------------------------------------------------------------------------
// Analytics settings
// ---------------------------------------------------------------------------

export function analyticsSettingsQueryOptions() {
  return queryOptions<AnalyticsSettings>({
    queryKey: [...queryKeys.analytics.all, 'settings'] as const,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const res = await api.get('/api/u/analytics/settings');
      return res.data.data as AnalyticsSettings;
    },
  });
}

export function useAnalyticsSettings() {
  return useQuery(analyticsSettingsQueryOptions());
}

export function useUpdateAnalyticsSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<AnalyticsSettings>) => {
      const res = await api.patch('/api/u/analytics/settings', settings);
      return res.data.data;
    },
    onSuccess: () => {
      // Invalidate settings + PMC (recalculates with new thresholds)
      void queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

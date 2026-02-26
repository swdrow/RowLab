/**
 * Profile query options and mutation hooks.
 *
 * Each queryFn calls /api/u/* and returns the data envelope.
 * Follows the exact pattern established in dashboard/api.ts.
 */
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { ProfileData, TrendData, AchievementData, PRsByMachine, StatsData } from './types';

// ---------------------------------------------------------------------------
// Query option factories
// ---------------------------------------------------------------------------

export function profileQueryOptions() {
  return queryOptions<ProfileData>({
    queryKey: queryKeys.profile.data(),
    staleTime: 120_000,
    queryFn: async () => {
      const res = await api.get('/api/u/profile');
      return res.data.data as ProfileData;
    },
  });
}

export function profileStatsQueryOptions(range?: string) {
  return queryOptions<StatsData>({
    queryKey: queryKeys.profile.stats(range),
    staleTime: 120_000,
    queryFn: async () => {
      const params = range ? { range } : undefined;
      const res = await api.get('/api/u/stats', { params });
      return res.data.data as StatsData;
    },
  });
}

export function profilePRsQueryOptions() {
  return queryOptions<PRsByMachine>({
    queryKey: queryKeys.profile.prs(),
    staleTime: 300_000,
    queryFn: async () => {
      const res = await api.get('/api/u/prs');
      return res.data.data as PRsByMachine;
    },
  });
}

export function profileTrendsQueryOptions(range: string) {
  return queryOptions<TrendData>({
    queryKey: queryKeys.profile.trends(range),
    staleTime: 300_000,
    queryFn: async () => {
      const res = await api.get('/api/u/profile/trends', { params: { range } });
      return res.data.data as TrendData;
    },
  });
}

export function profileAchievementsQueryOptions() {
  return queryOptions<AchievementData>({
    queryKey: queryKeys.profile.achievements(),
    staleTime: 300_000,
    queryFn: async () => {
      const res = await api.get('/api/u/achievements');
      return res.data.data as AchievementData;
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Update profile fields (name, bio). Uses optimistic update for instant feedback. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name?: string; bio?: string }) => {
      const res = await api.patch('/api/u/profile', data);
      return res.data.data as ProfileData;
    },
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.profile.data() });

      // Snapshot current value
      const previous = queryClient.getQueryData<ProfileData>(queryKeys.profile.data());

      // Optimistic update
      if (previous) {
        queryClient.setQueryData<ProfileData>(queryKeys.profile.data(), {
          ...previous,
          ...newData,
        });
      }

      return { previous };
    },
    onError: (_err, _newData, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.profile.data(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.data() });
    },
  });
}

/** Upload avatar image. */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/api/u/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data as ProfileData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.data() });
    },
  });
}

/** Upload banner image. */
export function useUploadBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('banner', file);
      const res = await api.post('/api/u/profile/banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data as ProfileData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.data() });
    },
  });
}

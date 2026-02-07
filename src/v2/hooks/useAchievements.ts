import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useShowGamification } from './useGamificationPreference';
import type {
  AchievementWithProgress,
  AchievementsResponse,
  GamificationApiResponse,
} from '../types/gamification';

/**
 * Query key factory for achievements
 */

/**
 * Fetch all achievements with current user's progress
 */
async function fetchAchievements(): Promise<AchievementsResponse> {
  const response = await api.get<GamificationApiResponse<AchievementsResponse>>(
    '/api/v1/achievements'
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch achievements');
  }

  return response.data.data;
}

/**
 * Hook for all achievements with progress
 */
export function useAchievements() {
  const { isAuthenticated, isInitialized } = useAuth();
  const showGamification = useShowGamification();

  const query = useQuery({
    queryKey: queryKeys.achievements.list(),
    queryFn: fetchAchievements,
    enabled: isInitialized && isAuthenticated && showGamification,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    achievements: query.data?.achievements || [],
    unlockedCount: query.data?.unlockedCount || 0,
    totalCount: query.data?.totalCount || 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Fetch achievements for a specific athlete
 */
export function useAthleteAchievements(athleteId: string) {
  const { isAuthenticated, isInitialized } = useAuth();
  const showGamification = useShowGamification();

  const query = useQuery({
    queryKey: queryKeys.achievements.athlete(athleteId),
    queryFn: async () => {
      const response = await api.get<GamificationApiResponse<AchievementsResponse>>(
        `/api/v1/achievements/athlete/${athleteId}`
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to fetch achievements');
      }
      return response.data.data;
    },
    enabled: isInitialized && isAuthenticated && showGamification && !!athleteId,
    staleTime: 2 * 60 * 1000,
  });

  return {
    achievements: query.data?.achievements || [],
    unlockedCount: query.data?.unlockedCount || 0,
    totalCount: query.data?.totalCount || 0,
    isLoading: query.isLoading,
    error: query.error,
  };
}

/**
 * Fetch pinned achievements for display on profile
 */
export function usePinnedAchievements(athleteId: string) {
  const { isAuthenticated, isInitialized } = useAuth();
  const showGamification = useShowGamification();

  return useQuery({
    queryKey: queryKeys.achievements.pinned(athleteId),
    queryFn: async () => {
      const response = await api.get<GamificationApiResponse<{ pinned: AchievementWithProgress[] }>>(
        `/api/v1/achievements/pinned/${athleteId}`
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to fetch pinned achievements');
      }
      return response.data.data.pinned;
    },
    enabled: isInitialized && isAuthenticated && showGamification && !!athleteId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook for toggling pinned status
 */
export function useTogglePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (achievementId: string) => {
      const response = await api.post<GamificationApiResponse<{ isPinned: boolean }>>(
        `/api/v1/achievements/${achievementId}/toggle-pin`
      );
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to toggle pin');
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.achievements.all });
    },
  });
}

/**
 * Hook to manually trigger progress check
 */
export function useCheckProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<GamificationApiResponse<{ newlyUnlocked: { id: string; name: string; rarity: string }[] }>>(
        '/api/v1/achievements/check-progress'
      );
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to check progress');
      }
      return response.data.data?.newlyUnlocked || [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.achievements.all });
    },
  });
}

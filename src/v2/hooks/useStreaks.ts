import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useShowGamification } from './useGamificationPreference';
import type { Streak, StreakSummaryResponse, GamificationApiResponse } from '../types/gamification';

/**
 * Query key factory for streaks
 */

/**
 * Hook for current user's streaks
 */
export function useStreaks() {
  const { isAuthenticated, isInitialized } = useAuth();
  const showGamification = useShowGamification();

  return useQuery({
    queryKey: queryKeys.streaks.mine(),
    queryFn: async () => {
      const response = await api.get<GamificationApiResponse<StreakSummaryResponse>>(
        '/api/v1/streaks'
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to fetch streaks');
      }
      return response.data.data;
    },
    enabled: isInitialized && isAuthenticated && showGamification,
    staleTime: 5 * 60 * 1000, // 5 minutes - streaks don't change rapidly
  });
}

/**
 * Hook for a specific athlete's streaks
 */
export function useAthleteStreaks(athleteId: string) {
  const { isAuthenticated, isInitialized } = useAuth();
  const showGamification = useShowGamification();

  return useQuery({
    queryKey: queryKeys.streaks.athlete(athleteId),
    queryFn: async () => {
      const response = await api.get<GamificationApiResponse<StreakSummaryResponse>>(
        `/api/v1/streaks/athlete/${athleteId}`
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to fetch streaks');
      }
      return response.data.data;
    },
    enabled: isInitialized && isAuthenticated && showGamification && !!athleteId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for streak configuration
 */
export function useStreakConfig() {
  const { isAuthenticated, isInitialized } = useAuth();

  return useQuery({
    queryKey: queryKeys.streaks.config(),
    queryFn: async () => {
      const response = await api.get<GamificationApiResponse<{ config: Record<string, number> }>>(
        '/api/v1/streaks/config'
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to fetch config');
      }
      return response.data.data.config;
    },
    enabled: isInitialized && isAuthenticated,
    staleTime: 60 * 60 * 1000, // 1 hour - config rarely changes
  });
}

/**
 * Get streak display info with icons and status
 */
export function getStreakDisplayInfo(streak: Streak) {
  const icons = {
    attendance: 'Calendar',
    workout: 'Dumbbell',
    pr: 'Trophy',
    challenge: 'Flag',
  };

  const labels = {
    attendance: 'Attendance Streak',
    workout: 'Workout Streak',
    pr: 'PR Streak',
    challenge: 'Challenge Streak',
  };

  let status: 'active' | 'at-risk' | 'broken' = 'broken';
  if (streak.isActive) {
    status = streak.gracePeriodUsed > 0 ? 'at-risk' : 'active';
  }

  let graceInfo: string | undefined;
  if (streak.isActive && streak.gracePeriodUsed > 0) {
    graceInfo = `${streak.gracePeriodUsed} ${streak.gracePeriodUsed === 1 ? 'day' : 'days'} grace used`;
  }

  return {
    category: streak.category,
    icon: icons[streak.category] || 'Fire',
    label: labels[streak.category] || 'Streak',
    current: streak.currentLength,
    longest: streak.longestLength,
    status,
    graceInfo,
  };
}

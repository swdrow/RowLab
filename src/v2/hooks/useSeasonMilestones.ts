import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useShowGamification } from './useGamificationPreference';
import type { JourneyMilestone, GamificationApiResponse } from '../types/gamification';

interface SeasonMilestonesResponse {
  milestones: JourneyMilestone[];
  stats: {
    totalMeters: number;
    totalSessions: number;
    totalPRs: number;
    totalAchievements: number;
    totalChallenges: number;
  };
  seasonPeriod: {
    start: string;
    end: string;
  };
}

/**
 * Hook for season milestones timeline
 * Fetches key events from the season (PRs, achievements, challenges, regattas)
 */
export function useSeasonMilestones(startDate?: string, endDate?: string) {
  const { isAuthenticated, isInitialized } = useAuth();
  const showGamification = useShowGamification();

  const query = useQuery({
    queryKey: queryKeys.seasons.milestones(startDate, endDate),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `/api/v1/seasons/milestones${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<GamificationApiResponse<SeasonMilestonesResponse>>(url);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to fetch season milestones');
      }

      return response.data.data;
    },
    enabled: isInitialized && isAuthenticated && showGamification,
    staleTime: 5 * 60 * 1000, // 5 minutes - milestones don't change frequently
  });

  return {
    milestones: query.data?.milestones || [],
    stats: query.data?.stats,
    seasonPeriod: query.data?.seasonPeriod,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

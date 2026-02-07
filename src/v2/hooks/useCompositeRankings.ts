import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { queryKeys } from '../lib/queryKeys';
import type {
  CompositeRankingsResponse,
  RankingWeightProfile,
  SideSpecificRating,
  Side,
} from '../types/advancedRanking';
import type { ApiResponse } from '../types/dashboard';

// ============================================
// QUERY KEYS
// ============================================

export const compositeRankingKeys = {
  all: ['compositeRanking'] as const,
  rankings: (teamId: string, profileId: string) =>
    [...compositeRankingKeys.all, 'rankings', teamId, profileId] as const,
  profiles: () => [...compositeRankingKeys.all, 'profiles'] as const,
  bySide: (teamId: string, side: Side | null) =>
    [...compositeRankingKeys.all, 'bySide', teamId, side] as const,
  athleteSides: (athleteId: string) =>
    [...compositeRankingKeys.all, 'athleteSides', athleteId] as const,
};

// ============================================
// FETCH FUNCTIONS
// ============================================

async function fetchCompositeRankings(
  teamId: string,
  profileId: string,
  customWeights?: { onWater: number; erg: number; attendance: number }
): Promise<CompositeRankingsResponse> {
  let url = `/api/v1/advanced-ranking/composite?teamId=${teamId}&profileId=${profileId}`;

  if (customWeights) {
    url += `&customWeights=${encodeURIComponent(JSON.stringify(customWeights))}`;
  }

  const response = await api.get<ApiResponse<CompositeRankingsResponse>>(url);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch composite rankings');
  }

  return response.data.data;
}

async function fetchWeightProfiles(): Promise<RankingWeightProfile[]> {
  const response = await api.get<ApiResponse<{ profiles: RankingWeightProfile[] }>>(
    '/api/v1/advanced-ranking/weight-profiles'
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch weight profiles');
  }

  return response.data.data.profiles;
}

async function fetchRankingsBySide(
  teamId: string,
  side: Side | null
): Promise<{
  rankings: Array<{ rank: number; athleteId: string; ratingValue: number; athlete: any }>;
  side: Side | null;
}> {
  let url = `/api/v1/advanced-ranking/by-side?teamId=${teamId}`;
  if (side) url += `&side=${side}`;

  const response = await api.get<
    ApiResponse<{
      rankings: Array<{ rank: number; athleteId: string; ratingValue: number; athlete: any }>;
      side: Side | null;
    }>
  >(url);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch side rankings');
  }

  return response.data.data;
}

async function fetchAthleteSideRatings(
  athleteId: string,
  teamId: string
): Promise<SideSpecificRating & { athlete: any }> {
  const response = await api.get<ApiResponse<SideSpecificRating & { athlete: any }>>(
    `/api/v1/advanced-ranking/athlete/${athleteId}/sides?teamId=${teamId}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch athlete side ratings');
  }

  return response.data.data;
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Hook for fetching composite rankings with configurable weights
 *
 * @param profileId - Weight profile ID ('balanced', 'performance-first', 'reliability', 'custom')
 * @param customWeights - Custom weights when profileId is 'custom'
 *
 * @example
 * const { rankings, profile, isLoading } = useCompositeRankings('balanced');
 * // Each ranking has: compositeScore, breakdown (onWater, erg, attendance contributions)
 */
export function useCompositeRankings(
  profileId: string = 'balanced',
  customWeights?: { onWater: number; erg: number; attendance: number }
) {
  const { isAuthenticated, isInitialized } = useAuth();
  const { activeTeamId } = useAuth();

  const query = useQuery({
    queryKey: compositeRankingKeys.rankings(activeTeamId || '', profileId),
    queryFn: () => fetchCompositeRankings(activeTeamId!, profileId, customWeights),
    enabled: isInitialized && isAuthenticated && !!activeTeamId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    response: query.data,
    rankings: query.data?.rankings || [],
    profile: query.data?.profile,
    calculatedAt: query.data?.calculatedAt,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for fetching available weight profiles
 *
 * @example
 * const { profiles, isLoading } = useWeightProfiles();
 * // profiles includes: Performance-First, Balanced, Reliability-Focus
 */
export function useWeightProfiles() {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: compositeRankingKeys.profiles(),
    queryFn: fetchWeightProfiles,
    enabled: isInitialized && isAuthenticated,
    staleTime: 60 * 60 * 1000, // Profiles rarely change
  });

  return {
    profiles: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

/**
 * Hook for fetching rankings filtered by side
 *
 * @param side - 'Port', 'Starboard', 'Cox', or null for combined
 *
 * @example
 * const { rankings, isLoading } = useSideRankings('Port');
 * // Rankings only include port-side ratings
 */
export function useSideRankings(side: Side | null = null) {
  const { isAuthenticated, isInitialized } = useAuth();
  const { activeTeamId } = useAuth();

  const query = useQuery({
    queryKey: compositeRankingKeys.bySide(activeTeamId || '', side),
    queryFn: () => fetchRankingsBySide(activeTeamId!, side),
    enabled: isInitialized && isAuthenticated && !!activeTeamId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    rankings: query.data?.rankings || [],
    side: query.data?.side,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for fetching all side-specific ratings for an athlete
 *
 * @param athleteId - Athlete ID to fetch ratings for
 *
 * @example
 * const { sideRatings, primarySide, athlete } = useAthleteSideRatings('athlete-id');
 * // sideRatings has port, starboard, cox ratings separately
 */
export function useAthleteSideRatings(athleteId: string | null) {
  const { isAuthenticated, isInitialized } = useAuth();
  const { activeTeamId } = useAuth();

  const query = useQuery({
    queryKey: compositeRankingKeys.athleteSides(athleteId || ''),
    queryFn: () => fetchAthleteSideRatings(athleteId!, activeTeamId!),
    enabled: isInitialized && isAuthenticated && !!athleteId && !!activeTeamId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    athlete: query.data?.athlete,
    primarySide: query.data?.primarySide,
    ratings: query.data?.ratings,
    primaryRating: query.data?.primaryRating,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

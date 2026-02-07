import { useQuery } from '@tanstack/react-query';
import api from '../../../utils/api';
import { useAuth } from '../../../contexts/AuthContext';
import { queryKeys } from '../../../lib/queryKeys';
import type { AthleteDetailData, ApiResponse } from '../../../types/athletes';

/**
 * Fetch a single athlete with extended detail data (attendance, erg tests, PRs, ranking).
 */
async function fetchAthleteDetail(athleteId: string): Promise<AthleteDetailData> {
  const response = await api.get<ApiResponse<{ athlete: AthleteDetailData }>>(
    `/api/v1/athletes/${athleteId}?detail=true`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch athlete detail');
  }

  return response.data.data.athlete;
}

/**
 * Hook for fetching a single athlete with extended detail data.
 * Includes recentAttendance, recentErgTests, personalRecords, seatRaceRating, teamRank.
 * Only enabled when athleteId is provided and user is authenticated.
 */
export function useAthleteDetail(athleteId: string | null) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.athletes.detail(athleteId ?? ''),
    queryFn: () => fetchAthleteDetail(athleteId!),
    enabled: !!athleteId && isInitialized && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    athlete: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}

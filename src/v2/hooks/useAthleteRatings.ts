import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { queryKeys } from '../lib/queryKeys';
import type { RatingWithAthlete, Side, ApiResponse } from '../types/seatRacing';

/**
 * Options for fetching athlete ratings
 */
interface RatingsOptions {
  ratingType?: string; // 'seat_race_elo', 'combined'
  minRaces?: number; // Minimum number of races for confidence filtering
  side?: Side; // Client-side filter for Port/Starboard/Cox
}

/**
 * Fetch athlete ratings for active team
 *
 * NOTE: This endpoint (/api/v1/ratings) does NOT exist yet.
 * Plan 09-08 creates this route in server/routes/ratings.js.
 * This hook will return errors until Plan 09-08 executes - this is expected.
 */
async function fetchAthleteRatings(
  teamId: string,
  options: RatingsOptions = {}
): Promise<RatingWithAthlete[]> {
  const params = new URLSearchParams();

  params.append('teamId', teamId);

  if (options.ratingType) {
    params.append('type', options.ratingType);
  }

  if (options.minRaces !== undefined) {
    params.append('minRaces', options.minRaces.toString());
  }

  const url = `/api/v1/ratings?${params.toString()}`;
  const response = await api.get<ApiResponse<{ ratings: RatingWithAthlete[] }>>(url);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch athlete ratings');
  }

  let ratings = response.data.data.ratings;

  // Client-side filter by side if specified
  if (options.side) {
    ratings = ratings.filter((rating) => rating.athlete.side === options.side);
  }

  return ratings;
}

/**
 * Fetch rating history for a single athlete
 *
 * NOTE: This endpoint may not exist in Phase 9 MVP.
 * Returns empty array if API doesn't exist.
 */
async function fetchAthleteRatingHistory(athleteId: string): Promise<RatingWithAthlete[]> {
  try {
    const response = await api.get<ApiResponse<{ history: RatingWithAthlete[] }>>(
      `/api/v1/ratings/history?athleteId=${athleteId}`
    );

    if (!response.data.success || !response.data.data) {
      // API doesn't exist yet, return empty for MVP
      return [];
    }

    return response.data.data.history;
  } catch (error) {
    // API doesn't exist yet, return empty for MVP
    return [];
  }
}

/**
 * Recalculate all ratings from scratch
 */
async function recalculateRatings(): Promise<{ updated: number }> {
  const response = await api.post<ApiResponse<{ updated: number }>>('/api/v1/ratings/recalculate');

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to recalculate ratings');
  }

  return response.data.data;
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Hook for fetching athlete ratings with optional filtering
 *
 * @param options - Filtering options (ratingType, minRaces, side)
 * @returns Ranked athletes sorted by rating descending
 *
 * @example
 * // Get all seat race ELO ratings
 * const { ratings } = useAthleteRatings({ ratingType: 'seat_race_elo' });
 *
 * @example
 * // Get port-side ratings with at least 3 races
 * const { ratings } = useAthleteRatings({
 *   ratingType: 'seat_race_elo',
 *   side: 'Port',
 *   minRaces: 3
 * });
 */
export function useAthleteRatings(options?: RatingsOptions) {
  const { isAuthenticated, isInitialized, activeTeamId } = useAuth();

  const query = useQuery({
    queryKey: [
      ...queryKeys.ratings.rankings(options?.side),
      options?.ratingType,
      options?.minRaces,
    ],
    queryFn: () => fetchAthleteRatings(activeTeamId!, options),
    enabled: isInitialized && isAuthenticated && !!activeTeamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    ratings: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for fetching rating history for a single athlete
 *
 * @param athleteId - Athlete ID to fetch history for
 * @returns Rating history array for trend visualization
 *
 * NOTE: This hook may return empty array if API doesn't exist yet (Phase 9 MVP).
 */
export function useAthleteRatingHistory(athleteId: string | null) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.ratings.athlete(athleteId || ''),
    queryFn: () => fetchAthleteRatingHistory(athleteId!),
    enabled: isInitialized && isAuthenticated && !!athleteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    history: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Hook for recalculating all athlete ratings from scratch
 *
 * Useful for:
 * - Fixing rating drift from algorithm changes
 * - Resetting after data cleanup
 * - Debugging rating issues
 *
 * @example
 * const { recalculate, isRecalculating } = useRecalculateRatings();
 *
 * const handleRecalculate = async () => {
 *   await recalculate();
 *   // Ratings refreshed automatically via query invalidation
 * };
 */
export function useRecalculateRatings() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: recalculateRatings,
    onSuccess: () => {
      // Invalidate all rating queries to refetch with updated values
      queryClient.invalidateQueries({ queryKey: queryKeys.ratings.all });
    },
  });

  return {
    recalculate: mutation.mutate,
    recalculateAsync: mutation.mutateAsync,
    isRecalculating: mutation.isPending,
    recalculateError: mutation.error,
  };
}

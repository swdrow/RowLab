import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { queryKeys } from '../lib/queryKeys';
import type { AthleteAvailability, AvailabilityDay, ApiResponse } from '../types/coach';

// Format date for query key stability
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Fetch team-wide availability for date range
 * Waits for auth to be initialized before fetching
 */
export function useTeamAvailability(startDate: Date, endDate: Date) {
  const { isAuthenticated, isInitialized } = useAuth();

  return useQuery({
    queryKey: queryKeys.availability.team({
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    }),
    queryFn: async () => {
      const response = await api.get<ApiResponse<{ availability: AthleteAvailability[] }>>(
        '/api/v1/availability/team',
        {
          params: {
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
          },
        }
      );
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to fetch team availability');
      }
      return response.data.data?.availability || [];
    },
    // Only fetch when auth is initialized and user is authenticated
    enabled: isInitialized && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch single athlete's availability
 * Waits for auth to be initialized before fetching
 */
export function useAthleteAvailability(
  athleteId: string | undefined,
  startDate: Date,
  endDate: Date
) {
  const { isAuthenticated, isInitialized } = useAuth();

  return useQuery({
    queryKey: [
      ...queryKeys.availability.athlete(athleteId || ''),
      startDate?.toISOString(),
      endDate?.toISOString(),
    ],
    queryFn: async () => {
      if (!athleteId) return [];
      const response = await api.get<ApiResponse<{ availability: AvailabilityDay[] }>>(
        `/api/v1/availability/${athleteId}`,
        {
          params: {
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
          },
        }
      );
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to fetch availability');
      }
      return response.data.data?.availability || [];
    },
    enabled: !!athleteId && isInitialized && isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Mutation to update athlete availability
 */
export function useUpdateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      athleteId,
      availability,
    }: {
      athleteId: string;
      availability: AvailabilityDay[];
    }) => {
      const response = await api.put<ApiResponse<{ availability: AvailabilityDay[] }>>(
        `/api/v1/availability/${athleteId}`,
        { availability }
      );
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to update availability');
      }
      return response.data.data?.availability;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.availability.all });
      const previousAthlete = queryClient.getQueryData(
        queryKeys.availability.athlete(variables.athleteId)
      );

      // Optimistic update for athlete query
      queryClient.setQueryData(
        queryKeys.availability.athlete(variables.athleteId),
        variables.availability
      );

      return { previousAthlete };
    },
    onError: (_err, variables, context) => {
      if (context?.previousAthlete !== undefined) {
        queryClient.setQueryData(
          queryKeys.availability.athlete(variables.athleteId),
          context.previousAthlete
        );
      }
    },
    onSettled: () => {
      // Invalidate both team and athlete queries to refresh
      queryClient.invalidateQueries({ queryKey: queryKeys.availability.all });
    },
  });
}

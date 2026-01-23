import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { AthleteAvailability, AvailabilityDay, ApiResponse } from '../types/coach';

const API_URL = import.meta.env.VITE_API_URL || '';

// Format date for query key stability
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Fetch team-wide availability for date range
 */
export function useTeamAvailability(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['availability', 'team', formatDate(startDate), formatDate(endDate)],
    queryFn: async () => {
      const response = await axios.get<ApiResponse<{ availability: AthleteAvailability[] }>>(
        `${API_URL}/api/v1/availability/team`,
        {
          params: {
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
          },
          withCredentials: true,
        }
      );
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to fetch team availability');
      }
      return response.data.data?.availability || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch single athlete's availability
 */
export function useAthleteAvailability(athleteId: string | undefined, startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['availability', 'athlete', athleteId, formatDate(startDate), formatDate(endDate)],
    queryFn: async () => {
      if (!athleteId) return [];
      const response = await axios.get<ApiResponse<{ availability: AvailabilityDay[] }>>(
        `${API_URL}/api/v1/availability/${athleteId}`,
        {
          params: {
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
          },
          withCredentials: true,
        }
      );
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to fetch availability');
      }
      return response.data.data?.availability || [];
    },
    enabled: !!athleteId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Mutation to update athlete availability
 */
export function useUpdateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ athleteId, availability }: { athleteId: string; availability: AvailabilityDay[] }) => {
      const response = await axios.put<ApiResponse<{ availability: AvailabilityDay[] }>>(
        `${API_URL}/api/v1/availability/${athleteId}`,
        { availability },
        { withCredentials: true }
      );
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to update availability');
      }
      return response.data.data?.availability;
    },
    onSuccess: (_, variables) => {
      // Invalidate both team and athlete queries to refresh
      queryClient.invalidateQueries({ queryKey: ['availability', 'team'] });
      queryClient.invalidateQueries({ queryKey: ['availability', 'athlete', variables.athleteId] });
    },
  });
}

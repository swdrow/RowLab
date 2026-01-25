import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import useAuthStore from '../../store/authStore';
import type { TeamSettings, TeamVisibility, ApiResponse } from '../types/settings';

/**
 * Query keys for team settings
 */
export const teamSettingsKeys = {
  all: ['settings', 'team'] as const,
  visibility: () => [...teamSettingsKeys.all, 'visibility'] as const,
};

/**
 * Fetch team settings from API (OWNER only)
 */
async function fetchTeamSettings(): Promise<TeamSettings> {
  const response = await api.get<ApiResponse<TeamSettings>>('/api/v1/settings/team');

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to load team settings');
  }

  return response.data.data;
}

/**
 * Update team visibility settings
 */
async function updateTeamVisibility(visibility: TeamVisibility): Promise<TeamSettings> {
  const response = await api.patch<ApiResponse<TeamSettings>>('/api/v1/settings/team', { visibility });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to save team settings');
  }

  return response.data.data;
}

/**
 * Hook to fetch team settings (OWNER only)
 *
 * @param enabled - Whether to enable the query (typically based on role check)
 */
export function useTeamSettings(enabled: boolean = true) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  const query = useQuery({
    queryKey: teamSettingsKeys.all,
    queryFn: fetchTeamSettings,
    enabled: isInitialized && isAuthenticated && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    teamSettings: query.data,
    visibility: query.data?.visibility,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to update team visibility settings with optimistic updates
 */
export function useUpdateTeamVisibility() {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: updateTeamVisibility,
    onMutate: async (newVisibility) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: teamSettingsKeys.all });

      // Snapshot previous value
      const previousSettings = queryClient.getQueryData<TeamSettings>(teamSettingsKeys.all);

      // Optimistically update
      if (previousSettings) {
        queryClient.setQueryData(teamSettingsKeys.all, {
          ...previousSettings,
          visibility: newVisibility,
        });
      }

      return { previousSettings };
    },
    onError: (_err, _newVisibility, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(teamSettingsKeys.all, context.previousSettings);
      }
    },
    onSettled: () => {
      // Refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: teamSettingsKeys.all });
    },
  });

  return {
    updateVisibility: updateMutation.mutate,
    updateVisibilityAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}

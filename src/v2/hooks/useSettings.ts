import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import type { UserSettings, UpdateSettingsPayload, ApiResponse } from '../types/settings';

/**
 * Fetch user settings from API
 */
async function fetchSettings(): Promise<UserSettings> {
  const response = await api.get<ApiResponse<UserSettings>>('/api/v1/settings');

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to load settings');
  }

  return response.data.data;
}

/**
 * Update user settings
 */
async function updateSettings(payload: UpdateSettingsPayload): Promise<UserSettings> {
  const response = await api.patch<ApiResponse<UserSettings>>('/api/v1/settings', payload);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to save settings');
  }

  return response.data.data;
}

/**
 * Hook to fetch user settings
 */
export function useSettings() {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.settings.user(),
    queryFn: fetchSettings,
    enabled: isInitialized && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to update user settings with optimistic updates
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.settings.user() });

      // Snapshot previous value
      const previousSettings = queryClient.getQueryData<UserSettings>(queryKeys.settings.user());

      // Optimistically update
      if (previousSettings) {
        queryClient.setQueryData(queryKeys.settings.user(), {
          ...previousSettings,
          ...payload,
        });
      }

      return { previousSettings };
    },
    onError: (_err, _payload, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(queryKeys.settings.user(), context.previousSettings);
      }
    },
    onSettled: () => {
      // Refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.user() });
    },
  });

  return {
    updateSettings: updateMutation.mutate,
    updateSettingsAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import axios from 'axios';
import type { DashboardPreferences, ApiResponse, WidgetId, ActivitySource } from '../types/dashboard';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Fetch dashboard preferences for current user
 */
async function fetchPreferences(): Promise<DashboardPreferences> {
  const response = await axios.get<ApiResponse<DashboardPreferences>>(
    `${API_URL}/api/v1/dashboard-preferences`,
    { withCredentials: true }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch preferences');
  }

  return response.data.data;
}

/**
 * Update dashboard preferences
 */
async function updatePreferences(
  prefs: Partial<Pick<DashboardPreferences, 'pinnedModules' | 'hiddenSources'>>
): Promise<DashboardPreferences> {
  const response = await axios.put<ApiResponse<DashboardPreferences>>(
    `${API_URL}/api/v1/dashboard-preferences`,
    prefs,
    { withCredentials: true }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update preferences');
  }

  return response.data.data;
}

/**
 * Hook for dashboard preferences with mutations
 */
export function useDashboardPrefs() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.dashboard.preferences(),
    queryFn: fetchPreferences,
    staleTime: 10 * 60 * 1000, // 10 minutes - preferences don't change often
  });

  const mutation = useMutation({
    mutationFn: updatePreferences,
    onSuccess: (data) => {
      // Update cache immediately
      queryClient.setQueryData(['dashboard-preferences'], data);
    },
  });

  // Helper to update pinned modules order
  const setPinnedModules = (modules: WidgetId[]) => {
    mutation.mutate({ pinnedModules: modules });
  };

  // Helper to toggle source visibility
  const toggleSourceVisibility = (source: ActivitySource) => {
    const current = query.data?.hiddenSources || [];
    const isHidden = current.includes(source);
    const newHidden = isHidden
      ? current.filter(s => s !== source)
      : [...current, source];
    mutation.mutate({ hiddenSources: newHidden });
  };

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    // Mutations
    updatePreferences: mutation.mutate,
    isUpdating: mutation.isPending,
    updateError: mutation.error,

    // Helpers
    setPinnedModules,
    toggleSourceVisibility,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import type { C2Status, C2SyncResult, ApiResponse } from '../types/ergTests';

/**
 * Fetch Concept2 connection status
 */
async function fetchC2Status(athleteId?: string): Promise<C2Status> {
  const endpoint = athleteId
    ? `/api/v1/concept2/status/${athleteId}`
    : '/api/v1/concept2/status/me';

  const response = await api.get<ApiResponse<C2Status>>(endpoint);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch C2 status');
  }

  return response.data.data;
}

/**
 * Trigger Concept2 sync
 */
async function triggerC2Sync(athleteId?: string): Promise<C2SyncResult> {
  const endpoint = athleteId ? `/api/v1/concept2/sync/${athleteId}` : '/api/v1/concept2/sync/me';

  const response = await api.post<ApiResponse<C2SyncResult>>(endpoint);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to sync C2 workouts');
  }

  return response.data.data;
}

/**
 * Hook for Concept2 connection status
 *
 * @param athleteId - Optional athlete ID. If not provided, fetches current user's status
 */
export function useConcept2Status(athleteId?: string) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.concept2.status(athleteId || 'me'),
    queryFn: () => fetchC2Status(athleteId),
    enabled: isInitialized && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes (status doesn't change frequently)
  });

  return {
    status: query.data || { connected: false },
    isConnected: query.data?.connected || false,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for triggering Concept2 sync
 *
 * @param athleteId - Optional athlete ID. If not provided, syncs current user's workouts
 */
export function useTriggerC2Sync(athleteId?: string) {
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: () => triggerC2Sync(athleteId),
    onSuccess: () => {
      // Invalidate erg tests and C2 status after sync
      queryClient.invalidateQueries({ queryKey: queryKeys.ergTests.all });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.concept2.all, 'status'] });
    },
  });

  return {
    triggerSync: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error,
    syncResult: syncMutation.data,
  };
}

/**
 * Hook for user-level Concept2 status (not athlete-level)
 */
export function useMyC2Status() {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.concept2.status('me'),
    queryFn: () => fetchC2Status(),
    enabled: isInitialized && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    isConnected: query.data?.connected ?? false,
    username: query.data?.username,
    lastSyncedAt: query.data?.lastSyncedAt,
    syncEnabled: query.data?.syncEnabled,
    isLoading: query.isLoading,
    error: query.error,
  };
}

/**
 * Hook for user-level Concept2 sync (not athlete-level)
 */
export function useMyC2Sync() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<C2SyncResult>>('/api/v1/concept2/sync/me');
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message || 'Failed to sync C2 workouts');
      }
      return res.data.data;
    },
    onSuccess: (data) => {
      const count = data.totalFetched || 0;
      toast.success(`Synced ${count} workout${count !== 1 ? 's' : ''}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.ergTests.all });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.concept2.all, 'status'] });
    },
    onError: (error: any) => {
      toast.error(
        'Sync failed: ' +
          (error?.response?.data?.error?.message || error.message || 'Unknown error')
      );
    },
  });

  return {
    triggerSync: mutation.mutate,
    isSyncing: mutation.isPending,
    syncError: mutation.error,
    syncResult: mutation.data,
  };
}

/**
 * Hook for getting C2 status for all athletes (for team overview)
 *
 * Note: This doesn't pre-fetch all statuses to avoid N+1 query at load time.
 * Instead, let individual components query status as needed using useConcept2Status.
 *
 * This hook is a convenience wrapper for cases where you need to check
 * multiple athletes' statuses programmatically.
 */
export function useTeamC2Statuses(athleteIds: string[]) {
  const { isAuthenticated, isInitialized } = useAuth();

  // Query all statuses in parallel
  const queries = useQuery({
    queryKey: queryKeys.concept2.teamStatuses(),
    queryFn: async () => {
      const results = await Promise.all(
        athleteIds.map(async (id) => {
          try {
            const status = await fetchC2Status(id);
            return { athleteId: id, status };
          } catch {
            // If error, return disconnected status
            return { athleteId: id, status: { connected: false } };
          }
        })
      );

      // Convert to Map for O(1) lookup
      const statusMap = new Map<string, C2Status>();
      results.forEach(({ athleteId, status }) => {
        statusMap.set(athleteId, status);
      });

      return statusMap;
    },
    enabled: isInitialized && isAuthenticated && athleteIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    statuses: queries.data || new Map<string, C2Status>(),
    isLoading: queries.isLoading,
    error: queries.error,
    refetch: queries.refetch,
  };
}

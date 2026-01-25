import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import useAuthStore from '../../store/authStore';
import type {
  C2Status,
  StravaStatus,
  C2SyncConfig,
  C2ToStravaSyncResult,
  OAuthUrlResponse,
  StravaAuthUrlResponse,
  ApiResponse,
} from '../types/settings';

/**
 * Query keys for integrations
 */
export const integrationKeys = {
  all: ['integrations'] as const,
  c2: {
    all: () => [...integrationKeys.all, 'c2'] as const,
    status: () => [...integrationKeys.c2.all(), 'status'] as const,
    syncConfig: () => [...integrationKeys.c2.all(), 'syncConfig'] as const,
  },
  strava: {
    all: () => [...integrationKeys.all, 'strava'] as const,
    status: () => [...integrationKeys.strava.all(), 'status'] as const,
  },
};

// ============================================================================
// Concept2 Integration Hooks
// ============================================================================

/**
 * Fetch Concept2 connection status
 */
async function fetchC2Status(): Promise<C2Status> {
  const response = await api.get<ApiResponse<C2Status>>('/api/v1/concept2/status/me');

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch Concept2 status');
  }

  return response.data.data;
}

/**
 * Connect to Concept2 - returns OAuth URL
 */
async function connectC2(): Promise<OAuthUrlResponse> {
  const response = await api.post<ApiResponse<OAuthUrlResponse>>('/api/v1/concept2/connect');

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to get Concept2 OAuth URL');
  }

  return response.data.data;
}

/**
 * Disconnect from Concept2
 */
async function disconnectC2(): Promise<void> {
  const response = await api.delete<ApiResponse<void>>('/api/v1/concept2/disconnect/me');

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to disconnect Concept2');
  }
}

/**
 * Sync Concept2 workouts
 */
async function syncC2(): Promise<{ newWorkouts: number }> {
  const response = await api.post<ApiResponse<{ newWorkouts: number }>>('/api/v1/concept2/sync/me');

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to sync Concept2 workouts');
  }

  return response.data.data;
}

/**
 * Hook for Concept2 connection status
 */
export function useC2Status() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  const query = useQuery({
    queryKey: integrationKeys.c2.status(),
    queryFn: fetchC2Status,
    enabled: isInitialized && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    status: query.data,
    isConnected: query.data?.connected || false,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for connecting to Concept2
 */
export function useConnectC2() {
  const queryClient = useQueryClient();

  const connectMutation = useMutation({
    mutationFn: connectC2,
    onSuccess: () => {
      // Invalidate C2 status after connection attempt
      queryClient.invalidateQueries({ queryKey: integrationKeys.c2.status() });
    },
  });

  return {
    connect: connectMutation.mutate,
    connectAsync: connectMutation.mutateAsync,
    isConnecting: connectMutation.isPending,
    connectError: connectMutation.error,
    oauthUrl: connectMutation.data?.url,
  };
}

/**
 * Hook for disconnecting from Concept2
 */
export function useDisconnectC2() {
  const queryClient = useQueryClient();

  const disconnectMutation = useMutation({
    mutationFn: disconnectC2,
    onSuccess: () => {
      // Invalidate C2 status after disconnect
      queryClient.invalidateQueries({ queryKey: integrationKeys.c2.status() });
      // Also invalidate sync config
      queryClient.invalidateQueries({ queryKey: integrationKeys.c2.syncConfig() });
    },
  });

  return {
    disconnect: disconnectMutation.mutate,
    disconnectAsync: disconnectMutation.mutateAsync,
    isDisconnecting: disconnectMutation.isPending,
    disconnectError: disconnectMutation.error,
  };
}

/**
 * Hook for syncing Concept2 workouts
 */
export function useSyncC2() {
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: syncC2,
    onSuccess: () => {
      // Invalidate erg tests and C2 status after sync
      queryClient.invalidateQueries({ queryKey: ['ergTests'] });
      queryClient.invalidateQueries({ queryKey: integrationKeys.c2.status() });
    },
  });

  return {
    sync: syncMutation.mutate,
    syncAsync: syncMutation.mutateAsync,
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error,
    syncResult: syncMutation.data,
  };
}

// ============================================================================
// Strava Integration Hooks
// ============================================================================

/**
 * Fetch Strava connection status
 */
async function fetchStravaStatus(): Promise<StravaStatus> {
  const response = await api.get<ApiResponse<StravaStatus>>('/api/v1/strava/status/me');

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch Strava status');
  }

  return response.data.data;
}

/**
 * Get Strava OAuth URL
 */
async function getStravaAuthUrl(): Promise<StravaAuthUrlResponse> {
  const response = await api.get<ApiResponse<StravaAuthUrlResponse>>('/api/v1/strava/auth-url');

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to get Strava OAuth URL');
  }

  return response.data.data;
}

/**
 * Disconnect from Strava
 */
async function disconnectStrava(): Promise<void> {
  const response = await api.delete<ApiResponse<void>>('/api/v1/strava/disconnect/me');

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to disconnect Strava');
  }
}

/**
 * Sync Strava activities
 */
async function syncStrava(): Promise<{ newActivities: number }> {
  const response = await api.post<ApiResponse<{ newActivities: number }>>('/api/v1/strava/sync/me');

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to sync Strava activities');
  }

  return response.data.data;
}

/**
 * Hook for Strava connection status
 */
export function useStravaStatus() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  const query = useQuery({
    queryKey: integrationKeys.strava.status(),
    queryFn: fetchStravaStatus,
    enabled: isInitialized && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    status: query.data,
    isConnected: query.data?.connected || false,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for connecting to Strava
 */
export function useConnectStrava() {
  const queryClient = useQueryClient();

  const connectMutation = useMutation({
    mutationFn: getStravaAuthUrl,
    onSuccess: () => {
      // Invalidate Strava status after connection attempt
      queryClient.invalidateQueries({ queryKey: integrationKeys.strava.status() });
    },
  });

  return {
    connect: connectMutation.mutate,
    connectAsync: connectMutation.mutateAsync,
    isConnecting: connectMutation.isPending,
    connectError: connectMutation.error,
    authUrl: connectMutation.data?.authUrl,
  };
}

/**
 * Hook for disconnecting from Strava
 */
export function useDisconnectStrava() {
  const queryClient = useQueryClient();

  const disconnectMutation = useMutation({
    mutationFn: disconnectStrava,
    onSuccess: () => {
      // Invalidate Strava status after disconnect
      queryClient.invalidateQueries({ queryKey: integrationKeys.strava.status() });
      // Also invalidate C2 sync config (depends on Strava connection)
      queryClient.invalidateQueries({ queryKey: integrationKeys.c2.syncConfig() });
    },
  });

  return {
    disconnect: disconnectMutation.mutate,
    disconnectAsync: disconnectMutation.mutateAsync,
    isDisconnecting: disconnectMutation.isPending,
    disconnectError: disconnectMutation.error,
  };
}

/**
 * Hook for syncing Strava activities
 */
export function useSyncStrava() {
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: syncStrava,
    onSuccess: () => {
      // Invalidate Strava status after sync
      queryClient.invalidateQueries({ queryKey: integrationKeys.strava.status() });
    },
  });

  return {
    sync: syncMutation.mutate,
    syncAsync: syncMutation.mutateAsync,
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error,
    syncResult: syncMutation.data,
  };
}

// ============================================================================
// C2 to Strava Sync Hooks
// ============================================================================

/**
 * Fetch C2 to Strava sync configuration
 */
async function fetchC2SyncConfig(): Promise<C2SyncConfig> {
  const response = await api.get<ApiResponse<C2SyncConfig>>('/api/v1/strava/c2-sync/config');

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch C2 sync config');
  }

  return response.data.data;
}

/**
 * Update C2 to Strava sync configuration
 */
async function updateC2SyncConfig(config: Partial<C2SyncConfig>): Promise<C2SyncConfig> {
  const response = await api.patch<ApiResponse<C2SyncConfig>>('/api/v1/strava/c2-sync/config', config);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update C2 sync config');
  }

  return response.data.data;
}

/**
 * Trigger C2 to Strava sync
 */
async function syncC2ToStrava(): Promise<C2ToStravaSyncResult> {
  const response = await api.post<ApiResponse<C2ToStravaSyncResult>>('/api/v1/strava/c2-sync/sync');

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to sync C2 workouts to Strava');
  }

  return response.data.data;
}

/**
 * Hook for C2 to Strava sync configuration
 */
export function useC2SyncConfig() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  const query = useQuery({
    queryKey: integrationKeys.c2.syncConfig(),
    queryFn: fetchC2SyncConfig,
    enabled: isInitialized && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    config: query.data,
    isEnabled: query.data?.enabled || false,
    hasWriteScope: query.data?.hasWriteScope || false,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for updating C2 to Strava sync configuration
 */
export function useUpdateC2SyncConfig() {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: updateC2SyncConfig,
    onMutate: async (newConfig) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: integrationKeys.c2.syncConfig() });

      // Snapshot previous value
      const previousConfig = queryClient.getQueryData<C2SyncConfig>(integrationKeys.c2.syncConfig());

      // Optimistically update
      if (previousConfig) {
        queryClient.setQueryData(integrationKeys.c2.syncConfig(), {
          ...previousConfig,
          ...newConfig,
        });
      }

      return { previousConfig };
    },
    onError: (_err, _newConfig, context) => {
      // Rollback on error
      if (context?.previousConfig) {
        queryClient.setQueryData(integrationKeys.c2.syncConfig(), context.previousConfig);
      }
    },
    onSettled: () => {
      // Refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: integrationKeys.c2.syncConfig() });
    },
  });

  return {
    updateConfig: updateMutation.mutate,
    updateConfigAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}

/**
 * Hook for triggering C2 to Strava sync
 */
export function useSyncC2ToStrava() {
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: syncC2ToStrava,
    onSuccess: () => {
      // Invalidate sync config to refresh lastSyncedAt
      queryClient.invalidateQueries({ queryKey: integrationKeys.c2.syncConfig() });
    },
  });

  return {
    sync: syncMutation.mutate,
    syncAsync: syncMutation.mutateAsync,
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error,
    syncResult: syncMutation.data,
  };
}

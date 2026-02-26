/**
 * Integration hooks for Concept2 and Strava.
 *
 * Ported from v2 useIntegrations.ts with v4 patterns:
 * - useAuth() from @/features/auth/useAuth for enabled guards
 * - queryKeys from @/lib/queryKeys for cache invalidation
 * - TanStack Query v5 (useQuery, useMutation, useQueryClient)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import {
  fetchC2Status,
  fetchStravaStatus,
  connectC2,
  connectStrava,
  disconnectC2,
  disconnectStrava,
  syncC2,
  syncStrava,
} from './api';

// ---------------------------------------------------------------------------
// Concept2 Hooks
// ---------------------------------------------------------------------------

/** Fetch Concept2 connection status. Only queries when authenticated. */
export function useC2Status() {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.integrations.c2.status(),
    queryFn: fetchC2Status,
    enabled: isInitialized && isAuthenticated,
    staleTime: 5 * 60_000,
  });

  return {
    status: query.data,
    isConnected: query.data?.connected ?? false,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/** Connect to Concept2 -- returns OAuth URL for popup flow. */
export function useConnectC2() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: connectC2,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations.c2.status() });
    },
  });

  return {
    connect: mutation.mutate,
    connectAsync: mutation.mutateAsync,
    isConnecting: mutation.isPending,
    connectError: mutation.error,
    oauthUrl: mutation.data?.url,
  };
}

/** Disconnect from Concept2. */
export function useDisconnectC2() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: disconnectC2,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations.c2.status() });
    },
  });

  return {
    disconnect: mutation.mutate,
    disconnectAsync: mutation.mutateAsync,
    isDisconnecting: mutation.isPending,
    disconnectError: mutation.error,
  };
}

/** Sync Concept2 workouts. Invalidates both C2 status and workout feed. */
export function useSyncC2() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: syncC2,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations.c2.status() });
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all });
    },
  });

  return {
    sync: mutation.mutate,
    syncAsync: mutation.mutateAsync,
    isSyncing: mutation.isPending,
    syncError: mutation.error,
    syncResult: mutation.data,
  };
}

// ---------------------------------------------------------------------------
// Strava Hooks
// ---------------------------------------------------------------------------

/** Fetch Strava connection status. Only queries when authenticated. */
export function useStravaStatus() {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.integrations.strava.status(),
    queryFn: fetchStravaStatus,
    enabled: isInitialized && isAuthenticated,
    staleTime: 5 * 60_000,
  });

  return {
    status: query.data,
    isConnected: query.data?.connected ?? false,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/** Connect to Strava -- returns OAuth auth URL for popup flow. */
export function useConnectStrava() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: connectStrava,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations.strava.status() });
    },
  });

  return {
    connect: mutation.mutate,
    connectAsync: mutation.mutateAsync,
    isConnecting: mutation.isPending,
    connectError: mutation.error,
    authUrl: mutation.data?.authUrl,
  };
}

/** Disconnect from Strava. */
export function useDisconnectStrava() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: disconnectStrava,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations.strava.status() });
    },
  });

  return {
    disconnect: mutation.mutate,
    disconnectAsync: mutation.mutateAsync,
    isDisconnecting: mutation.isPending,
    disconnectError: mutation.error,
  };
}

/** Sync Strava activities. Invalidates both Strava status and workout feed. */
export function useSyncStrava() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: syncStrava,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations.strava.status() });
      queryClient.invalidateQueries({ queryKey: queryKeys.workouts.all });
    },
  });

  return {
    sync: mutation.mutate,
    syncAsync: mutation.mutateAsync,
    isSyncing: mutation.isPending,
    syncError: mutation.error,
    syncResult: mutation.data,
  };
}

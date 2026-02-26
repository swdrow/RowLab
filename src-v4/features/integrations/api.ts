/**
 * Integration API functions and query option factories.
 *
 * Follows the v4 pattern from profile/api.ts:
 * - Uses axios `api` instance from @/lib/api (module-scoped token, refresh mutex)
 * - Query option factories for Suspense-compatible data loading
 * - All responses unwrapped from { success, data } envelope
 */
import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { C2Status, StravaStatus, SyncResult } from './types';

// ---------------------------------------------------------------------------
// Concept2 API functions
// ---------------------------------------------------------------------------

export function fetchC2Status(): Promise<C2Status> {
  return apiClient.get<C2Status>('/api/v1/concept2/status/me');
}

export function connectC2(): Promise<{ url: string }> {
  return apiClient.post<{ url: string }>('/api/v1/concept2/connect');
}

export async function disconnectC2(): Promise<void> {
  await apiClient.delete('/api/v1/concept2/disconnect/me');
}

export function syncC2(): Promise<SyncResult> {
  return apiClient.post<SyncResult>('/api/v1/concept2/sync/me');
}

// ---------------------------------------------------------------------------
// Strava API functions
// ---------------------------------------------------------------------------

export function fetchStravaStatus(): Promise<StravaStatus> {
  return apiClient.get<StravaStatus>('/api/v1/strava/status/me');
}

export function connectStrava(): Promise<{ authUrl: string }> {
  return apiClient.get<{ authUrl: string }>('/api/v1/strava/auth-url');
}

export async function disconnectStrava(): Promise<void> {
  await apiClient.delete('/api/v1/strava/disconnect/me');
}

export function syncStrava(): Promise<SyncResult> {
  return apiClient.post<SyncResult>('/api/v1/strava/sync/me');
}

// ---------------------------------------------------------------------------
// Query option factories
// ---------------------------------------------------------------------------

export function c2StatusQueryOptions() {
  return queryOptions<C2Status>({
    queryKey: queryKeys.integrations.c2.status(),
    staleTime: 5 * 60_000, // 5 minutes
    queryFn: fetchC2Status,
  });
}

export function stravaStatusQueryOptions() {
  return queryOptions<StravaStatus>({
    queryKey: queryKeys.integrations.strava.status(),
    staleTime: 5 * 60_000, // 5 minutes
    queryFn: fetchStravaStatus,
  });
}

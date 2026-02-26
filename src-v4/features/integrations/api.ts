/**
 * Integration API functions and query option factories.
 *
 * Follows the v4 pattern from profile/api.ts:
 * - Uses axios `api` instance from @/lib/api (module-scoped token, refresh mutex)
 * - Query option factories for Suspense-compatible data loading
 * - All responses unwrapped from { success, data } envelope
 */
import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { C2Status, StravaStatus, SyncResult } from './types';

// ---------------------------------------------------------------------------
// Concept2 API functions
// ---------------------------------------------------------------------------

export async function fetchC2Status(): Promise<C2Status> {
  const res = await api.get('/api/v1/concept2/status/me');
  return res.data.data as C2Status;
}

export async function connectC2(): Promise<{ url: string }> {
  const res = await api.post('/api/v1/concept2/connect');
  return res.data.data as { url: string };
}

export async function disconnectC2(): Promise<void> {
  await api.delete('/api/v1/concept2/disconnect/me');
}

export async function syncC2(): Promise<SyncResult> {
  const res = await api.post('/api/v1/concept2/sync/me');
  return res.data.data as SyncResult;
}

// ---------------------------------------------------------------------------
// Strava API functions
// ---------------------------------------------------------------------------

export async function fetchStravaStatus(): Promise<StravaStatus> {
  const res = await api.get('/api/v1/strava/status/me');
  return res.data.data as StravaStatus;
}

export async function connectStrava(): Promise<{ authUrl: string }> {
  const res = await api.get('/api/v1/strava/auth-url');
  return res.data.data as { authUrl: string };
}

export async function disconnectStrava(): Promise<void> {
  await api.delete('/api/v1/strava/disconnect/me');
}

export async function syncStrava(): Promise<SyncResult> {
  const res = await api.post('/api/v1/strava/sync/me');
  return res.data.data as SyncResult;
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

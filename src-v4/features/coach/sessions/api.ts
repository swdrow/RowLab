/**
 * Session API functions and query option factories.
 *
 * Uses /api/v1/sessions endpoints (existing backend, requires team context).
 * Query keys are scoped by filter params for proper cache invalidation.
 *
 * Mutations return hooks directly (useMutation pattern from attendance api).
 */
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  TrainingSession,
  SessionsResponse,
  SessionFilters,
  CreateSessionInput,
  UpdateSessionInput,
} from './types';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const sessionKeys = {
  all: ['sessions'] as const,
  lists: () => [...sessionKeys.all, 'list'] as const,
  list: (filters: SessionFilters) => [...sessionKeys.all, 'list', filters] as const,
  detail: (id: string) => [...sessionKeys.all, 'detail', id] as const,
  active: () => [...sessionKeys.all, 'active'] as const,
};

// ---------------------------------------------------------------------------
// API functions -- reads
// ---------------------------------------------------------------------------

async function fetchSessions(filters: SessionFilters = {}): Promise<TrainingSession[]> {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);

  const url = `/api/v1/sessions${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await api.get(url);
  return (res.data as { data: SessionsResponse }).data.sessions;
}

async function fetchSession(sessionId: string): Promise<TrainingSession> {
  const res = await api.get(`/api/v1/sessions/${sessionId}`);
  return (res.data as { data: { session: TrainingSession } }).data.session;
}

async function fetchActiveSession(): Promise<TrainingSession | null> {
  try {
    const res = await api.get('/api/v1/sessions/active');
    return (res.data as { data: { session: TrainingSession | null } }).data.session ?? null;
  } catch {
    // 404 = no active session, which is fine
    return null;
  }
}

// ---------------------------------------------------------------------------
// API functions -- mutations
// ---------------------------------------------------------------------------

async function createSession(input: CreateSessionInput): Promise<TrainingSession> {
  const res = await api.post('/api/v1/sessions', input);
  return (res.data as { data: { session: TrainingSession } }).data.session;
}

async function updateSession(data: {
  sessionId: string;
  input: UpdateSessionInput;
}): Promise<TrainingSession> {
  const res = await api.patch(`/api/v1/sessions/${data.sessionId}`, data.input);
  return (res.data as { data: { session: TrainingSession } }).data.session;
}

async function deleteSession(sessionId: string): Promise<void> {
  await api.delete(`/api/v1/sessions/${sessionId}`);
}

async function startSession(sessionId: string): Promise<TrainingSession> {
  // Backend handles ACTIVE transition via PATCH with status
  const res = await api.patch(`/api/v1/sessions/${sessionId}`, { status: 'ACTIVE' });
  return (res.data as { data: { session: TrainingSession } }).data.session;
}

async function endSession(sessionId: string): Promise<TrainingSession> {
  const res = await api.patch(`/api/v1/sessions/${sessionId}`, { status: 'COMPLETED' });
  return (res.data as { data: { session: TrainingSession } }).data.session;
}

// ---------------------------------------------------------------------------
// Query option factories
// ---------------------------------------------------------------------------

export function sessionsOptions(filters: SessionFilters = {}) {
  return queryOptions<TrainingSession[]>({
    queryKey: sessionKeys.list(filters),
    queryFn: () => fetchSessions(filters),
    staleTime: 60_000,
  });
}

export function sessionDetailOptions(sessionId: string) {
  return queryOptions<TrainingSession>({
    queryKey: sessionKeys.detail(sessionId),
    queryFn: () => fetchSession(sessionId),
    staleTime: 60_000,
    enabled: !!sessionId,
  });
}

export function activeSessionOptions() {
  return queryOptions<TrainingSession | null>({
    queryKey: sessionKeys.active(),
    queryFn: fetchActiveSession,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSession,
    onSuccess: (updated) => {
      queryClient.setQueryData(sessionKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sessionKeys.active() });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

export function useStartSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startSession,
    onSuccess: (started) => {
      queryClient.setQueryData(sessionKeys.detail(started.id), started);
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sessionKeys.active() });
    },
  });
}

export function useEndSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: endSession,
    onSuccess: (ended) => {
      queryClient.setQueryData(sessionKeys.detail(ended.id), ended);
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sessionKeys.active() });
    },
  });
}

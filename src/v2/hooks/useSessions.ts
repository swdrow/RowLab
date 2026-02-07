// src/v2/hooks/useSessions.ts
// TanStack Query hooks for Session CRUD operations

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { queryKeys } from '../lib/queryKeys';
import type {
  Session,
  SessionsResponse,
  SessionFilters,
  CreateSessionInput,
  UpdateSessionInput,
} from '../types/session';

// ============================================
// API TYPES
// ============================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================
// API FUNCTIONS
// ============================================

async function fetchSessions(filters: SessionFilters = {}): Promise<SessionsResponse> {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);

  const url = `/api/v1/sessions${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await api.get<ApiResponse<SessionsResponse>>(url);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch sessions');
  }

  return response.data.data;
}

async function fetchSession(sessionId: string): Promise<Session> {
  const response = await api.get<ApiResponse<{ session: Session }>>(
    `/api/v1/sessions/${sessionId}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch session');
  }

  return response.data.data.session;
}

async function fetchActiveSession(): Promise<Session | null> {
  const response =
    await api.get<ApiResponse<{ session: Session | null }>>('/api/v1/sessions/active');

  if (!response.data.success) {
    // 404 means no active session - that's OK
    if (response.data.error?.code === 'NOT_FOUND') {
      return null;
    }
    throw new Error(response.data.error?.message || 'Failed to fetch active session');
  }

  return response.data.data?.session || null;
}

async function createSession(input: CreateSessionInput): Promise<Session> {
  const response = await api.post<ApiResponse<{ session: Session }>>('/api/v1/sessions', input);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to create session');
  }

  return response.data.data.session;
}

async function updateSession(data: {
  sessionId: string;
  input: UpdateSessionInput;
}): Promise<Session> {
  const { sessionId, input } = data;
  const response = await api.patch<ApiResponse<{ session: Session }>>(
    `/api/v1/sessions/${sessionId}`,
    input
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update session');
  }

  return response.data.data.session;
}

async function deleteSession(sessionId: string): Promise<void> {
  const response = await api.delete<ApiResponse<void>>(`/api/v1/sessions/${sessionId}`);

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete session');
  }
}

async function startSession(sessionId: string): Promise<Session> {
  const response = await api.post<ApiResponse<{ session: Session }>>(
    `/api/v1/sessions/${sessionId}/start`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to start session');
  }

  return response.data.data.session;
}

async function endSession(sessionId: string): Promise<Session> {
  const response = await api.post<ApiResponse<{ session: Session }>>(
    `/api/v1/sessions/${sessionId}/end`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to end session');
  }

  return response.data.data.session;
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Fetch sessions with optional filters
 */
export function useSessions(filters: SessionFilters = {}) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.sessions.list(filters),
    queryFn: () => fetchSessions(filters),
    enabled: isInitialized && isAuthenticated,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  return {
    sessions: query.data?.sessions || [],
    total: query.data?.total || 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Fetch single session by ID
 */
export function useSession(sessionId: string | null) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.sessions.detail(sessionId!),
    queryFn: () => fetchSession(sessionId!),
    enabled: isInitialized && isAuthenticated && !!sessionId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  return {
    session: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Fetch active live session (for joining)
 */
export function useActiveSession() {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.sessions.active(),
    queryFn: fetchActiveSession,
    enabled: isInitialized && isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds for active sessions (more frequent updates)
  });

  return {
    session: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Fetch upcoming sessions for the next N days
 */
export function useUpcomingSessions(days: number = 7) {
  const { isAuthenticated, isInitialized } = useAuth();

  const startDate = new Date().toISOString().split('T')[0];
  const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const filters: SessionFilters = { startDate, endDate };

  const query = useQuery({
    queryKey: queryKeys.sessions.upcoming(days),
    queryFn: () => fetchSessions(filters),
    enabled: isInitialized && isAuthenticated,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  return {
    sessions: query.data?.sessions || [],
    total: query.data?.total || 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Create session mutation
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
    },
  });

  return {
    createSession: mutation.mutate,
    createSessionAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    createError: mutation.error,
  };
}

/**
 * Update session mutation
 */
export function useUpdateSession() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateSession,
    onSuccess: (updatedSession) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.setQueryData(queryKeys.sessions.detail(updatedSession.id), updatedSession);
    },
  });

  return {
    updateSession: mutation.mutate,
    updateSessionAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
  };
}

/**
 * Delete session mutation
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
    },
  });

  return {
    deleteSession: mutation.mutate,
    deleteSessionAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    deleteError: mutation.error,
  };
}

/**
 * Start session mutation (transition to ACTIVE status)
 */
export function useStartSession() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: startSession,
    onSuccess: (startedSession) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.setQueryData(queryKeys.sessions.detail(startedSession.id), startedSession);
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.active() });
    },
  });

  return {
    startSession: mutation.mutate,
    startSessionAsync: mutation.mutateAsync,
    isStarting: mutation.isPending,
    startError: mutation.error,
  };
}

/**
 * End session mutation (transition to COMPLETED status)
 */
export function useEndSession() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: endSession,
    onSuccess: (endedSession) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.setQueryData(queryKeys.sessions.detail(endedSession.id), endedSession);
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.active() });
    },
  });

  return {
    endSession: mutation.mutate,
    endSessionAsync: mutation.mutateAsync,
    isEnding: mutation.isPending,
    endError: mutation.error,
  };
}

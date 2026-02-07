// src/v2/hooks/useRecruitVisits.ts
// TanStack Query hooks for Recruit Visit CRUD operations

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import type {
  RecruitVisit,
  RecruitVisitsResponse,
  RecruitVisitFilters,
  CreateRecruitVisitInput,
  UpdateRecruitVisitInput,
} from '../types/recruiting';

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

interface ShareTokenResponse {
  shareToken: string;
}

// ============================================
// QUERY KEYS
// ============================================

// ============================================
// API FUNCTIONS
// ============================================

async function fetchRecruitVisits(
  filters: RecruitVisitFilters = {}
): Promise<RecruitVisitsResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.hostAthleteId) params.set('hostAthleteId', filters.hostAthleteId);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);

  const url = `/api/v1/recruit-visits${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await api.get<ApiResponse<RecruitVisitsResponse>>(url);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch recruit visits');
  }

  return response.data.data;
}

async function fetchRecruitVisit(visitId: string): Promise<RecruitVisit> {
  const response = await api.get<ApiResponse<{ visit: RecruitVisit }>>(
    `/api/v1/recruit-visits/${visitId}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch recruit visit');
  }

  return response.data.data.visit;
}

async function createRecruitVisit(input: CreateRecruitVisitInput): Promise<RecruitVisit> {
  const response = await api.post<ApiResponse<{ visit: RecruitVisit }>>(
    '/api/v1/recruit-visits',
    input
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to create recruit visit');
  }

  return response.data.data.visit;
}

async function updateRecruitVisit(data: {
  visitId: string;
  input: UpdateRecruitVisitInput;
}): Promise<RecruitVisit> {
  const { visitId, input } = data;
  const response = await api.patch<ApiResponse<{ visit: RecruitVisit }>>(
    `/api/v1/recruit-visits/${visitId}`,
    input
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update recruit visit');
  }

  return response.data.data.visit;
}

async function deleteRecruitVisit(visitId: string): Promise<void> {
  const response = await api.delete<ApiResponse<void>>(`/api/v1/recruit-visits/${visitId}`);

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete recruit visit');
  }
}

async function generateShareToken(visitId: string): Promise<string> {
  const response = await api.post<ApiResponse<ShareTokenResponse>>(
    `/api/v1/recruit-visits/${visitId}/generate-share-token`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to generate share token');
  }

  return response.data.data.shareToken;
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Fetch recruit visits with optional filters
 */
export function useRecruitVisits(filters: RecruitVisitFilters = {}) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.recruitVisit.list(filters),
    queryFn: () => fetchRecruitVisits(filters),
    enabled: isInitialized && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    visits: query.data?.visits || [],
    total: query.data?.total || 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Fetch single recruit visit by ID
 */
export function useRecruitVisit(visitId: string | null) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.recruitVisit.detail(visitId!),
    queryFn: () => fetchRecruitVisit(visitId!),
    enabled: isInitialized && isAuthenticated && !!visitId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    visit: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Fetch upcoming recruit visits (scheduled status, from today onwards)
 */
export function useUpcomingRecruitVisits() {
  const { isAuthenticated, isInitialized } = useAuth();

  const today = new Date().toISOString().split('T')[0];
  const filters: RecruitVisitFilters = {
    status: 'scheduled',
    startDate: today,
  };

  const query = useQuery({
    queryKey: queryKeys.recruitVisit.upcoming(),
    queryFn: () => fetchRecruitVisits(filters),
    enabled: isInitialized && isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });

  return {
    visits: query.data?.visits || [],
    total: query.data?.total || 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Fetch recruit visits for a specific host athlete
 */
export function useHostAthleteVisits(athleteId: string | null) {
  const { isAuthenticated, isInitialized } = useAuth();

  const filters: RecruitVisitFilters = {
    hostAthleteId: athleteId!,
  };

  const query = useQuery({
    queryKey: queryKeys.recruitVisit.byHost(athleteId!),
    queryFn: () => fetchRecruitVisits(filters),
    enabled: isInitialized && isAuthenticated && !!athleteId,
    staleTime: 2 * 60 * 1000,
  });

  return {
    visits: query.data?.visits || [],
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
 * Create recruit visit mutation
 */
export function useCreateRecruitVisit() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createRecruitVisit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitVisit.all });
    },
  });

  return {
    createVisit: mutation.mutate,
    createVisitAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    createError: mutation.error,
  };
}

/**
 * Update recruit visit mutation
 */
export function useUpdateRecruitVisit() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateRecruitVisit,
    onSuccess: (updatedVisit) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitVisit.all });
      queryClient.setQueryData(queryKeys.recruitVisit.detail(updatedVisit.id), updatedVisit);
    },
  });

  return {
    updateVisit: mutation.mutate,
    updateVisitAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
  };
}

/**
 * Delete recruit visit mutation
 */
export function useDeleteRecruitVisit() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteRecruitVisit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitVisit.all });
    },
  });

  return {
    deleteVisit: mutation.mutate,
    deleteVisitAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    deleteError: mutation.error,
  };
}

/**
 * Generate share token mutation
 */
export function useGenerateShareToken() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: generateShareToken,
    onSuccess: (shareToken, visitId) => {
      // Update the visit detail cache with new share token
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitVisit.detail(visitId) });
    },
  });

  return {
    generateToken: mutation.mutate,
    generateTokenAsync: mutation.mutateAsync,
    isGenerating: mutation.isPending,
    generateError: mutation.error,
  };
}

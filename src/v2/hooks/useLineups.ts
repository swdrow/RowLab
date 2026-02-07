import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import type { ApiResponse } from '../types/athletes';

/**
 * Lineup data structure from API
 */
export interface Lineup {
  id: string;
  name: string;
  notes?: string;
  status?: 'draft' | 'published';
  draftedBy?: string | null;
  draftedByUser?: {
    id: string;
    name: string;
  };
  publishedAt?: string | null;
  assignments: LineupAssignment[];
  createdAt: string;
  updatedAt: string;
  teamId: string;
}

/**
 * Single athlete assignment within a lineup
 */
export interface LineupAssignment {
  athleteId: string;
  boatClass: string;
  shellName: string | null;
  seatNumber: number;
  side: 'Port' | 'Starboard';
  isCoxswain: boolean;
}

/**
 * Input for saving new lineup
 */
export interface SaveLineupInput {
  name: string;
  notes?: string;
  assignments: LineupAssignment[];
}

/**
 * Input for updating existing lineup
 */
export interface UpdateLineupInput {
  name?: string;
  notes?: string;
  assignments?: LineupAssignment[];
}

/**
 * Input for duplicating lineup
 */
export interface DuplicateLineupInput {
  name: string;
}

/**
 * Fetch all lineups for current team
 */
async function fetchLineups(): Promise<Lineup[]> {
  const response = await api.get<ApiResponse<{ lineups: Lineup[] }>>('/api/v1/lineups');

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch lineups');
  }

  return response.data.data.lineups;
}

/**
 * Fetch single lineup with assignments
 */
async function fetchLineup(lineupId: string): Promise<Lineup> {
  const response = await api.get<ApiResponse<{ lineup: Lineup }>>(`/api/v1/lineups/${lineupId}`);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch lineup');
  }

  return response.data.data.lineup;
}

/**
 * Save new lineup
 */
async function saveLineup(data: SaveLineupInput): Promise<Lineup> {
  const response = await api.post<ApiResponse<{ lineup: Lineup }>>('/api/v1/lineups', data);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to save lineup');
  }

  return response.data.data.lineup;
}

/**
 * Update existing lineup
 */
async function updateLineup(data: UpdateLineupInput & { id: string }): Promise<Lineup> {
  const { id, ...updateData } = data;
  const response = await api.patch<ApiResponse<{ lineup: Lineup }>>(
    `/api/v1/lineups/${id}`,
    updateData
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update lineup');
  }

  return response.data.data.lineup;
}

/**
 * Duplicate existing lineup
 */
async function duplicateLineup(data: DuplicateLineupInput & { id: string }): Promise<Lineup> {
  const { id, name } = data;
  const response = await api.post<ApiResponse<{ lineup: Lineup }>>(
    `/api/v1/lineups/${id}/duplicate`,
    { name }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to duplicate lineup');
  }

  return response.data.data.lineup;
}

/**
 * Delete lineup
 */
async function deleteLineup(id: string): Promise<void> {
  const response = await api.delete<ApiResponse<void>>(`/api/v1/lineups/${id}`);

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete lineup');
  }
}

/**
 * Hook for fetching all lineups
 */
export function useLineups() {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: ['lineups'],
    queryFn: fetchLineups,
    enabled: isInitialized && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    lineups: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for fetching single lineup by ID
 */
export function useLineup(lineupId: string | null) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: ['lineups', lineupId],
    queryFn: () => fetchLineup(lineupId!),
    enabled: isInitialized && isAuthenticated && !!lineupId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    lineup: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for saving new lineup
 */
export function useSaveLineup() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: saveLineup,
    onSuccess: () => {
      // Invalidate lineups list to refetch with new lineup
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
    },
  });

  return {
    saveLineup: mutation.mutate,
    saveLineupAsync: mutation.mutateAsync,
    isSaving: mutation.isPending,
    saveError: mutation.error,
  };
}

/**
 * Hook for updating existing lineup
 */
export function useUpdateLineup() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateLineup,
    onSuccess: (updatedLineup) => {
      // Invalidate both the list and specific lineup query
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
      queryClient.invalidateQueries({ queryKey: ['lineups', updatedLineup.id] });
    },
  });

  return {
    updateLineup: mutation.mutate,
    updateLineupAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
  };
}

/**
 * Hook for duplicating lineup
 */
export function useDuplicateLineup() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: duplicateLineup,
    onSuccess: () => {
      // Invalidate lineups list to show the new duplicate
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
    },
  });

  return {
    duplicateLineup: mutation.mutate,
    duplicateLineupAsync: mutation.mutateAsync,
    isDuplicating: mutation.isPending,
    duplicateError: mutation.error,
  };
}

/**
 * Hook for deleting lineup
 */
export function useDeleteLineup() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteLineup,
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['lineups'] });

      // Snapshot previous value
      const previousLineups = queryClient.getQueryData<Lineup[]>(['lineups']);

      // Optimistically remove from list
      queryClient.setQueryData<Lineup[]>(['lineups'], (old = []) =>
        old.filter((lineup) => lineup.id !== deletedId)
      );

      return { previousLineups };
    },
    onError: (_err, _deletedId, context) => {
      // Rollback on error
      if (context?.previousLineups) {
        queryClient.setQueryData(['lineups'], context.previousLineups);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
    },
  });

  return {
    deleteLineup: mutation.mutate,
    deleteLineupAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    deleteError: mutation.error,
  };
}

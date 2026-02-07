import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { queryKeys } from '../lib/queryKeys';
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
    queryKey: queryKeys.lineups.all,
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
    queryKey: lineupId ? queryKeys.lineups.detail(lineupId) : ['lineups', null],
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
 * Hook for saving new lineup (with optimistic update)
 */
export function useSaveLineup() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: saveLineup,
    onMutate: async (newLineup) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.lineups.all });

      // Snapshot previous value
      const previousLineups = queryClient.getQueryData<Lineup[]>(queryKeys.lineups.all);

      // Optimistically add temp lineup to list
      if (previousLineups) {
        const tempLineup: Lineup = {
          id: `temp-${Date.now()}`,
          name: newLineup.name,
          notes: newLineup.notes,
          assignments: newLineup.assignments,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          teamId: 'temp', // Will be replaced by server response
        };
        queryClient.setQueryData<Lineup[]>(queryKeys.lineups.all, [...previousLineups, tempLineup]);
      }

      return { previousLineups };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousLineups) {
        queryClient.setQueryData(queryKeys.lineups.all, context.previousLineups);
      }
    },
    onSuccess: (savedLineup) => {
      // Replace temp with server response
      const previous = queryClient.getQueryData<Lineup[]>(queryKeys.lineups.all);
      if (previous) {
        const withoutTemp = previous.filter((l) => !l.id.startsWith('temp-'));
        queryClient.setQueryData<Lineup[]>(queryKeys.lineups.all, [...withoutTemp, savedLineup]);
      }
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.lineups.all });
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
 * Hook for updating existing lineup (with optimistic update)
 */
export function useUpdateLineup() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateLineup,
    onMutate: async (data) => {
      const { id, ...updateData } = data;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.lineups.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.lineups.detail(id) });

      // Snapshot previous values
      const previousList = queryClient.getQueryData<Lineup[]>(queryKeys.lineups.all);
      const previousDetail = queryClient.getQueryData<Lineup>(queryKeys.lineups.detail(id));

      // Optimistically update list cache
      if (previousList) {
        queryClient.setQueryData<Lineup[]>(
          queryKeys.lineups.all,
          previousList.map((lineup) =>
            lineup.id === id
              ? { ...lineup, ...updateData, updatedAt: new Date().toISOString() }
              : lineup
          )
        );
      }

      // Optimistically update detail cache
      if (previousDetail) {
        queryClient.setQueryData<Lineup>(queryKeys.lineups.detail(id), {
          ...previousDetail,
          ...updateData,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousList, previousDetail };
    },
    onError: (_err, variables, context) => {
      // Rollback both caches on error
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.lineups.all, context.previousList);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(queryKeys.lineups.detail(variables.id), context.previousDetail);
      }
    },
    onSuccess: (updatedLineup) => {
      // Replace with server response
      const previousList = queryClient.getQueryData<Lineup[]>(queryKeys.lineups.all);
      if (previousList) {
        queryClient.setQueryData<Lineup[]>(
          queryKeys.lineups.all,
          previousList.map((l) => (l.id === updatedLineup.id ? updatedLineup : l))
        );
      }
      queryClient.setQueryData(queryKeys.lineups.detail(updatedLineup.id), updatedLineup);
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.lineups.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.lineups.detail(updatedLineup.id) });
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
 * Hook for duplicating lineup (with optimistic update)
 */
export function useDuplicateLineup() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: duplicateLineup,
    onMutate: async (data) => {
      const { id, name } = data;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.lineups.all });

      // Snapshot previous value
      const previousLineups = queryClient.getQueryData<Lineup[]>(queryKeys.lineups.all);

      // Get the source lineup to copy assignments
      const sourceLineup = previousLineups?.find((l) => l.id === id);

      // Optimistically add temp duplicate to list
      if (previousLineups && sourceLineup) {
        const tempDuplicate: Lineup = {
          id: `temp-duplicate-${Date.now()}`,
          name,
          notes: sourceLineup.notes,
          assignments: [...sourceLineup.assignments],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          teamId: sourceLineup.teamId,
        };
        queryClient.setQueryData<Lineup[]>(queryKeys.lineups.all, [
          ...previousLineups,
          tempDuplicate,
        ]);
      }

      return { previousLineups };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousLineups) {
        queryClient.setQueryData(queryKeys.lineups.all, context.previousLineups);
      }
    },
    onSuccess: (duplicatedLineup) => {
      // Replace temp with server response
      const previous = queryClient.getQueryData<Lineup[]>(queryKeys.lineups.all);
      if (previous) {
        const withoutTemp = previous.filter((l) => !l.id.startsWith('temp-duplicate-'));
        queryClient.setQueryData<Lineup[]>(queryKeys.lineups.all, [
          ...withoutTemp,
          duplicatedLineup,
        ]);
      }
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.lineups.all });
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
 * Hook for deleting lineup (with optimistic update)
 */
export function useDeleteLineup() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteLineup,
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.lineups.all });

      // Snapshot previous value
      const previousLineups = queryClient.getQueryData<Lineup[]>(queryKeys.lineups.all);

      // Optimistically remove from list
      queryClient.setQueryData<Lineup[]>(queryKeys.lineups.all, (old = []) =>
        old.filter((lineup) => lineup.id !== deletedId)
      );

      return { previousLineups };
    },
    onError: (_err, _deletedId, context) => {
      // Rollback on error
      if (context?.previousLineups) {
        queryClient.setQueryData(queryKeys.lineups.all, context.previousLineups);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.lineups.all });
    },
  });

  return {
    deleteLineup: mutation.mutate,
    deleteLineupAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    deleteError: mutation.error,
  };
}

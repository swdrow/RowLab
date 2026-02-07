import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import { useCallback, useRef } from 'react';
import { queryKeys } from '../lib/queryKeys';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import type { ApiResponse } from '../types/athletes';
import type { Lineup, LineupAssignment } from './useLineups';

/**
 * Lineup draft data structure (extends base Lineup)
 */
export interface LineupDraft extends Lineup {
  status: 'draft' | 'published';
  draftedBy: string | null;
  draftedByUser?: {
    id: string;
    name: string;
  };
  publishedAt: string | null;
}

/**
 * Draft update payload
 */
export interface DraftUpdateInput {
  name?: string;
  notes?: string;
  assignments?: LineupAssignment[];
}

/**
 * Publish input payload
 */
export interface PublishLineupInput {
  lastKnownUpdatedAt?: string;
}

/**
 * Conflict error thrown when lineup was modified by another user
 */
export class ConflictError extends Error {
  constructor(
    public current: LineupDraft,
    public server: LineupDraft
  ) {
    super('Lineup was modified by another user');
    this.name = 'ConflictError';
  }
}

/**
 * Fetch lineup draft
 */
async function fetchLineupDraft(lineupId: string): Promise<LineupDraft> {
  const response = await api.get<ApiResponse<{ lineup: LineupDraft }>>(
    `/api/v1/lineups/${lineupId}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch draft');
  }

  return response.data.data.lineup;
}

/**
 * Update lineup draft
 */
async function updateLineupDraft(lineupId: string, data: DraftUpdateInput): Promise<LineupDraft> {
  const response = await api.patch<ApiResponse<{ lineup: LineupDraft }>>(
    `/api/v1/lineups/${lineupId}/draft`,
    data
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update draft');
  }

  return response.data.data.lineup;
}

/**
 * Publish lineup
 */
async function publishLineupMutation(
  lineupId: string,
  data: PublishLineupInput
): Promise<LineupDraft> {
  const response = await api.post<ApiResponse<{ lineup: LineupDraft }>>(
    `/api/v1/lineups/${lineupId}/publish`,
    data
  );

  if (!response.data.success || !response.data.data) {
    // Check for conflict error (409)
    if (response.status === 409 && response.data.error?.code === 'CONFLICT') {
      const serverLineup = (response.data.error as any).currentLineup;
      const error = new Error('Lineup was modified by another user') as any;
      error.code = 'CONFLICT';
      error.serverLineup = serverLineup;
      throw error;
    }
    throw new Error(response.data.error?.message || 'Failed to publish lineup');
  }

  return response.data.data.lineup;
}

/**
 * Hook for managing lineup draft with debounced auto-save and conflict detection
 *
 * Features:
 * - 4-second debounced auto-save to draft endpoint
 * - Optimistic updates with rollback on error
 * - Conflict detection when publishing
 * - Session-only state (no persistence across page refresh)
 *
 * @param lineupId - Lineup ID to manage
 */
export function useLineupDraft(lineupId: string | null) {
  const { isAuthenticated, isInitialized } = useAuth();
  const queryClient = useQueryClient();

  // Track the debounced save function ref so we can cancel it
  const debouncedSaveRef = useRef<ReturnType<typeof debounce> | null>(null);

  // Fetch lineup draft
  const draftQuery = useQuery({
    queryKey: queryKeys.lineups.draft(lineupId!),
    queryFn: () => fetchLineupDraft(lineupId!),
    enabled: isInitialized && isAuthenticated && !!lineupId,
    staleTime: 30 * 1000, // 30 seconds - detect other editors
    refetchInterval: 30 * 1000, // Poll every 30 seconds for changes
  });

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: (data: DraftUpdateInput & { id: string }) => {
      const { id, ...updateData } = data;
      return updateLineupDraft(id, updateData);
    },
    onMutate: async (data) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.lineups.draft(data.id) });

      // Snapshot previous value
      const previousDraft = queryClient.getQueryData<LineupDraft>(queryKeys.lineups.draft(data.id));

      // Optimistically update cache
      if (previousDraft) {
        queryClient.setQueryData<LineupDraft>(queryKeys.lineups.draft(data.id), {
          ...previousDraft,
          ...data,
        });
      }

      return { previousDraft };
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousDraft) {
        queryClient.setQueryData(queryKeys.lineups.draft(variables.id), context.previousDraft);
      }
    },
    onSuccess: (updatedLineup) => {
      // Update cache with server response
      queryClient.setQueryData(queryKeys.lineups.draft(updatedLineup.id), updatedLineup);
    },
  });

  // Publish mutation with conflict detection
  const publishMutation = useMutation({
    mutationFn: async (data: { id: string; lastKnownUpdatedAt?: string }) => {
      // First, fetch latest lineup to check for conflicts
      const latest = await fetchLineupDraft(data.id);
      const current = draftQuery.data;

      // Compare updatedAt timestamps
      if (current && data.lastKnownUpdatedAt) {
        const knownDate = new Date(data.lastKnownUpdatedAt);
        const serverDate = new Date(latest.updatedAt);
        if (serverDate > knownDate) {
          throw new ConflictError(current, latest);
        }
      }

      // No conflict, proceed with publish
      return publishLineupMutation(data.id, { lastKnownUpdatedAt: data.lastKnownUpdatedAt });
    },
    onSuccess: () => {
      // Invalidate all lineup queries
      queryClient.invalidateQueries({ queryKey: queryKeys.lineups.all });
    },
  });

  // Create debounced auto-save function (4 seconds)
  const createDebouncedSave = useCallback(() => {
    if (!debouncedSaveRef.current) {
      debouncedSaveRef.current = debounce((data: DraftUpdateInput & { id: string }) => {
        autoSaveMutation.mutate(data);
      }, 4000); // 4-second debounce
    }
    return debouncedSaveRef.current;
  }, [autoSaveMutation]);

  // Auto-save function (debounced)
  const autoSave = useCallback(
    (data: DraftUpdateInput) => {
      if (!lineupId) return;
      const debouncedSave = createDebouncedSave();
      debouncedSave({ id: lineupId, ...data });
    },
    [lineupId, createDebouncedSave]
  );

  // Cancel auto-save (for undo/redo)
  const cancelAutoSave = useCallback(() => {
    debouncedSaveRef.current?.cancel();
  }, []);

  // Publish function
  const publish = useCallback(
    (lastKnownUpdatedAt?: string) => {
      if (!lineupId) return;
      publishMutation.mutate({ id: lineupId, lastKnownUpdatedAt });
    },
    [lineupId, publishMutation]
  );

  // Extract conflict error if present
  const conflictError =
    publishMutation.error instanceof ConflictError ? publishMutation.error : null;

  return {
    draft: draftQuery.data,
    isLoading: draftQuery.isLoading,
    error: draftQuery.error,
    refetch: draftQuery.refetch,

    // Auto-save
    autoSave,
    cancelAutoSave,
    isSaving: autoSaveMutation.isPending,
    saveError: autoSaveMutation.error,

    // Publish
    publish,
    isPublishing: publishMutation.isPending,
    publishError: publishMutation.error,
    conflictError,
  };
}

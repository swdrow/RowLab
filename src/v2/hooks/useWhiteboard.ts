import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { queryKeys } from '../lib/queryKeys';
import type { Whiteboard, ApiResponse } from '../types/coach';

/**
 * Fetch latest whiteboard for current team
 */
async function fetchWhiteboard(): Promise<Whiteboard | null> {
  try {
    const response = await api.get<ApiResponse<Whiteboard>>('/api/v1/whiteboards/latest');

    if (!response.data.success) {
      return null;
    }

    return response.data.data || null;
  } catch (error: any) {
    // 404 is expected if no whiteboard exists yet
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Save whiteboard (create or update)
 */
async function saveWhiteboard(data: Pick<Whiteboard, 'date' | 'content'>): Promise<Whiteboard> {
  const response = await api.post<ApiResponse<Whiteboard>>('/api/v1/whiteboards', data);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to save whiteboard');
  }

  return response.data.data;
}

/**
 * Delete whiteboard
 */
async function deleteWhiteboard(id: string): Promise<void> {
  const response = await api.delete<ApiResponse<void>>(`/api/v1/whiteboards/${id}`);

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete whiteboard');
  }
}

/**
 * Hook for whiteboard with mutations
 */
export function useWhiteboard() {
  const queryClient = useQueryClient();
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.whiteboard.latest(),
    queryFn: fetchWhiteboard,
    enabled: isInitialized && isAuthenticated,
    staleTime: 1 * 60 * 1000, // 1 minute - frequent updates
  });

  const saveMutation = useMutation({
    mutationFn: saveWhiteboard,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.whiteboard.all });
      const previous = queryClient.getQueryData(queryKeys.whiteboard.latest());

      // Optimistic update — merge with existing data to preserve fields like id
      if (previous) {
        queryClient.setQueryData(queryKeys.whiteboard.latest(), { ...previous, ...newData });
      } else {
        queryClient.setQueryData(queryKeys.whiteboard.latest(), newData);
      }

      return { previous };
    },
    onError: (_err, _newData, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.whiteboard.latest(), context.previous);
      }
    },
    onSuccess: (data) => {
      // Update cache with server response
      queryClient.setQueryData(queryKeys.whiteboard.latest(), data);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWhiteboard,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.whiteboard.all });
      const previous = queryClient.getQueryData(queryKeys.whiteboard.latest());

      // Optimistic delete
      queryClient.setQueryData(queryKeys.whiteboard.latest(), null);

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.whiteboard.latest(), context.previous);
      }
    },
  });

  return {
    whiteboard: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    // Save mutation (create or update)
    saveWhiteboard: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,

    // Delete mutation
    deleteWhiteboard: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  };
}

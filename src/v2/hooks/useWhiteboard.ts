import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { Whiteboard, ApiResponse } from '../types/coach';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Fetch latest whiteboard for current team
 */
async function fetchWhiteboard(): Promise<Whiteboard | null> {
  const response = await axios.get<ApiResponse<Whiteboard>>(
    `${API_URL}/api/v1/whiteboards/latest`,
    { withCredentials: true }
  );

  if (!response.data.success) {
    // 404 is expected if no whiteboard exists yet
    if (response.status === 404) {
      return null;
    }
    throw new Error(response.data.error?.message || 'Failed to fetch whiteboard');
  }

  return response.data.data || null;
}

/**
 * Save whiteboard (create or update)
 */
async function saveWhiteboard(
  data: Pick<Whiteboard, 'date' | 'content'>
): Promise<Whiteboard> {
  const response = await axios.post<ApiResponse<Whiteboard>>(
    `${API_URL}/api/v1/whiteboards`,
    data,
    { withCredentials: true }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to save whiteboard');
  }

  return response.data.data;
}

/**
 * Delete whiteboard
 */
async function deleteWhiteboard(id: string): Promise<void> {
  const response = await axios.delete<ApiResponse<void>>(
    `${API_URL}/api/v1/whiteboards/${id}`,
    { withCredentials: true }
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete whiteboard');
  }
}

/**
 * Hook for whiteboard with mutations
 */
export function useWhiteboard() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['whiteboard', 'latest'],
    queryFn: fetchWhiteboard,
    staleTime: 5 * 60 * 1000, // 5 minutes - whiteboards don't change often
  });

  const saveMutation = useMutation({
    mutationFn: saveWhiteboard,
    onSuccess: (data) => {
      // Update cache immediately
      queryClient.setQueryData(['whiteboard', 'latest'], data);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWhiteboard,
    onSuccess: () => {
      // Clear cache on delete
      queryClient.setQueryData(['whiteboard', 'latest'], null);
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

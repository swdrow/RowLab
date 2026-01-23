import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import useAuthStore from '../../store/authStore';
import type { Shell, ApiResponse } from '../types/coach';

/**
 * Fetch all shells for current team
 */
async function fetchShells(): Promise<Shell[]> {
  const response = await api.get<ApiResponse<{ shells: Shell[] }>>('/api/v1/shells');

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch shells');
  }

  return response.data.data.shells;
}

/**
 * Create a new shell
 */
async function createShell(
  data: Omit<Shell, 'id' | 'teamId'>
): Promise<Shell> {
  const response = await api.post<ApiResponse<Shell>>('/api/v1/shells', data);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to create shell');
  }

  return response.data.data;
}

/**
 * Update an existing shell
 */
async function updateShell(
  data: Shell
): Promise<Shell> {
  const response = await api.put<ApiResponse<Shell>>(`/api/v1/shells/${data.id}`, data);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update shell');
  }

  return response.data.data;
}

/**
 * Delete a shell
 */
async function deleteShell(id: string): Promise<void> {
  const response = await api.delete<ApiResponse<void>>(`/api/v1/shells/${id}`);

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete shell');
  }
}

/**
 * Hook for shells with CRUD mutations and optimistic updates
 */
export function useShells() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  const query = useQuery({
    queryKey: ['shells'],
    queryFn: fetchShells,
    enabled: isInitialized && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes - equipment doesn't change often
  });

  const createMutation = useMutation({
    mutationFn: createShell,
    onMutate: async (newShell) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['shells'] });

      // Snapshot previous value
      const previousShells = queryClient.getQueryData<Shell[]>(['shells']);

      // Optimistically update with temporary ID
      queryClient.setQueryData<Shell[]>(['shells'], (old = []) => [
        ...old,
        { ...newShell, id: 'temp-' + Date.now(), teamId: 'temp' } as Shell,
      ]);

      return { previousShells };
    },
    onError: (err, newShell, context) => {
      // Rollback on error
      if (context?.previousShells) {
        queryClient.setQueryData(['shells'], context.previousShells);
      }
    },
    onSettled: () => {
      // Refetch to get server state
      queryClient.invalidateQueries({ queryKey: ['shells'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateShell,
    onMutate: async (updatedShell) => {
      await queryClient.cancelQueries({ queryKey: ['shells'] });
      const previousShells = queryClient.getQueryData<Shell[]>(['shells']);

      // Optimistically update
      queryClient.setQueryData<Shell[]>(['shells'], (old = []) =>
        old.map((shell) => (shell.id === updatedShell.id ? updatedShell : shell))
      );

      return { previousShells };
    },
    onError: (err, updatedShell, context) => {
      if (context?.previousShells) {
        queryClient.setQueryData(['shells'], context.previousShells);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['shells'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteShell,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['shells'] });
      const previousShells = queryClient.getQueryData<Shell[]>(['shells']);

      // Optimistically remove
      queryClient.setQueryData<Shell[]>(['shells'], (old = []) =>
        old.filter((shell) => shell.id !== deletedId)
      );

      return { previousShells };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousShells) {
        queryClient.setQueryData(['shells'], context.previousShells);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['shells'] });
    },
  });

  return {
    shells: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    // Create mutation
    createShell: createMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    // Update mutation
    updateShell: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // Delete mutation
    deleteShell: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  };
}

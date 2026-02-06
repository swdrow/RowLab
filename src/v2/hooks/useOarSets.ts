import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import type { OarSet, ApiResponse } from '../types/coach';

/**
 * Fetch all oar sets for current team
 */
async function fetchOarSets(): Promise<OarSet[]> {
  const response = await api.get<ApiResponse<{ oarSets: OarSet[] }>>('/api/v1/oar-sets');

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch oar sets');
  }

  return response.data.data.oarSets;
}

/**
 * Create a new oar set
 */
async function createOarSet(data: Omit<OarSet, 'id' | 'teamId'>): Promise<OarSet> {
  const response = await api.post<ApiResponse<OarSet>>('/api/v1/oar-sets', data);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to create oar set');
  }

  return response.data.data;
}

/**
 * Update an existing oar set
 */
async function updateOarSet(data: OarSet): Promise<OarSet> {
  const response = await api.put<ApiResponse<OarSet>>(`/api/v1/oar-sets/${data.id}`, data);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update oar set');
  }

  return response.data.data;
}

/**
 * Delete an oar set
 */
async function deleteOarSet(id: string): Promise<void> {
  const response = await api.delete<ApiResponse<void>>(`/api/v1/oar-sets/${id}`);

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete oar set');
  }
}

/**
 * Hook for oar sets with CRUD mutations and optimistic updates
 */
export function useOarSets() {
  const queryClient = useQueryClient();
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: ['oar-sets'],
    queryFn: fetchOarSets,
    enabled: isInitialized && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes - equipment doesn't change often
  });

  const createMutation = useMutation({
    mutationFn: createOarSet,
    onMutate: async (newOarSet) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['oar-sets'] });

      // Snapshot previous value
      const previousOarSets = queryClient.getQueryData<OarSet[]>(['oar-sets']);

      // Optimistically update with temporary ID
      queryClient.setQueryData<OarSet[]>(['oar-sets'], (old = []) => [
        ...old,
        { ...newOarSet, id: 'temp-' + Date.now(), teamId: 'temp' } as OarSet,
      ]);

      return { previousOarSets };
    },
    onError: (err, newOarSet, context) => {
      // Rollback on error
      if (context?.previousOarSets) {
        queryClient.setQueryData(['oar-sets'], context.previousOarSets);
      }
    },
    onSettled: () => {
      // Refetch to get server state
      queryClient.invalidateQueries({ queryKey: ['oar-sets'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateOarSet,
    onMutate: async (updatedOarSet) => {
      await queryClient.cancelQueries({ queryKey: ['oar-sets'] });
      const previousOarSets = queryClient.getQueryData<OarSet[]>(['oar-sets']);

      // Optimistically update
      queryClient.setQueryData<OarSet[]>(['oar-sets'], (old = []) =>
        old.map((oarSet) => (oarSet.id === updatedOarSet.id ? updatedOarSet : oarSet))
      );

      return { previousOarSets };
    },
    onError: (err, updatedOarSet, context) => {
      if (context?.previousOarSets) {
        queryClient.setQueryData(['oar-sets'], context.previousOarSets);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['oar-sets'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOarSet,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['oar-sets'] });
      const previousOarSets = queryClient.getQueryData<OarSet[]>(['oar-sets']);

      // Optimistically remove
      queryClient.setQueryData<OarSet[]>(['oar-sets'], (old = []) =>
        old.filter((oarSet) => oarSet.id !== deletedId)
      );

      return { previousOarSets };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousOarSets) {
        queryClient.setQueryData(['oar-sets'], context.previousOarSets);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['oar-sets'] });
    },
  });

  return {
    oarSets: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    // Create mutation
    createOarSet: createMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    // Update mutation
    updateOarSet: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // Delete mutation
    deleteOarSet: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  };
}

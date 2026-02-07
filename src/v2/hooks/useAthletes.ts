import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { queryKeys } from '../lib/queryKeys';
import type { Athlete, AthleteFilters, ApiResponse, CSVImportResult } from '../types/athletes';

/**
 * Fetch all athletes for current team
 */
async function fetchAthletes(): Promise<Athlete[]> {
  const response = await api.get<ApiResponse<{ athletes: Athlete[] }>>('/api/v1/athletes');

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch athletes');
  }

  return response.data.data.athletes;
}

/**
 * Create a new athlete
 */
async function createAthlete(
  data: Omit<Athlete, 'id' | 'teamId' | 'createdAt' | 'updatedAt'>
): Promise<Athlete> {
  const response = await api.post<ApiResponse<{ athlete: Athlete }>>('/api/v1/athletes', data);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to create athlete');
  }

  return response.data.data.athlete;
}

/**
 * Update an existing athlete
 */
async function updateAthlete(data: Partial<Athlete> & { id: string }): Promise<Athlete> {
  const response = await api.put<ApiResponse<{ athlete: Athlete }>>(
    `/api/v1/athletes/${data.id}`,
    data
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update athlete');
  }

  return response.data.data.athlete;
}

/**
 * Delete an athlete
 */
async function deleteAthlete(id: string): Promise<void> {
  const response = await api.delete<ApiResponse<void>>(`/api/v1/athletes/${id}`);

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete athlete');
  }
}

/**
 * Bulk import athletes from CSV
 */
async function bulkImportAthletes(
  athletes: Omit<Athlete, 'id' | 'teamId' | 'createdAt' | 'updatedAt'>[]
): Promise<CSVImportResult> {
  const response = await api.post<ApiResponse<CSVImportResult>>('/api/v1/athletes/bulk', {
    athletes,
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to import athletes');
  }

  return response.data.data;
}

/**
 * Filter athletes client-side
 */
function filterAthletes(athletes: Athlete[], filters: AthleteFilters): Athlete[] {
  return athletes.filter((athlete) => {
    // Search filter (name)
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const fullName = `${athlete.firstName} ${athlete.lastName}`.toLowerCase();
      if (!fullName.includes(search)) return false;
    }

    // Side preference filter
    if (filters.side && filters.side !== 'all') {
      if (athlete.side !== filters.side) return false;
    }

    // Can scull filter
    if (filters.canScull !== null && filters.canScull !== undefined) {
      if (athlete.canScull !== filters.canScull) return false;
    }

    // Can cox filter
    if (filters.canCox !== null && filters.canCox !== undefined) {
      if (athlete.canCox !== filters.canCox) return false;
    }

    return true;
  });
}

/**
 * Hook for athletes with CRUD mutations and filtering
 */
export function useAthletes(filters?: AthleteFilters) {
  const queryClient = useQueryClient();
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.athletes.list(filters),
    queryFn: fetchAthletes,
    enabled: isInitialized && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Apply client-side filters
  const filteredAthletes =
    query.data && filters ? filterAthletes(query.data, filters) : query.data || [];

  const createMutation = useMutation({
    mutationFn: createAthlete,
    onMutate: async (newAthlete) => {
      const queryKey = queryKeys.athletes.list(filters);
      await queryClient.cancelQueries({ queryKey: queryKeys.athletes.all });
      const previousAthletes = queryClient.getQueryData<Athlete[]>(queryKey);

      queryClient.setQueryData<Athlete[]>(queryKey, (old = []) => [
        ...old,
        {
          ...newAthlete,
          id: 'temp-' + Date.now(),
          teamId: 'temp',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Athlete,
      ]);

      return { previousAthletes, queryKey };
    },
    onError: (_err, _newAthlete, context) => {
      if (context?.previousAthletes && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousAthletes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.athletes.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAthlete,
    onMutate: async (updatedAthlete) => {
      const queryKey = queryKeys.athletes.list(filters);
      await queryClient.cancelQueries({ queryKey: queryKeys.athletes.all });
      const previousAthletes = queryClient.getQueryData<Athlete[]>(queryKey);

      queryClient.setQueryData<Athlete[]>(queryKey, (old = []) =>
        old.map((athlete) =>
          athlete.id === updatedAthlete.id
            ? { ...athlete, ...updatedAthlete, updatedAt: new Date().toISOString() }
            : athlete
        )
      );

      return { previousAthletes, queryKey };
    },
    onError: (_err, _updatedAthlete, context) => {
      if (context?.previousAthletes && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousAthletes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.athletes.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAthlete,
    onMutate: async (deletedId) => {
      const queryKey = queryKeys.athletes.list(filters);
      await queryClient.cancelQueries({ queryKey: queryKeys.athletes.all });
      const previousAthletes = queryClient.getQueryData<Athlete[]>(queryKey);

      queryClient.setQueryData<Athlete[]>(queryKey, (old = []) =>
        old.filter((athlete) => athlete.id !== deletedId)
      );

      return { previousAthletes, queryKey };
    },
    onError: (_err, _deletedId, context) => {
      if (context?.previousAthletes && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousAthletes);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.athletes.all });
    },
  });

  const importMutation = useMutation({
    mutationFn: bulkImportAthletes,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.athletes.all });
    },
  });

  return {
    // Data
    athletes: filteredAthletes,
    allAthletes: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    // Create mutation
    createAthlete: createMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    // Update mutation
    updateAthlete: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // Delete mutation
    deleteAthlete: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    // Bulk import mutation
    importAthletes: importMutation.mutate,
    isImporting: importMutation.isPending,
    importError: importMutation.error,
    importResult: importMutation.data,
  };
}

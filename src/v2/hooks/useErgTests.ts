import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import useAuthStore from '../../store/authStore';
import type {
  ErgTest,
  ErgTestFilters,
  AthleteErgHistory,
  ErgLeaderboardEntry,
  CreateErgTestInput,
  UpdateErgTestInput,
  BulkImportResult,
  ApiResponse,
  TestType,
} from '../types/ergTests';

/**
 * Fetch all erg tests with optional filters
 */
async function fetchErgTests(filters: ErgTestFilters = {}): Promise<ErgTest[]> {
  const params = new URLSearchParams();

  if (filters.athleteId) params.append('athleteId', filters.athleteId);
  if (filters.testType && filters.testType !== 'all') params.append('testType', filters.testType);
  if (filters.fromDate) params.append('fromDate', filters.fromDate);
  if (filters.toDate) params.append('toDate', filters.toDate);

  const url = `/api/v1/erg-tests${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await api.get<ApiResponse<{ tests: ErgTest[] }>>(url);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch erg tests');
  }

  return response.data.data.tests;
}

/**
 * Create a new erg test
 */
async function createErgTest(data: CreateErgTestInput): Promise<ErgTest> {
  const response = await api.post<ApiResponse<{ test: ErgTest }>>('/api/v1/erg-tests', data);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to create erg test');
  }

  return response.data.data.test;
}

/**
 * Update an existing erg test
 */
async function updateErgTest(data: UpdateErgTestInput & { id: string }): Promise<ErgTest> {
  const response = await api.patch<ApiResponse<{ test: ErgTest }>>(
    `/api/v1/erg-tests/${data.id}`,
    data
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update erg test');
  }

  return response.data.data.test;
}

/**
 * Delete an erg test
 */
async function deleteErgTest(id: string): Promise<void> {
  const response = await api.delete<ApiResponse<void>>(`/api/v1/erg-tests/${id}`);

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete erg test');
  }
}

/**
 * Fetch athlete's erg test history with personal bests
 */
async function fetchAthleteHistory(athleteId: string): Promise<AthleteErgHistory> {
  const response = await api.get<ApiResponse<AthleteErgHistory>>(
    `/api/v1/erg-tests/athlete/${athleteId}/history`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch athlete history');
  }

  return response.data.data;
}

/**
 * Fetch leaderboard for a test type
 */
async function fetchLeaderboard(
  testType: TestType,
  limit: number = 20
): Promise<ErgLeaderboardEntry[]> {
  const params = new URLSearchParams({
    testType,
    limit: limit.toString(),
  });

  const response = await api.get<ApiResponse<{ leaderboard: ErgLeaderboardEntry[] }>>(
    `/api/v1/erg-tests/leaderboard?${params.toString()}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch leaderboard');
  }

  return response.data.data.leaderboard;
}

/**
 * Bulk import erg tests from CSV
 */
async function bulkImportTests(tests: CreateErgTestInput[]): Promise<BulkImportResult> {
  const response = await api.post<ApiResponse<BulkImportResult>>(
    '/api/v1/erg-tests/bulk-import',
    { tests }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to import erg tests');
  }

  return response.data.data;
}

/**
 * Hook for erg tests with CRUD mutations and filtering
 */
export function useErgTests(filters?: ErgTestFilters) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  const query = useQuery({
    queryKey: ['ergTests', filters],
    queryFn: () => fetchErgTests(filters),
    enabled: isInitialized && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const createMutation = useMutation({
    mutationFn: createErgTest,
    onMutate: async (newTest) => {
      await queryClient.cancelQueries({ queryKey: ['ergTests'] });
      const previousTests = queryClient.getQueryData<ErgTest[]>(['ergTests', filters]);

      // Optimistic update
      queryClient.setQueryData<ErgTest[]>(['ergTests', filters], (old = []) => [
        {
          ...newTest,
          id: 'temp-' + Date.now(),
          athlete: null,
          createdAt: new Date().toISOString(),
        } as ErgTest,
        ...old,
      ]);

      return { previousTests };
    },
    onError: (_err, _newTest, context) => {
      if (context?.previousTests) {
        queryClient.setQueryData(['ergTests', filters], context.previousTests);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ergTests'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateErgTest,
    onMutate: async (updatedTest) => {
      await queryClient.cancelQueries({ queryKey: ['ergTests'] });
      const previousTests = queryClient.getQueryData<ErgTest[]>(['ergTests', filters]);

      // Optimistic update
      queryClient.setQueryData<ErgTest[]>(['ergTests', filters], (old = []) =>
        old.map((test) =>
          test.id === updatedTest.id
            ? { ...test, ...updatedTest }
            : test
        )
      );

      return { previousTests };
    },
    onError: (_err, _updatedTest, context) => {
      if (context?.previousTests) {
        queryClient.setQueryData(['ergTests', filters], context.previousTests);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ergTests'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteErgTest,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['ergTests'] });
      const previousTests = queryClient.getQueryData<ErgTest[]>(['ergTests', filters]);

      // Optimistic update
      queryClient.setQueryData<ErgTest[]>(['ergTests', filters], (old = []) =>
        old.filter((test) => test.id !== deletedId)
      );

      return { previousTests };
    },
    onError: (_err, _deletedId, context) => {
      if (context?.previousTests) {
        queryClient.setQueryData(['ergTests', filters], context.previousTests);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ergTests'] });
    },
  });

  return {
    // Data
    tests: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    // Create mutation
    createTest: createMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    // Update mutation
    updateTest: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // Delete mutation
    deleteTest: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  };
}

/**
 * Hook for athlete's erg test history with personal bests
 */
export function useAthleteErgHistory(athleteId: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  const query = useQuery({
    queryKey: ['ergTests', 'athlete', athleteId],
    queryFn: () => fetchAthleteHistory(athleteId),
    enabled: isInitialized && isAuthenticated && !!athleteId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    tests: query.data?.tests || [],
    personalBests: query.data?.personalBests || {},
    totalTests: query.data?.totalTests || 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for erg test leaderboard
 */
export function useErgLeaderboard(testType: TestType, limit: number = 20) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  const query = useQuery({
    queryKey: ['ergTests', 'leaderboard', testType, limit],
    queryFn: () => fetchLeaderboard(testType, limit),
    enabled: isInitialized && isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    leaderboard: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for bulk importing erg tests from CSV
 */
export function useBulkImportErgTests() {
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: bulkImportTests,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ergTests'] });
    },
  });

  return {
    importTests: importMutation.mutate,
    isImporting: importMutation.isPending,
    importError: importMutation.error,
    importResult: importMutation.data,
  };
}

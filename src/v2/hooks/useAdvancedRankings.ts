import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { queryKeys } from '../lib/queryKeys';
import type { BradleyTerryModel, ProbabilityPair, ComparisonGraph } from '../types/advancedRanking';
import type { ApiResponse } from '../types/dashboard';

// ============================================
// QUERY KEYS
// ============================================

export const advancedRankingKeys = {
  all: ['advancedRanking'] as const,
  bradleyTerry: (teamId: string) => [...advancedRankingKeys.all, 'bradleyTerry', teamId] as const,
  probabilityMatrix: (teamId: string) =>
    [...advancedRankingKeys.all, 'probabilityMatrix', teamId] as const,
  comparisonGraph: (teamId: string) =>
    [...advancedRankingKeys.all, 'comparisonGraph', teamId] as const,
};

// ============================================
// FETCH FUNCTIONS
// ============================================

async function fetchBradleyTerryRankings(teamId: string): Promise<BradleyTerryModel> {
  const response = await api.get<ApiResponse<BradleyTerryModel>>(
    `/api/v1/advanced-ranking/bradley-terry?teamId=${teamId}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch Bradley-Terry rankings');
  }

  return response.data.data;
}

async function fetchProbabilityMatrix(teamId: string): Promise<{
  matrix: number[][];
  athletes: Array<{ id: string; firstName: string; lastName: string }>;
}> {
  const response = await api.get<
    ApiResponse<{
      matrix: number[][];
      athletes: Array<{ id: string; firstName: string; lastName: string }>;
    }>
  >(`/api/v1/advanced-ranking/probability-matrix?teamId=${teamId}`);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch probability matrix');
  }

  return response.data.data;
}

async function fetchComparisonGraph(teamId: string): Promise<ComparisonGraph> {
  const response = await api.get<ApiResponse<ComparisonGraph>>(
    `/api/v1/advanced-ranking/comparison-graph?teamId=${teamId}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch comparison graph');
  }

  return response.data.data;
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Hook for fetching Bradley-Terry model rankings
 *
 * @returns Bradley-Terry model with athlete strengths and confidence intervals
 *
 * @example
 * const { model, isLoading, error } = useBradleyTerryRankings();
 * // model.athletes is sorted by strength descending
 * // Each athlete has: strength, stdError, confidenceInterval
 */
export function useBradleyTerryRankings() {
  const { isAuthenticated, isInitialized, activeTeamId } = useAuth();

  const query = useQuery({
    queryKey: advancedRankingKeys.bradleyTerry(activeTeamId || ''),
    queryFn: () => fetchBradleyTerryRankings(activeTeamId!),
    enabled: isInitialized && isAuthenticated && !!activeTeamId,
    staleTime: 5 * 60 * 1000, // 5 minutes - rankings don't change frequently
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  return {
    model: query.data,
    athletes: query.data?.athletes || [],
    convergence: query.data?.convergence,
    modelStats: query.data?.modelStats,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for fetching pairwise win probability matrix
 *
 * @returns Matrix of P(A beats B) for all athlete pairs
 *
 * @example
 * const { matrix, athletes } = useProbabilityMatrix();
 * // matrix[i][j] = P(athletes[i] beats athletes[j])
 */
export function useProbabilityMatrix() {
  const { isAuthenticated, isInitialized, activeTeamId } = useAuth();

  const query = useQuery({
    queryKey: advancedRankingKeys.probabilityMatrix(activeTeamId || ''),
    queryFn: () => fetchProbabilityMatrix(activeTeamId!),
    enabled: isInitialized && isAuthenticated && !!activeTeamId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    matrix: query.data?.matrix || [],
    athletes: query.data?.athletes || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for fetching comparison graph data for visualization
 *
 * @returns Nodes (athletes), edges (comparisons), and gaps (missing comparisons)
 *
 * @example
 * const { nodes, edges, gaps, statistics } = useComparisonGraph();
 * // gaps array shows which athlete pairs need more comparisons
 */
export function useComparisonGraph() {
  const { isAuthenticated, isInitialized, activeTeamId } = useAuth();

  const query = useQuery({
    queryKey: advancedRankingKeys.comparisonGraph(activeTeamId || ''),
    queryFn: () => fetchComparisonGraph(activeTeamId!),
    enabled: isInitialized && isAuthenticated && !!activeTeamId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    nodes: query.data?.nodes || [],
    edges: query.data?.edges || [],
    gaps: query.data?.gaps || [],
    statistics: query.data?.statistics,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

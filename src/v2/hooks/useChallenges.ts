import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useShowGamification } from './useGamificationPreference';
import type {
  Challenge,
  ChallengeTemplate,
  LeaderboardResponse,
  CreateChallengeInput,
  GamificationApiResponse,
} from '../types/gamification';

/**
 * Query key factory for challenges
 */
export const challengeKeys = {
  all: ['challenges'] as const,
  list: (status?: string) => [...challengeKeys.all, 'list', status] as const,
  active: () => [...challengeKeys.all, 'active'] as const,
  detail: (id: string) => [...challengeKeys.all, 'detail', id] as const,
  leaderboard: (id: string) => [...challengeKeys.all, 'leaderboard', id] as const,
  templates: () => [...challengeKeys.all, 'templates'] as const,
};

/**
 * Hook for all challenges (with optional status filter)
 */
export function useChallenges(status?: 'active' | 'completed' | 'cancelled') {
  const { isAuthenticated, isInitialized } = useAuth();
  const showGamification = useShowGamification();

  return useQuery({
    queryKey: challengeKeys.list(status),
    queryFn: async () => {
      const url = status
        ? `/api/v1/challenges?status=${status}`
        : '/api/v1/challenges';
      const response = await api.get<GamificationApiResponse<{ challenges: Challenge[] }>>(url);
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to fetch challenges');
      }
      return response.data.data.challenges;
    },
    enabled: isInitialized && isAuthenticated && showGamification,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook for active challenges
 */
export function useActiveChallenges() {
  const { isAuthenticated, isInitialized } = useAuth();
  const showGamification = useShowGamification();

  return useQuery({
    queryKey: challengeKeys.active(),
    queryFn: async () => {
      const response = await api.get<GamificationApiResponse<{ challenges: Challenge[] }>>(
        '/api/v1/challenges/active'
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to fetch active challenges');
      }
      return response.data.data.challenges;
    },
    enabled: isInitialized && isAuthenticated && showGamification,
    staleTime: 30 * 1000, // 30 seconds for active challenges
  });
}

/**
 * Hook for challenge templates
 */
export function useChallengeTemplates() {
  const { isAuthenticated, isInitialized } = useAuth();

  return useQuery({
    queryKey: challengeKeys.templates(),
    queryFn: async () => {
      const response = await api.get<GamificationApiResponse<{ templates: ChallengeTemplate[] }>>(
        '/api/v1/challenges/templates'
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to fetch templates');
      }
      return response.data.data.templates;
    },
    enabled: isInitialized && isAuthenticated,
    staleTime: Infinity, // Templates are static
  });
}

/**
 * Hook for single challenge details
 */
export function useChallenge(challengeId: string) {
  const { isAuthenticated, isInitialized } = useAuth();
  const showGamification = useShowGamification();

  return useQuery({
    queryKey: challengeKeys.detail(challengeId),
    queryFn: async () => {
      const response = await api.get<GamificationApiResponse<{ challenge: Challenge }>>(
        `/api/v1/challenges/${challengeId}`
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to fetch challenge');
      }
      return response.data.data.challenge;
    },
    enabled: isInitialized && isAuthenticated && showGamification && !!challengeId,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook for challenge leaderboard with real-time polling
 * Uses 5s refetchInterval and staleTime: 0 per RESEARCH.md
 */
export function useLeaderboard(challengeId: string, isActive: boolean = true) {
  const { isAuthenticated, isInitialized } = useAuth();
  const showGamification = useShowGamification();

  return useQuery({
    queryKey: challengeKeys.leaderboard(challengeId),
    queryFn: async () => {
      const response = await api.get<GamificationApiResponse<LeaderboardResponse>>(
        `/api/v1/challenges/${challengeId}/leaderboard`
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to fetch leaderboard');
      }
      return response.data.data;
    },
    enabled: isInitialized && isAuthenticated && showGamification && !!challengeId,
    // Per RESEARCH.md: 5s polling with staleTime: 0 for real-time updates
    refetchInterval: isActive ? 5000 : false,
    staleTime: 0, // Always consider stale for real-time updates
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

/**
 * Hook for creating a challenge
 */
export function useCreateChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateChallengeInput) => {
      const response = await api.post<GamificationApiResponse<{ challenge: Challenge }>>(
        '/api/v1/challenges',
        data
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to create challenge');
      }
      return response.data.data.challenge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.all });
    },
  });
}

/**
 * Hook for joining a challenge
 */
export function useJoinChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (challengeId: string) => {
      const response = await api.post<GamificationApiResponse<{ joined: boolean }>>(
        `/api/v1/challenges/${challengeId}/join`
      );
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to join challenge');
      }
      return response.data.data;
    },
    onSuccess: (_, challengeId) => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.detail(challengeId) });
      queryClient.invalidateQueries({ queryKey: challengeKeys.leaderboard(challengeId) });
    },
  });
}

/**
 * Hook for leaving a challenge
 */
export function useLeaveChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (challengeId: string) => {
      const response = await api.post<GamificationApiResponse<{ left: boolean }>>(
        `/api/v1/challenges/${challengeId}/leave`
      );
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to leave challenge');
      }
      return response.data.data;
    },
    onSuccess: (_, challengeId) => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.detail(challengeId) });
      queryClient.invalidateQueries({ queryKey: challengeKeys.leaderboard(challengeId) });
    },
  });
}

/**
 * Hook for refreshing leaderboard manually
 */
export function useRefreshLeaderboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (challengeId: string) => {
      const response = await api.post<GamificationApiResponse<LeaderboardResponse>>(
        `/api/v1/challenges/${challengeId}/refresh`
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to refresh leaderboard');
      }
      return response.data.data;
    },
    onSuccess: (data, challengeId) => {
      queryClient.setQueryData(challengeKeys.leaderboard(challengeId), data);
    },
  });
}

/**
 * Hook for cancelling a challenge
 */
export function useCancelChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (challengeId: string) => {
      const response = await api.delete<GamificationApiResponse<{ cancelled: boolean }>>(
        `/api/v1/challenges/${challengeId}`
      );
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to cancel challenge');
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.all });
    },
  });
}

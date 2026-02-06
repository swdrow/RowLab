import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useShowGamification } from './useGamificationPreference';
import type {
  PersonalRecord,
  TeamRecord,
  PRCelebrationData,
  GamificationApiResponse,
} from '../types/gamification';

/**
 * Query key factory for personal records
 */
export const prKeys = {
  all: ['personalRecords'] as const,
  mine: () => [...prKeys.all, 'mine'] as const,
  athlete: (athleteId: string) => [...prKeys.all, 'athlete', athleteId] as const,
  history: (athleteId: string) => [...prKeys.all, 'history', athleteId] as const,
  teamRecords: () => [...prKeys.all, 'team-records'] as const,
  celebration: (testId: string) => [...prKeys.all, 'celebration', testId] as const,
  trend: (athleteId: string, testType: string) => [...prKeys.all, 'trend', athleteId, testType] as const,
};

/**
 * Hook for current user's PRs
 */
export function usePersonalRecords() {
  const { isAuthenticated, isInitialized } = useAuth();
  const showGamification = useShowGamification();

  return useQuery({
    queryKey: prKeys.mine(),
    queryFn: async () => {
      const response = await api.get<GamificationApiResponse<{ prs: PersonalRecord[] }>>(
        '/api/v1/personal-records'
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to fetch PRs');
      }
      return response.data.data.prs;
    },
    enabled: isInitialized && isAuthenticated && showGamification,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook for a specific athlete's PRs
 */
export function useAthletePRs(athleteId: string) {
  const { isAuthenticated, isInitialized } = useAuth();
  const showGamification = useShowGamification();

  return useQuery({
    queryKey: prKeys.athlete(athleteId),
    queryFn: async () => {
      const response = await api.get<GamificationApiResponse<{ prs: PersonalRecord[] }>>(
        `/api/v1/personal-records/athlete/${athleteId}`
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to fetch PRs');
      }
      return response.data.data.prs;
    },
    enabled: isInitialized && isAuthenticated && showGamification && !!athleteId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook for team records
 */
export function useTeamRecords() {
  const { isAuthenticated, isInitialized } = useAuth();
  const showGamification = useShowGamification();

  return useQuery({
    queryKey: prKeys.teamRecords(),
    queryFn: async () => {
      const response = await api.get<GamificationApiResponse<{ records: TeamRecord[] }>>(
        '/api/v1/personal-records/team-records'
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to fetch team records');
      }
      return response.data.data.records;
    },
    enabled: isInitialized && isAuthenticated && showGamification,
    staleTime: 5 * 60 * 1000, // 5 minutes - records change rarely
  });
}

/**
 * Hook for PR celebration data (for specific test)
 */
export function usePRCelebration(testId: string) {
  const { isAuthenticated, isInitialized } = useAuth();
  const showGamification = useShowGamification();

  return useQuery({
    queryKey: prKeys.celebration(testId),
    queryFn: async () => {
      const response = await api.get<GamificationApiResponse<PRCelebrationData>>(
        `/api/v1/personal-records/detect/${testId}`
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to detect PRs');
      }
      return response.data.data;
    },
    enabled: isInitialized && isAuthenticated && showGamification && !!testId,
    staleTime: Infinity, // PR detection is immutable
  });
}

/**
 * Hook for result trend (for sparkline)
 */
export function useResultTrend(athleteId: string, testType: string, limit: number = 5) {
  const { isAuthenticated, isInitialized } = useAuth();
  const showGamification = useShowGamification();

  return useQuery({
    queryKey: prKeys.trend(athleteId, testType),
    queryFn: async () => {
      const response = await api.get<GamificationApiResponse<{ trend: { result: number; date: string }[] }>>(
        `/api/v1/personal-records/trend/${athleteId}/${testType}?limit=${limit}`
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to fetch trend');
      }
      return response.data.data.trend;
    },
    enabled: isInitialized && isAuthenticated && showGamification && !!athleteId && !!testType,
    staleTime: 2 * 60 * 1000,
  });
}

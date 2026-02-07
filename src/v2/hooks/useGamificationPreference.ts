import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useFeature } from './useFeaturePreference';
import type { GamificationApiResponse } from '../types/gamification';

/**
 * Hook to check if gamification is enabled for current user.
 * Checks both team-level feature toggle and per-athlete opt-out.
 *
 * @returns Object with enabled status and loading state
 */
export function useGamificationEnabled() {
  const { isAuthenticated, isInitialized } = useAuth();

  // Team-level feature toggle
  const teamEnabled = useFeature('gamification');

  // Athlete-level preference
  const { data: athletePrefs, isLoading } = useQuery({
    queryKey: queryKeys.gamification.preferences(),
    queryFn: async () => {
      const response = await api.get<GamificationApiResponse<{ gamificationEnabled: boolean }>>(
        '/api/v1/athletes/me/preferences'
      );
      return response.data.data?.gamificationEnabled ?? true;
    },
    enabled: isInitialized && isAuthenticated && teamEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Both must be true for gamification to show
  const enabled = teamEnabled && (athletePrefs ?? true);

  return {
    enabled,
    isLoading,
    teamEnabled,
    athleteOptedIn: athletePrefs ?? true,
  };
}

/**
 * Simplified hook that just returns boolean
 */
export function useShowGamification(): boolean {
  const { enabled } = useGamificationEnabled();
  return enabled;
}

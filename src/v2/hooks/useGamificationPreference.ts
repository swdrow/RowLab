import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import type { GamificationApiResponse } from '../types/gamification';

/**
 * Hook to check if gamification is enabled for current user.
 * Checks per-athlete opt-out preference.
 *
 * NOTE: Team-level feature toggles removed in Phase 36.
 * Gamification is now always available, athletes can opt-out individually.
 *
 * @returns Object with enabled status and loading state
 */
export function useGamificationEnabled() {
  const { isAuthenticated, isInitialized } = useAuth();

  // Athlete-level preference (defaults to enabled)
  const { data: athletePrefs, isLoading } = useQuery({
    queryKey: queryKeys.gamification.preferences(),
    queryFn: async () => {
      const response = await api.get<GamificationApiResponse<{ gamificationEnabled: boolean }>>(
        '/api/v1/athletes/me/preferences'
      );
      return response.data.data?.gamificationEnabled ?? true;
    },
    enabled: isInitialized && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const enabled = athletePrefs ?? true;

  return {
    enabled,
    isLoading,
    teamEnabled: true, // Always true now, feature toggles removed
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

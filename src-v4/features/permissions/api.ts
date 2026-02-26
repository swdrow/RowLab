/**
 * Permission / feature-flag query options.
 *
 * Fetches team feature flags from GET /api/v1/teams/:teamId/feature-flags.
 * Flags change rarely so staleTime is 5 minutes.
 */
import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { FeatureFlags } from './types';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const permissionKeys = {
  all: ['permissions'] as const,
  flags: (teamId: string) => [...permissionKeys.all, teamId, 'flags'] as const,
};

// ---------------------------------------------------------------------------
// Query options
// ---------------------------------------------------------------------------

export function featureFlagsOptions(teamId: string | null) {
  return queryOptions<FeatureFlags>({
    queryKey: permissionKeys.flags(teamId ?? ''),
    enabled: !!teamId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const data = await apiClient.get<{ flags: FeatureFlags }>(
        `/api/v1/teams/${teamId}/feature-flags`
      );
      return data.flags;
    },
  });
}

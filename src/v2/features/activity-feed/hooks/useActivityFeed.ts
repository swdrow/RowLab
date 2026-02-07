// src/v2/features/activity-feed/hooks/useActivityFeed.ts
// TanStack Query infinite query hook for unified activity feed

import { useInfiniteQuery } from '@tanstack/react-query';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import api from '../../../utils/api';
import { useAuth } from '../../../contexts/AuthContext';
import { queryKeys } from '../../../lib/queryKeys';
import type { ActivityFeedResponse } from '../../../types/activity';

// ============================================
// API TYPES
// ============================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================
// API FUNCTION
// ============================================

async function fetchActivityFeed(
  athleteId?: string,
  cursor?: string
): Promise<ActivityFeedResponse> {
  const params = new URLSearchParams();
  if (athleteId) params.set('athleteId', athleteId);
  if (cursor) params.set('cursor', cursor);
  params.set('limit', '20');

  const url = `/api/v1/activities/unified?${params.toString()}`;
  const response = await api.get<ApiResponse<ActivityFeedResponse>>(url);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch activities');
  }

  return response.data.data;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook for unified activity feed with infinite scroll
 *
 * Uses TanStack Query's useInfiniteQuery for cursor-based pagination.
 * Aggregates erg tests, session participation, race results, etc.
 *
 * @param athleteId - Optional athlete ID to filter activities
 */
export function useUnifiedActivityFeed(athleteId?: string) {
  const { isAuthenticated, isInitialized, activeTeamId } = useAuth();

  return useInfiniteQuery({
    queryKey: [...queryKeys.dashboard.activityFeed(), athleteId],
    queryFn: ({ pageParam }) => fetchActivityFeed(athleteId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: isInitialized && isAuthenticated && !!activeTeamId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

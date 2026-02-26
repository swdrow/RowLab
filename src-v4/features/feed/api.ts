/**
 * Feed query option factories for TanStack Query.
 *
 * socialFeedOptions    -- infinite cursor-paginated social feed
 * followStatsOptions   -- current user's follower/following counts
 *
 * Mutations (like, follow, unfollow) are defined inline in components
 * via useMutation since they need optimistic update logic.
 */
import { infiniteQueryOptions, queryOptions, type InfiniteData } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { FeedData, FeedFilters, FollowStats, ToggleLikeResult, FollowResult } from './types';

// ---------------------------------------------------------------------------
// Social feed (infinite scroll)
// ---------------------------------------------------------------------------

export function socialFeedOptions(filters: FeedFilters) {
  return infiniteQueryOptions<
    FeedData,
    Error,
    InfiniteData<FeedData, string | null>,
    ReturnType<typeof queryKeys.feed.list>,
    string | null
  >({
    queryKey: queryKeys.feed.list(filters),
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string> = { limit: '20' };

      if (filters.filter) params.filter = filters.filter;
      if (pageParam) params.cursor = pageParam;

      return apiClient.get<FeedData>('/api/u/feed', { params });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Follow stats
// ---------------------------------------------------------------------------

export function followStatsOptions() {
  return queryOptions<FollowStats>({
    queryKey: queryKeys.feed.followStats(),
    queryFn: () => apiClient.get<FollowStats>('/api/u/feed/follow-stats'),
    staleTime: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Mutation helpers (plain functions, used with useMutation in components)
// ---------------------------------------------------------------------------

export function toggleLike(workoutId: string): Promise<ToggleLikeResult> {
  return apiClient.post<ToggleLikeResult>(`/api/u/feed/${workoutId}/like`);
}

export function followUser(userId: string): Promise<FollowResult> {
  return apiClient.post<FollowResult>(`/api/u/feed/follow/${userId}`);
}

export function unfollowUser(userId: string): Promise<FollowResult> {
  return apiClient.delete<FollowResult>(`/api/u/feed/follow/${userId}`);
}

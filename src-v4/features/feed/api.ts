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
import { api } from '@/lib/api';
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

      const res = await api.get('/api/u/feed', { params });
      return res.data.data as FeedData;
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
    queryFn: async () => {
      const res = await api.get('/api/u/feed/follow-stats');
      return res.data.data as FollowStats;
    },
    staleTime: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Mutation helpers (plain functions, used with useMutation in components)
// ---------------------------------------------------------------------------

export async function toggleLike(workoutId: string): Promise<ToggleLikeResult> {
  const res = await api.post(`/api/u/feed/${workoutId}/like`);
  return res.data.data as ToggleLikeResult;
}

export async function followUser(userId: string): Promise<FollowResult> {
  const res = await api.post(`/api/u/feed/follow/${userId}`);
  return res.data.data as FollowResult;
}

export async function unfollowUser(userId: string): Promise<FollowResult> {
  const res = await api.delete(`/api/u/feed/follow/${userId}`);
  return res.data.data as FollowResult;
}

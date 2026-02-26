/**
 * Infinite-scrolling team activity feed hook.
 *
 * Returns a flattened events array with pagination controls.
 * Uses the explicit 5-param InfiniteData generic pattern from Phase 47-02.
 */
import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { teamActivityOptions } from '../api';
import type { ActivityEvent } from '../types';

export interface TeamActivityResult {
  events: ActivityEvent[];
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
}

export function useTeamActivity(teamId: string): TeamActivityResult {
  const query = useInfiniteQuery(teamActivityOptions(teamId));

  const events = useMemo(() => query.data?.pages.flatMap((p) => p.events) ?? [], [query.data]);

  return {
    events,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
  };
}

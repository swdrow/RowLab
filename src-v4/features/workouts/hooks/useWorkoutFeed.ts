/**
 * Infinite-scrolling workout feed hook.
 *
 * Returns a flattened `workouts` array, a `sentinelRef` to attach to a
 * bottom-of-list element, and all standard infinite query state.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { workoutFeedOptions } from '../api';
import type { WorkoutFilters } from '../types';

export function useWorkoutFeed(filters: WorkoutFilters) {
  const query = useInfiniteQuery(workoutFeedOptions(filters));
  const sentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver: fetch next page when sentinel becomes visible
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
          query.fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  // Flatten paginated data into a single array (memoised)
  const workouts = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);

  return { ...query, workouts, sentinelRef };
}

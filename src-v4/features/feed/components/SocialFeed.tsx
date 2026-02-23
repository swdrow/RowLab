/**
 * SocialFeed — infinite-scroll workout feed with filter tabs.
 * Uses useInfiniteQuery for cursor-based pagination.
 * IntersectionObserver triggers next page fetch.
 */
import { useRef, useEffect, useState, useMemo, forwardRef, type SVGProps } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { socialFeedOptions } from '../api';
import { SocialFeedCard } from './SocialFeedCard';
import { FeedSkeleton, FeedCardSkeleton } from './FeedSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { FeedFilter } from '../types';

/** Custom rowing icon — replaces generic icon library per design spec. */
const RowingIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement> & { size?: number }>(
  ({ size = 24, className, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Oar blade */}
      <path d="M4 18 L20 6" />
      <path d="M17 4 L21 8 L19 9 L16 6 Z" />
      {/* Water line */}
      <path d="M2 20 Q6 18 10 20 Q14 22 18 20 L22 20" />
    </svg>
  )
);
RowingIcon.displayName = 'RowingIcon';

const FILTER_TABS: { value: FeedFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'following', label: 'Following' },
  { value: 'me', label: 'You' },
];

export function SocialFeed() {
  const [filter, setFilter] = useState<FeedFilter>('all');

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-edge-default">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              filter === tab.value
                ? 'text-text-bright border-accent-teal'
                : 'text-text-dim border-transparent hover:text-text-default'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <FeedContent filter={filter} />
    </div>
  );
}

function FeedContent({ filter }: { filter: FeedFilter }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery(
    socialFeedOptions({ filter })
  );

  // Stable IntersectionObserver — use refs for volatile state to avoid teardown/rebuild
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingRef = useRef(isFetchingNextPage);
  hasNextPageRef.current = hasNextPage;
  isFetchingRef.current = isFetchingNextPage;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPageRef.current && !isFetchingRef.current) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage]);

  // Memoize flattened items — prevents new array reference on every render
  const allItems = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  if (isLoading) {
    return <FeedSkeleton />;
  }

  if (allItems.length === 0) {
    return (
      <EmptyState
        icon={RowingIcon as unknown as import('@/types/icons').IconComponent}
        title="No workouts yet"
        description={
          filter === 'following'
            ? 'Follow other athletes to see their workouts here.'
            : 'Log a workout to get started.'
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {allItems.map((item) => (
        <SocialFeedCard key={item.id} item={item} />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef}>
        {isFetchingNextPage && (
          <div className="space-y-4">
            <FeedCardSkeleton />
            <FeedCardSkeleton />
          </div>
        )}
      </div>
    </div>
  );
}

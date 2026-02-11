/**
 * SkeletonList - List-shaped skeleton loader
 *
 * Matches the shape of list items: avatar + title + subtitle.
 * Used for loading states in activity feeds, athlete lists, etc.
 *
 * @example
 * // Default 5 items
 * <SkeletonList />
 *
 * // Custom item count
 * <SkeletonList items={10} />
 */

import { Skeleton } from './Skeleton';

interface SkeletonListProps {
  items?: number;
}

export function SkeletonList({ items = 5 }: SkeletonListProps) {
  return (
    <div className="space-y-0">
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 py-3 border-b border-bdr-default last:border-b-0"
        >
          {/* Avatar */}
          <Skeleton variant="avatar" width="40px" height="40px" />

          {/* Title + subtitle */}
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height="16px" />
            <Skeleton width="40%" height="14px" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonCard - Card-shaped skeleton loader
 *
 * Matches the shape of GlassCard components: title + body text + metadata row.
 * Used for loading states in dashboard widgets, athlete lists, etc.
 *
 * @example
 * // Single card
 * <SkeletonCard />
 *
 * // Multiple cards
 * <SkeletonCard count={3} />
 */

import { Skeleton } from './Skeleton';

interface SkeletonCardProps {
  count?: number;
}

export function SkeletonCard({ count = 1 }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-surface-elevated rounded-lg border border-bdr-default p-4 space-y-3"
        >
          {/* Title */}
          <Skeleton variant="title" />

          {/* Body text lines (3 lines with varying widths) */}
          <div className="space-y-2">
            <Skeleton width="100%" />
            <Skeleton width="85%" />
            <Skeleton width="60%" />
          </div>

          {/* Metadata row (2 small items side by side) */}
          <div className="flex gap-4 pt-2">
            <Skeleton width="80px" height="14px" />
            <Skeleton width="100px" height="14px" />
          </div>
        </div>
      ))}
    </>
  );
}

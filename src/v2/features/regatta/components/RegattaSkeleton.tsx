/**
 * RegattaSkeleton Component
 *
 * Skeleton loaders matching regatta list and detail layouts.
 * Replaces spinners during data loading (CW-03).
 *
 * Features:
 * - RegattaListSkeleton: 5 rows matching regatta card layout
 * - RegattaDetailSkeleton: Race timeline skeleton with 4 race cards
 * - Shimmer animation with animate-pulse
 * - Matches exact layout dimensions of real components
 */

import { cn } from '@v2/utils/cn';

interface RegattaListSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Skeleton loader for regatta list view.
 * Matches RegattaList card layout with name, date, location.
 */
export function RegattaListSkeleton({ count = 5, className }: RegattaListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-lg bg-ink-raised border border-bdr-default animate-pulse"
        >
          {/* Name bar */}
          <div className="h-6 w-2/3 bg-ink-well rounded mb-3 opacity-50" />

          {/* Date and location */}
          <div className="flex gap-4 mb-2">
            <div className="h-4 w-32 bg-ink-well rounded opacity-50" />
            <div className="h-4 w-40 bg-ink-well rounded opacity-50" />
          </div>

          {/* Stats row */}
          <div className="flex gap-3 mt-3">
            <div className="h-8 w-20 bg-ink-well rounded opacity-50" />
            <div className="h-8 w-24 bg-ink-well rounded opacity-50" />
            <div className="h-8 w-20 bg-ink-well rounded opacity-50" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface RegattaDetailSkeletonProps {
  className?: string;
}

/**
 * Skeleton loader for regatta detail view.
 * Matches RegattaDetail layout with header + race timeline.
 */
export function RegattaDetailSkeleton({ className }: RegattaDetailSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="h-8 w-1/2 bg-ink-raised rounded mb-4 opacity-50" />
        <div className="flex gap-4 mb-2">
          <div className="h-4 w-32 bg-ink-raised rounded opacity-50" />
          <div className="h-4 w-40 bg-ink-raised rounded opacity-50" />
        </div>
        <div className="h-16 w-full bg-ink-raised rounded mt-4 opacity-50" />
      </div>

      {/* Race timeline skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-40 bg-ink-raised rounded animate-pulse opacity-50" />

        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-lg bg-ink-raised border border-bdr-default animate-pulse"
          >
            {/* Race name and time */}
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-48 bg-ink-well rounded opacity-50" />
              <div className="h-4 w-24 bg-ink-well rounded opacity-50" />
            </div>

            {/* Results table skeleton */}
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex gap-3">
                  <div className="h-4 w-8 bg-ink-well rounded opacity-50" />
                  <div className="h-4 flex-1 bg-ink-well rounded opacity-50" />
                  <div className="h-4 w-20 bg-ink-well rounded opacity-50" />
                  <div className="h-4 w-16 bg-ink-well rounded opacity-50" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

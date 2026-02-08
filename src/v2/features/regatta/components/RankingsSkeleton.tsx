/**
 * RankingsSkeleton Component
 *
 * Skeleton loader matching rankings table layout.
 * Replaces spinners during ranking data loading (CW-03).
 *
 * Features:
 * - Table header skeleton (6 columns)
 * - 10 rows with rank, team name, speed, trend sparkline placeholders
 * - Matches column widths of real RankingsView table
 * - Shimmer animation with animate-pulse
 */

import { cn } from '@v2/utils/cn';

interface RankingsSkeletonProps {
  rows?: number;
  className?: string;
}

/**
 * Skeleton loader for rankings table.
 * Matches RankingsView table layout with rank, team, speed, trend.
 */
export function RankingsSkeleton({ rows = 10, className }: RankingsSkeletonProps) {
  return (
    <div className={cn('', className)}>
      {/* Table header skeleton */}
      <div className="border-b border-bdr-default pb-2 mb-2 animate-pulse">
        <div className="flex gap-4">
          <div className="h-4 w-12 bg-ink-raised rounded opacity-50" />
          <div className="h-4 w-8 bg-ink-raised rounded opacity-50" />
          <div className="h-4 flex-1 bg-ink-raised rounded opacity-50" />
          <div className="h-4 w-20 bg-ink-raised rounded opacity-50" />
          <div className="h-4 w-32 bg-ink-raised rounded opacity-50" />
          <div className="h-4 w-16 bg-ink-raised rounded opacity-50" />
        </div>
      </div>

      {/* Table rows skeleton */}
      <div className="space-y-1">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 py-3 border-b border-bdr-default/50 animate-pulse"
          >
            {/* Rank */}
            <div className="h-5 w-12 bg-ink-raised rounded opacity-50" />

            {/* Trend icon placeholder */}
            <div className="h-4 w-8 bg-ink-raised rounded opacity-50" />

            {/* Team name */}
            <div
              className="h-5 flex-1 bg-ink-raised rounded opacity-50"
              style={{ width: `${60 + Math.random() * 20}%` }}
            />

            {/* Speed */}
            <div className="h-5 w-20 bg-ink-raised rounded opacity-50" />

            {/* Sparkline placeholder */}
            <div className="h-8 w-32 bg-ink-raised rounded opacity-50" />

            {/* Rank change badge */}
            <div className="h-6 w-16 bg-ink-raised rounded-full opacity-50" />
          </div>
        ))}
      </div>
    </div>
  );
}

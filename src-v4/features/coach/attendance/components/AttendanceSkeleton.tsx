/**
 * Skeleton loader for the attendance page.
 *
 * Shows shimmer rows matching the athlete roster layout.
 * Uses Skeleton primitives per design standard -- NEVER spinners.
 */
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';

interface AttendanceSkeletonProps {
  rows?: number;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-void-raised p-3" aria-hidden="true">
      {/* Avatar */}
      <Skeleton height="2.5rem" width="2.5rem" rounded="full" />

      {/* Name + badge */}
      <div className="flex-1 space-y-1.5">
        <Skeleton height="0.875rem" width="40%" rounded="sm" />
        <Skeleton height="0.625rem" width="20%" rounded="sm" />
      </div>

      {/* Status buttons */}
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height="2rem" width="2rem" rounded="md" />
        ))}
      </div>
    </div>
  );
}

function SkeletonDateNav() {
  return (
    <div className="flex items-center justify-between" aria-hidden="true">
      <div className="flex items-center gap-2">
        <Skeleton height="2.25rem" width="2.25rem" rounded="md" />
        <Skeleton height="2.25rem" width="10rem" rounded="md" />
        <Skeleton height="2.25rem" width="2.25rem" rounded="md" />
      </div>
      <Skeleton height="0.875rem" width="12rem" rounded="sm" />
    </div>
  );
}

function SkeletonStatsBar() {
  return (
    <div className="flex items-center gap-6" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton height="0.625rem" width="3rem" rounded="sm" />
          <Skeleton height="1.25rem" width="1.5rem" rounded="sm" />
        </div>
      ))}
    </div>
  );
}

export function AttendanceSkeleton({ rows = 6 }: AttendanceSkeletonProps) {
  return (
    <SkeletonGroup className="space-y-4">
      <SkeletonDateNav />
      <SkeletonStatsBar />
      <div className="space-y-1">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </SkeletonGroup>
  );
}

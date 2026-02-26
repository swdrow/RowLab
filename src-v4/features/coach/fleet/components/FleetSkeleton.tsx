/**
 * Skeleton loader for the Fleet page.
 * Shows shimmer placeholders for tab bar + table rows.
 */
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';

export function FleetSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading fleet data">
      {/* Tab bar skeleton */}
      <div className="flex gap-2">
        <Skeleton height="2rem" width="5rem" rounded="lg" />
        <Skeleton height="2rem" width="4rem" rounded="lg" />
      </div>

      {/* Table header */}
      <div className="flex gap-4 px-4 py-2">
        <Skeleton height="0.75rem" width="20%" rounded="sm" />
        <Skeleton height="0.75rem" width="12%" rounded="sm" />
        <Skeleton height="0.75rem" width="12%" rounded="sm" />
        <Skeleton height="0.75rem" width="12%" rounded="sm" />
        <Skeleton height="0.75rem" width="10%" rounded="sm" />
      </div>

      {/* Table rows */}
      <SkeletonGroup className="gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg bg-void-raised/40 px-4 py-3">
            <Skeleton height="0.875rem" width="22%" rounded="sm" />
            <Skeleton height="0.875rem" width="10%" rounded="sm" />
            <Skeleton height="0.875rem" width="12%" rounded="sm" />
            <Skeleton height="0.875rem" width="12%" rounded="sm" />
            <Skeleton height="1.5rem" width="4.5rem" rounded="lg" />
          </div>
        ))}
      </SkeletonGroup>
    </div>
  );
}

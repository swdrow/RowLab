/**
 * Skeleton loader for the team dashboard.
 *
 * Full mode: tab bar + content skeleton matching 3-column overview.
 * Tab-only mode: content skeleton only (used inside Suspense per tab).
 * Uses .animate-shimmer per design standard -- NEVER spinners.
 */
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';

interface TeamDashboardSkeletonProps {
  tabOnly?: boolean;
}

function SkeletonTabBar() {
  return (
    <div className="flex gap-1 rounded-xl bg-void-deep/50 p-1" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-1 items-center justify-center py-2.5">
          <Skeleton height="0.875rem" width="4rem" rounded="sm" />
        </div>
      ))}
    </div>
  );
}

function SkeletonStatsCard() {
  return (
    <div className="panel rounded-xl p-5 space-y-3" aria-hidden="true">
      <Skeleton height="0.75rem" width="5rem" rounded="sm" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton height="2.25rem" width="2.25rem" rounded="lg" />
          <div className="flex-1 space-y-1">
            <Skeleton height="0.625rem" width="60%" rounded="sm" />
            <Skeleton height="0.875rem" width="30%" rounded="sm" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonActivityRow() {
  return (
    <div className="flex items-center gap-3 rounded-lg p-2" aria-hidden="true">
      <Skeleton height="2rem" width="2rem" rounded="full" />
      <div className="flex-1 space-y-1">
        <Skeleton height="0.75rem" width="70%" rounded="sm" />
      </div>
      <Skeleton height="0.625rem" width="2rem" rounded="sm" />
    </div>
  );
}

function SkeletonAnnouncementCard() {
  return (
    <div
      className="space-y-2 border-b border-edge-default/40 pb-3 last:border-0"
      aria-hidden="true"
    >
      <Skeleton height="0.875rem" width="80%" rounded="sm" />
      <Skeleton height="0.625rem" width="100%" rounded="sm" />
      <Skeleton height="0.5rem" width="40%" rounded="sm" />
    </div>
  );
}

function SkeletonOverviewContent() {
  return (
    <div className="mt-4 flex gap-6">
      {/* Left sidebar skeleton */}
      <div className="hidden lg:block w-72 shrink-0 space-y-4">
        <SkeletonStatsCard />
      </div>

      {/* Center feed skeleton */}
      <div className="min-w-0 flex-1 space-y-3">
        <Skeleton height="0.75rem" width="6rem" rounded="sm" />
        <SkeletonActivityRow />
        <SkeletonActivityRow />
        <SkeletonActivityRow />
        <SkeletonActivityRow />
        <SkeletonActivityRow />
      </div>

      {/* Right sidebar skeleton */}
      <div className="hidden lg:block w-72 shrink-0 space-y-4">
        <div className="panel rounded-xl p-5 space-y-3" aria-hidden="true">
          <Skeleton height="0.75rem" width="6rem" rounded="sm" />
          <SkeletonAnnouncementCard />
          <SkeletonAnnouncementCard />
        </div>
      </div>
    </div>
  );
}

export function TeamDashboardSkeleton({ tabOnly }: TeamDashboardSkeletonProps) {
  if (tabOnly) {
    return <SkeletonOverviewContent />;
  }

  return (
    <SkeletonGroup className="mx-auto max-w-6xl p-4 md:p-6 pb-20 gap-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton height="1.75rem" width="10rem" rounded="sm" />
        <Skeleton height="1rem" width="16rem" rounded="sm" />
      </div>

      {/* Tab bar skeleton */}
      <SkeletonTabBar />

      {/* Content skeleton */}
      <SkeletonOverviewContent />

      {/* Mobile-only stats (visible on small screens) */}
      <div className="lg:hidden">
        <SkeletonStatsCard />
      </div>
    </SkeletonGroup>
  );
}

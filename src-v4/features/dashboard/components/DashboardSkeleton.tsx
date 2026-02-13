/**
 * Dashboard skeleton loading state.
 * Mirrors the final dashboard layout: hero, stats grid, workouts list, PR cards.
 * Uses shimmer animation only — NEVER spinners.
 */

import { Skeleton, SkeletonGroup, SkeletonCard } from '@/components/ui/Skeleton';

function SkeletonStatCard() {
  return (
    <div className="bg-ink-raised rounded-xl p-4" aria-hidden="true">
      <Skeleton height="0.75rem" width="60%" rounded="sm" className="mb-3" />
      <Skeleton height="1.75rem" width="40%" rounded="sm" className="mb-2" />
      <Skeleton height="0.625rem" width="80%" rounded="sm" />
    </div>
  );
}

function SkeletonWorkoutRow() {
  return (
    <div className="flex items-center gap-4 bg-ink-raised rounded-xl p-4" aria-hidden="true">
      <Skeleton height="2.5rem" width="2.5rem" rounded="lg" />
      <div className="flex-1 space-y-2">
        <Skeleton height="0.875rem" width="50%" rounded="sm" />
        <Skeleton height="0.625rem" width="30%" rounded="sm" />
      </div>
      <Skeleton height="1rem" width="4rem" rounded="sm" />
    </div>
  );
}

function SkeletonSectionHeader() {
  return (
    <div className="flex items-center justify-between mb-3" aria-hidden="true">
      <Skeleton height="1.25rem" width="8rem" rounded="sm" />
      <Skeleton height="0.875rem" width="4rem" rounded="sm" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <SkeletonGroup className="max-w-6xl mx-auto p-4 md:p-6 pb-20 gap-6">
      {/* Hero area: greeting + subtitle */}
      <div className="space-y-2">
        <Skeleton height="1.75rem" width="12.5rem" rounded="sm" />
        <Skeleton height="1.25rem" width="7.5rem" rounded="sm" />
      </div>

      {/* Stats grid: 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>

      {/* Recent workouts section */}
      <div>
        <SkeletonSectionHeader />
        <div className="space-y-3">
          <SkeletonWorkoutRow />
          <SkeletonWorkoutRow />
          <SkeletonWorkoutRow />
          <SkeletonWorkoutRow />
          <SkeletonWorkoutRow />
        </div>
      </div>

      {/* PR section */}
      <div>
        <SkeletonSectionHeader />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </SkeletonGroup>
  );
}

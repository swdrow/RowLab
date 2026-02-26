/**
 * Shimmer loading skeleton matching the WorkoutFeed layout.
 * Shows 3 day groups of 2 rows each with date header placeholders.
 */

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      {/* Icon placeholder */}
      <div className="w-9 h-9 rounded-lg bg-void-raised animate-shimmer shrink-0" />
      {/* Label placeholder */}
      <div className="h-4 w-14 rounded bg-void-raised animate-shimmer shrink-0" />
      {/* Metrics placeholders */}
      <div className="flex-1 flex items-center justify-end gap-4 sm:gap-6">
        <div className="h-4 w-12 rounded bg-void-raised animate-shimmer" />
        <div className="h-4 w-10 rounded bg-void-raised animate-shimmer" />
        <div className="h-4 w-14 rounded bg-void-raised animate-shimmer" />
        <div className="h-4 w-10 rounded bg-void-raised animate-shimmer" />
      </div>
      {/* Source + chevron placeholder */}
      <div className="h-3.5 w-3.5 rounded bg-void-raised animate-shimmer shrink-0 ml-2" />
    </div>
  );
}

function SkeletonDateHeader() {
  return (
    <div className="flex items-center gap-3 px-3 pt-4 pb-2">
      <div className="h-3.5 w-24 rounded bg-void-raised animate-shimmer" />
      <div className="flex-1 h-px bg-edge-default" />
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="space-y-1" role="status" aria-label="Loading workouts">
      {[1, 2, 3].map((group) => (
        <div key={group}>
          <SkeletonDateHeader />
          <div className="space-y-0.5">
            <SkeletonRow />
            <SkeletonRow />
          </div>
        </div>
      ))}
    </div>
  );
}

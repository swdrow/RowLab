/**
 * Loading skeleton for the workout detail page.
 * Mirrors the hero + splits + notes layout with shimmer animation.
 */

/* ------------------------------------------------------------------ */
/* Shimmer block helper                                                */
/* ------------------------------------------------------------------ */

function Shimmer({ className }: { className?: string }) {
  return <div className={`bg-void-overlay rounded animate-shimmer ${className ?? ''}`} />;
}

/* ------------------------------------------------------------------ */
/* DetailSkeleton                                                      */
/* ------------------------------------------------------------------ */

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back bar */}
      <div className="flex items-center justify-between">
        <Shimmer className="h-5 w-32" />
        <Shimmer className="h-8 w-16" />
      </div>

      {/* Hero card */}
      <div className="flex items-stretch gap-2">
        {/* Prev arrow placeholder */}
        <div className="flex items-center">
          <Shimmer className="h-10 w-10 rounded-lg" />
        </div>

        <div className="flex-1 bg-void-raised rounded-xl p-6">
          {/* Top row */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <Shimmer className="w-12 h-12 rounded-xl" />
              <div className="space-y-2">
                <Shimmer className="h-5 w-24" />
                <Shimmer className="h-4 w-40" />
              </div>
            </div>
            <Shimmer className="h-7 w-24 rounded-full" />
          </div>

          {/* Metric grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Shimmer className="h-9 w-24" />
                <Shimmer className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Next arrow placeholder */}
        <div className="flex items-center">
          <Shimmer className="h-10 w-10 rounded-lg" />
        </div>
      </div>

      {/* Splits section skeleton */}
      <div className="space-y-4">
        <Shimmer className="h-6 w-16" />

        {/* Table skeleton */}
        <div className="bg-void-raised rounded-xl border border-edge-default overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 px-4 py-3 border-b border-edge-default">
            <Shimmer className="h-3 w-10" />
            <Shimmer className="h-3 w-14 ml-auto" />
            <Shimmer className="h-3 w-14" />
            <Shimmer className="h-3 w-10" />
          </div>
          {/* Rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-4 py-2.5 border-b border-edge-default last:border-0"
            >
              <Shimmer className="h-4 w-6" />
              <Shimmer className="h-4 w-16 ml-auto" />
              <Shimmer className="h-4 w-12" />
              <Shimmer className="h-4 w-10" />
            </div>
          ))}
        </div>
      </div>

      {/* Notes skeleton */}
      <div className="bg-void-raised rounded-xl border border-edge-default p-4 space-y-2">
        <Shimmer className="h-4 w-12" />
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-4 w-3/4" />
      </div>
    </div>
  );
}

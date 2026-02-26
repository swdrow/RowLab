/**
 * Skeleton shimmer loader — oarbit design system.
 *
 * bg-void-raised with shimmer animation.
 * Radius matches the element being replaced.
 * NEVER use spinners — skeleton loaders only.
 */

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

const roundedMap = {
  sm: 'rounded-[var(--radius-sm)]',
  md: 'rounded-[var(--radius-md)]',
  lg: 'rounded-[var(--radius-lg)]',
  full: 'rounded-full',
} as const;

export function Skeleton({ className = '', width, height, rounded = 'md' }: SkeletonProps) {
  return (
    <div
      className={`bg-void-raised animate-shimmer ${roundedMap[rounded]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

interface SkeletonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function SkeletonGroup({ children, className = '' }: SkeletonGroupProps) {
  return (
    <div className={`flex flex-col gap-3 ${className}`} aria-busy="true" aria-label="Loading">
      {children}
    </div>
  );
}

/** Pre-built skeleton: text block */
export function SkeletonText({
  lines = 3,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <SkeletonGroup className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height="0.875rem" width={i === lines - 1 ? '60%' : '100%'} rounded="sm" />
      ))}
    </SkeletonGroup>
  );
}

/** Pre-built skeleton: card */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-void-raised border border-edge-default rounded-[var(--radius-lg)] p-4 ${className}`}
      aria-hidden="true"
    >
      <Skeleton height="1.25rem" width="40%" rounded="sm" className="mb-4" />
      <SkeletonText lines={2} />
    </div>
  );
}

/** Pre-built skeleton: table row */
export function SkeletonRow({
  columns = 4,
  className = '',
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`flex gap-4 px-3 py-2 ${className}`} aria-hidden="true">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} height="0.875rem" width={i === 0 ? '30%' : '15%'} rounded="sm" />
      ))}
    </div>
  );
}

/** Pre-built skeleton: metric */
export function SkeletonMetric({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`} aria-hidden="true">
      <Skeleton height="0.75rem" width="60px" rounded="sm" />
      <Skeleton height="1.5rem" width="80px" rounded="sm" />
    </div>
  );
}

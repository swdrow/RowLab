/**
 * Skeleton shimmer loader component.
 * NEVER use spinners - design standard requires skeleton loaders with shimmer.
 */

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

const roundedMap = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
} as const;

export function Skeleton({ className = '', width, height, rounded = 'md' }: SkeletonProps) {
  return (
    <div
      className={`bg-ink-raised animate-shimmer ${roundedMap[rounded]} ${className}`}
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

/** Pre-built skeleton patterns for common layouts */
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

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-ink-raised rounded-xl p-5 ${className}`} aria-hidden="true">
      <Skeleton height="1.25rem" width="40%" rounded="sm" className="mb-4" />
      <SkeletonText lines={2} />
    </div>
  );
}

interface SkeletonProps {
  className?: string;
}

/**
 * Skeleton loading component for placeholder states
 */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-surface-hover rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export default Skeleton;

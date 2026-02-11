/**
 * Skeleton - Base skeleton loader with shimmer animation
 *
 * Replaces all spinner loading states with content-shaped placeholders.
 * Uses V2 design tokens (Inkwell palette) and CSS shimmer animation.
 *
 * @example
 * // Default text skeleton
 * <Skeleton />
 *
 * // Title skeleton
 * <Skeleton variant="title" />
 *
 * // Avatar skeleton
 * <Skeleton variant="avatar" />
 *
 * // Custom dimensions
 * <Skeleton width="200px" height="100px" />
 */

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: string;
  variant?: 'text' | 'title' | 'avatar' | 'button';
}

export function Skeleton({
  className = '',
  width,
  height,
  rounded,
  variant = 'text',
}: SkeletonProps) {
  // Variant presets
  const variants = {
    text: {
      width: width || '100%',
      height: height || '16px',
      rounded: rounded || 'rounded-sm',
    },
    title: {
      width: width || '60%',
      height: height || '24px',
      rounded: rounded || 'rounded-md',
    },
    avatar: {
      width: width || '40px',
      height: height || '40px',
      rounded: rounded || 'rounded-full',
    },
    button: {
      width: width || '120px',
      height: height || '36px',
      rounded: rounded || 'rounded-lg',
    },
  };

  const preset = variants[variant];

  return (
    <div
      className={`bg-surface-elevated animate-shimmer ${preset.rounded} ${className}`}
      style={{
        width: preset.width,
        height: preset.height,
        background: `
          linear-gradient(
            90deg,
            var(--color-bg-surface-elevated) 0%,
            var(--color-bg-hover) 50%,
            var(--color-bg-surface-elevated) 100%
          )
        `,
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s ease-in-out infinite',
      }}
    />
  );
}

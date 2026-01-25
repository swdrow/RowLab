import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * LoadingSkeleton - Themed wrapper for react-loading-skeleton
 *
 * Provides consistent skeleton loading states using V2 design tokens.
 * Automatically adapts to dark/light/field themes via CSS custom properties.
 */

interface LoadingSkeletonProps {
  children: React.ReactNode;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ children }) => (
  <SkeletonTheme
    baseColor="var(--color-bg-surface)"
    highlightColor="var(--color-bg-hover)"
  >
    {children}
  </SkeletonTheme>
);

/**
 * SkeletonLine - Rectangular skeleton for text/content lines
 */
interface SkeletonLineProps {
  width?: string | number;
  height?: number;
  className?: string;
  count?: number;
}

export const SkeletonLine: React.FC<SkeletonLineProps> = ({
  width = '100%',
  height = 20,
  className,
  count = 1,
}) => (
  <Skeleton
    width={width}
    height={height}
    className={className}
    count={count}
  />
);

/**
 * SkeletonCircle - Circular skeleton for avatars/icons
 */
interface SkeletonCircleProps {
  size?: number;
  className?: string;
}

export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({
  size = 40,
  className,
}) => (
  <Skeleton
    circle
    width={size}
    height={size}
    className={className}
  />
);

/**
 * SkeletonCard - Card-shaped skeleton with optional avatar
 */
interface SkeletonCardProps {
  showAvatar?: boolean;
  lines?: number;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showAvatar = true,
  lines = 2,
  className,
}) => (
  <div className={`flex items-start gap-4 p-4 ${className || ''}`}>
    {showAvatar && <SkeletonCircle size={40} />}
    <div className="flex-1">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine
          key={i}
          width={i === 0 ? '60%' : '40%'}
          height={i === 0 ? 20 : 16}
          className={i > 0 ? 'mt-2' : undefined}
        />
      ))}
    </div>
  </div>
);

/**
 * SkeletonTable - Table rows skeleton
 */
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
}) => (
  <div className="w-full">
    {showHeader && (
      <div className="flex gap-4 p-4 border-b border-[var(--color-border-subtle)]">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonLine key={i} width="100%" height={16} />
        ))}
      </div>
    )}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        className="flex gap-4 p-4 border-b border-[var(--color-border-subtle)]"
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <SkeletonLine
            key={colIndex}
            width={colIndex === 0 ? '30%' : '100%'}
            height={20}
          />
        ))}
      </div>
    ))}
  </div>
);

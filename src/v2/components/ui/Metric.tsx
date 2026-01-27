import React from 'react';

/**
 * Metric - Chromatic data display with performance-based color
 *
 * Features:
 * - Color based on performance level (excellent/good/warning/poor)
 * - Optional Night Shift glow for critical metrics
 * - Monospace font with tabular-nums for alignment
 * - Label uses receded luminance (ink-secondary)
 *
 * This is CHROMATIC DATA in action - where color lives in the UI.
 */

// Class merging utility
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export type PerformanceLevel = 'excellent' | 'good' | 'warning' | 'poor' | 'neutral';

export interface MetricProps {
  value: string | number;
  label: string;
  performance?: PerformanceLevel;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Night Shift glow effect for critical/hero metrics */
  glow?: boolean;
  className?: string;
}

/**
 * Performance colors - the ONLY chromatic elements in the UI
 * All other UI uses monochrome inkwell palette
 */
const performanceColors: Record<PerformanceLevel, string> = {
  excellent: 'text-data-excellent',
  good: 'text-data-good',
  warning: 'text-data-warning',
  poor: 'text-data-poor',
  neutral: 'text-ink-primary',
};

/**
 * Night Shift glow styles - subtle color halos for emphasis
 * Only used on critical metrics to draw attention
 */
const glowStyles: Record<PerformanceLevel, string> = {
  excellent: 'drop-shadow-[0_0_20px_rgba(34,197,94,0.3)]',
  good: 'drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]',
  warning: 'drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]',
  poor: 'drop-shadow-[0_0_20px_rgba(239,68,68,0.3)]',
  neutral: 'drop-shadow-[0_0_20px_rgba(250,250,250,0.15)]',
};

const sizeClasses: Record<string, string> = {
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-5xl',
  xl: 'text-7xl',
};

export const Metric: React.FC<MetricProps> = ({
  value,
  label,
  performance = 'neutral',
  size = 'md',
  glow = false,
  className,
}) => {
  return (
    <div className={cn('flex flex-col', className)}>
      <span
        className={cn(
          'font-mono font-semibold tabular-nums',
          sizeClasses[size],
          performanceColors[performance],
          glow && glowStyles[performance]
        )}
      >
        {value}
      </span>
      <span className="text-xs uppercase tracking-wider text-ink-secondary mt-1">
        {label}
      </span>
    </div>
  );
};

Metric.displayName = 'Metric';

export default Metric;

import React from 'react';

/**
 * ProgressBar - Chromatic progress indicator
 *
 * Features:
 * - Fill color based on performance variant
 * - Track uses ink-border (monochrome)
 * - Smooth animated transitions
 * - Optional value display
 *
 * This is CHROMATIC DATA in action - progress bars show colored data
 * against the monochrome UI background.
 */

// Class merging utility
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export type ProgressVariant = 'excellent' | 'good' | 'warning' | 'poor' | 'neutral';

export interface ProgressBarProps {
  /** Progress value from 0-100 */
  value: number;
  variant?: ProgressVariant;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

/**
 * Variant to data color mapping
 * These are the ONLY chromatic elements - the filled portion
 * The track/background is monochrome ink-border
 */
const variantColors: Record<ProgressVariant, string> = {
  excellent: 'bg-data-excellent',
  good: 'bg-data-good',
  warning: 'bg-data-warning',
  poor: 'bg-data-poor',
  neutral: 'bg-ink-secondary',
};

const sizeClasses: Record<string, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  variant = 'good',
  size = 'md',
  showValue = false,
  className,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full', className)}>
      {/* Track - monochrome background */}
      <div
        className={cn(
          'w-full bg-ink-border rounded-full overflow-hidden',
          sizeClasses[size]
        )}
      >
        {/* Fill - chromatic data color */}
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            variantColors[variant]
          )}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showValue && (
        <span className="text-xs text-ink-secondary mt-1 block">
          {clampedValue}%
        </span>
      )}
    </div>
  );
};

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;

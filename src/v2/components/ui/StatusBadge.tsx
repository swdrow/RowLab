import React from 'react';

/**
 * StatusBadge - Data-colored status indicators
 *
 * Features:
 * - Status maps to data colors (success=excellent, info=good, etc.)
 * - Subtle background tint (10% opacity)
 * - Border matches color at 20% opacity
 * - Neutral variant is fully monochrome
 *
 * This is CHROMATIC DATA in action - status badges are allowed to be colored
 * because they represent data/state, not decoration.
 */

// Class merging utility
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export type StatusType = 'success' | 'info' | 'warning' | 'error' | 'neutral';

export interface StatusBadgeProps {
  status: StatusType;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Status to data color mapping
 * - success -> data-excellent (green)
 * - info -> data-good (blue)
 * - warning -> data-warning (amber)
 * - error -> data-poor (red)
 * - neutral -> ink (monochrome)
 */
const statusStyles: Record<StatusType, string> = {
  success: 'bg-data-excellent/10 text-data-excellent border-data-excellent/20',
  info: 'bg-data-good/10 text-data-good border-data-good/20',
  warning: 'bg-data-warning/10 text-data-warning border-data-warning/20',
  error: 'bg-data-poor/10 text-data-poor border-data-poor/20',
  neutral: 'bg-ink-raised text-ink-body border-ink-border',
};

const sizeClasses: Record<string, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  children,
  size = 'sm',
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-md border',
        statusStyles[status],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
};

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;

import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * UsageBar - Progress bar component for displaying resource usage
 *
 * Shows used/limit counts with visual progress indicator.
 * Color-coded for normal, near-limit, and at-limit states.
 * Handles unlimited plans gracefully.
 */

interface UsageBarProps {
  /** Display label for the resource */
  label: string;
  /** Current usage count */
  used: number;
  /** Limit count (-1 for unlimited) */
  limit: number;
  /** Icon component to display */
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Calculate usage percentage, capped at 100%
 */
function calculatePercentage(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

/**
 * Get color class based on usage percentage
 */
function getBarColor(percentage: number): string {
  if (percentage >= 100) {
    return 'bg-[var(--color-status-error)]';
  }
  if (percentage >= 80) {
    return 'bg-[var(--color-status-warning)]';
  }
  return 'bg-[var(--color-interactive-primary)]';
}

/**
 * Get text color class based on usage percentage
 */
function getTextColor(percentage: number): string {
  if (percentage >= 100) {
    return 'text-[var(--color-status-error)]';
  }
  if (percentage >= 80) {
    return 'text-[var(--color-status-warning)]';
  }
  return 'text-[var(--color-text-tertiary)]';
}

export const UsageBar: React.FC<UsageBarProps> = ({
  label,
  used,
  limit,
  icon: Icon,
}) => {
  const isUnlimited = limit === -1;
  const percentage = calculatePercentage(used, limit);
  const isNearLimit = percentage >= 80 && percentage < 100;
  const isAtLimit = percentage >= 100;

  return (
    <div className="space-y-2">
      {/* Header row with icon, label, and count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            {label}
          </span>
        </div>
        <span className={`text-sm font-mono ${getTextColor(percentage)}`}>
          {used} / {isUnlimited ? 'Unlimited' : limit}
        </span>
      </div>

      {/* Progress bar (hidden for unlimited) */}
      {!isUnlimited && (
        <div className="h-2 bg-[var(--color-bg-surface)] rounded-full overflow-hidden border border-[var(--color-border-subtle)]">
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${getBarColor(percentage)}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {/* Warning message when near limit */}
      {isNearLimit && (
        <p className="text-xs text-[var(--color-status-warning)] flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Approaching limit - consider upgrading
        </p>
      )}

      {/* Warning message when at limit */}
      {isAtLimit && (
        <p className="text-xs text-[var(--color-status-error)] flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Limit reached - upgrade to add more
        </p>
      )}
    </div>
  );
};

export default UsageBar;

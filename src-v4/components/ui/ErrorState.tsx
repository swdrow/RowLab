/**
 * Error state -- oarbit design system.
 *
 * Inline data-fetching error component. Shown when a query's `isError` is true.
 * Icon 32px in accent-coral (error accent). Title: text-h3, text-bright.
 * Description: text-body, text-dim, max-width 280px.
 * Optional retry button (secondary, sm).
 * Follows the EmptyState API pattern for consistency.
 */

import type { IconComponent } from '@/types/icons';
import { IconAlertTriangle, IconRefresh } from '@/components/icons';
import { Button } from '@/components/ui/Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  icon?: IconComponent;
  className?: string;
  size?: 'sm' | 'md';
}

export function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  icon: Icon = IconAlertTriangle,
  className = '',
  size = 'md',
}: ErrorStateProps) {
  const iconSize = size === 'sm' ? 24 : 32;

  return (
    <div role="alert" className={`flex flex-col items-center text-center gap-3 ${className}`}>
      <Icon width={iconSize} height={iconSize} className="text-accent-coral" aria-hidden="true" />

      <div className="space-y-1">
        <h3 className="text-[0.9375rem] font-display font-semibold text-text-bright">{title}</h3>
        <p className="text-sm text-text-dim max-w-[280px]">{message}</p>
      </div>

      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <IconRefresh width={14} height={14} />
          Retry
        </Button>
      )}
    </div>
  );
}

/**
 * Empty state — oarbit design system.
 *
 * Compact, domain-specific. Icon 32px in text-faint.
 * Title: text-h3 (15px semibold), text-primary.
 * Description: text-body (14px), text-dim, max-width 280px.
 * Action: secondary button (not primary).
 * No oversized illustrations, no patronizing copy, no animated elements.
 */

import type { IconComponent } from '@/types/icons';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/Button';

interface EmptyStateAction {
  label: string;
  to?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon: IconComponent;
  title: string;
  description: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  size?: 'sm' | 'md';
}

function ActionButton({
  action,
  variant,
}: {
  action: EmptyStateAction;
  variant: 'secondary' | 'ghost';
}) {
  const navigate = useNavigate();
  const handleClick = action.to ? () => navigate({ to: action.to as '/' }) : action.onClick;

  return (
    <Button variant={variant} size="sm" onClick={handleClick}>
      {action.label}
    </Button>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
  size = 'md',
}: EmptyStateProps) {
  const iconSize = size === 'sm' ? 24 : 32;

  return (
    <div role="status" className={`flex flex-col items-center text-center gap-3 ${className}`}>
      <Icon width={iconSize} height={iconSize} className="text-text-faint" aria-hidden="true" />

      <div className="space-y-1">
        <h3 className="text-[0.9375rem] font-display font-semibold text-text-bright">{title}</h3>
        <p className="text-sm text-text-dim max-w-[280px]">{description}</p>
      </div>

      {(action || secondaryAction) && (
        <div className="flex items-center gap-2">
          {action && <ActionButton action={action} variant="secondary" />}
          {secondaryAction && <ActionButton action={secondaryAction} variant="ghost" />}
        </div>
      )}
    </div>
  );
}

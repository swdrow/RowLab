/**
 * Reusable section-level empty state component.
 * Uses icon composition (not geometric SVG — that's for full-page only).
 * Provides centered layout with optional primary and secondary actions.
 */

import type { LucideIcon } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'motion/react';
import { fadeIn } from '@/lib/animations';
import { Button } from '@/components/ui/Button';

interface EmptyStateAction {
  label: string;
  to?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  size?: 'sm' | 'md';
}

const iconSizeMap = {
  sm: 32,
  md: 40,
} as const;

const containerSizeMap = {
  sm: 'h-14 w-14',
  md: 'h-18 w-18',
} as const;

const gapMap = {
  sm: 'gap-3',
  md: 'gap-4',
} as const;

function ActionButton({
  action,
  variant,
}: {
  action: EmptyStateAction;
  variant: 'primary' | 'ghost';
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
  return (
    <motion.div
      {...fadeIn}
      role="status"
      className={`flex flex-col items-center text-center ${gapMap[size]} ${className}`}
    >
      <div
        className={`flex items-center justify-center rounded-full bg-ink-well ${containerSizeMap[size]}`}
      >
        <Icon size={iconSizeMap[size]} className="text-ink-muted" aria-hidden="true" />
      </div>

      <div className="space-y-1">
        <h3 className="text-ink-primary font-medium">{title}</h3>
        <p className="text-ink-secondary text-sm max-w-xs">{description}</p>
      </div>

      {(action || secondaryAction) && (
        <div className="flex items-center gap-2">
          {action && <ActionButton action={action} variant="primary" />}
          {secondaryAction && <ActionButton action={secondaryAction} variant="ghost" />}
        </div>
      )}
    </motion.div>
  );
}

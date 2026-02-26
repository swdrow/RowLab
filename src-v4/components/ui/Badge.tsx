/**
 * Badge component — oarbit design system.
 *
 * Compact status indicators, metadata chips, machine type labels.
 * Height 22px, radius-sm (4px), text-caption (12px) medium weight.
 *
 * Variants:
 *   status-excellent, status-good, status-warning, status-poor — data semantic
 *   machine — machine type label (neutral bg, secondary text)
 *   highlight — "new" badge, featured item
 *   neutral — generic metadata chip
 *   filled — uses accent color
 *   outlined — border-only accent
 *   subtle — tinted background accent
 */

import type { ReactNode } from 'react';

type BadgeVariant =
  | 'status-excellent'
  | 'status-good'
  | 'status-warning'
  | 'status-poor'
  | 'machine'
  | 'highlight'
  | 'warm'
  | 'neutral'
  | 'filled'
  | 'outlined'
  | 'subtle';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  icon?: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  'status-excellent': 'bg-data-excellent-subtle text-data-excellent',
  'status-good': 'bg-data-good-subtle text-data-good',
  'status-warning': 'bg-data-warning-subtle text-data-warning',
  'status-poor': 'bg-data-poor-subtle text-data-poor',
  machine: 'bg-void-deep text-text-dim',
  highlight: 'bg-accent-coral/20 text-accent-coral',
  warm: 'bg-accent-sand/15 text-accent-sand border border-accent-sand/30',
  neutral: 'bg-void-deep text-text-faint',
  filled: 'bg-accent-teal text-void-deep',
  outlined: 'bg-transparent text-accent-teal border border-accent-teal/40',
  subtle: 'bg-accent-teal/20 text-accent-teal',
};

export function Badge({ children, variant = 'neutral', icon, className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1
        h-[22px] px-2 rounded-[var(--radius-sm)]
        text-xs font-medium leading-none whitespace-nowrap
        ${variantStyles[variant]}
        ${className}
      `.trim()}
    >
      {icon && <span className="flex-shrink-0 [&>svg]:w-3 [&>svg]:h-3">{icon}</span>}
      {children}
    </span>
  );
}

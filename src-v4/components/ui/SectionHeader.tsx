/**
 * Section header — oarbit design system.
 *
 * Typography-driven. text-h2 (18px semibold) title, text-primary.
 * Optional description (text-small, text-dim).
 * Optional right-aligned action slot.
 * No icon container, no background, no border.
 * Bottom margin space-4 (16px) to section content.
 */

import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  /** @deprecated Not used in new design system. Kept for compat. */
  icon?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, action, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex items-start sm:items-center justify-between gap-3 mb-4 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-lg font-display font-semibold text-text-bright leading-[1.3]">
          {title}
        </h2>
        {description && <p className="text-[0.8125rem] text-accent-sand mt-1">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

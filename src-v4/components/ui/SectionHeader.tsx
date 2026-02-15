/**
 * Section header with title, description, icon, and action slot.
 * Provides consistent heading layout across feature sections.
 */

import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  action,
  icon,
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`flex items-start sm:items-center justify-between gap-3 ${className}`}>
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-ink-well flex items-center justify-center shrink-0 text-ink-secondary">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink-primary">{title}</h2>
          {description && <p className="text-sm text-ink-secondary mt-0.5">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

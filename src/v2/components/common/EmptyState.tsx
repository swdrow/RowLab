import React from 'react';
import { Upload, Plus, type LucideIcon } from 'lucide-react';

/**
 * EmptyState - Display when content is not available
 *
 * Provides consistent empty state UI with icon, title, description,
 * and optional call-to-action button.
 *
 * Per RESEARCH.md: Center aligned with py-12, max-w-sm for description
 */

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
}

interface EmptyStateProps {
  /** Icon to display (defaults to Upload) */
  icon?: LucideIcon;
  /** Main title text */
  title: string;
  /** Description text (max-w-sm for readability) */
  description: string;
  /** Optional primary CTA button */
  action?: EmptyStateAction;
  /** Optional secondary CTA button */
  secondaryAction?: EmptyStateAction;
  /** Optional custom illustration component */
  illustration?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Upload,
  title,
  description,
  action,
  secondaryAction,
  illustration,
  className,
}) => {
  const ActionIcon = action?.icon || Plus;
  const SecondaryIcon = secondaryAction?.icon;

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className || ''}`}
    >
      {illustration || (
        <div className="w-16 h-16 mb-4 rounded-full bg-[var(--color-bg-surface-elevated)] flex items-center justify-center">
          <Icon className="w-8 h-8 text-[var(--color-text-tertiary)]" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-sm">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-interactive-primary)] text-white rounded-lg hover:bg-[var(--color-interactive-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]"
            >
              <ActionIcon className="w-4 h-4" />
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--color-border-default)] text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-surface-elevated)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]"
            >
              {SecondaryIcon && <SecondaryIcon className="w-4 h-4" />}
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

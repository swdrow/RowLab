import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorState - Display when an error occurs
 *
 * Provides consistent error UI with AlertTriangle icon, title, message,
 * and optional retry action.
 *
 * Per RESEARCH.md: AlertTriangle icon in error color, Retry button with RefreshCw icon
 */

interface ErrorStateProps {
  /** Error title (defaults to "Something went wrong") */
  title?: string;
  /** Error message/description */
  message: string;
  /** Optional retry handler */
  onRetry?: () => void;
  /** Additional class names */
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className || ''}`}
    >
      <div className="w-16 h-16 mb-4 rounded-full bg-[var(--color-status-error)]/10 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-[var(--color-status-error)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-sm">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-surface-elevated)] border border-[var(--color-border-default)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
};

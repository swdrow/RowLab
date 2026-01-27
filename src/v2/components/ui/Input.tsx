import React, { forwardRef } from 'react';

/**
 * Input - Form input component with warm palette and validation states
 *
 * Features:
 * - Clear focus states with warm border colors
 * - Error state with status-error color
 * - Support for left/right icons
 * - Label and hint text support
 * - Accessible aria attributes
 * - Warm stone palette tokens
 */

// Class merging utility
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s/g, '-') : undefined);

    const baseInputStyles = `
      w-full px-3 py-2
      bg-[var(--color-input-bg)]
      border border-[var(--color-input-border)]
      rounded-lg
      text-[var(--color-input-text)]
      placeholder:text-[var(--color-input-placeholder)]
      transition-colors duration-150
      focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive-primary)]/20
      focus:border-[var(--color-interactive-primary)]
      disabled:bg-[var(--color-bg-surface)] disabled:text-[var(--color-text-muted)] disabled:cursor-not-allowed
    `;

    const errorInputStyles = error
      ? 'border-[var(--color-status-error)] focus:ring-[var(--color-status-error)]/20 focus:border-[var(--color-status-error)]'
      : '';

    const iconPaddingStyles = cn(
      leftIcon && 'pl-10',
      rightIcon && 'pr-10'
    );

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--color-text-secondary)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(baseInputStyles, errorInputStyles, iconPaddingStyles, className)}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-[var(--color-status-error)]" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-sm text-[var(--color-text-tertiary)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Textarea - Multi-line text input with same styling as Input
 *
 * Features:
 * - Resizable by default (vertical only)
 * - Minimum height of 100px
 * - Same focus and error states as Input
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s/g, '-') : undefined);

    const baseStyles = `
      w-full px-3 py-2 min-h-[100px]
      bg-[var(--color-input-bg)]
      border border-[var(--color-input-border)]
      rounded-lg
      text-[var(--color-input-text)]
      placeholder:text-[var(--color-input-placeholder)]
      transition-colors duration-150
      focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive-primary)]/20
      focus:border-[var(--color-interactive-primary)]
      disabled:bg-[var(--color-bg-surface)] disabled:text-[var(--color-text-muted)]
      resize-y
    `;

    const errorStyles = error
      ? 'border-[var(--color-status-error)] focus:ring-[var(--color-status-error)]/20 focus:border-[var(--color-status-error)]'
      : '';

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-text-secondary)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(baseStyles, errorStyles, className)}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        />
        {error && (
          <p className="text-sm text-[var(--color-status-error)]" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-sm text-[var(--color-text-tertiary)]">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

/**
 * Select - Dropdown select component with same styling as Input
 *
 * Features:
 * - Same visual styling as Input
 * - Custom caret icon
 * - Error and hint support
 */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className, id, children, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s/g, '-') : undefined);

    const baseStyles = `
      w-full px-3 py-2
      bg-[var(--color-input-bg)]
      border border-[var(--color-input-border)]
      rounded-lg
      text-[var(--color-input-text)]
      transition-colors duration-150
      focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive-primary)]/20
      focus:border-[var(--color-interactive-primary)]
      disabled:bg-[var(--color-bg-surface)] disabled:text-[var(--color-text-muted)] disabled:cursor-not-allowed
      appearance-none
      cursor-pointer
    `;

    const errorStyles = error
      ? 'border-[var(--color-status-error)] focus:ring-[var(--color-status-error)]/20 focus:border-[var(--color-status-error)]'
      : '';

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-text-secondary)]">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={cn(baseStyles, errorStyles, 'pr-10', className)}
            aria-invalid={error ? 'true' : undefined}
            {...props}
          >
            {children}
          </select>
          {/* Custom caret */}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-tertiary)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
        {error && (
          <p className="text-sm text-[var(--color-status-error)]" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-sm text-[var(--color-text-tertiary)]">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

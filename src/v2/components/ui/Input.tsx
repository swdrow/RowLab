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

    // Dark Editorial: White focus ring, monochrome styling
    const baseInputStyles = `
      w-full px-3 py-2
      bg-ink-base
      border border-ink-border
      rounded-lg
      text-ink-primary
      placeholder:text-ink-secondary
      transition-all duration-150 ease-out
      focus:outline-none focus:ring-2 focus:ring-white/30
      focus:border-ink-bright
      disabled:bg-ink-raised disabled:text-ink-muted disabled:cursor-not-allowed
    `;

    // Error state uses data-poor (chromatic - appropriate for errors)
    const errorInputStyles = error
      ? 'border-data-poor focus:ring-data-poor/30 focus:border-data-poor'
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
            className="block text-sm font-medium text-ink-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary">
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
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-data-poor" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-sm text-ink-tertiary">
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

    // Dark Editorial: White focus ring, monochrome styling
    const baseStyles = `
      w-full px-3 py-2 min-h-[100px]
      bg-ink-base
      border border-ink-border
      rounded-lg
      text-ink-primary
      placeholder:text-ink-secondary
      transition-all duration-150 ease-out
      focus:outline-none focus:ring-2 focus:ring-white/30
      focus:border-ink-bright
      disabled:bg-ink-raised disabled:text-ink-muted
      resize-y
    `;

    // Error state uses data-poor (chromatic - appropriate for errors)
    const errorStyles = error
      ? 'border-data-poor focus:ring-data-poor/30 focus:border-data-poor'
      : '';

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-ink-secondary">
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
          <p className="text-sm text-data-poor" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-sm text-ink-tertiary">{hint}</p>
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

    // Dark Editorial: White focus ring, monochrome styling
    const baseStyles = `
      w-full px-3 py-2
      bg-ink-base
      border border-ink-border
      rounded-lg
      text-ink-primary
      transition-all duration-150 ease-out
      focus:outline-none focus:ring-2 focus:ring-white/30
      focus:border-ink-bright
      disabled:bg-ink-raised disabled:text-ink-muted disabled:cursor-not-allowed
      appearance-none
      cursor-pointer
    `;

    // Error state uses data-poor (chromatic - appropriate for errors)
    const errorStyles = error
      ? 'border-data-poor focus:ring-data-poor/30 focus:border-data-poor'
      : '';

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-ink-secondary">
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
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-tertiary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
        {error && (
          <p className="text-sm text-data-poor" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-sm text-ink-tertiary">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

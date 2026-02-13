/**
 * Input component with label and error state support.
 * React 19: ref is a regular prop (no forwardRef needed).
 */

import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  ref?: React.Ref<HTMLInputElement>;
}

export function Input({ label, error, hint, className = '', id, ref, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-body">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`
          h-10 w-full rounded-xl px-3.5 text-sm
          bg-ink-raised text-ink-primary placeholder:text-ink-muted
          border transition-colors duration-150
          ${
            error
              ? 'border-data-poor focus:border-data-poor focus:ring-1 focus:ring-data-poor/30'
              : 'border-ink-border focus:border-accent-copper focus:ring-1 focus:ring-accent-copper/30'
          }
          focus:outline-none
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `.trim()}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-data-poor">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

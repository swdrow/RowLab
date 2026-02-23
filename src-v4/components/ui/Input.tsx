/**
 * Input component — oarbit design system.
 *
 * bg-void-deep, border-edge-default.
 * Focus: border-strong + accent ring.
 * Error: data-poor border + ring.
 * Label above input (text-caption, medium weight, text-dim).
 * Includes textarea variant.
 *
 * React 19: ref is a regular prop (no forwardRef needed).
 */

import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface InputBaseProps {
  label?: string;
  error?: string;
  hint?: string;
}

interface InputFieldProps extends InputBaseProps, InputHTMLAttributes<HTMLInputElement> {
  as?: 'input';
  ref?: React.Ref<HTMLInputElement>;
}

interface TextareaFieldProps extends InputBaseProps, TextareaHTMLAttributes<HTMLTextAreaElement> {
  as: 'textarea';
  ref?: React.Ref<HTMLTextAreaElement>;
}

type InputProps = InputFieldProps | TextareaFieldProps;

const baseInputClasses = `
  w-full rounded-[var(--radius-md)]
  bg-void-deep text-text-bright placeholder:text-text-faint
  border transition-colors duration-150
  focus:outline-none
  disabled:opacity-50 disabled:cursor-not-allowed
`.trim();

const normalBorder =
  'border-edge-default focus:border-edge-hover focus:ring-2 focus:ring-accent-teal/20';
const errorBorder = 'border-data-poor focus:border-data-poor focus:ring-2 focus:ring-data-poor/30';

export function Input(props: InputProps) {
  const { label, error, hint, className = '', as = 'input', ...rest } = props;

  const inputId = rest.id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const borderClasses = error ? errorBorder : normalBorder;

  const labelNode = label ? (
    <label htmlFor={inputId} className="text-xs font-medium text-text-dim">
      {label}
    </label>
  ) : null;

  const errorNode = error ? (
    <p id={`${inputId}-error`} className="text-xs text-data-poor">
      {error}
    </p>
  ) : null;

  const hintNode =
    hint && !error ? (
      <p id={`${inputId}-hint`} className="text-xs text-text-faint">
        {hint}
      </p>
    ) : null;

  const ariaProps = {
    'aria-invalid': error ? ('true' as const) : undefined,
    'aria-describedby': error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined,
  };

  return (
    <div className="flex flex-col gap-1">
      {labelNode}
      {as === 'textarea' ? (
        <textarea
          ref={(rest as TextareaFieldProps).ref}
          id={inputId}
          className={`
            ${baseInputClasses} ${borderClasses}
            px-3 py-2 text-sm min-h-[80px] resize-y
            ${className}
          `.trim()}
          {...ariaProps}
          {...(rest as Omit<TextareaFieldProps, 'as' | 'ref' | 'label' | 'error' | 'hint'>)}
        />
      ) : (
        <input
          ref={(rest as InputFieldProps).ref}
          id={inputId}
          className={`
            ${baseInputClasses} ${borderClasses}
            h-9 px-3 text-sm
            ${className}
          `.trim()}
          {...ariaProps}
          {...(rest as Omit<InputFieldProps, 'as' | 'ref' | 'label' | 'error' | 'hint'>)}
        />
      )}
      {errorNode}
      {hintNode}
    </div>
  );
}

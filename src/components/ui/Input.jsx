import { forwardRef, useState } from 'react';
import { clsx } from 'clsx';

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
};

const variants = {
  default: [
    'bg-surface-850',
    'border border-border-default',
    'hover:border-border-strong',
    'focus:border-accent focus:ring-2 focus:ring-accent/20',
  ].join(' '),
  filled: [
    'bg-surface-700',
    'border border-transparent',
    'hover:bg-surface-650',
    'focus:bg-surface-700 focus:ring-2 focus:ring-accent/20',
  ].join(' '),
  ghost: [
    'bg-transparent',
    'border border-transparent',
    'hover:bg-surface-800',
    'focus:bg-surface-800 focus:ring-2 focus:ring-accent/20',
  ].join(' '),
};

/**
 * Input component
 *
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg'} props.size
 * @param {'default' | 'filled' | 'ghost'} props.variant
 * @param {string} props.label
 * @param {string} props.error
 * @param {string} props.hint
 * @param {React.ReactNode} props.leftIcon
 * @param {React.ReactNode} props.rightIcon
 * @param {boolean} props.required
 * @param {string} props.className
 */
const Input = forwardRef(function Input(
  {
    size = 'md',
    variant = 'default',
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    required = false,
    className,
    id,
    type = 'text',
    ...props
  },
  ref
) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-secondary mb-1.5"
        >
          {label}
          {required && <span className="text-spectrum-red ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          className={clsx(
            // Base styles
            'w-full rounded-lg',
            'text-text-primary placeholder:text-text-muted',
            'transition-all duration-200 ease-smooth',
            'outline-none',

            // Size styles
            sizes[size],

            // Variant styles
            error
              ? 'border-spectrum-red focus:border-spectrum-red focus:ring-spectrum-red/20'
              : variants[variant],

            // Icon padding
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',

            // Disabled styles
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
            {rightIcon}
          </div>
        )}
      </div>

      {(error || hint) && (
        <p
          className={clsx(
            'mt-1.5 text-xs',
            error ? 'text-spectrum-red' : 'text-text-tertiary'
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
});

/**
 * Password Input with toggle visibility
 */
const PasswordInput = forwardRef(function PasswordInput(props, ref) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      ref={ref}
      type={showPassword ? 'text' : 'password'}
      rightIcon={
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-text-tertiary hover:text-text-secondary transition-colors p-1"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOffIcon className="w-4 h-4" />
          ) : (
            <EyeIcon className="w-4 h-4" />
          )}
        </button>
      }
      {...props}
    />
  );
});

/**
 * Textarea component
 */
const Textarea = forwardRef(function Textarea(
  {
    size = 'md',
    variant = 'default',
    label,
    error,
    hint,
    required = false,
    className,
    id,
    rows = 4,
    ...props
  },
  ref
) {
  const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-secondary mb-1.5"
        >
          {label}
          {required && <span className="text-spectrum-red ml-1">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={clsx(
          // Base styles
          'w-full rounded-lg',
          'text-text-primary placeholder:text-text-muted',
          'transition-all duration-200 ease-smooth',
          'outline-none resize-none',

          // Size styles
          sizes[size],

          // Variant styles
          error
            ? 'border-spectrum-red focus:border-spectrum-red focus:ring-spectrum-red/20'
            : variants[variant],

          // Disabled styles
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        {...props}
      />

      {(error || hint) && (
        <p
          className={clsx(
            'mt-1.5 text-xs',
            error ? 'text-spectrum-red' : 'text-text-tertiary'
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
});

// Icons
function EyeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function EyeOffIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  );
}

export { Input, PasswordInput, Textarea };
export default Input;

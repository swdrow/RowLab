/**
 * Button component with variant support.
 * React 19: ref is a regular prop (no forwardRef needed).
 * Loading state uses Skeleton shimmer, NEVER a spinner.
 */

import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-accent-copper to-accent-copper/90 text-white hover:-translate-y-px active:translate-y-0 shadow-glow-copper/0 hover:shadow-glow-copper active:scale-[0.98]',
  secondary:
    'bg-ink-raised text-ink-primary border border-ink-border hover:bg-ink-hover hover:border-ink-border-strong active:scale-[0.98]',
  ghost:
    'bg-transparent text-ink-secondary hover:text-ink-primary hover:bg-ink-hover active:scale-[0.98]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ref,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-150 ease-out
        focus-visible:outline-2 focus-visible:outline-accent-copper/60 focus-visible:outline-offset-2
        disabled:opacity-50 disabled:pointer-events-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.trim()}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-16 bg-white/20 animate-shimmer rounded-sm" />
        </span>
      ) : (
        children
      )}
    </button>
  );
}

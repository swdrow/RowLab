/**
 * Button component — oarbit design system.
 *
 * Variants: primary (gold filled), secondary (bordered), ghost (text-only),
 *           icon (icon-only), destructive (data-poor filled).
 * Sizes: sm (32px), md (36px), lg (40px).
 * Radius: radius-sm (4px) — never pills.
 * Press: active:scale-[0.98].
 * Loading: shimmer bar, never a spinner.
 *
 * React 19: ref is a regular prop (no forwardRef needed).
 */

import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-accent-teal text-void-deep',
    'hover:bg-accent-teal-hover',
    'active:bg-accent-teal-hover active:scale-[0.98]',
  ].join(' '),
  secondary: [
    'bg-transparent text-text-dim',
    'border border-edge-default',
    'hover:bg-void-raised hover:text-text-bright hover:border-edge-hover',
    'active:scale-[0.98]',
  ].join(' '),
  ghost: [
    'bg-transparent text-text-dim',
    'hover:text-text-bright hover:bg-void-raised',
    'active:scale-[0.98]',
  ].join(' '),
  icon: [
    'bg-transparent text-text-dim',
    'hover:text-text-bright hover:bg-void-raised',
    'active:scale-[0.98]',
  ].join(' '),
  destructive: [
    'bg-data-poor text-white',
    'hover:bg-data-poor/90',
    'active:bg-data-poor/80 active:scale-[0.98]',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-2',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-10 px-5 text-sm gap-2.5',
};

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-10 w-10',
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
  const isIcon = variant === 'icon';

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-medium
        rounded-[var(--radius-sm)]
        transition-all duration-150 ease-out
        focus-visible:outline-2 focus-visible:outline-accent-teal focus-visible:outline-offset-2
        disabled:opacity-50 disabled:pointer-events-none
        cursor-pointer
        ${variantStyles[variant]}
        ${isIcon ? iconSizeStyles[size] : sizeStyles[size]}
        ${className}
      `.trim()}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-16 bg-void-deep animate-shimmer rounded-sm" />
        </span>
      ) : (
        children
      )}
    </button>
  );
}

import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { SPRING_FAST, usePrefersReducedMotion } from '../../utils/animations';

/**
 * Button - Polished button component with animations
 *
 * Features:
 * - 5 variants: primary, secondary, ghost, danger, outline
 * - 3 sizes: sm, md, lg
 * - Loading state with spinner
 * - Left/right icon slots
 * - Spring animations for hover/tap
 * - Focus-visible ring for keyboard navigation
 * - Reduced motion support
 */

// Class merging utility
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-[var(--color-interactive-primary)] text-white
    hover:bg-[var(--color-interactive-hover)]
    active:bg-[var(--color-interactive-active)]
    disabled:bg-[var(--color-interactive-disabled)] disabled:text-[var(--color-text-muted)]
  `,
  secondary: `
    bg-[var(--color-bg-surface-elevated)] text-[var(--color-text-primary)]
    border border-[var(--color-border-default)]
    hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-strong)]
    active:bg-[var(--color-bg-active)]
    disabled:bg-[var(--color-bg-surface)] disabled:text-[var(--color-text-muted)] disabled:border-[var(--color-border-subtle)]
  `,
  ghost: `
    bg-transparent text-[var(--color-text-primary)]
    hover:bg-[var(--color-bg-hover)]
    active:bg-[var(--color-bg-active)]
    disabled:text-[var(--color-text-muted)] disabled:bg-transparent
  `,
  danger: `
    bg-[var(--color-status-error)] text-white
    hover:bg-[var(--color-status-error)]/90
    active:bg-[var(--color-status-error)]/80
    disabled:bg-[var(--color-interactive-disabled)] disabled:text-[var(--color-text-muted)]
  `,
  outline: `
    bg-transparent text-[var(--color-interactive-primary)]
    border border-[var(--color-interactive-primary)]
    hover:bg-[var(--color-interactive-primary)]/10
    active:bg-[var(--color-interactive-primary)]/20
    disabled:text-[var(--color-text-muted)] disabled:border-[var(--color-border-subtle)] disabled:bg-transparent
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
};

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = usePrefersReducedMotion();
    const isDisabled = disabled || loading;

    const baseStyles = `
      inline-flex items-center justify-center
      rounded-lg font-medium
      transition-colors duration-150
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]
      disabled:cursor-not-allowed
    `;

    const motionProps = prefersReducedMotion
      ? {}
      : {
          whileHover: isDisabled ? {} : { scale: 1.02 },
          whileTap: isDisabled ? {} : { scale: 0.98 },
          transition: SPRING_FAST,
        };

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...motionProps}
        {...props}
      >
        {loading ? (
          <Loader2 className={cn(iconSizeStyles[size], 'animate-spin')} />
        ) : leftIcon ? (
          <span className={iconSizeStyles[size]}>{leftIcon}</span>
        ) : null}
        {children}
        {!loading && rightIcon && (
          <span className={iconSizeStyles[size]}>{rightIcon}</span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

/**
 * IconButton - Icon-only button variant
 *
 * Square button for icon-only actions with proper accessibility.
 */
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

const iconButtonSizeStyles: Record<ButtonSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'ghost',
      size = 'md',
      loading = false,
      disabled = false,
      icon,
      fullWidth,
      className,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = usePrefersReducedMotion();
    const isDisabled = disabled || loading;

    const baseStyles = `
      inline-flex items-center justify-center
      rounded-lg
      transition-colors duration-150
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]
      disabled:cursor-not-allowed
    `;

    const motionProps = prefersReducedMotion
      ? {}
      : {
          whileHover: isDisabled ? {} : { scale: 1.1 },
          whileTap: isDisabled ? {} : { scale: 0.9 },
          transition: SPRING_FAST,
        };

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          baseStyles,
          variantStyles[variant],
          iconButtonSizeStyles[size],
          'px-0', // Override horizontal padding
          className
        )}
        {...motionProps}
        {...props}
      >
        {loading ? (
          <Loader2 className={cn(iconSizeStyles[size], 'animate-spin')} />
        ) : (
          <span className={iconSizeStyles[size]}>{icon}</span>
        )}
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';

import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { SPRING_FAST, BUTTON_PRESS, usePrefersReducedMotion } from '../../utils/animations';

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

/**
 * Dark Editorial Button Variants
 *
 * Primary: White on dark (inverted from typical SaaS)
 * Secondary: Ghost with border
 * All variants are MONOCHROME - no colored backgrounds
 * Danger is the only exception (uses data-poor for destructive actions)
 */
const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-ink-bright text-ink-deep
    hover:bg-ink-primary
    active:bg-ink-body
    disabled:bg-ink-muted disabled:text-ink-tertiary
  `,
  secondary: `
    bg-transparent text-ink-primary
    border border-ink-border
    hover:bg-ink-raised hover:border-ink-border-strong
    active:bg-ink-border
    disabled:text-ink-muted disabled:border-ink-muted disabled:bg-transparent
  `,
  ghost: `
    bg-transparent text-ink-primary
    hover:bg-ink-raised
    active:bg-ink-border
    disabled:text-ink-muted disabled:bg-transparent
  `,
  danger: `
    bg-data-poor text-white
    hover:brightness-110
    active:brightness-90
    disabled:bg-ink-muted disabled:text-ink-tertiary
  `,
  outline: `
    bg-transparent text-ink-primary
    border border-ink-border
    hover:bg-ink-raised hover:border-ink-border-strong
    active:bg-ink-border
    disabled:text-ink-muted disabled:border-ink-muted disabled:bg-transparent
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

    // Dark Editorial: White focus ring, precise transitions
    const baseStyles = `
      inline-flex items-center justify-center
      rounded-lg font-medium
      transition-all duration-150 ease-out
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-deep
      disabled:cursor-not-allowed
    `;

    // Dark Editorial: Precise scale(0.98) on press, no hover scale (too playful)
    const motionProps = prefersReducedMotion
      ? {}
      : {
          whileTap: isDisabled ? {} : { scale: 0.98 },
          transition: { duration: 0.1, ease: 'easeOut' },
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

    // Dark Editorial: White focus ring, precise transitions
    const baseStyles = `
      inline-flex items-center justify-center
      rounded-lg
      transition-all duration-150 ease-out
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-deep
      disabled:cursor-not-allowed
    `;

    // Dark Editorial: Precise scale(0.98) on press, no hover scale
    const motionProps = prefersReducedMotion
      ? {}
      : {
          whileTap: isDisabled ? {} : { scale: 0.98 },
          transition: { duration: 0.1, ease: 'easeOut' },
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

import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { SPRING_FAST, usePrefersReducedMotion } from '../../utils/animations';

/**
 * Card - Polished card component with optional interactivity
 *
 * Features:
 * - Multiple visual variants: default, elevated, outline
 * - Optional hover animation for interactive cards
 * - Proper padding and border radius
 * - Focus-visible state for keyboard navigation
 * - Reduced motion support
 */

// Class merging utility
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export type CardVariant = 'default' | 'elevated' | 'outline';

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: CardVariant;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default: `
    bg-[var(--color-bg-surface)]
    border border-[var(--color-border-subtle)]
  `,
  elevated: `
    bg-[var(--color-bg-surface-elevated)]
    border border-[var(--color-border-subtle)]
    shadow-lg
  `,
  outline: `
    bg-transparent
    border border-[var(--color-border-default)]
  `,
};

const paddingStyles: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      interactive = false,
      padding = 'md',
      children,
      className,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = usePrefersReducedMotion();

    const baseStyles = 'rounded-lg';

    const interactiveStyles = interactive
      ? `
        cursor-pointer
        transition-colors duration-150
        hover:bg-[var(--color-bg-hover)]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]
      `
      : '';

    const motionProps =
      interactive && !prefersReducedMotion
        ? {
            whileHover: { scale: 1.01, y: -2 },
            whileTap: { scale: 0.99 },
            transition: SPRING_FAST,
          }
        : {};

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          paddingStyles[padding],
          interactiveStyles,
          className
        )}
        tabIndex={interactive ? 0 : undefined}
        {...motionProps}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

/**
 * CardHeader - Header section for cards
 */
export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 pb-4',
        'border-b border-[var(--color-border-subtle)]',
        '-mx-4 px-4 -mt-4 pt-4', // Extend to card edges
        className
      )}
    >
      {children}
    </div>
  );
};

CardHeader.displayName = 'CardHeader';

/**
 * CardTitle - Title element for cards
 */
export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h2' | 'h3' | 'h4';
}

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  className,
  as: Component = 'h3',
}) => {
  return (
    <Component
      className={cn(
        'text-base font-semibold text-[var(--color-text-primary)]',
        className
      )}
    >
      {children}
    </Component>
  );
};

CardTitle.displayName = 'CardTitle';

/**
 * CardContent - Content section for cards
 */
export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className,
}) => {
  return <div className={cn('mt-4', className)}>{children}</div>;
};

CardContent.displayName = 'CardContent';

/**
 * CardFooter - Footer section for cards
 */
export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-3 pt-4 mt-4',
        'border-t border-[var(--color-border-subtle)]',
        '-mx-4 px-4 -mb-4 pb-4', // Extend to card edges
        className
      )}
    >
      {children}
    </div>
  );
};

CardFooter.displayName = 'CardFooter';

import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { SPRING_CONFIG, CARD_HOVER, usePrefersReducedMotion } from '../../utils/animations';

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
  /** @deprecated Use hoverable instead */
  interactive?: boolean;
  /** Enable hover lift animation for clickable cards */
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

/**
 * Dark Editorial Card Variants
 *
 * All variants use monochrome Inkwell palette
 * No colored accents or left borders
 */
const variantStyles: Record<CardVariant, string> = {
  default: `
    bg-ink-raised
    border border-ink-border
  `,
  elevated: `
    bg-ink-raised
    border border-ink-border
  `,
  outline: `
    bg-transparent
    border border-ink-border
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
      hoverable,
      padding = 'md',
      children,
      className,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = usePrefersReducedMotion();
    // Support both interactive (deprecated) and hoverable props
    const isHoverable = hoverable ?? interactive;

    const baseStyles = 'rounded-lg';

    // Dark Editorial: Hover changes border only, no lift animation (too playful)
    const hoverableStyles = isHoverable
      ? `
        cursor-pointer
        transition-colors duration-200 ease-out
        hover:border-ink-border-strong
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-deep
      `
      : '';

    // Dark Editorial: No scale/lift animations on cards - precise, editorial feel
    const motionProps = {};

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          paddingStyles[padding],
          hoverableStyles,
          className
        )}
        tabIndex={isHoverable ? 0 : undefined}
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
        'border-b border-ink-border',
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
  // Dark Editorial: Card titles use serif display font, bright luminance
  return (
    <Component
      className={cn(
        'text-base font-semibold text-ink-bright font-display',
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
        'border-t border-ink-border',
        '-mx-4 px-4 -mb-4 pb-4', // Extend to card edges
        className
      )}
    >
      {children}
    </div>
  );
};

CardFooter.displayName = 'CardFooter';

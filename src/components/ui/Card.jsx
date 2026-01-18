import { forwardRef } from 'react';
import { clsx } from 'clsx';

const variants = {
  default: [
    'bg-surface-800',
    'border border-border-subtle',
    'shadow-card',
  ].join(' '),
  elevated: [
    'bg-surface-750',
    'border border-border-default',
    'shadow-lg',
  ].join(' '),
  ghost: [
    'bg-transparent',
    'border border-transparent',
  ].join(' '),
  gradient: [
    'bg-gradient-to-br from-surface-800 to-surface-850',
    'border border-border-subtle',
    'shadow-card',
  ].join(' '),
  glow: [
    'bg-surface-800',
    'border border-accent/20',
    'shadow-glow-indigo',
  ].join(' '),
  interactive: [
    'bg-surface-800',
    'border border-border-subtle',
    'shadow-card',
    'hover:shadow-card-hover hover:border-border-default',
    'transition-all duration-200',
    'cursor-pointer',
  ].join(' '),
};

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

const radii = {
  sm: 'rounded-md',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
};

/**
 * Card component for containing content
 *
 * @param {Object} props
 * @param {'default' | 'elevated' | 'ghost' | 'gradient' | 'glow' | 'interactive'} props.variant
 * @param {'none' | 'sm' | 'md' | 'lg' | 'xl'} props.padding
 * @param {'sm' | 'md' | 'lg' | 'xl'} props.radius
 * @param {string} props.className
 * @param {React.ReactNode} props.children
 */
const Card = forwardRef(function Card(
  {
    variant = 'default',
    padding = 'md',
    radius = 'lg',
    className,
    children,
    ...props
  },
  ref
) {
  return (
    <div
      ref={ref}
      className={clsx(
        variants[variant],
        paddings[padding],
        radii[radius],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

/**
 * Card Header component
 */
const CardHeader = forwardRef(function CardHeader(
  { className, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={clsx(
        'flex items-center justify-between',
        'pb-4 mb-4',
        'border-b border-border-subtle',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

/**
 * Card Title component
 */
const CardTitle = forwardRef(function CardTitle(
  { as: Component = 'h3', className, children, ...props },
  ref
) {
  return (
    <Component
      ref={ref}
      className={clsx(
        'text-lg font-semibold text-text-primary',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

/**
 * Card Description component
 */
const CardDescription = forwardRef(function CardDescription(
  { className, children, ...props },
  ref
) {
  return (
    <p
      ref={ref}
      className={clsx(
        'text-sm text-text-secondary',
        'mt-1',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
});

/**
 * Card Content component
 */
const CardContent = forwardRef(function CardContent(
  { className, children, ...props },
  ref
) {
  return (
    <div ref={ref} className={clsx(className)} {...props}>
      {children}
    </div>
  );
});

/**
 * Card Footer component
 */
const CardFooter = forwardRef(function CardFooter(
  { className, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={clsx(
        'flex items-center justify-end gap-3',
        'pt-4 mt-4',
        'border-t border-border-subtle',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
export default Card;

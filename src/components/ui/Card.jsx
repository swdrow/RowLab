import { forwardRef } from 'react';
import { clsx } from 'clsx';

/**
 * Card - Precision Instrument Card Component
 *
 * Follows the glass card primitive pattern with:
 * - Multi-layer shadow (shadow-card)
 * - Noise texture overlay at 3% opacity
 * - Top gradient highlight on hover
 * - Smooth rounded corners (rounded-2xl)
 */

const Card = forwardRef(function Card(
  {
    variant = 'glass',
    padding = 'md',
    interactive = false,
    className,
    children,
    ...props
  },
  ref
) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  // Base glass card styles following the design standard
  const baseGlassStyles = `
    relative overflow-hidden
    bg-white/[0.02]
    backdrop-blur-xl
    border border-white/10
    rounded-2xl
    shadow-card
    group
    transition-all duration-150
    hover:shadow-card-hover hover:border-white/15
  `;

  const variantStyles = {
    glass: baseGlassStyles,
    elevated: `
      ${baseGlassStyles}
      bg-white/[0.03]
    `,
    subtle: `
      ${baseGlassStyles}
      bg-white/[0.01]
      shadow-none hover:shadow-card
    `,
    solid: `
      relative overflow-hidden
      bg-void-elevated
      border border-white/[0.08]
      rounded-2xl
      shadow-card
      group
      transition-all duration-150
      hover:shadow-card-hover hover:border-white/12
    `,
    inset: `
      relative overflow-hidden
      bg-void-surface
      border border-white/[0.04]
      rounded-xl
      shadow-inset-depth
      group
    `,
    interactive: `
      ${baseGlassStyles}
      cursor-pointer
    `,
    ghost: `
      relative overflow-hidden
      bg-transparent
      border border-transparent
      rounded-2xl
      group
      transition-all duration-150
      hover:bg-white/[0.02] hover:border-white/10
    `,
    // Legacy compatibility
    default: baseGlassStyles,
  };

  const interactiveStyles = interactive
    ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform duration-150'
    : '';

  return (
    <div
      ref={ref}
      className={clsx(
        variantStyles[variant],
        interactiveStyles,
        className
      )}
      {...props}
    >
      {/* Noise Texture */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

      {/* Top Highlight (Linear Style) - appears on hover */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-100" />

      {/* Content */}
      <div className={clsx('relative z-10', paddingStyles[padding])}>
        {children}
      </div>
    </div>
  );
});

const CardHeader = forwardRef(function CardHeader({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={clsx('flex flex-col space-y-1.5 pb-4', className)}
      {...props}
    />
  );
});

const CardTitle = forwardRef(function CardTitle({ className, ...props }, ref) {
  return (
    <h3
      ref={ref}
      className={clsx(
        'font-display text-xl font-semibold text-text-primary tracking-[-0.02em]',
        className
      )}
      {...props}
    />
  );
});

const CardDescription = forwardRef(function CardDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={clsx('text-sm text-text-secondary', className)}
      {...props}
    />
  );
});

const CardContent = forwardRef(function CardContent({ className, ...props }, ref) {
  return <div ref={ref} className={clsx('', className)} {...props} />;
});

const CardFooter = forwardRef(function CardFooter({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={clsx('flex items-center pt-4', className)}
      {...props}
    />
  );
});

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export default Card;

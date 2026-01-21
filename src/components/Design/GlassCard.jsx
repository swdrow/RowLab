import React from 'react';

/**
 * GlassCard - Precision Instrument Glass Card Component
 *
 * Usage:
 *   <GlassCard variant="base" interactive>
 *     <h2>Card Title</h2>
 *     <p>Content...</p>
 *   </GlassCard>
 *
 * Props:
 *   - variant: 'subtle' | 'base' | 'elevated' | 'strong' (default: 'base')
 *   - interactive: boolean - adds hover/focus effects with scale
 *   - glow: boolean - adds accent glow on hover
 *   - padding: 'none' | 'sm' | 'md' | 'lg' (default: 'md')
 *   - className: additional CSS classes
 *   - children: card content
 */

const GlassCard = ({
  children,
  variant = 'base',
  interactive = false,
  glow = false,
  padding = 'md',
  className = '',
  ...props
}) => {
  // Variant-based background opacity
  const variantStyles = {
    subtle: 'bg-white/[0.01]',
    base: 'bg-white/[0.02]',
    elevated: 'bg-white/[0.03]',
    strong: 'bg-white/[0.04]',
  };

  // Padding styles
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  // Interactive states with scale
  const interactiveClasses = interactive
    ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform duration-150'
    : '';

  // Glow effect on hover
  const glowClasses = glow
    ? 'hover:shadow-[0_0_40px_-10px_rgba(var(--accent-rgb),0.4)]'
    : '';

  return (
    <div
      className={`
        relative overflow-hidden
        ${variantStyles[variant]}
        backdrop-blur-xl
        border border-white/10
        rounded-2xl
        shadow-card
        group
        transition-all duration-150
        hover:shadow-card-hover hover:border-white/15
        ${interactiveClasses}
        ${glowClasses}
        ${className}
      `}
      {...props}
    >
      {/* Noise Texture */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

      {/* Top Highlight (Linear Style) - appears on hover */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-100" />

      {/* Content */}
      <div className={`relative z-10 ${paddingStyles[padding]}`}>
        {children}
      </div>
    </div>
  );
};

export default GlassCard;

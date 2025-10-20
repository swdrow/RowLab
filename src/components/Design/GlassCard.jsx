import React from 'react';

/**
 * GlassCard - Liquid Glass Card Component
 *
 * Usage:
 *   <GlassCard variant="base" interactive>
 *     <h2>Card Title</h2>
 *     <p>Content...</p>
 *   </GlassCard>
 *
 * Props:
 *   - variant: 'subtle' | 'base' | 'elevated' | 'strong' (default: 'base')
 *   - interactive: boolean - adds hover/focus effects
 *   - blur: 'subtle' | 'base' | 'strong' | 'intense' (default: 'base')
 *   - glow: boolean - adds subtle glow on hover
 *   - className: additional CSS classes
 *   - children: card content
 */

const GlassCard = ({
  children,
  variant = 'base',
  interactive = false,
  blur = 'base',
  glow = false,
  className = '',
  ...props
}) => {
  // Variant-based styles
  const variants = {
    subtle: 'glass-subtle',
    base: 'glass-card',
    elevated: 'glass-elevated',
    strong: 'glass-strong',
  };

  // Blur intensity
  const blurLevels = {
    subtle: 'backdrop-blur-sm',
    base: 'backdrop-blur-md',
    strong: 'backdrop-blur-lg',
    intense: 'backdrop-blur-xl',
  };

  // Interactive states
  const interactiveClasses = interactive
    ? 'cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-elevated active:scale-[0.98]'
    : '';

  // Glow effect
  const glowClasses = glow
    ? 'hover:shadow-glow-blue dark:hover:shadow-glow-purple'
    : '';

  return (
    <div
      className={`
        ${variants[variant]}
        ${blurLevels[blur]}
        ${interactiveClasses}
        ${glowClasses}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;

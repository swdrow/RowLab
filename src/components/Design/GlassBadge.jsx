import React from 'react';

/**
 * GlassBadge - Liquid Glass Badge/Tag Component
 *
 * Usage:
 *   <GlassBadge variant="primary" size="md">New</GlassBadge>
 *
 * Props:
 *   - variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'port' | 'starboard' (default: 'primary')
 *   - size: 'sm' | 'md' | 'lg' (default: 'md')
 *   - glow: boolean - adds glow effect
 *   - dot: boolean - shows dot indicator
 *   - className: additional CSS classes
 *   - children: badge content
 */

const GlassBadge = ({
  children,
  variant = 'primary',
  size = 'md',
  glow = false,
  dot = false,
  className = '',
  ...props
}) => {
  // Size variants
  const sizes = {
    sm: 'px-2 py-0.5 text-xs rounded-md',
    md: 'px-3 py-1 text-sm rounded-lg',
    lg: 'px-4 py-1.5 text-base rounded-xl',
  };

  // Variant styles
  const variants = {
    primary: `
      bg-gradient-to-r from-blue-500/20 to-purple-600/20
      dark:from-accent-blue/20 dark:to-accent-purple/20
      text-blue-700 dark:text-blue-300
      border-blue-500/30 dark:border-accent-blue/30
      ${glow ? 'shadow-glow-blue' : ''}
    `,
    secondary: `
      bg-white/20 dark:bg-white/10
      text-gray-700 dark:text-gray-200
      border-white/30 dark:border-white/20
    `,
    success: `
      bg-green-500/20 dark:bg-green-500/20
      text-green-700 dark:text-green-300
      border-green-500/30 dark:border-green-500/30
      ${glow ? 'shadow-glow-green' : ''}
    `,
    warning: `
      bg-amber-500/20 dark:bg-amber-500/20
      text-amber-700 dark:text-amber-300
      border-amber-500/30 dark:border-amber-500/30
    `,
    error: `
      bg-red-500/20 dark:bg-red-500/20
      text-red-700 dark:text-red-300
      border-red-500/30 dark:border-red-500/30
      ${glow ? 'shadow-glow-red' : ''}
    `,
    info: `
      bg-cyan-500/20 dark:bg-cyan-500/20
      text-cyan-700 dark:text-cyan-300
      border-cyan-500/30 dark:border-cyan-500/30
    `,
    port: `
      bg-red-500/20 dark:bg-port/20
      text-red-700 dark:text-red-300
      border-red-500/30 dark:border-port/30
    `,
    starboard: `
      bg-green-500/20 dark:bg-starboard/20
      text-green-700 dark:text-green-300
      border-green-500/30 dark:border-starboard/30
    `,
  };

  // Dot color based on variant
  const dotColors = {
    primary: 'bg-blue-500',
    secondary: 'bg-gray-500',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    info: 'bg-cyan-500',
    port: 'bg-red-500',
    starboard: 'bg-green-500',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-medium
        backdrop-blur-md
        border
        transition-all duration-200
        ${sizes[size]}
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} animate-pulse`} />
      )}
      {children}
    </span>
  );
};

export default GlassBadge;

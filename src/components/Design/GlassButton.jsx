import React from 'react';

/**
 * GlassButton - Liquid Glass Button Component
 *
 * Usage:
 *   <GlassButton variant="primary" size="md" onClick={handleClick}>
 *     Click me
 *   </GlassButton>
 *
 * Props:
 *   - variant: 'primary' | 'secondary' | 'ghost' | 'danger' (default: 'primary')
 *   - size: 'sm' | 'md' | 'lg' (default: 'md')
 *   - fullWidth: boolean - button takes full container width
 *   - disabled: boolean - disabled state
 *   - loading: boolean - shows loading state
 *   - icon: React element - optional icon
 *   - className: additional CSS classes
 *   - children: button text
 */

const GlassButton = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon = null,
  className = '',
  ...props
}) => {
  // Base button styles
  const baseStyles = `
    relative overflow-hidden
    font-semibold text-center
    backdrop-blur-md
    border border-white/20
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;

  // Size variants
  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-lg min-h-[36px]',
    md: 'px-6 py-3 text-base rounded-xl min-h-[44px]',
    lg: 'px-8 py-4 text-lg rounded-2xl min-h-[52px]',
  };

  // Variant styles - Following "Signal Blue" philosophy
  // Blue is reserved for active/selected states, primary actions use blade-blue
  const variants = {
    primary: `
      bg-blade-blue
      text-void-deep
      shadow-lg shadow-blade-blue/20
      hover:bg-blade-blue/90 hover:shadow-xl hover:shadow-blade-blue/30 hover:scale-[1.02]
      active:scale-[0.98]
      focus:ring-blade-blue
    `,
    secondary: `
      bg-white/10 dark:bg-white/5
      text-gray-900 dark:text-white
      border-white/20 dark:border-white/10
      shadow-md
      hover:bg-white/15 dark:hover:bg-white/10
      hover:shadow-lg hover:scale-[1.02]
      active:scale-[0.98]
      focus:ring-white/50
    `,
    ghost: `
      bg-transparent
      text-gray-700 dark:text-white/70
      border-transparent
      hover:bg-white/10 dark:hover:bg-white/5
      hover:text-gray-900 dark:hover:text-white
      active:scale-[0.98]
      focus:ring-white/30
    `,
    danger: `
      bg-danger-red
      text-white
      shadow-lg shadow-danger-red/20
      hover:bg-danger-red/90 hover:shadow-xl hover:shadow-danger-red/30 hover:scale-[1.02]
      active:scale-[0.98]
      focus:ring-danger-red
    `,
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${sizes[size]}
        ${variants[variant]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {/* Button content */}
      <span className="flex items-center justify-center gap-2">
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && icon && <span className="inline-flex">{icon}</span>}
        {children}
      </span>
    </button>
  );
};

export default GlassButton;

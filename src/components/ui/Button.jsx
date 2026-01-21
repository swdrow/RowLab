import { forwardRef } from 'react';
import { clsx } from 'clsx';

const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className,
    children,
    ...props
  },
  ref
) {
  const baseStyles = `
    relative inline-flex items-center justify-center
    font-medium rounded-xl
    transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-blade-blue/50 focus:ring-offset-2 focus:ring-offset-void-deep
    disabled:opacity-40 disabled:pointer-events-none disabled:translate-y-0
  `;

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  const variantStyles = {
    // Primary - gradient with glow
    primary: `
      bg-gradient-to-b from-blade-blue to-blade-blue/90
      text-void-deep font-semibold
      shadow-[0_0_20px_-5px_rgba(0,112,243,0.4)]
      hover:shadow-[0_0_30px_-5px_rgba(0,112,243,0.5)]
      hover:translate-y-[-1px]
      active:translate-y-0 active:shadow-[0_0_15px_-5px_rgba(0,112,243,0.3)]
    `,

    // Secondary - subtle border with hover lift
    secondary: `
      bg-white/[0.04]
      text-text-primary
      border border-white/10
      hover:bg-white/[0.06] hover:border-white/20
      hover:translate-y-[-1px]
      hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.3)]
      active:translate-y-0
    `,

    // Ghost - minimal, text only with subtle hover
    ghost: `
      bg-transparent
      text-text-secondary
      border border-white/10
      hover:bg-white/[0.04] hover:border-white/20
      hover:text-text-primary
    `,

    // Danger - red accent
    danger: `
      bg-gradient-to-b from-danger-red to-danger-red/90
      text-white font-semibold
      shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)]
      hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.5)]
      hover:translate-y-[-1px]
      active:translate-y-0 active:shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)]
    `,

    // Success - green accent
    success: `
      bg-gradient-to-b from-success to-success/90
      text-void-deep font-semibold
      shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]
      hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)]
      hover:translate-y-[-1px]
      active:translate-y-0
    `,

    // Outline - bordered with accent color
    outline: `
      bg-transparent
      text-blade-blue
      border border-blade-blue/50
      hover:bg-blade-blue/10 hover:border-blade-blue
      hover:translate-y-[-1px]
      hover:shadow-[0_0_20px_-5px_rgba(0,112,243,0.3)]
      active:translate-y-0
    `,

    // Icon button - square with subtle background
    icon: `
      !rounded-xl !p-0 w-10 h-10
      bg-white/[0.04]
      text-text-secondary
      border border-white/10
      hover:bg-white/[0.08] hover:border-white/20
      hover:text-text-primary
      hover:translate-y-[-1px]
      hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.3)]
      active:translate-y-0 active:scale-95
    `,
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading}
      className={clsx(
        baseStyles,
        variant !== 'icon' && sizeStyles[size],
        variantStyles[variant],
        loading && 'cursor-wait',
        className
      )}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
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
      {children}
    </button>
  );
});

export { Button };
export default Button;

import { forwardRef } from 'react';
import { clsx } from 'clsx';

const variants = {
  primary: [
    'bg-gradient-accent text-white',
    'hover:brightness-110',
    'shadow-glow-indigo/30',
    'active:scale-[0.98]',
  ].join(' '),
  secondary: [
    'bg-surface-700 text-text-primary',
    'hover:bg-surface-650',
    'border border-border-default',
    'active:bg-surface-600',
  ].join(' '),
  ghost: [
    'bg-transparent text-text-secondary',
    'hover:bg-surface-700 hover:text-text-primary',
    'active:bg-surface-650',
  ].join(' '),
  danger: [
    'bg-spectrum-red/20 text-spectrum-red',
    'hover:bg-spectrum-red/30',
    'border border-spectrum-red/30',
    'active:bg-spectrum-red/40',
  ].join(' '),
  success: [
    'bg-success/20 text-success',
    'hover:bg-success/30',
    'border border-success/30',
    'active:bg-success/40',
  ].join(' '),
  outline: [
    'bg-transparent text-accent',
    'border border-accent/50',
    'hover:bg-accent/10 hover:border-accent',
    'active:bg-accent/20',
  ].join(' '),
};

const sizes = {
  xs: 'px-2 py-1 text-xs rounded',
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
  xl: 'px-8 py-4 text-lg rounded-xl',
};

const iconSizes = {
  xs: 'p-1',
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3',
  xl: 'p-4',
};

/**
 * Button component with variants and sizes
 *
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline'} props.variant
 * @param {'xs' | 'sm' | 'md' | 'lg' | 'xl'} props.size
 * @param {boolean} props.isLoading
 * @param {boolean} props.disabled
 * @param {boolean} props.iconOnly
 * @param {React.ReactNode} props.leftIcon
 * @param {React.ReactNode} props.rightIcon
 * @param {string} props.className
 * @param {React.ReactNode} props.children
 */
const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    iconOnly = false,
    leftIcon,
    rightIcon,
    className,
    children,
    type = 'button',
    ...props
  },
  ref
) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={clsx(
        // Base styles
        'inline-flex items-center justify-center gap-2',
        'font-medium',
        'transition-all duration-200 ease-smooth',
        'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-surface-900',
        'select-none',

        // Variant styles
        variants[variant],

        // Size styles
        iconOnly ? iconSizes[size] : sizes[size],

        // Disabled styles
        isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',

        // Custom classes
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size={size} />
          {!iconOnly && <span className="opacity-70">{children}</span>}
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

function LoadingSpinner({ size }) {
  const spinnerSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  return (
    <svg
      className={clsx('animate-spin', spinnerSizes[size])}
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
  );
}

export { Button };
export default Button;

import { forwardRef, useState } from 'react';
import { clsx } from 'clsx';

const Input = forwardRef(function Input(
  { className, type = 'text', error, ...props },
  ref
) {
  return (
    <input
      type={type}
      ref={ref}
      className={clsx(
        `w-full px-4 py-2.5
        bg-void-surface/50
        border border-white/[0.08] rounded-xl
        shadow-inner
        text-text-primary placeholder:text-white/40
        transition-all duration-150
        focus:outline-none focus:border-blade-blue/50 focus:ring-2 focus:ring-blade-blue/20
        disabled:opacity-50 disabled:cursor-not-allowed`,
        error && 'border-danger-red focus:border-danger-red focus:ring-danger-red/20',
        className
      )}
      {...props}
    />
  );
});

const Label = forwardRef(function Label({ className, required, children, ...props }, ref) {
  return (
    <label
      ref={ref}
      className={clsx(
        'block mb-2 font-body text-sm font-medium text-text-secondary',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-danger-red">*</span>}
    </label>
  );
});

const InputError = forwardRef(function InputError({ className, children, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={clsx('mt-1.5 text-xs text-danger-red', className)}
      {...props}
    >
      {children}
    </p>
  );
});

/**
 * Password Input with toggle visibility
 */
const PasswordInput = forwardRef(function PasswordInput(props, ref) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        className="pr-10"
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors p-1"
        tabIndex={-1}
      >
        {showPassword ? (
          <EyeOffIcon className="w-4 h-4" />
        ) : (
          <EyeIcon className="w-4 h-4" />
        )}
      </button>
    </div>
  );
});

/**
 * Textarea component
 */
const Textarea = forwardRef(function Textarea(
  { className, error, rows = 4, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={clsx(
        `w-full px-4 py-2.5
        bg-void-surface/50
        border border-white/[0.08] rounded-xl
        shadow-inner
        text-text-primary placeholder:text-white/40
        transition-all duration-150
        focus:outline-none focus:border-blade-blue/50 focus:ring-2 focus:ring-blade-blue/20
        disabled:opacity-50 disabled:cursor-not-allowed
        resize-none`,
        error && 'border-danger-red focus:border-danger-red focus:ring-danger-red/20',
        className
      )}
      {...props}
    />
  );
});

// Icons
function EyeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function EyeOffIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  );
}

export { Input, Label, InputError, PasswordInput, Textarea };
export default Input;

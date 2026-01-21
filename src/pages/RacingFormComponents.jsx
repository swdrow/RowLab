/**
 * Racing Form Components
 * Reusable form components for the racing module
 */
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * InputField - Text/date/number input with label
 */
export function InputField({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`w-full px-4 py-2.5 rounded-lg bg-void-deep/50 border transition-all duration-200 text-text-primary placeholder:text-text-muted focus:outline-none ${
          error
            ? 'border-danger-red/50 focus:border-danger-red focus:ring-1 focus:ring-danger-red/20'
            : 'border-white/[0.06] focus:border-blade-blue/50 focus:ring-1 focus:ring-blade-blue/20'
        }`}
      />
    </div>
  );
}

/**
 * SelectField - Dropdown select with label
 */
export function SelectField({ label, options, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {label}
        </label>
      )}
      <select
        {...props}
        className="w-full px-4 py-2.5 rounded-lg bg-void-deep/50 border border-white/[0.06] text-text-primary focus:outline-none focus:border-blade-blue/50 focus:ring-1 focus:ring-blade-blue/20 transition-all duration-200 appearance-none cursor-pointer"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717A'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          backgroundSize: '16px',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-void-elevated">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Checkbox - Toggle checkbox with label
 */
export function Checkbox({ label, checked, onChange, name }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <div className={`w-5 h-5 rounded border transition-all duration-200 flex items-center justify-center ${
          checked
            ? 'bg-blade-blue border-blade-blue shadow-[0_0_10px_rgba(0,112,243,0.3)]'
            : 'border-white/[0.1] bg-void-deep/50 group-hover:border-white/[0.2]'
        }`}>
          {checked && (
            <svg className="w-3 h-3 text-void-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <span className="text-sm text-text-primary">{label}</span>
    </label>
  );
}

/**
 * Button - Action button with variants
 */
export function Button({ children, variant = 'primary', isLoading, className = '', ...props }) {
  const variants = {
    primary: 'bg-blade-blue text-void-deep hover:shadow-[0_0_20px_rgba(0,112,243,0.3)] font-medium',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/[0.04]',
    danger: 'bg-danger-red/10 text-danger-red border border-danger-red/20 hover:bg-danger-red/20',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`px-5 py-2.5 rounded-lg text-sm transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </motion.button>
  );
}

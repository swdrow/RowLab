import React from 'react';

/**
 * GlassInput - Liquid Glass Input Component
 *
 * Usage:
 *   <GlassInput
 *     label="Name"
 *     placeholder="Enter your name"
 *     value={value}
 *     onChange={handleChange}
 *   />
 *
 * Props:
 *   - label: string - input label
 *   - placeholder: string - placeholder text
 *   - type: string - input type (default: 'text')
 *   - value: string - controlled value
 *   - onChange: function - change handler
 *   - error: string - error message
 *   - helperText: string - helper text below input
 *   - icon: React element - optional icon
 *   - disabled: boolean - disabled state
 *   - required: boolean - required field
 *   - className: additional CSS classes
 */

const GlassInput = ({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  error,
  helperText,
  icon,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {label && (
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input container */}
      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full
            ${icon ? 'pl-10' : 'pl-4'}
            pr-4 py-3
            rounded-xl
            backdrop-blur-md
            bg-white/40 dark:bg-white/5
            border border-white/30 dark:border-white/10
            text-gray-900 dark:text-white
            placeholder-gray-500 dark:placeholder-gray-400
            shadow-md
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            focus:bg-white/60 dark:focus:bg-white/10
            hover:bg-white/50 dark:hover:bg-white/8
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
          `}
          {...props}
        />

        {/* Inner shadow for glass depth */}
        <div className="absolute inset-0 rounded-xl pointer-events-none shadow-inner-glass" />
      </div>

      {/* Helper text or error */}
      {(helperText || error) && (
        <p
          className={`
            mt-2 text-sm
            ${error ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}
          `}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default GlassInput;

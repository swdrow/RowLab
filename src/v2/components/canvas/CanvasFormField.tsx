/**
 * CanvasFormField - Chamfered form input with ruled label
 *
 * Form input with Canvas design language:
 * - Ruled label style
 * - Chamfered input via clip-path (top-right diagonal)
 * - Monospace font for data entry
 * - Error state with warm negative color
 *
 * Design: Canvas form field primitive
 */

import React from 'react';

export interface CanvasFormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  className?: string;
}

export const CanvasFormField = React.forwardRef<HTMLInputElement, CanvasFormFieldProps>(
  ({ label, error, className = '', value, ...inputProps }, ref) => {
    // Prevent React warning about null value prop
    const safeValue = value ?? '';
    return (
      <div className={`space-y-2 ${className}`}>
        {/* Label: ruled style */}
        <label className="block text-[10px] font-semibold text-ink-muted uppercase tracking-[0.2em]">
          {label}
        </label>

        {/* Input: chamfered */}
        <input
          ref={ref}
          className="w-full bg-ink-raised border border-white/[0.06] text-ink-bright font-mono focus:border-white/[0.12] transition-colors outline-none px-4 py-2.5"
          style={{
            clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
          }}
          value={safeValue}
          {...inputProps}
        />

        {/* Error */}
        {error && <p className="text-xs text-data-poor font-medium">{error}</p>}
      </div>
    );
  }
);

CanvasFormField.displayName = 'CanvasFormField';

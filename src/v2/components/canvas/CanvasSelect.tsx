/**
 * CanvasSelect - Chamfered select dropdown
 *
 * Native select styled with Canvas design language:
 * - Ruled label style
 * - Chamfered input via clip-path (top-right diagonal)
 * - Monospace font
 * - Custom chevron icon
 *
 * Design: Canvas select primitive
 */

import { ChevronDown } from 'lucide-react';

export interface CanvasSelectProps {
  label?: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CanvasSelect({
  label,
  options,
  value,
  onChange,
  className = '',
}: CanvasSelectProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label: ruled style */}
      {label && (
        <label className="block text-[10px] font-semibold text-ink-muted uppercase tracking-[0.2em]">
          {label}
        </label>
      )}

      {/* Select wrapper for custom chevron */}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-ink-raised border border-white/[0.06] text-ink-bright font-mono focus:border-white/[0.12] transition-colors outline-none px-4 py-2.5 pr-10 cursor-pointer"
          style={{
            clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom chevron icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown size={14} className="text-ink-muted" />
        </div>
      </div>
    </div>
  );
}

/**
 * RangeSelector -- horizontal row of preset time range buttons.
 *
 * Active button shows copper accent. Matches the design system
 * toggle-button pattern used throughout the profile feature.
 */

import type { PMCRange } from '../types';

const RANGES: Array<{ value: PMCRange; label: string }> = [
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '180d', label: '180D' },
  { value: '365d', label: '1Y' },
  { value: 'all', label: 'All' },
];

interface RangeSelectorProps {
  value: PMCRange;
  onChange: (range: PMCRange) => void;
}

export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div
      className="flex gap-1 rounded-lg bg-ink-base/50 p-0.5"
      role="group"
      aria-label="Time range"
    >
      {RANGES.map((range) => {
        const isActive = value === range.value;
        return (
          <button
            key={range.value}
            type="button"
            onClick={() => onChange(range.value)}
            aria-pressed={isActive}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-accent-copper/15 text-accent-copper'
                : 'text-ink-tertiary hover:text-ink-secondary'
            }`}
          >
            {range.label}
          </button>
        );
      })}
    </div>
  );
}

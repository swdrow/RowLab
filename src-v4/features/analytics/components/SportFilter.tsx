/**
 * SportFilter -- dropdown select for filtering analytics by sport type.
 *
 * Uses SPORT_CONFIG from the workouts feature module for consistent
 * sport names. Glass select styling matching design system.
 */

import { SPORT_CONFIG } from '@/features/workouts/constants';

const SPORT_OPTIONS: Array<{ value: string | null; label: string }> = [
  { value: null, label: 'All Sports' },
  ...Object.entries(SPORT_CONFIG).map(([key, config]) => ({
    value: key as string,
    label: config.label,
  })),
];

interface SportFilterProps {
  value: string | null;
  onChange: (sport: string | null) => void;
}

export function SportFilter({ value, onChange }: SportFilterProps) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      aria-label="Filter by sport"
      className="rounded-lg bg-void-surface/50 border border-edge-default px-3 py-1.5 text-xs font-medium text-text-dim appearance-none cursor-pointer hover:border-text-faint transition-colors focus:outline-none focus:ring-1 focus:ring-accent-teal/40 pr-7"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
      }}
    >
      {SPORT_OPTIONS.map((opt) => (
        <option key={opt.value ?? 'all'} value={opt.value ?? ''}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

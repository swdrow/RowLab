import { useCallback, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import type { AthleteStatus, SidePreference } from '@v2/types/athletes';

export interface RosterFilters {
  search: string;
  side: SidePreference | 'all';
  status: AthleteStatus | 'all';
  classYear: number | null;
}

export const DEFAULT_ROSTER_FILTERS: RosterFilters = {
  search: '',
  side: 'all',
  status: 'all',
  classYear: null,
};

export interface RosterFilterBarProps {
  filters: RosterFilters;
  onChange: (filters: RosterFilters) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  availableClassYears?: number[];
  className?: string;
}

const SIDE_OPTIONS: Array<{ value: SidePreference | 'all'; label: string }> = [
  { value: 'all', label: 'All Sides' },
  { value: 'Port', label: 'Port' },
  { value: 'Starboard', label: 'Starboard' },
  { value: 'Both', label: 'Both' },
  { value: 'Cox', label: 'Cox' },
];

const STATUS_OPTIONS: Array<{ value: AthleteStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'injured', label: 'Injured' },
  { value: 'graduated', label: 'Graduated' },
];

const selectClassName = `
  appearance-none px-3 py-2 pr-8
  bg-bg-surface border border-bdr-default rounded-lg
  text-sm text-txt-primary
  focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent
  transition-all cursor-pointer
`;

/**
 * Always-visible inline filter bar for the athletes roster.
 * Provides search, side, status, and class year dropdowns.
 * "/" keyboard shortcut focuses the search input.
 */
export function RosterFilterBar({
  filters,
  onChange,
  searchInputRef,
  availableClassYears = [],
  className = '',
}: RosterFilterBarProps) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.side !== 'all' ||
    filters.status !== 'all' ||
    filters.classYear !== null;

  const updateFilter = useCallback(
    <K extends keyof RosterFilters>(key: K, value: RosterFilters[K]) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange]
  );

  const clearFilters = useCallback(() => {
    onChange(DEFAULT_ROSTER_FILTERS);
  }, [onChange]);

  // "/" keyboard shortcut to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === '/' &&
        !e.metaKey &&
        !e.ctrlKey &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchInputRef]);

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] max-w-[320px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-txt-tertiary pointer-events-none" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search athletes..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="
            w-full pl-9 pr-8 py-2
            bg-bg-surface border border-bdr-default rounded-lg
            text-sm text-txt-primary placeholder:text-txt-tertiary
            focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent
            transition-all
          "
        />
        {/* "/" shortcut hint or clear button */}
        {filters.search ? (
          <button
            onClick={() => updateFilter('search', '')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-txt-tertiary hover:text-txt-secondary"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-txt-tertiary bg-bg-active border border-bdr-subtle rounded">
            /
          </kbd>
        )}
      </div>

      {/* Side Dropdown */}
      <div className="relative">
        <select
          value={filters.side ?? 'all'}
          onChange={(e) => {
            const value = e.target.value;
            updateFilter('side', value === 'all' ? 'all' : (value as SidePreference));
          }}
          className={selectClassName}
        >
          {SIDE_OPTIONS.map((opt) => (
            <option key={opt.value ?? 'all'} value={opt.value ?? 'all'}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg
            className="h-4 w-4 text-txt-tertiary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Status Dropdown */}
      <div className="relative">
        <select
          value={filters.status}
          onChange={(e) => {
            const value = e.target.value;
            updateFilter('status', value as AthleteStatus | 'all');
          }}
          className={selectClassName}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg
            className="h-4 w-4 text-txt-tertiary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Class Year Dropdown */}
      {availableClassYears.length > 0 && (
        <div className="relative">
          <select
            value={filters.classYear ?? 'all'}
            onChange={(e) => {
              const value = e.target.value;
              updateFilter('classYear', value === 'all' ? null : parseInt(value, 10));
            }}
            className={selectClassName}
          >
            <option value="all">All Years</option>
            {availableClassYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <svg
              className="h-4 w-4 text-txt-tertiary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="
            flex items-center gap-1.5 px-3 py-2
            text-sm font-medium text-txt-secondary hover:text-txt-primary
            border border-bdr-default rounded-lg
            hover:bg-bg-hover transition-all
          "
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}

export default RosterFilterBar;

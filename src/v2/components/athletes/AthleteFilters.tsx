import { type AthleteFilters as FilterState, type SidePreference } from '@v2/types/athletes';

export interface AthleteFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  className?: string;
}

export function AthleteFilters({ filters, onChange, className = '' }: AthleteFiltersProps) {
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className={`flex flex-wrap gap-4 ${className}`}>
      {/* Search */}
      <div className="flex-1 min-w-[240px]">
        <div className="relative">
          <input
            type="text"
            placeholder="Search athletes..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="
              w-full px-4 py-2 pl-10
              bg-bg-surface border border-bdr-default rounded-lg
              text-txt-primary placeholder:text-txt-tertiary
              focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent
              transition-all
            "
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-tertiary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Side Preference */}
      <div className="min-w-[160px]">
        <select
          value={filters.side || 'all'}
          onChange={(e) => {
            const value = e.target.value;
            updateFilter('side', value === 'all' ? 'all' : (value as SidePreference));
          }}
          className="
            w-full px-4 py-2
            bg-bg-surface border border-bdr-default rounded-lg
            text-txt-primary
            focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent
            transition-all cursor-pointer
          "
        >
          <option value="all">All Sides</option>
          <option value="Port">Port</option>
          <option value="Starboard">Starboard</option>
          <option value="Both">Both</option>
          <option value="Cox">Cox</option>
        </select>
      </div>

      {/* Can Scull */}
      <div className="min-w-[140px]">
        <select
          value={
            filters.canScull === null || filters.canScull === undefined
              ? 'all'
              : filters.canScull
              ? 'true'
              : 'false'
          }
          onChange={(e) => {
            const value = e.target.value;
            updateFilter('canScull', value === 'all' ? null : value === 'true');
          }}
          className="
            w-full px-4 py-2
            bg-bg-surface border border-bdr-default rounded-lg
            text-txt-primary
            focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent
            transition-all cursor-pointer
          "
        >
          <option value="all">All Scullers</option>
          <option value="true">Can Scull</option>
          <option value="false">Sweep Only</option>
        </select>
      </div>

      {/* Can Cox */}
      <div className="min-w-[140px]">
        <select
          value={
            filters.canCox === null || filters.canCox === undefined
              ? 'all'
              : filters.canCox
              ? 'true'
              : 'false'
          }
          onChange={(e) => {
            const value = e.target.value;
            updateFilter('canCox', value === 'all' ? null : value === 'true');
          }}
          className="
            w-full px-4 py-2
            bg-bg-surface border border-bdr-default rounded-lg
            text-txt-primary
            focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent
            transition-all cursor-pointer
          "
        >
          <option value="all">All Coxes</option>
          <option value="true">Can Cox</option>
          <option value="false">Rowers Only</option>
        </select>
      </div>

      {/* Clear Filters */}
      {(filters.search || filters.side !== 'all' || filters.canScull !== null || filters.canCox !== null) && (
        <button
          onClick={() => onChange({ search: '', side: 'all', canScull: null, canCox: null })}
          className="
            px-4 py-2 text-sm font-medium
            text-txt-secondary hover:text-txt-primary
            border border-bdr-default rounded-lg
            hover:bg-bg-hover transition-all
          "
        >
          Clear
        </button>
      )}
    </div>
  );
}

export default AthleteFilters;

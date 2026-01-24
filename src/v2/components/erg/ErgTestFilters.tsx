import { useState } from 'react';
import type { ErgTestFilters as FilterState, TestType } from '@v2/types/ergTests';

export interface ErgTestFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

/**
 * Date range presets for quick filtering
 */
const DATE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'This year', days: 365 },
  { label: 'All time', days: null },
] as const;

/**
 * Test type options for dropdown
 */
const TEST_TYPE_OPTIONS: Array<{ value: TestType | 'all'; label: string }> = [
  { value: 'all', label: 'All Types' },
  { value: '2k', label: '2k' },
  { value: '6k', label: '6k' },
  { value: '30min', label: '30min' },
  { value: '500m', label: '500m' },
];

/**
 * Calculate ISO date string for N days ago
 */
function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * Filter bar for erg tests table
 */
export function ErgTestFilters({ filters, onFilterChange }: ErgTestFiltersProps) {
  const [showCustomDates, setShowCustomDates] = useState(false);

  const handleTestTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as TestType | 'all';
    onFilterChange({
      ...filters,
      testType: value,
    });
  };

  const handlePresetChange = (days: number | null) => {
    if (days === null) {
      // All time - clear date filters
      onFilterChange({
        ...filters,
        fromDate: undefined,
        toDate: undefined,
      });
      setShowCustomDates(false);
    } else {
      // Set date range
      onFilterChange({
        ...filters,
        fromDate: getDaysAgo(days),
        toDate: new Date().toISOString().split('T')[0],
      });
      setShowCustomDates(false);
    }
  };

  const handleCustomDateChange = (field: 'fromDate' | 'toDate', value: string) => {
    onFilterChange({
      ...filters,
      [field]: value || undefined,
    });
  };

  const toggleCustomDates = () => {
    setShowCustomDates(!showCustomDates);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Primary filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Test type dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="testType" className="text-sm font-medium text-txt-secondary">
            Type:
          </label>
          <select
            id="testType"
            value={filters.testType || 'all'}
            onChange={handleTestTypeChange}
            className="px-3 py-1.5 bg-bg-surface border border-bdr-default rounded-md text-sm text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent"
          >
            {TEST_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date range presets */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-txt-secondary">Range:</label>
          <div className="flex gap-2">
            {DATE_PRESETS.map((preset) => {
              const isActive =
                preset.days === null
                  ? !filters.fromDate && !filters.toDate
                  : filters.fromDate === getDaysAgo(preset.days);

              return (
                <button
                  key={preset.label}
                  onClick={() => handlePresetChange(preset.days)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-interactive-primary text-white'
                      : 'bg-bg-surface text-txt-secondary hover:bg-bg-active hover:text-txt-primary border border-bdr-default'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
            <button
              onClick={toggleCustomDates}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                showCustomDates
                  ? 'bg-interactive-primary text-white'
                  : 'bg-bg-surface text-txt-secondary hover:bg-bg-active hover:text-txt-primary border border-bdr-default'
              }`}
            >
              Custom
            </button>
          </div>
        </div>
      </div>

      {/* Custom date inputs (when toggled) */}
      {showCustomDates && (
        <div className="flex items-center gap-3 pl-16">
          <div className="flex items-center gap-2">
            <label htmlFor="fromDate" className="text-sm font-medium text-txt-secondary">
              From:
            </label>
            <input
              id="fromDate"
              type="date"
              value={filters.fromDate || ''}
              onChange={(e) => handleCustomDateChange('fromDate', e.target.value)}
              className="px-3 py-1.5 bg-bg-surface border border-bdr-default rounded-md text-sm text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="toDate" className="text-sm font-medium text-txt-secondary">
              To:
            </label>
            <input
              id="toDate"
              type="date"
              value={filters.toDate || ''}
              onChange={(e) => handleCustomDateChange('toDate', e.target.value)}
              className="px-3 py-1.5 bg-bg-surface border border-bdr-default rounded-md text-sm text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
}

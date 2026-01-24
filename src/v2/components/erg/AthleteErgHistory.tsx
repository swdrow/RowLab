import { useState } from 'react';
import { useAthleteErgHistory } from '@v2/hooks/useErgTests';
import { PersonalBestsCard } from './PersonalBestsCard';
import { ErgProgressChart } from './ErgProgressChart';
import type { TestType } from '@v2/types/ergTests';

interface AthleteErgHistoryProps {
  athleteId: string;
  athleteName?: string;
  compact?: boolean;
  className?: string;
}

type FilterOption = 'all' | TestType;

const testTypeOptions: Array<{ value: FilterOption; label: string }> = [
  { value: 'all', label: 'All' },
  { value: '2k', label: '2k' },
  { value: '6k', label: '6k' },
  { value: '30min', label: '30min' },
  { value: '500m', label: '500m' },
];

/**
 * Segmented control for test type filtering
 */
function TestTypeFilter({
  selected,
  onChange
}: {
  selected: FilterOption;
  onChange: (value: FilterOption) => void;
}) {
  return (
    <div className="inline-flex rounded-lg bg-bg-surface border border-bdr-subtle p-1">
      {testTypeOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`
            px-3 py-1.5 rounded-md text-sm font-medium transition-all
            ${
              selected === option.value
                ? 'bg-interactive-primary text-white shadow-sm'
                : 'text-txt-secondary hover:text-txt-primary hover:bg-bg-hover'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for history view
 */
function HistorySkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Filter skeleton */}
      {!compact && (
        <div className="h-10 bg-bg-surface rounded-lg w-64" />
      )}

      {/* Content skeleton */}
      <div className={compact ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-3 gap-4'}>
        <div className={compact ? 'h-48' : 'lg:col-span-1 h-64'}>
          <div className="w-full h-full bg-bg-surface rounded-lg" />
        </div>
        <div className={compact ? 'h-64' : 'lg:col-span-2 h-64'}>
          <div className="w-full h-full bg-bg-surface rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state for no erg tests
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 mb-4 rounded-full bg-bg-surface flex items-center justify-center">
        <svg
          className="w-8 h-8 text-txt-tertiary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-txt-primary mb-2">
        No erg tests recorded yet
      </h3>
      <p className="text-sm text-txt-tertiary text-center max-w-sm">
        Erg test results will appear here once they are added.
      </p>
    </div>
  );
}

/**
 * Error state for failed data fetch
 */
function ErrorState({ error }: { error: Error }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 mb-4 rounded-full bg-status-error/10 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-status-error"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-txt-primary mb-2">
        Failed to load erg history
      </h3>
      <p className="text-sm text-txt-tertiary text-center max-w-sm">
        {error.message || 'An error occurred while fetching erg test data.'}
      </p>
    </div>
  );
}

/**
 * Combined view of athlete's erg test history with charts and personal bests
 */
export function AthleteErgHistory({
  athleteId,
  athleteName,
  compact = false,
  className = ''
}: AthleteErgHistoryProps) {
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('all');
  const { tests, personalBests, totalTests, isLoading, error } = useAthleteErgHistory(athleteId);

  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        <HistorySkeleton compact={compact} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        <ErrorState error={error as Error} />
      </div>
    );
  }

  // Empty state
  if (totalTests === 0) {
    return (
      <div className={className}>
        <EmptyState />
      </div>
    );
  }

  // Filter tests based on selection
  const filteredTests = selectedFilter === 'all'
    ? tests
    : tests.filter(t => t.testType === selectedFilter);

  return (
    <div className={className}>
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {athleteName && (
              <h2 className="text-xl font-semibold text-txt-primary mb-1">
                {athleteName}'s Erg History
              </h2>
            )}
            <p className="text-sm text-txt-tertiary">
              {totalTests} {totalTests === 1 ? 'test' : 'tests'} recorded
            </p>
          </div>
          <TestTypeFilter
            selected={selectedFilter}
            onChange={setSelectedFilter}
          />
        </div>
      )}

      {/* Compact mode filter */}
      {compact && (
        <div className="mb-4">
          <TestTypeFilter
            selected={selectedFilter}
            onChange={setSelectedFilter}
          />
        </div>
      )}

      {/* Content layout */}
      <div className={
        compact
          ? 'space-y-4'
          : 'grid grid-cols-1 lg:grid-cols-3 gap-4'
      }>
        {/* Personal Bests */}
        <div className={compact ? '' : 'lg:col-span-1'}>
          <PersonalBestsCard
            personalBests={personalBests}
            testTypes={selectedFilter === 'all' ? undefined : [selectedFilter]}
          />
        </div>

        {/* Progress Chart */}
        <div className={compact ? '' : 'lg:col-span-2'}>
          <ErgProgressChart
            tests={filteredTests}
            testType={selectedFilter === 'all' ? undefined : selectedFilter}
            height={compact ? 250 : 350}
          />
        </div>
      </div>
    </div>
  );
}

export default AthleteErgHistory;

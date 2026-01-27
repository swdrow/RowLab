/**
 * HistoricalLineupBrowser - Phase 18 LINEUP-02
 *
 * Searchable, filterable view of past lineups with multi-criteria filtering.
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Calendar,
  Users,
  Ship,
  X,
  ChevronDown,
  ChevronUp,
  History,
  ArrowUpDown,
} from 'lucide-react';
import { useLineupSearch } from '@v2/hooks/useLineupSearch';
import { useAthletes } from '@v2/hooks/useAthletes';
import type { LineupSearchFilters, LineupSearchResult } from '@v2/types/equipment';

interface HistoricalLineupBrowserProps {
  onSelectLineup: (lineupId: string) => void;
  onCompare?: (lineup1Id: string, lineup2Id: string) => void;
  className?: string;
}

const BOAT_CLASSES = ['8+', '4+', '4-', '4x', '2+', '2-', '2x', '1x'];

interface FilterPillProps {
  label: string;
  onRemove: () => void;
}

function FilterPill({ label, onRemove }: FilterPillProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full
                     bg-interactive-primary/10 text-interactive-primary">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-interactive-primary/20 rounded-full p-0.5"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function LineupCard({
  lineup,
  isSelected,
  onSelect,
  onToggleCompare,
  isInCompare,
}: {
  lineup: LineupSearchResult;
  isSelected: boolean;
  onSelect: () => void;
  onToggleCompare?: () => void;
  isInCompare: boolean;
}) {
  const formattedDate = new Date(lineup.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className={`p-3 rounded-lg border transition-all cursor-pointer
                  ${
                    isSelected
                      ? 'border-interactive-primary bg-interactive-primary/5'
                      : isInCompare
                      ? 'border-amber-500 bg-amber-500/5'
                      : 'border-bdr-default bg-bg-elevated hover:border-bdr-hover'
                  }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-txt-primary">{lineup.name}</h4>
          <p className="text-xs text-txt-tertiary mt-0.5">{formattedDate}</p>
        </div>
        {onToggleCompare && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare();
            }}
            className={`px-2 py-1 text-xs rounded transition-colors
                        ${
                          isInCompare
                            ? 'bg-amber-500 text-white'
                            : 'bg-bg-hover text-txt-secondary hover:bg-bg-default'
                        }`}
          >
            {isInCompare ? 'Selected' : 'Compare'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2">
        {lineup.boatClasses.map((bc) => (
          <span
            key={bc}
            className="px-1.5 py-0.5 text-xs rounded bg-bg-hover text-txt-secondary"
          >
            {bc}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-2 text-xs text-txt-tertiary">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {lineup.athleteCount} athletes
        </span>
        {lineup.shellNames.length > 0 && (
          <span className="flex items-center gap-1">
            <Ship className="h-3 w-3" />
            {lineup.shellNames.length} shells
          </span>
        )}
        {lineup.matchedAthleteCount !== undefined && (
          <span className="text-interactive-primary">
            {lineup.matchedAthleteCount} matched
          </span>
        )}
      </div>
    </div>
  );
}

export function HistoricalLineupBrowser({
  onSelectLineup,
  onCompare,
  className = '',
}: HistoricalLineupBrowserProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [nameSearch, setNameSearch] = useState('');
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);
  const [minAthletes, setMinAthletes] = useState<number>(1);
  const [selectedBoatClasses, setSelectedBoatClasses] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  const [sortBy, setSortBy] = useState<'createdAt' | 'name'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const { allAthletes } = useAthletes();

  const filters = useMemo<LineupSearchFilters>(() => ({
    nameSearch: nameSearch || undefined,
    athleteIds: selectedAthleteIds.length > 0 ? selectedAthleteIds : undefined,
    minAthletes: selectedAthleteIds.length > 0 ? minAthletes : undefined,
    boatClasses: selectedBoatClasses.length > 0 ? selectedBoatClasses : undefined,
    startDate: dateRange.start,
    endDate: dateRange.end,
    sortBy,
    sortDirection,
  }), [nameSearch, selectedAthleteIds, minAthletes, selectedBoatClasses, dateRange, sortBy, sortDirection]);

  const hasFilters = selectedAthleteIds.length > 0 || selectedBoatClasses.length > 0 || dateRange.start || dateRange.end;

  const { data, isLoading } = useLineupSearch(filters, true);

  const handleToggleAthlete = useCallback((athleteId: string) => {
    setSelectedAthleteIds((prev) =>
      prev.includes(athleteId)
        ? prev.filter((id) => id !== athleteId)
        : [...prev, athleteId]
    );
  }, []);

  const handleToggleBoatClass = useCallback((boatClass: string) => {
    setSelectedBoatClasses((prev) =>
      prev.includes(boatClass)
        ? prev.filter((bc) => bc !== boatClass)
        : [...prev, boatClass]
    );
  }, []);

  const handleToggleCompare = useCallback((lineupId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(lineupId)) {
        return prev.filter((id) => id !== lineupId);
      }
      if (prev.length >= 2) {
        const secondId = prev[1];
        if (secondId) {
          return [secondId, lineupId];
        }
        return [lineupId];
      }
      return [...prev, lineupId];
    });
  }, []);

  const handleCompare = useCallback(() => {
    if (onCompare && compareIds.length === 2 && compareIds[0] && compareIds[1]) {
      onCompare(compareIds[0], compareIds[1]);
    }
  }, [onCompare, compareIds]);

  const clearFilters = useCallback(() => {
    setSelectedAthleteIds([]);
    setSelectedBoatClasses([]);
    setDateRange({});
    setMinAthletes(1);
  }, []);

  const selectedAthletes = useMemo(() => {
    return allAthletes.filter((a) => selectedAthleteIds.includes(a.id));
  }, [allAthletes, selectedAthleteIds]);

  return (
    <div className={`bg-bg-elevated rounded-lg border border-bdr-default ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-bdr-default">
        <div className="flex items-center gap-2 mb-3">
          <History className="h-5 w-5 text-txt-secondary" />
          <h3 className="font-medium text-txt-primary">Lineup History</h3>
          {data && (
            <span className="text-xs text-txt-tertiary">
              ({data.total} {data.total === 1 ? 'lineup' : 'lineups'})
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-txt-tertiary" />
          <input
            type="text"
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            placeholder="Search lineups..."
            className="w-full pl-8 pr-3 py-2 text-sm rounded border border-bdr-default
                       bg-bg-default focus:outline-none focus:ring-2 focus:ring-interactive-primary"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`mt-2 flex items-center gap-1.5 text-sm transition-colors
                      ${hasFilters ? 'text-interactive-primary' : 'text-txt-secondary hover:text-txt-primary'}`}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasFilters && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-interactive-primary/10">
              {selectedAthleteIds.length + selectedBoatClasses.length + (dateRange.start || dateRange.end ? 1 : 0)}
            </span>
          )}
          {showFilters ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {/* Active filter pills */}
        {hasFilters && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedAthletes.map((athlete) => (
              <FilterPill
                key={athlete.id}
                label={`${athlete.firstName} ${athlete.lastName}`}
                onRemove={() => handleToggleAthlete(athlete.id)}
              />
            ))}
            {selectedBoatClasses.map((bc) => (
              <FilterPill
                key={bc}
                label={bc}
                onRemove={() => handleToggleBoatClass(bc)}
              />
            ))}
            {(dateRange.start || dateRange.end) && (
              <FilterPill
                label={`${dateRange.start ?? '...'} - ${dateRange.end ?? '...'}`}
                onRemove={() => setDateRange({})}
              />
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-txt-tertiary hover:text-txt-secondary"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-bdr-default"
          >
            <div className="p-3 space-y-4 bg-bg-default">
              {/* Boat class filter */}
              <div>
                <label className="block text-xs font-medium text-txt-secondary mb-1.5">
                  Boat Class
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {BOAT_CLASSES.map((bc) => (
                    <button
                      key={bc}
                      onClick={() => handleToggleBoatClass(bc)}
                      className={`px-2 py-1 text-xs rounded border transition-colors
                                  ${
                                    selectedBoatClasses.includes(bc)
                                      ? 'border-interactive-primary bg-interactive-primary/10 text-interactive-primary'
                                      : 'border-bdr-default text-txt-secondary hover:border-bdr-hover'
                                  }`}
                    >
                      {bc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div>
                <label className="block text-xs font-medium text-txt-secondary mb-1.5">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  Date Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateRange.start || ''}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                    className="flex-1 px-2 py-1.5 text-sm rounded border border-bdr-default
                               bg-bg-elevated focus:outline-none focus:ring-2 focus:ring-interactive-primary"
                  />
                  <span className="text-txt-tertiary">to</span>
                  <input
                    type="date"
                    value={dateRange.end || ''}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                    className="flex-1 px-2 py-1.5 text-sm rounded border border-bdr-default
                               bg-bg-elevated focus:outline-none focus:ring-2 focus:ring-interactive-primary"
                  />
                </div>
              </div>

              {/* Athlete filter with minimum */}
              {selectedAthleteIds.length > 1 && (
                <div>
                  <label className="block text-xs font-medium text-txt-secondary mb-1.5">
                    Minimum athletes to match
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedAthleteIds.length}
                    value={minAthletes}
                    onChange={(e) => setMinAthletes(parseInt(e.target.value, 10) || 1)}
                    className="w-20 px-2 py-1.5 text-sm rounded border border-bdr-default
                               bg-bg-elevated focus:outline-none focus:ring-2 focus:ring-interactive-primary"
                  />
                  <span className="ml-2 text-xs text-txt-tertiary">
                    of {selectedAthleteIds.length} selected
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sort options */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-bdr-default bg-bg-default">
        <div className="flex items-center gap-2 text-xs text-txt-secondary">
          <ArrowUpDown className="h-3.5 w-3.5" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'name')}
            className="bg-transparent focus:outline-none"
          >
            <option value="createdAt">Date</option>
            <option value="name">Name</option>
          </select>
          <button
            onClick={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
            className="hover:text-txt-primary"
          >
            {sortDirection === 'desc' ? '↓' : '↑'}
          </button>
        </div>

        {onCompare && compareIds.length === 2 && (
          <button
            onClick={handleCompare}
            className="px-2 py-1 text-xs text-white bg-amber-500 hover:bg-amber-600 rounded"
          >
            Compare Selected
          </button>
        )}
      </div>

      {/* Results */}
      <div className="p-3 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-20 rounded bg-bg-hover" />
            <div className="h-20 rounded bg-bg-hover" />
            <div className="h-20 rounded bg-bg-hover" />
          </div>
        ) : data && data.lineups.length > 0 ? (
          <div className="space-y-2">
            {data.lineups.map((lineup) => (
              <LineupCard
                key={lineup.id}
                lineup={lineup}
                isSelected={false}
                onSelect={() => onSelectLineup(lineup.id)}
                onToggleCompare={onCompare ? () => handleToggleCompare(lineup.id) : undefined}
                isInCompare={compareIds.includes(lineup.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <History className="h-8 w-8 text-txt-tertiary mx-auto mb-2" />
            <p className="text-sm text-txt-secondary">No lineups found</p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 text-xs text-interactive-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoricalLineupBrowser;

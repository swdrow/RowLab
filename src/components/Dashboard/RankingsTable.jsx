import React, { useState, useMemo } from 'react';
import {
  Trophy,
  ChevronUp,
  ChevronDown,
  Minus,
  Filter,
  Download,
  Search,
} from 'lucide-react';

/**
 * RankingsTable - Comprehensive athlete comparison
 *
 * Columns:
 * - Seat Race Elo
 * - 2k Time
 * - 6k Time
 * - Recent Trend
 * - Combined Score
 *
 * Features:
 * - Column sorting
 * - Filter by side (Port/Starboard/Both)
 * - Export to CSV
 */
function RankingsTable({
  athletes = [], // Array of { id, name, side, elo, time2k, time6k, trend, combinedScore }
  onExport,
  onAthleteClick,
  className = '',
}) {
  const [sortColumn, setSortColumn] = useState('combinedScore');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterSide, setFilterSide] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Format time in M:SS.T
  const formatTime = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  // Filter and sort athletes
  const filteredAthletes = useMemo(() => {
    let result = [...athletes];

    // Filter by side
    if (filterSide !== 'all') {
      result = result.filter(a => {
        if (filterSide === 'port') return a.side === 'P' || a.side === 'B';
        if (filterSide === 'starboard') return a.side === 'S' || a.side === 'B';
        return true;
      });
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.name?.toLowerCase().includes(query) ||
        a.firstName?.toLowerCase().includes(query) ||
        a.lastName?.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      // Handle null/undefined
      if (aVal == null) aVal = sortDirection === 'desc' ? -Infinity : Infinity;
      if (bVal == null) bVal = sortDirection === 'desc' ? -Infinity : Infinity;

      // For times, lower is better
      const isTimeColumn = sortColumn === 'time2k' || sortColumn === 'time6k';

      if (sortDirection === 'asc') {
        return aVal - bVal;
      } else {
        // For times descending should show best (lowest) first
        if (isTimeColumn) return aVal - bVal;
        return bVal - aVal;
      }
    });

    return result;
  }, [athletes, sortColumn, sortDirection, filterSide, searchQuery]);

  // Handle column header click
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      // Default to desc for scores, asc for times
      setSortDirection(column === 'time2k' || column === 'time6k' ? 'asc' : 'desc');
    }
  };

  // Trend icon
  const TrendIcon = ({ trend }) => {
    if (trend === 'up') return <ChevronUp size={14} className="text-success" />;
    if (trend === 'down') return <ChevronDown size={14} className="text-danger-red" />;
    return <Minus size={14} className="text-text-muted" />;
  };

  // Column header with sort indicator
  const SortableHeader = ({ column, label, align = 'left' }) => {
    const isActive = sortColumn === column;
    // Explicit mapping for Tailwind class detection (dynamic classes not purge-safe)
    const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
    return (
      <th
        className={`
          px-4 py-3 cursor-pointer select-none transition-colors
          ${alignClass} text-[10px] font-medium uppercase tracking-wider
          ${isActive ? 'text-blade-blue' : 'text-text-muted hover:text-text-secondary'}
        `}
        onClick={() => handleSort(column)}
      >
        <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
          <span>{label}</span>
          {isActive && (
            sortDirection === 'asc'
              ? <ChevronUp size={12} />
              : <ChevronDown size={12} />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className={`rounded-xl bg-void-elevated border border-white/[0.06] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning-orange/10 border border-warning-orange/20 flex items-center justify-center">
            <Trophy size={20} className="text-warning-orange" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-primary">Rankings</h3>
            <p className="text-xs text-text-muted">{filteredAthletes.length} athletes</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-32 sm:w-40 pl-9 pr-3 py-2 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-blade-blue/50"
            />
          </div>

          {/* Side filter */}
          <select
            value={filterSide}
            onChange={(e) => setFilterSide(e.target.value)}
            className="px-3 py-2 rounded-lg bg-void-surface border border-white/[0.06] text-text-secondary text-xs focus:outline-none focus:border-blade-blue/50"
          >
            <option value="all">All Sides</option>
            <option value="port">Port</option>
            <option value="starboard">Starboard</option>
          </select>

          {/* Export */}
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-void-surface border border-white/[0.06] text-text-secondary text-xs hover:text-text-primary hover:bg-white/[0.04] transition-all"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-text-muted w-8">
                #
              </th>
              <SortableHeader column="name" label="Athlete" />
              <th className="px-4 py-3 text-center text-[10px] font-medium uppercase tracking-wider text-text-muted w-16">
                Side
              </th>
              <SortableHeader column="elo" label="Elo" align="right" />
              <SortableHeader column="time2k" label="2k" align="right" />
              <SortableHeader column="time6k" label="6k" align="right" />
              <th className="px-4 py-3 text-center text-[10px] font-medium uppercase tracking-wider text-text-muted w-16">
                Trend
              </th>
              <SortableHeader column="combinedScore" label="Score" align="right" />
            </tr>
          </thead>
          <tbody>
            {filteredAthletes.map((athlete, index) => (
              <tr
                key={athlete.id}
                onClick={() => onAthleteClick?.(athlete)}
                className={`
                  border-b border-white/[0.03] transition-colors duration-100
                  ${onAthleteClick ? 'cursor-pointer hover:bg-white/[0.03]' : 'hover:bg-white/[0.02]'}
                `}
              >
                {/* Rank */}
                <td className="px-4 py-3 text-sm font-mono text-text-muted">
                  {index + 1}
                </td>

                {/* Name */}
                <td className="px-4 py-3">
                  <span className="text-sm text-text-primary font-medium">
                    {athlete.name || `${athlete.firstName} ${athlete.lastName}`}
                  </span>
                </td>

                {/* Side */}
                <td className="px-4 py-3 text-center">
                  <span className={`
                    inline-block px-2 py-0.5 rounded text-[10px] font-mono
                    ${athlete.side === 'P'
                      ? 'bg-danger-red/10 text-danger-red'
                      : athlete.side === 'S'
                        ? 'bg-starboard/10 text-starboard'
                        : 'bg-spectrum-violet/10 text-spectrum-violet'
                    }
                  `}>
                    {athlete.side || 'B'}
                  </span>
                </td>

                {/* Elo */}
                <td className="px-4 py-3 text-right font-mono text-sm text-text-primary tabular-nums">
                  {athlete.elo?.toFixed(0) || '-'}
                </td>

                {/* 2k */}
                <td className="px-4 py-3 text-right font-mono text-sm text-blade-blue tabular-nums">
                  {formatTime(athlete.time2k)}
                </td>

                {/* 6k */}
                <td className="px-4 py-3 text-right font-mono text-sm text-text-secondary tabular-nums">
                  {formatTime(athlete.time6k)}
                </td>

                {/* Trend */}
                <td className="px-4 py-3 text-center">
                  <TrendIcon trend={athlete.trend} />
                </td>

                {/* Combined Score */}
                <td className="px-4 py-3 text-right">
                  <span className="font-mono text-sm font-medium text-warning-orange tabular-nums">
                    {athlete.combinedScore?.toFixed(0) || '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {filteredAthletes.length === 0 && (
        <div className="px-4 py-12 text-center">
          <Trophy size={32} className="mx-auto mb-3 text-text-muted/50" />
          <p className="text-sm text-text-muted">No athletes found</p>
          <p className="text-xs text-text-muted/60 mt-1">
            {searchQuery || filterSide !== 'all'
              ? 'Try adjusting your filters'
              : 'Add athletes to see rankings'
            }
          </p>
        </div>
      )}
    </div>
  );
}

export default RankingsTable;

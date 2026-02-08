import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { ConfidenceBadge } from './ConfidenceBadge';
import type { RatingWithAthlete } from '@v2/types/seatRacing';

export interface RankingsTableProps {
  ratings: RatingWithAthlete[];
  isLoading?: boolean;
  onRecalculate?: () => void;
}

/**
 * Format side preference badge (V3 tokens)
 */
function SideBadge({ side }: { side: string | null }) {
  if (!side) return <span className="text-txt-tertiary">—</span>;

  const colors: Record<string, string> = {
    Port: 'bg-[var(--data-poor)]/10 text-[var(--data-poor)]',
    Starboard: 'bg-[var(--data-excellent)]/10 text-[var(--data-excellent)]',
    Both: 'bg-[var(--data-good)]/10 text-[var(--data-good)]',
    Cox: 'bg-[var(--chart-2)]/10 text-[var(--chart-2)]',
  };

  const color = colors[side] || 'bg-[var(--ink-muted)]/10 text-[var(--ink-muted)]';

  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{side}</span>;
}

/**
 * Get rating color based on value (V3 tokens)
 */
function getRatingColor(rating: number): string {
  if (rating >= 1200) return 'text-[var(--data-good)]';
  if (rating >= 1000) return 'text-txt-primary';
  if (rating >= 800) return 'text-[var(--data-warning)]';
  return 'text-txt-muted';
}

/**
 * Get rank color (top 3 highlighted with warm accent)
 */
function getRankColor(rank: number): string {
  if (rank <= 3) return 'text-[var(--data-warning)] font-bold';
  return 'text-txt-primary';
}

/**
 * Sortable rankings table using TanStack Table
 */
export function RankingsTable({ ratings, isLoading = false, onRecalculate }: RankingsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'rating', desc: true }]);
  const [sideFilter, setSideFilter] = useState<string>('All');

  // Filter by side
  const filteredRatings = useMemo(() => {
    if (sideFilter === 'All') return ratings;
    return ratings.filter((r) => r.athlete.side === sideFilter);
  }, [ratings, sideFilter]);

  const columns = useMemo<ColumnDef<RatingWithAthlete, any>[]>(
    () => [
      {
        id: 'rank',
        header: 'Rank',
        accessorFn: (_, index) => index + 1,
        cell: ({ row }) => {
          const rank = row.index + 1;
          return <span className={getRankColor(rank)}>{rank}</span>;
        },
        size: 60,
        enableSorting: false,
      },
      {
        id: 'athlete',
        header: 'Athlete',
        accessorFn: (row) => `${row.athlete.lastName}, ${row.athlete.firstName}`,
        cell: ({ row }) => (
          <div className="font-medium text-txt-primary">
            {row.original.athlete.lastName}, {row.original.athlete.firstName}
          </div>
        ),
        size: 200,
        enableSorting: true,
      },
      {
        id: 'side',
        header: 'Side',
        accessorKey: 'athlete.side',
        cell: ({ row }) => <SideBadge side={row.original.athlete.side} />,
        size: 100,
        enableSorting: false,
      },
      {
        id: 'rating',
        header: 'ELO Rating',
        accessorKey: 'ratingValue',
        cell: ({ row }) => {
          const rating = Math.round(row.original.ratingValue);
          return <span className={`font-mono ${getRatingColor(rating)}`}>{rating}</span>;
        },
        size: 100,
        enableSorting: true,
      },
      {
        id: 'pieces',
        header: 'Pieces',
        accessorKey: 'racesCount',
        cell: ({ row }) => <span className="text-txt-secondary">{row.original.racesCount}</span>,
        size: 80,
        enableSorting: true,
      },
      {
        id: 'confidence',
        header: 'Confidence',
        accessorKey: 'confidenceScore',
        cell: ({ row }) => <ConfidenceBadge confidence={row.original.confidenceScore} />,
        size: 120,
        enableSorting: true,
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredRatings,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-interactive-primary" />
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6 bg-bg-surface rounded-lg">
        <svg
          className="w-16 h-16 text-txt-muted mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="text-lg font-medium text-txt-primary mb-2">No Rankings Available</p>
        <p className="text-sm text-txt-secondary">
          Complete some seat races to generate athlete rankings
        </p>
      </div>
    );
  }

  return (
    <div className="bg-bg-surface rounded-lg border border-bdr-default">
      {/* Header with actions */}
      <div className="flex items-center justify-between p-4 border-b border-bdr-default">
        <h2 className="text-xl font-semibold text-txt-primary">Athlete Rankings</h2>
        <div className="flex items-center gap-3">
          {/* Side filter */}
          <select
            value={sideFilter}
            onChange={(e) => setSideFilter(e.target.value)}
            className="px-3 py-1.5 bg-bg-surface border border-bdr-default rounded-md text-sm text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary"
          >
            <option value="All">All Sides</option>
            <option value="Port">Port</option>
            <option value="Starboard">Starboard</option>
          </select>

          {/* Recalculate button */}
          {onRecalculate && (
            <button
              onClick={onRecalculate}
              className="px-4 py-1.5 text-sm font-medium text-white bg-interactive-primary rounded-md hover:bg-interactive-primary/90 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Recalculate
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-bg-active">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="px-4 py-3 text-left text-xs font-medium text-txt-muted uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-2 ${
                          header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="text-txt-tertiary">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ArrowDown className="w-3 h-3" />
                            ) : (
                              <div className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-bg-surface divide-y divide-bdr-default">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-bg-hover transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile responsive view (below 768px) */}
      <style>{`
        @media (max-width: 768px) {
          .overflow-x-auto {
            overflow-x: scroll;
          }
        }
      `}</style>
    </div>
  );
}

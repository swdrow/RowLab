import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AnimatePresence, motion } from 'framer-motion';
import { UserPlus, Upload } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAthletes } from '@v2/hooks/useAthletes';
import { AthleteAvatar } from '@v2/components/athletes/AthleteAvatar';
import {
  AthletesEmptyState,
  AthletesNoResultsState,
} from '@v2/components/athletes/AthletesEmptyState';
import {
  AthletesSkeleton,
  AthletesGridSkeleton,
} from '@v2/features/athletes/components/AthletesSkeleton';
import { AthleteCard } from '@v2/components/athletes/AthleteCard';
import { getCountryFlag } from '@v2/utils/countryFlags';
import { SPRING_GENTLE } from '@v2/utils/animations';

import { AthleteProfilePanel } from '../profile/AthleteProfilePanel';
import { CSVImportWizard } from '../import/CSVImportWizard';
import { useAthleteKeyboard } from '../../hooks/useAthleteKeyboard';
import { useAthleteSelection } from '../../hooks/useAthleteSelection';

import { ViewModeSwitcher, type ViewMode } from './ViewModeSwitcher';
import { RosterFilterBar, DEFAULT_ROSTER_FILTERS, type RosterFilters } from './RosterFilterBar';
import { FilterSummary } from './FilterSummary';
import { AthleteCompactRow } from './AthleteCompactRow';
import { BulkActionBar } from './BulkActionBar';
import { BulkEditDialog, type BulkEditFields } from './BulkEditDialog';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import type { Athlete, AthleteFilters, AthleteStatus } from '@v2/types/athletes';

// ============================================
// Local storage key for view mode persistence
// ============================================
const VIEW_MODE_KEY = 'rowlab-athletes-view-v3';

function getPersistedViewMode(): ViewMode {
  try {
    const stored = localStorage.getItem(VIEW_MODE_KEY);
    if (stored === 'grid' || stored === 'table' || stored === 'compact') return stored;
  } catch {
    // localStorage unavailable
  }
  return 'table';
}

function persistViewMode(mode: ViewMode) {
  try {
    localStorage.setItem(VIEW_MODE_KEY, mode);
  } catch {
    // noop
  }
}

// ============================================
// Helpers
// ============================================

function SideBadge({ side }: { side: Athlete['side'] }) {
  if (!side) return <span className="text-txt-tertiary">--</span>;
  const colors: Record<string, string> = {
    Port: 'bg-red-500/10 text-red-600 dark:text-red-400',
    Starboard: 'bg-green-500/10 text-green-600 dark:text-green-400',
    Both: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    Cox: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[side] || ''}`}>
      {side}
    </span>
  );
}

function StatusBadge({ status }: { status: AthleteStatus }) {
  const styles: Record<string, string> = {
    active: 'bg-green-500/10 text-green-600 dark:text-green-400',
    inactive: 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400',
    injured: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    graduated: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || styles.active}`}
    >
      {status}
    </span>
  );
}

function formatBiometric(value: number | null, unit: string): string {
  if (value === null) return '--';
  return `${value}${unit}`;
}

// ============================================
// CSV Export utility
// ============================================

function exportAthletesToCsv(athletes: Athlete[]) {
  const headers = [
    'First Name',
    'Last Name',
    'Email',
    'Side',
    'Status',
    'Class Year',
    'Weight (kg)',
    'Height (cm)',
  ];
  const rows = athletes.map((a) => [
    a.firstName,
    a.lastName,
    a.email || '',
    a.side || '',
    a.status || 'active',
    a.classYear?.toString() || '',
    a.weightKg?.toString() || '',
    a.heightCm?.toString() || '',
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `athletes-export-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ============================================
// Main Component
// ============================================

export function AthletesRosterPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // View mode (persisted)
  const [viewMode, setViewMode] = useState<ViewMode>(getPersistedViewMode);
  const handleViewChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    persistViewMode(mode);
  }, []);

  // Roster filters
  const [rosterFilters, setRosterFilters] = useState<RosterFilters>(DEFAULT_ROSTER_FILTERS);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Map roster filters to AthleteFilters for the hook
  const athleteFilters = useMemo<AthleteFilters>(
    () => ({
      search: rosterFilters.search || undefined,
      side: rosterFilters.side === 'all' ? undefined : rosterFilters.side,
      status: rosterFilters.status === 'all' ? undefined : rosterFilters.status,
      classYear: rosterFilters.classYear,
      sortBy: 'name',
      sortDir: 'asc',
    }),
    [rosterFilters]
  );

  // Fetch athletes
  const { athletes, allAthletes, isLoading, updateAthlete } = useAthletes(athleteFilters);

  // Derive available class years from all athletes
  const availableClassYears = useMemo(() => {
    const years = new Set<number>();
    allAthletes.forEach((a) => {
      if (a.classYear) years.add(a.classYear);
    });
    return Array.from(years).sort((a, b) => a - b);
  }, [allAthletes]);

  // ─── Profile Panel State ──────────────────────────────────────────
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);

  const handleAthleteClick = useCallback((athlete: Athlete) => {
    setSelectedAthleteId(athlete.id);
    setIsProfilePanelOpen(true);
  }, []);

  const handleCloseProfilePanel = useCallback(() => {
    setIsProfilePanelOpen(false);
    // Delay clearing selection so close animation completes
    setTimeout(() => setSelectedAthleteId(null), 300);
  }, []);

  // ─── CSV Import Wizard State ──────────────────────────────────────
  const [isImportOpen, setIsImportOpen] = useState(false);

  // ─── URL Param Actions ────────────────────────────────────────────
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') {
      navigate('/app/athletes/new');
      // Clear the param
      setSearchParams((prev) => {
        prev.delete('action');
        return prev;
      });
    } else if (action === 'import') {
      setIsImportOpen(true);
      // Clear the param
      setSearchParams((prev) => {
        prev.delete('action');
        return prev;
      });
    }
  }, [searchParams, navigate, setSearchParams]);

  // ─── Selection (for keyboard hook) ────────────────────────────────
  const selection = useAthleteSelection(athletes);

  // ─── Keyboard Shortcuts ───────────────────────────────────────────
  const keyboard = useAthleteKeyboard({
    athletes,
    searchInputRef: searchInputRef as React.RefObject<HTMLInputElement>,
    onEdit: handleAthleteClick,
    onViewProfile: handleAthleteClick,
    selection,
    isEnabled: !isProfilePanelOpen && !isImportOpen,
  });

  // TanStack Table: Row selection state (persists across view switches)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);

  // TanStack Table: Column definitions
  const columns = useMemo<ColumnDef<Athlete, unknown>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="h-3.5 w-3.5 rounded border-bdr-default text-interactive-primary focus:ring-interactive-primary/50 cursor-pointer"
            aria-label="Select all athletes"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
            className="h-3.5 w-3.5 rounded border-bdr-default text-interactive-primary focus:ring-interactive-primary/50 cursor-pointer"
            aria-label={`Select ${row.original.firstName} ${row.original.lastName}`}
          />
        ),
        size: 40,
        enableSorting: false,
      },
      {
        id: 'name',
        header: 'Athlete',
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <AthleteAvatar
              firstName={row.original.firstName}
              lastName={row.original.lastName}
              size="sm"
            />
            <div>
              <div className="font-medium text-txt-primary flex items-center gap-2">
                <span>
                  {row.original.firstName} {row.original.lastName}
                </span>
                {row.original.country && (
                  <span title={row.original.country}>{getCountryFlag(row.original.country)}</span>
                )}
              </div>
              {row.original.email && (
                <div className="text-xs text-txt-tertiary">{row.original.email}</div>
              )}
            </div>
          </div>
        ),
        size: 250,
      },
      {
        id: 'side',
        header: 'Side',
        accessorKey: 'side',
        cell: ({ row }) => <SideBadge side={row.original.side} />,
        size: 120,
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => <StatusBadge status={row.original.status || 'active'} />,
        size: 110,
      },
      {
        id: 'classYear',
        header: 'Year',
        accessorKey: 'classYear',
        cell: ({ row }) => (
          <span className="text-txt-secondary tabular-nums">{row.original.classYear ?? '--'}</span>
        ),
        size: 80,
      },
      {
        id: 'capabilities',
        header: 'Capabilities',
        accessorFn: (row) => `${row.canScull ? 'Scull' : ''} ${row.canCox ? 'Cox' : ''}`,
        cell: ({ row }) => (
          <div className="flex gap-1">
            {row.original.canScull && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-bg-active text-txt-primary">
                Scull
              </span>
            )}
            {row.original.canCox && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-bg-active text-txt-primary">
                Cox
              </span>
            )}
            {!row.original.canScull && !row.original.canCox && (
              <span className="text-txt-tertiary">--</span>
            )}
          </div>
        ),
        size: 140,
      },
      {
        id: 'weight',
        header: 'Weight',
        accessorKey: 'weightKg',
        cell: ({ row }) => (
          <span className="text-txt-secondary tabular-nums">
            {formatBiometric(row.original.weightKg, 'kg')}
          </span>
        ),
        size: 90,
      },
      {
        id: 'height',
        header: 'Height',
        accessorKey: 'heightCm',
        cell: ({ row }) => (
          <span className="text-txt-secondary tabular-nums">
            {formatBiometric(row.original.heightCm, 'cm')}
          </span>
        ),
        size: 90,
      },
    ],
    []
  );

  // TanStack Table instance (shared across all views)
  const table = useReactTable({
    data: athletes,
    columns,
    state: { rowSelection, sorting },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: true,
    enableMultiRowSelection: true,
  });

  const { rows } = table.getRowModel();
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedAthletes = useMemo(() => selectedRows.map((r) => r.original), [selectedRows]);
  const selectedCount = selectedAthletes.length;

  // Bulk edit dialog
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);

  const handleBulkUpdate = useCallback(
    async (updates: BulkEditFields) => {
      // Optimistic: update each selected athlete
      const updatePromises = selectedAthletes.map((athlete) =>
        updateAthlete({ id: athlete.id, ...updates } as Partial<Athlete> & { id: string })
      );
      // Fire all updates (optimistic cache handled by useAthletes)
      await Promise.all(updatePromises.map((p) => Promise.resolve(p)));
    },
    [selectedAthletes, updateAthlete]
  );

  const handleExportCsv = useCallback(() => {
    exportAthletesToCsv(selectedAthletes);
  }, [selectedAthletes]);

  const handleAssignToLineup = useCallback(() => {
    navigate('/app/coach/lineup-builder');
  }, [navigate]);

  const handleClearSelection = useCallback(() => {
    table.resetRowSelection();
  }, [table]);

  // Compact view: virtual scroll
  const compactScrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => compactScrollRef.current,
    estimateSize: () => 48,
    overscan: 20,
  });

  // ============================================
  // Render
  // ============================================

  return (
    <div className="flex flex-col h-full relative">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center gap-4 px-6 py-4 border-b border-bdr-default">
        <FilterSummary
          filteredCount={athletes.length}
          totalCount={allAthletes.length}
          className="mr-auto"
        />

        <ViewModeSwitcher view={viewMode} onChange={handleViewChange} />

        <button
          onClick={() => navigate('/app/athletes/new')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-interactive-primary hover:bg-interactive-primary-hover rounded-lg transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Add Athlete
        </button>

        <button
          onClick={() => setIsImportOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-txt-secondary border border-bdr-default hover:bg-bg-hover rounded-lg transition-colors"
        >
          <Upload className="h-4 w-4" />
          Import CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-3 border-b border-bdr-subtle bg-bg-surface">
        <RosterFilterBar
          filters={rosterFilters}
          onChange={setRosterFilters}
          searchInputRef={searchInputRef}
          availableClassYears={availableClassYears}
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          // Skeleton loaders based on view mode
          <div className="p-6">
            {viewMode === 'grid' ? (
              <AthletesGridSkeleton cards={8} />
            ) : (
              <AthletesSkeleton rows={10} />
            )}
          </div>
        ) : allAthletes.length === 0 ? (
          // No athletes at all
          <div className="flex items-center justify-center h-full p-6">
            <AthletesEmptyState
              onAddAthlete={() => navigate('/app/athletes/new')}
              onImportCsv={() => setIsImportOpen(true)}
            />
          </div>
        ) : athletes.length === 0 ? (
          // Filters returned no results
          <div className="flex items-center justify-center h-full p-6">
            <AthletesNoResultsState
              searchQuery={rosterFilters.search || undefined}
              onClearFilters={() => setRosterFilters(DEFAULT_ROSTER_FILTERS)}
            />
          </div>
        ) : (
          // View mode content
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={SPRING_GENTLE}
              className="h-full"
            >
              {viewMode === 'table' && (
                <TableView table={table} rows={rows} onRowClick={handleAthleteClick} />
              )}
              {viewMode === 'grid' && (
                <GridView
                  rows={rows}
                  onAthleteClick={handleAthleteClick}
                  onToggleSelect={(id) => {
                    const row = table.getRow(id);
                    if (row) row.toggleSelected();
                  }}
                />
              )}
              {viewMode === 'compact' && (
                <CompactView
                  rows={rows}
                  scrollRef={compactScrollRef}
                  virtualizer={virtualizer}
                  onAthleteClick={handleAthleteClick}
                  focusedIndex={keyboard.focusedIndex}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedCount}
        onExportCsv={handleExportCsv}
        onBulkEdit={() => setIsBulkEditOpen(true)}
        onAssignToLineup={handleAssignToLineup}
        onClearSelection={handleClearSelection}
      />

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        selectedAthletes={selectedAthletes}
        onBulkUpdate={handleBulkUpdate}
      />

      {/* Athlete Profile Panel (slide-over) */}
      <AthleteProfilePanel
        athleteId={selectedAthleteId}
        isOpen={isProfilePanelOpen}
        onClose={handleCloseProfilePanel}
      />

      {/* CSV Import Wizard */}
      <CSVImportWizard isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isOpen={keyboard.isShortcutsHelpOpen}
        onClose={() => keyboard.setIsShortcutsHelpOpen(false)}
      />
    </div>
  );
}

// ============================================
// Sub-views (separated for clarity)
// ============================================

/**
 * Table View: Full table with headers, sorting, virtual rows
 */
function TableView({
  table,
  rows,
  onRowClick,
}: {
  table: ReturnType<typeof useReactTable<Athlete>>;
  rows: import('@tanstack/react-table').Row<Athlete>[];
  onRowClick: (athlete: Athlete) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 20,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0) : 0;

  return (
    <div ref={parentRef} className="h-full overflow-auto" style={{ contain: 'strict' }}>
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-bg-surface-elevated">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortDirection = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={`
                      px-4 py-3 text-left text-xs font-semibold text-txt-secondary uppercase tracking-wider
                      border-b border-bdr-default
                      ${canSort ? 'cursor-pointer select-none hover:text-txt-primary' : ''}
                    `}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    <div className="flex items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {sortDirection && (
                        <span className="text-interactive-primary">
                          {sortDirection === 'asc' ? '\u2191' : '\u2193'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {paddingTop > 0 && (
            <tr>
              <td style={{ height: paddingTop }} colSpan={table.getAllColumns().length} />
            </tr>
          )}
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index];
            if (!row) return null;
            const isSelected = row.getIsSelected();
            return (
              <tr
                key={row.id}
                style={{ height: 60 }}
                className={`
                  border-b border-bdr-subtle transition-colors cursor-pointer
                  ${isSelected ? 'bg-interactive-primary/10' : 'hover:bg-bg-hover'}
                `}
                onClick={() => onRowClick(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-3 text-sm text-txt-primary whitespace-nowrap"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
          {paddingBottom > 0 && (
            <tr>
              <td style={{ height: paddingBottom }} colSpan={table.getAllColumns().length} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Grid View: Responsive card grid using existing AthleteCard
 */
function GridView({
  rows,
  onAthleteClick,
  onToggleSelect,
}: {
  rows: Array<{ original: Athlete; id: string; getIsSelected: () => boolean }>;
  onAthleteClick: (athlete: Athlete) => void;
  onToggleSelect: (id: string) => void;
}) {
  return (
    <div className="h-full overflow-auto p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rows.map((row) => (
          <div key={row.id} className="relative">
            {/* Selection checkbox overlay */}
            <div className="absolute top-3 left-3 z-10">
              <input
                type="checkbox"
                checked={row.getIsSelected()}
                onChange={() => onToggleSelect(row.original.id)}
                className="h-4 w-4 rounded border-bdr-default text-interactive-primary focus:ring-interactive-primary/50 cursor-pointer bg-bg-surface/80 backdrop-blur-sm"
                aria-label={`Select ${row.original.firstName} ${row.original.lastName}`}
              />
            </div>
            <AthleteCard
              athlete={row.original}
              onClick={() => onAthleteClick(row.original)}
              isSelected={row.getIsSelected()}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Compact View: Dense list with virtualization at 48px row height
 */
function CompactView({
  rows,
  scrollRef,
  virtualizer,
  onAthleteClick,
  focusedIndex,
}: {
  rows: import('@tanstack/react-table').Row<Athlete>[];
  scrollRef: React.RefObject<HTMLDivElement>;
  virtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>;
  onAthleteClick: (athlete: Athlete) => void;
  focusedIndex: number;
}) {
  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div
      ref={scrollRef as React.RefObject<HTMLDivElement>}
      className="h-full overflow-auto"
      role="grid"
      aria-label="Athletes compact list"
    >
      <div style={{ height: totalSize, position: 'relative' }}>
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index];
          if (!row) return null;
          return (
            <div
              key={row.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: 48,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <AthleteCompactRow
                row={row}
                onClick={onAthleteClick}
                isKeyboardFocused={focusedIndex === virtualRow.index}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AthletesRosterPage;

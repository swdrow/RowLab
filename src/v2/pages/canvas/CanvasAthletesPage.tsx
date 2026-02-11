/**
 * CanvasAthletesPage - Athletes roster for The Canvas prototype
 *
 * Most complex Canvas page (mirrors 795-line V2 roster with Canvas design):
 * - Virtual table (TanStack Virtual for 500+ athletes, ~60px rows)
 * - Grid view (CanvasChamferPanel cards, 4-col responsive)
 * - Compact view (CanvasLogEntry-style dense rows, 48px)
 * - Slide-out editor panel (chamfer panel, full height, Framer Motion)
 * - Bulk actions (console readout at bottom, NOT floating bar)
 * - CSV import wizard (reused from V2, wrapped in CanvasModal)
 * - Keyboard shortcuts (reused from V2)
 * - ScrambleNumber for ALL numeric metrics
 *
 * Reuses ALL V2 data hooks/logic, only redesigns the display layer.
 */

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
import { UserPlus, Upload, Search, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// V2 hooks & types (reused)
import { useAthletes } from '@v2/hooks/useAthletes';
import type { Athlete, AthleteFilters, AthleteStatus } from '@v2/types/athletes';
import { useAthleteKeyboard } from '@v2/features/athletes/hooks/useAthleteKeyboard';
import { useAthleteSelection } from '@v2/features/athletes/hooks/useAthleteSelection';
import { getCountryFlag } from '@v2/utils/countryFlags';
import { SPRING_GENTLE } from '@v2/utils/animations';

// V2 components (reused as-is or wrapped)
import { AthleteAvatar } from '@v2/components/athletes/AthleteAvatar';
import {
  AthletesEmptyState,
  AthletesNoResultsState,
} from '@v2/components/athletes/AthletesEmptyState';
import { CSVImportWizard } from '@v2/features/athletes/components/import/CSVImportWizard';
import { KeyboardShortcutsHelp } from '@v2/features/athletes/components/roster/KeyboardShortcutsHelp';

// Canvas primitives
import {
  ScrambleNumber,
  RuledHeader,
  CanvasChamferPanel,
  CanvasFormField,
  CanvasButton,
  CanvasSelect,
  CanvasConsoleReadout,
  CanvasModal,
} from '@v2/components/canvas';

// ============================================
// TYPES & CONSTANTS
// ============================================

type ViewMode = 'table' | 'grid' | 'compact';

interface RosterFilters {
  search: string;
  side: 'all' | 'Port' | 'Starboard' | 'Both' | 'Cox';
  status: 'all' | AthleteStatus;
  classYear: number | null;
}

const DEFAULT_ROSTER_FILTERS: RosterFilters = {
  search: '',
  side: 'all',
  status: 'all',
  classYear: null,
};

const VIEW_MODE_KEY = 'rowlab-canvas-athletes-view';

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
// UTILITY: CSV Export
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
// MAIN COMPONENT
// ============================================

export function CanvasAthletesPage() {
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

  // Fetch athletes (V2 hook)
  const { athletes, allAthletes, isLoading } = useAthletes(athleteFilters);

  // Derive available class years from all athletes
  const availableClassYears = useMemo(() => {
    const years = new Set<number>();
    allAthletes.forEach((a) => {
      if (a.classYear) years.add(a.classYear);
    });
    return Array.from(years).sort((a, b) => a - b);
  }, [allAthletes]);

  // ─── Slide-out Editor Panel State ────────────────────────────────────
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleAthleteClick = useCallback((athlete: Athlete) => {
    setSelectedAthleteId(athlete.id);
    setIsEditorOpen(true);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setIsEditorOpen(false);
    setTimeout(() => setSelectedAthleteId(null), 300);
  }, []);

  // ─── CSV Import Wizard State ──────────────────────────────────────────
  const [isImportOpen, setIsImportOpen] = useState(false);

  // ─── URL Param Actions ────────────────────────────────────────────────
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') {
      navigate('/app/athletes/new');
      setSearchParams((prev) => {
        prev.delete('action');
        return prev;
      });
    } else if (action === 'import') {
      setIsImportOpen(true);
      setSearchParams((prev) => {
        prev.delete('action');
        return prev;
      });
    }
  }, [searchParams, navigate, setSearchParams]);

  // ─── Selection (for keyboard hook) ────────────────────────────────────
  const selection = useAthleteSelection(athletes);

  // ─── Keyboard Shortcuts ───────────────────────────────────────────────
  const keyboard = useAthleteKeyboard({
    athletes,
    searchInputRef: searchInputRef as React.RefObject<HTMLInputElement>,
    onEdit: handleAthleteClick,
    onViewProfile: handleAthleteClick,
    selection,
    isEnabled: !isEditorOpen && !isImportOpen,
  });

  // TanStack Table: Row selection state
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
            className="h-3 w-3 border border-white/[0.06] bg-transparent text-ink-primary focus:ring-1 focus:ring-ink-primary cursor-pointer"
            aria-label="Select all athletes"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
            className="h-3 w-3 border border-white/[0.06] bg-transparent text-ink-primary focus:ring-1 focus:ring-ink-primary cursor-pointer"
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
              <div className="font-medium text-ink-primary flex items-center gap-2">
                <span>
                  {row.original.firstName} {row.original.lastName}
                </span>
                {row.original.country && (
                  <span title={row.original.country}>{getCountryFlag(row.original.country)}</span>
                )}
              </div>
              {row.original.email && (
                <div className="text-xs text-ink-tertiary font-mono">{row.original.email}</div>
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
        cell: ({ row }) => (
          <span className="font-mono text-xs text-ink-secondary uppercase tracking-wider">
            {row.original.side || '--'}
          </span>
        ),
        size: 100,
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-ink-secondary uppercase tracking-wider">
            {row.original.status || 'active'}
          </span>
        ),
        size: 100,
      },
      {
        id: 'classYear',
        header: 'Year',
        accessorKey: 'classYear',
        cell: ({ row }) => (
          <span className="text-ink-secondary font-mono tabular-nums">
            <ScrambleNumber value={row.original.classYear ?? 0} />
          </span>
        ),
        size: 80,
      },
      {
        id: 'weight',
        header: 'Weight',
        accessorKey: 'weightKg',
        cell: ({ row }) => (
          <span className="text-ink-secondary font-mono tabular-nums">
            {row.original.weightKg ? (
              <>
                <ScrambleNumber value={row.original.weightKg} />
                <span className="text-ink-muted ml-0.5">kg</span>
              </>
            ) : (
              '--'
            )}
          </span>
        ),
        size: 90,
      },
      {
        id: 'height',
        header: 'Height',
        accessorKey: 'heightCm',
        cell: ({ row }) => (
          <span className="text-ink-secondary font-mono tabular-nums">
            {row.original.heightCm ? (
              <>
                <ScrambleNumber value={row.original.heightCm} />
                <span className="text-ink-muted ml-0.5">cm</span>
              </>
            ) : (
              '--'
            )}
          </span>
        ),
        size: 90,
      },
    ],
    []
  );

  // TanStack Table instance
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

  // Bulk edit state
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);

  const handleExportCsv = useCallback(() => {
    exportAthletesToCsv(selectedAthletes);
  }, [selectedAthletes]);

  const handleClearSelection = useCallback(() => {
    table.resetRowSelection();
  }, [table]);

  // Compact view virtual scroll
  const compactScrollRef = useRef<HTMLDivElement>(null);
  const compactVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => compactScrollRef.current,
    estimateSize: () => 48,
    overscan: 20,
  });

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="flex flex-col h-full relative bg-ink-deep">
      {/* ============================================ */}
      {/* HEADER — Text against void (Canvas pattern) */}
      {/* ============================================ */}
      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between pt-8 pb-6 px-4 lg:px-6 gap-4">
        <div>
          <p className="text-[10px] font-medium text-ink-muted uppercase tracking-[0.2em] mb-2">
            TEAM
          </p>
          <h1 className="text-4xl lg:text-5xl font-bold text-ink-bright tracking-tight leading-none">
            Athletes
          </h1>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <CanvasButton
            variant="primary"
            onClick={() => navigate('/app/athletes/new')}
            className="flex-1 lg:flex-none"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Athlete</span>
            <span className="sm:hidden">Add</span>
          </CanvasButton>
          <CanvasButton
            variant="ghost"
            onClick={() => setIsImportOpen(true)}
            className="flex-1 lg:flex-none"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import CSV</span>
            <span className="sm:hidden">Import</span>
          </CanvasButton>
        </div>
      </div>

      {/* ============================================ */}
      {/* SEARCH + FILTERS */}
      {/* ============================================ */}
      <div className="px-4 lg:px-6 pb-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted pointer-events-none z-10" />
          <CanvasFormField
            label="Search"
            type="text"
            placeholder="Search athletes..."
            value={rosterFilters.search}
            onChange={(e) => setRosterFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="[&>label]:sr-only"
            ref={searchInputRef}
          />
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-ink-raised p-1 canvas-chamfer">
            {(['table', 'grid', 'compact'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => handleViewChange(mode)}
                className={`
                  px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-all duration-150
                  ${
                    viewMode === mode
                      ? 'bg-ink-bright text-ink-deep'
                      : 'text-ink-secondary hover:text-ink-primary'
                  }
                `}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Side filter */}
          <CanvasSelect
            value={rosterFilters.side}
            onChange={(value) =>
              setRosterFilters((prev) => ({
                ...prev,
                side: value as RosterFilters['side'],
              }))
            }
            options={[
              { value: 'all', label: 'All Sides' },
              { value: 'Port', label: 'Port' },
              { value: 'Starboard', label: 'Starboard' },
              { value: 'Both', label: 'Both' },
              { value: 'Cox', label: 'Cox' },
            ]}
          />

          {/* Status filter */}
          <CanvasSelect
            value={rosterFilters.status}
            onChange={(value) =>
              setRosterFilters((prev) => ({
                ...prev,
                status: value as RosterFilters['status'],
              }))
            }
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'injured', label: 'Injured' },
              { value: 'graduated', label: 'Graduated' },
            ]}
          />

          {/* Class year filter */}
          <CanvasSelect
            value={rosterFilters.classYear?.toString() || ''}
            onChange={(value) =>
              setRosterFilters((prev) => ({
                ...prev,
                classYear: value ? parseInt(value, 10) : null,
              }))
            }
            options={[
              { value: '', label: 'All Years' },
              ...availableClassYears.map((year) => ({
                value: year.toString(),
                label: year.toString(),
              })),
            ]}
          />

          {/* Active filter display */}
          {(rosterFilters.side !== 'all' ||
            rosterFilters.status !== 'all' ||
            rosterFilters.classYear !== null) && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider">
                FILTERS:{' '}
                {[
                  rosterFilters.side !== 'all' && `Side=${rosterFilters.side}`,
                  rosterFilters.status !== 'all' && `Status=${rosterFilters.status}`,
                  rosterFilters.classYear && `Year=${rosterFilters.classYear}`,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </span>
              <button
                onClick={() => setRosterFilters(DEFAULT_ROSTER_FILTERS)}
                className="text-ink-muted hover:text-ink-primary transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ruled separator */}
      <div className="px-4 lg:px-6">
        <RuledHeader>
          {athletes.length} of {allAthletes.length} athletes
        </RuledHeader>
      </div>

      {/* ============================================ */}
      {/* CONTENT AREA — View-dependent */}
      {/* ============================================ */}
      <div className="flex-1 overflow-hidden px-4 lg:px-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <CanvasConsoleReadout items={[{ label: 'STATUS', value: 'LOADING ATHLETES' }]} />
          </div>
        ) : allAthletes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <AthletesEmptyState
              onAddAthlete={() => navigate('/app/athletes/new')}
              onImportCsv={() => setIsImportOpen(true)}
            />
          </div>
        ) : athletes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <AthletesNoResultsState
              searchQuery={rosterFilters.search || undefined}
              onClearFilters={() => setRosterFilters(DEFAULT_ROSTER_FILTERS)}
            />
          </div>
        ) : (
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
                <CanvasTableView table={table} rows={rows} onRowClick={handleAthleteClick} />
              )}
              {viewMode === 'grid' && (
                <CanvasGridView
                  rows={rows}
                  onAthleteClick={handleAthleteClick}
                  onToggleSelect={(id) => {
                    const row = table.getRow(id);
                    if (row) row.toggleSelected();
                  }}
                />
              )}
              {viewMode === 'compact' && (
                <CanvasCompactView
                  rows={rows}
                  scrollRef={compactScrollRef}
                  virtualizer={compactVirtualizer}
                  onAthleteClick={handleAthleteClick}
                  focusedIndex={keyboard.focusedIndex}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ============================================ */}
      {/* BULK ACTIONS — Console readout at bottom */}
      {/* ============================================ */}
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={SPRING_GENTLE}
          className="px-6 py-4 border-t border-white/[0.06] bg-ink-raised"
        >
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs font-mono text-ink-primary uppercase tracking-wider">
              <ScrambleNumber value={selectedCount} /> SELECTED
            </span>
            <span className="text-ink-muted">{'\u2502'}</span>
            <CanvasButton variant="ghost" size="sm" onClick={() => setIsBulkEditOpen(true)}>
              BULK EDIT
            </CanvasButton>
            <CanvasButton variant="ghost" size="sm" onClick={handleExportCsv}>
              EXPORT
            </CanvasButton>
            <CanvasButton variant="ghost" size="sm" onClick={handleClearSelection}>
              CLEAR
            </CanvasButton>
          </div>
        </motion.div>
      )}

      {/* ============================================ */}
      {/* CONSOLE READOUT — Status bar */}
      {/* ============================================ */}
      <CanvasConsoleReadout
        items={[
          { label: 'TOTAL', value: allAthletes.length.toString() },
          {
            label: 'ACTIVE',
            value: allAthletes.filter((a) => a.status === 'active').length.toString(),
          },
          { label: 'VIEW', value: viewMode.toUpperCase() },
        ]}
      />

      {/* ============================================ */}
      {/* SLIDE-OUT EDITOR PANEL */}
      {/* ============================================ */}
      <AnimatePresence>
        {isEditorOpen && selectedAthleteId && (
          <>
            {/* Background overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-ink-deep/60 backdrop-blur-sm z-40"
              onClick={handleCloseEditor}
            />

            {/* Slide-out panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-ink-raised canvas-chamfer border-l border-white/[0.06] z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-ink-bright">Edit Athlete</h2>
                  <button
                    onClick={handleCloseEditor}
                    className="text-ink-muted hover:text-ink-primary transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Form sections */}
                <div className="space-y-6">
                  <RuledHeader>Profile</RuledHeader>
                  <p className="text-ink-muted text-sm font-mono">
                    Full editor implementation deferred to future phase.
                  </p>
                  <p className="text-ink-secondary text-sm">
                    This panel demonstrates the Canvas slide-out pattern. The actual form fields
                    would use CanvasFormField components with proper validation.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-8">
                  <CanvasButton variant="primary">Save Changes</CanvasButton>
                  <CanvasButton variant="ghost" onClick={handleCloseEditor}>
                    Cancel
                  </CanvasButton>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* BULK EDIT MODAL */}
      {/* ============================================ */}
      <CanvasModal
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        title="Bulk Edit Athletes"
      >
        <div className="space-y-4">
          <p className="text-ink-secondary text-sm font-mono">
            Bulk edit dialog implementation deferred. Would include:
          </p>
          <ul className="list-disc list-inside text-ink-muted text-sm space-y-1">
            <li>Side preference (Port/Starboard/Both/Cox)</li>
            <li>Status (Active/Inactive/Injured/Graduated)</li>
            <li>Class year adjustment</li>
            <li>Tag assignment</li>
          </ul>
        </div>
      </CanvasModal>

      {/* ============================================ */}
      {/* CSV IMPORT WIZARD (V2 component reused) */}
      {/* ============================================ */}
      <CSVImportWizard isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />

      {/* ============================================ */}
      {/* KEYBOARD SHORTCUTS HELP */}
      {/* ============================================ */}
      <KeyboardShortcutsHelp
        isOpen={keyboard.isShortcutsHelpOpen}
        onClose={() => keyboard.setIsShortcutsHelpOpen(false)}
      />
    </div>
  );
}

// ============================================
// SUB-VIEWS
// ============================================

/**
 * Table View: Virtual table with Canvas styling
 * Uses TanStack Virtual for 500+ row performance
 */
function CanvasTableView({
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
    <div
      ref={parentRef}
      className="h-full overflow-auto canvas-table-scroll -mx-4 lg:mx-0"
      style={{ contain: 'strict' }}
    >
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-ink-raised border-b border-white/[0.06]">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header, idx) => {
                const canSort = header.column.getCanSort();
                const sortDirection = header.column.getIsSorted();
                const isFirstCol = idx === 0;
                const isNameCol = idx === 1;
                return (
                  <th
                    key={header.id}
                    style={{
                      width: header.getSize(),
                      minWidth: isNameCol ? '150px' : isFirstCol ? '40px' : '120px',
                    }}
                    className={`
                      px-4 py-3 text-left text-[10px] font-semibold text-ink-muted uppercase tracking-[0.2em]
                      whitespace-nowrap
                      ${canSort ? 'cursor-pointer select-none hover:text-ink-primary' : ''}
                      ${isNameCol ? 'canvas-table-sticky-col' : ''}
                    `}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    <div className="flex items-center gap-1.5">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {sortDirection && (
                        <span className="text-ink-primary">
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
                  border-b border-white/[0.06]/30 transition-all duration-150 cursor-pointer group
                  ${isSelected ? 'bg-ink-primary/5' : 'hover:bg-white/[0.02]'}
                `}
                onClick={() => onRowClick(row.original)}
              >
                {/* Left accent edge on hover */}
                <td className="relative" colSpan={0}>
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-ink-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                </td>
                {row.getVisibleCells().map((cell, idx) => {
                  const isNameCol = idx === 0;
                  return (
                    <td
                      key={cell.id}
                      className={`px-4 py-3 text-sm text-ink-primary whitespace-nowrap ${isNameCol ? 'canvas-table-sticky-col' : ''}`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
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
 * Grid View: CanvasChamferPanel cards in responsive grid
 */
function CanvasGridView({
  rows,
  onAthleteClick,
  onToggleSelect,
}: {
  rows: Array<{ original: Athlete; id: string; getIsSelected: () => boolean }>;
  onAthleteClick: (athlete: Athlete) => void;
  onToggleSelect: (id: string) => void;
}) {
  return (
    <div className="h-full overflow-auto py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rows.map((row, i) => {
          const athlete = row.original;
          const isSelected = row.getIsSelected();
          return (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02, duration: 0.3 }}
            >
              <div className="cursor-pointer group" onClick={() => onAthleteClick(athlete)}>
                <CanvasChamferPanel
                  accentColor={isSelected ? 'var(--ink-primary)' : undefined}
                  className="relative"
                >
                  {/* Selection checkbox */}
                  <div className="absolute top-3 right-3 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(athlete.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-3 w-3 border border-white/[0.06] bg-transparent text-ink-primary focus:ring-1 focus:ring-ink-primary cursor-pointer"
                      aria-label={`Select ${athlete.firstName} ${athlete.lastName}`}
                    />
                  </div>

                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <AthleteAvatar
                      firstName={athlete.firstName}
                      lastName={athlete.lastName}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink-primary truncate">
                        {athlete.firstName} {athlete.lastName}
                      </p>
                      <p className="text-xs font-mono text-ink-muted uppercase tracking-wider">
                        {athlete.side || '--'}
                      </p>
                    </div>
                  </div>

                  {/* Key stats */}
                  <div className="grid grid-cols-2 gap-3">
                    {athlete.classYear && (
                      <div>
                        <p className="text-[10px] font-mono text-ink-muted uppercase tracking-wider mb-1">
                          Year
                        </p>
                        <p className="text-lg font-bold text-ink-primary tabular-nums">
                          <ScrambleNumber value={athlete.classYear} />
                        </p>
                      </div>
                    )}
                    {athlete.weightKg && (
                      <div>
                        <p className="text-[10px] font-mono text-ink-muted uppercase tracking-wider mb-1">
                          Weight
                        </p>
                        <p className="text-lg font-bold text-ink-primary tabular-nums">
                          <ScrambleNumber value={athlete.weightKg} />
                          <span className="text-xs text-ink-muted ml-1">kg</span>
                        </p>
                      </div>
                    )}
                    {athlete.heightCm && (
                      <div>
                        <p className="text-[10px] font-mono text-ink-muted uppercase tracking-wider mb-1">
                          Height
                        </p>
                        <p className="text-lg font-bold text-ink-primary tabular-nums">
                          <ScrambleNumber value={athlete.heightCm} />
                          <span className="text-xs text-ink-muted ml-1">cm</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Status indicator at bottom */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06]/30">
                    <span className="text-[10px] font-mono text-ink-secondary uppercase tracking-wider">
                      {athlete.status || 'active'}
                    </span>
                  </div>
                </CanvasChamferPanel>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compact View: CanvasLogEntry-style dense rows (48px)
 */
function CanvasCompactView({
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
          const athlete = row.original;
          const isSelected = row.getIsSelected();
          const isFocused = focusedIndex === virtualRow.index;

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
              className={`
                flex items-center gap-4 px-4 border-b border-white/[0.06]/30
                transition-all duration-150 cursor-pointer group
                ${isSelected ? 'bg-ink-primary/5' : 'hover:bg-white/[0.02]'}
                ${isFocused ? 'ring-1 ring-ink-primary ring-inset' : ''}
              `}
              onClick={() => onAthleteClick(athlete)}
            >
              {/* Left accent bar */}
              <div
                className={`
                  w-1 h-6 transition-opacity duration-150
                  ${isSelected ? 'bg-ink-primary opacity-100' : 'bg-ink-muted opacity-0 group-hover:opacity-100'}
                `}
              />

              {/* Selection checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={row.getToggleSelectedHandler()}
                onClick={(e) => e.stopPropagation()}
                className="h-3 w-3 border border-white/[0.06] bg-transparent text-ink-primary focus:ring-1 focus:ring-ink-primary cursor-pointer flex-shrink-0"
                aria-label={`Select ${athlete.firstName} ${athlete.lastName}`}
              />

              {/* Avatar */}
              <AthleteAvatar
                firstName={athlete.firstName}
                lastName={athlete.lastName}
                size="sm"
                className="!w-6 !h-6 !text-[10px] flex-shrink-0"
              />

              {/* Name */}
              <span className="font-medium text-sm text-ink-primary truncate min-w-[140px] max-w-[200px]">
                {athlete.firstName} {athlete.lastName}
              </span>

              {/* Side */}
              <span className="font-mono text-xs text-ink-secondary uppercase tracking-wider flex-shrink-0 w-12">
                {athlete.side || '--'}
              </span>

              {/* Key metric (class year or weight) */}
              <span className="font-mono text-xs text-ink-muted tabular-nums flex-shrink-0 w-16 text-right">
                {athlete.classYear ? (
                  <>
                    <ScrambleNumber value={athlete.classYear} />
                  </>
                ) : athlete.weightKg ? (
                  <>
                    <ScrambleNumber value={athlete.weightKg} />
                    <span className="text-ink-tertiary ml-0.5">kg</span>
                  </>
                ) : (
                  '--'
                )}
              </span>

              {/* Status */}
              <span className="font-mono text-[10px] text-ink-tertiary uppercase tracking-wider flex-shrink-0 hidden lg:block">
                {athlete.status || 'active'}
              </span>

              {/* Spacer */}
              <div className="flex-1" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CanvasAthletesPage;

import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { VirtualTable } from '@v2/components/common/VirtualTable';
import { Pencil, Trash2, Trophy } from 'lucide-react';
import { ErgTableSkeleton, ErgMobileListSkeleton } from '@v2/features/erg/components/ErgSkeleton';
import type { ErgTest } from '@v2/types/ergTests';
import { MACHINE_TYPE_LABELS } from '@v2/types/ergTests';

export interface ErgTestsTableProps {
  tests: ErgTest[];
  isLoading: boolean;
  onEdit: (test: ErgTest) => void;
  onDelete: (testId: string) => void;
  onRowClick?: (test: ErgTest) => void;
  /** Index of the keyboard-selected row for visual highlight (-1 = none) */
  selectedIndex?: number;
  /** Set of test IDs that are personal records - shows trophy icon */
  prTestIds?: Set<string>;
}

/**
 * Format seconds to MM:SS.s format
 */
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${minutes}:${secs.padStart(4, '0')}`;
}

/**
 * Format date to locale string
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Test type badge with color coding
 */
function TestTypeBadge({ type }: { type: string }) {
  const colors = {
    '2k': 'bg-data-poor/10 text-data-poor border border-data-poor/30',
    '6k': 'bg-data-good/10 text-data-good border border-data-good/30',
    '30min': 'bg-data-excellent/10 text-data-excellent border border-data-excellent/30',
    '500m': 'bg-data-warning/10 text-data-warning border border-data-warning/30',
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[type as keyof typeof colors] || 'bg-bg-subtle text-txt-secondary'}`}
    >
      {type}
    </span>
  );
}

/**
 * Concept2 badge for synced workouts
 */
function C2Badge() {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#1a1a2e]/80 text-[#00b4d8] border border-[#00b4d8]/30"
      title="Synced from Concept2 Logbook"
    >
      C2
    </span>
  );
}

/**
 * Machine type badge (BikeErg/SkiErg only, RowErg is default and not shown)
 */
function MachineTypeBadge({ machineType }: { machineType: 'bikerg' | 'skierg' }) {
  const config = {
    bikerg: {
      label: MACHINE_TYPE_LABELS.bikerg,
      className: 'bg-data-warning/10 text-data-warning border border-data-warning/30',
    },
    skierg: {
      label: MACHINE_TYPE_LABELS.skierg,
      className: 'bg-data-good/10 text-data-good border border-data-good/30',
    },
  };

  const { label, className } = config[machineType];

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${className}`}
    >
      {label}
    </span>
  );
}

/**
 * Mobile card view for erg tests
 */
function ErgTestCard({
  test,
  onEdit,
  onDelete,
  onClick,
}: {
  test: ErgTest;
  onEdit: (test: ErgTest) => void;
  onDelete: (testId: string) => void;
  onClick?: (test: ErgTest) => void;
}) {
  return (
    <div
      onClick={() => onClick?.(test)}
      className="p-4 bg-bg-surface border border-ink-border rounded-xl hover:border-accent-copper/30 hover:bg-accent-copper/[0.02] transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-medium text-txt-primary">
            {test.athlete?.firstName} {test.athlete?.lastName}
          </h3>
          <p className="text-sm text-txt-tertiary">{formatDate(test.testDate)}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <TestTypeBadge type={test.testType} />
          {test.source === 'concept2' && <C2Badge />}
          {test.machineType && test.machineType !== 'rower' && (
            <MachineTypeBadge machineType={test.machineType as 'bikerg' | 'skierg'} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <span className="text-txt-tertiary">Time:</span>{' '}
          <span className="text-txt-primary font-medium">{formatTime(test.timeSeconds)}</span>
        </div>
        {test.splitSeconds && (
          <div>
            <span className="text-txt-tertiary">Split:</span>{' '}
            <span className="text-txt-primary font-medium">{formatTime(test.splitSeconds)}</span>
          </div>
        )}
        {test.watts && (
          <div>
            <span className="text-txt-tertiary">Watts:</span>{' '}
            <span className="text-txt-primary font-medium">{test.watts}W</span>
          </div>
        )}
        {test.strokeRate && (
          <div>
            <span className="text-txt-tertiary">SR:</span>{' '}
            <span className="text-txt-primary font-medium">{test.strokeRate}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(test);
          }}
          className="flex-1 px-3 py-1.5 text-sm bg-interactive-primary text-white rounded-md hover:bg-interactive-primary-hover transition-colors"
        >
          <Pencil size={14} className="inline mr-1" />
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(test.id);
          }}
          className="flex-1 px-3 py-1.5 text-sm bg-status-error/10 text-status-error rounded-md hover:bg-status-error/20 transition-colors"
        >
          <Trash2 size={14} className="inline mr-1" />
          Delete
        </button>
      </div>
    </div>
  );
}

/**
 * Virtualized table for erg tests
 */
export function ErgTestsTable({
  tests,
  isLoading,
  onEdit,
  onDelete,
  onRowClick,
  selectedIndex = -1,
  prTestIds,
}: ErgTestsTableProps) {
  const columns = useMemo<ColumnDef<ErgTest, any>[]>(
    () => [
      {
        id: 'athlete',
        header: 'Athlete',
        accessorFn: (row) =>
          row.athlete ? `${row.athlete.firstName} ${row.athlete.lastName}` : 'Unknown',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 font-medium text-txt-primary">
            <span>
              {row.original.athlete?.firstName} {row.original.athlete?.lastName}
            </span>
            {prTestIds?.has(row.original.id) && (
              <span title="Personal Record">
                <Trophy size={14} className="text-accent-gold" />
              </span>
            )}
          </div>
        ),
        size: 180,
      },
      {
        id: 'testType',
        header: 'Type',
        accessorKey: 'testType',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 flex-wrap">
            <TestTypeBadge type={row.original.testType} />
            {row.original.source === 'concept2' && <C2Badge />}
            {row.original.machineType && row.original.machineType !== 'rower' && (
              <MachineTypeBadge machineType={row.original.machineType as 'bikerg' | 'skierg'} />
            )}
          </div>
        ),
        size: 160,
      },
      {
        id: 'testDate',
        header: 'Date',
        accessorKey: 'testDate',
        cell: ({ row }) => (
          <span className="text-txt-secondary">{formatDate(row.original.testDate)}</span>
        ),
        size: 120,
      },
      {
        id: 'time',
        header: 'Time',
        accessorKey: 'timeSeconds',
        cell: ({ row }) => (
          <span className="font-mono text-txt-primary font-medium">
            {formatTime(row.original.timeSeconds)}
          </span>
        ),
        size: 100,
      },
      {
        id: 'split',
        header: 'Split/500m',
        accessorKey: 'splitSeconds',
        cell: ({ row }) =>
          row.original.splitSeconds ? (
            <span className="font-mono text-txt-secondary">
              {formatTime(row.original.splitSeconds)}
            </span>
          ) : (
            <span className="text-txt-tertiary">—</span>
          ),
        size: 100,
      },
      {
        id: 'watts',
        header: 'Watts',
        accessorKey: 'watts',
        cell: ({ row }) =>
          row.original.watts ? (
            <span className="text-txt-primary">{row.original.watts}W</span>
          ) : (
            <span className="text-txt-tertiary">—</span>
          ),
        size: 80,
      },
      {
        id: 'strokeRate',
        header: 'SR',
        accessorKey: 'strokeRate',
        cell: ({ row }) =>
          row.original.strokeRate ? (
            <span className="text-txt-secondary">{row.original.strokeRate}</span>
          ) : (
            <span className="text-txt-tertiary">—</span>
          ),
        size: 60,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row.original);
              }}
              className="p-1.5 rounded-md hover:bg-bg-active transition-colors"
              title="Edit test"
            >
              <Pencil size={16} className="text-txt-secondary hover:text-txt-primary" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row.original.id);
              }}
              className="p-1.5 rounded-md hover:bg-status-error/10 transition-colors"
              title="Delete test"
            >
              <Trash2 size={16} className="text-status-error hover:text-status-error" />
            </button>
          </div>
        ),
        size: 100,
        enableSorting: false,
      },
    ],
    [onEdit, onDelete, prTestIds]
  );

  // Mobile view detection
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (isLoading) {
    return isMobile ? <ErgMobileListSkeleton /> : <ErgTableSkeleton />;
  }

  if (tests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-txt-secondary">
        <p className="text-lg mb-2">No erg tests yet</p>
        <p className="text-sm text-txt-tertiary">Add your first test to get started</p>
      </div>
    );
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div className="p-4 space-y-3">
        {tests.map((test) => (
          <ErgTestCard
            key={test.id}
            test={test}
            onEdit={onEdit}
            onDelete={onDelete}
            onClick={onRowClick}
          />
        ))}
      </div>
    );
  }

  // Derive selectedId from selectedIndex for keyboard highlight
  const selectedId =
    selectedIndex >= 0 && selectedIndex < tests.length ? tests[selectedIndex]?.id : undefined;

  // Desktop table view
  return (
    <VirtualTable
      data={tests}
      columns={columns}
      rowHeight={56}
      overscan={20}
      onRowClick={onRowClick}
      selectedId={selectedId}
      emptyMessage="No erg tests found"
      className="h-full"
    />
  );
}

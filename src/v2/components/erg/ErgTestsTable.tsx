import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { VirtualTable } from '@v2/components/common/VirtualTable';
import { Pencil, Trash2 } from 'lucide-react';
import type { ErgTest } from '@v2/types/ergTests';

export interface ErgTestsTableProps {
  tests: ErgTest[];
  isLoading: boolean;
  onEdit: (test: ErgTest) => void;
  onDelete: (testId: string) => void;
  onRowClick?: (test: ErgTest) => void;
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
    '2k': 'bg-red-500/10 text-red-600 dark:text-red-400',
    '6k': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    '30min': 'bg-green-500/10 text-green-600 dark:text-green-400',
    '500m': 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[type as keyof typeof colors] || 'bg-gray-500/10 text-gray-600'}`}>
      {type}
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
      className="p-4 bg-bg-surface border border-bdr-default rounded-lg hover:border-interactive-primary transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-medium text-txt-primary">
            {test.athlete?.firstName} {test.athlete?.lastName}
          </h3>
          <p className="text-sm text-txt-tertiary">{formatDate(test.testDate)}</p>
        </div>
        <TestTypeBadge type={test.testType} />
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
          className="flex-1 px-3 py-1.5 text-sm bg-red-500/10 text-red-600 rounded-md hover:bg-red-500/20 transition-colors"
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
}: ErgTestsTableProps) {
  const columns = useMemo<ColumnDef<ErgTest, any>[]>(
    () => [
      {
        id: 'athlete',
        header: 'Athlete',
        accessorFn: (row) => row.athlete ? `${row.athlete.firstName} ${row.athlete.lastName}` : 'Unknown',
        cell: ({ row }) => (
          <div className="font-medium text-txt-primary">
            {row.original.athlete?.firstName} {row.original.athlete?.lastName}
          </div>
        ),
        size: 180,
      },
      {
        id: 'testType',
        header: 'Type',
        accessorKey: 'testType',
        cell: ({ row }) => <TestTypeBadge type={row.original.testType} />,
        size: 100,
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
              className="p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
              title="Delete test"
            >
              <Trash2 size={16} className="text-red-600 hover:text-red-700" />
            </button>
          </div>
        ),
        size: 100,
        enableSorting: false,
      },
    ],
    [onEdit, onDelete]
  );

  // Mobile view detection
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-interactive-primary" />
      </div>
    );
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

  // Desktop table view
  return (
    <VirtualTable
      data={tests}
      columns={columns}
      rowHeight={56}
      overscan={20}
      onRowClick={onRowClick}
      emptyMessage="No erg tests found"
      className="h-full"
    />
  );
}

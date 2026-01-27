import React from 'react';

/**
 * Table - Data-dense but readable table component
 *
 * Features:
 * - Warm palette with stone borders
 * - Compact row spacing for data density
 * - Monospace tabular-nums for numeric data
 * - Hover states for rows
 * - Status cell with color-coded indicators
 * - DataCell for right-aligned numeric values
 *
 * Design Philosophy: "Precision Instrument" (like SpeedCoach display)
 * - Numbers are the hero
 * - Dense but readable
 * - Rowing-specific semantic colors
 */

// Class merging utility
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  compact?: boolean;
}

export const Table: React.FC<TableProps> = ({ compact = false, className, ...props }) => (
  <div className="w-full overflow-x-auto rounded-lg border border-[var(--color-border-subtle)]">
    <table
      className={cn(
        'w-full border-collapse',
        compact ? 'text-sm' : 'text-base',
        className
      )}
      {...props}
    />
  </div>
);

Table.displayName = 'Table';

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...props
}) => (
  <thead
    className={cn(
      'bg-[var(--color-bg-surface)]',
      className
    )}
    {...props}
  />
);

TableHeader.displayName = 'TableHeader';

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...props
}) => (
  <tbody className={cn('divide-y divide-[var(--color-border-subtle)]', className)} {...props} />
);

TableBody.displayName = 'TableBody';

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  hoverable?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({
  hoverable = true,
  className,
  ...props
}) => (
  <tr
    className={cn(
      'transition-colors duration-100',
      hoverable && 'hover:bg-[var(--color-bg-hover)]',
      className
    )}
    {...props}
  />
);

TableRow.displayName = 'TableRow';

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  ...props
}) => (
  <th
    className={cn(
      'px-4 py-3 text-left',
      'text-xs font-semibold uppercase tracking-wider',
      'text-[var(--color-text-secondary)]',
      'border-b border-[var(--color-border-default)]',
      className
    )}
    {...props}
  />
);

TableHead.displayName = 'TableHead';

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  mono?: boolean;
}

export const TableCell: React.FC<TableCellProps> = ({
  mono = false,
  className,
  ...props
}) => (
  <td
    className={cn(
      'px-4 py-3',
      'text-[var(--color-text-primary)]',
      mono && 'font-mono tabular-nums',
      className
    )}
    {...props}
  />
);

TableCell.displayName = 'TableCell';

/**
 * DataCell - Special cell for numeric/metric data
 *
 * Uses monospace font and right alignment for number columns.
 * Perfect for times, distances, ratings, and other metrics.
 */
export const DataCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  ...props
}) => (
  <td
    className={cn(
      'px-4 py-3 text-right',
      'font-mono tabular-nums',
      'text-[var(--color-text-primary)]',
      className
    )}
    {...props}
  />
);

DataCell.displayName = 'DataCell';

/**
 * StatusCell - Cell with colored status indicator
 *
 * Status colors:
 * - success: Green (starboard, positive)
 * - warning: Amber (caution)
 * - error: Red (port, attention needed)
 * - info: Blue (water/erg related)
 * - neutral: Gray (default state)
 */
export interface StatusCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

const statusColors: Record<StatusCellProps['status'], string> = {
  success: 'text-[var(--color-status-success)]',
  warning: 'text-[var(--color-status-warning)]',
  error: 'text-[var(--color-status-error)]',
  info: 'text-[var(--color-status-info)]',
  neutral: 'text-[var(--color-text-secondary)]',
};

export const StatusCell: React.FC<StatusCellProps> = ({ status, className, ...props }) => (
  <td className={cn('px-4 py-3 font-medium', statusColors[status], className)} {...props} />
);

StatusCell.displayName = 'StatusCell';

/**
 * SortableHead - Sortable column header with visual indicator
 *
 * Used for columns that can be sorted. Shows direction arrow when active.
 */
export interface SortableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

export const SortableHead: React.FC<SortableHeadProps> = ({
  sortDirection,
  onSort,
  className,
  children,
  ...props
}) => (
  <th
    className={cn(
      'px-4 py-3 text-left',
      'text-xs font-semibold uppercase tracking-wider',
      'text-[var(--color-text-secondary)]',
      'border-b border-[var(--color-border-default)]',
      onSort && 'cursor-pointer select-none hover:text-[var(--color-text-primary)]',
      'transition-colors duration-100',
      className
    )}
    onClick={onSort}
    {...props}
  >
    <span className="inline-flex items-center gap-1">
      {children}
      {sortDirection && (
        <svg
          className={cn(
            'w-3.5 h-3.5 transition-transform',
            sortDirection === 'desc' && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      )}
    </span>
  </th>
);

SortableHead.displayName = 'SortableHead';

/**
 * EmptyRow - Placeholder row for empty tables
 *
 * Spans all columns and shows a message when no data is available.
 */
export interface EmptyRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  colSpan: number;
  message?: string;
}

export const EmptyRow: React.FC<EmptyRowProps> = ({
  colSpan,
  message = 'No data available',
  className,
  ...props
}) => (
  <tr className={className} {...props}>
    <td
      colSpan={colSpan}
      className="px-4 py-8 text-center text-[var(--color-text-tertiary)]"
    >
      {message}
    </td>
  </tr>
);

EmptyRow.displayName = 'EmptyRow';

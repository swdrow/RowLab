import React from 'react';

/**
 * DataTable - Editorial newspaper-style data table
 *
 * Features:
 * - Headers: uppercase, tracking-wider, text-xs, ink-secondary
 * - Numeric columns: right-aligned, font-mono, tabular-nums
 * - Row dividers: subtle ink-border (not zebra striping)
 * - Row hover: ink-raised background
 * - No colored row backgrounds (monochrome only)
 *
 * The table should feel like a newspaper data table -
 * clean, aligned, readable. Color exists only in data
 * rendered within cells (Metric, StatusBadge, etc.).
 */

// Class merging utility
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export interface Column<T> {
  key: keyof T | string;
  header: string;
  /** Mark as numeric for right-align and monospace */
  numeric?: boolean;
  /** Custom render function */
  render?: (value: any, row: T) => React.ReactNode;
  /** Column width class */
  width?: string;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  /** Custom row key extractor */
  getRowKey?: (row: T, index: number) => string | number;
  className?: string;
  /** Empty state message */
  emptyMessage?: string;
}

/**
 * Header cell - editorial uppercase style
 */
const headerCellStyles = `
  text-xs uppercase tracking-wider text-ink-secondary font-medium
  py-3 px-4 text-left
  border-b border-ink-border
`;

/**
 * Header cell for numeric columns - right aligned
 */
const headerCellNumericStyles = `
  text-xs uppercase tracking-wider text-ink-secondary font-medium
  py-3 px-4 text-right
  border-b border-ink-border
`;

/**
 * Body cell - standard styling
 */
const bodyCellStyles = `
  py-3 px-4
  text-ink-primary
  border-b border-ink-border/50
`;

/**
 * Body cell for numeric columns - monospace, right aligned
 */
const bodyCellNumericStyles = `
  py-3 px-4
  text-ink-primary font-mono tabular-nums text-right
  border-b border-ink-border/50
`;

/**
 * Row hover effect - subtle raised background
 */
const rowStyles = `
  hover:bg-ink-raised/50 transition-colors duration-150
`;

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  getRowKey,
  className,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const keyExtractor = getRowKey || ((_, index) => index);

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={cn(
                  column.numeric ? headerCellNumericStyles : headerCellStyles,
                  column.width,
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 px-4 text-center text-ink-secondary"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={keyExtractor(row, rowIndex)} className={rowStyles}>
                {columns.map((column) => {
                  const value = row[column.key as keyof T];
                  return (
                    <td
                      key={String(column.key)}
                      className={cn(
                        column.numeric ? bodyCellNumericStyles : bodyCellStyles,
                        column.width,
                        column.className
                      )}
                    >
                      {column.render ? column.render(value, row) : value}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

DataTable.displayName = 'DataTable';

export default DataTable;

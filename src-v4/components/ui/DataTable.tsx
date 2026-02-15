/**
 * Generic typed data table with glass headers and hover rows.
 * Supports click-to-expand rows, compact mode, and empty state.
 */

import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
  render: (item: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  emptyMessage?: string;
  className?: string;
  compact?: boolean;
  onRowClick?: (item: T, index: number) => void;
}

const alignClasses = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const;

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data',
  className = '',
  compact = false,
  onRowClick,
}: DataTableProps<T>) {
  const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div className={`overflow-x-auto rounded-xl border border-ink-border/50 ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="bg-ink-well/40">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`
                  ${cellPadding}
                  text-xs font-medium uppercase tracking-wider text-ink-muted
                  ${alignClasses[col.align ?? 'left']}
                `.trim()}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-border/30">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className={`${cellPadding} text-center text-sm text-ink-muted py-8`}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={keyExtractor(item, index)}
                onClick={onRowClick ? () => onRowClick(item, index) : undefined}
                className={
                  onRowClick
                    ? 'hover:bg-ink-hover/50 cursor-pointer transition-colors duration-100'
                    : 'hover:bg-ink-well/20 transition-colors duration-100'
                }
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`${cellPadding} text-sm text-ink-body ${alignClasses[col.align ?? 'left']}`}
                  >
                    {col.render(item, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

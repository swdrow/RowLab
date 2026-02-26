/**
 * Data table — oarbit design system.
 *
 * Compact rows (36-40px), right-aligned numeric support.
 * Header: bg-void-deep, text-caption, medium weight, uppercase, tracking 0.04em.
 * Alternating rows: even void-surface, odd void-raised at 50% opacity.
 * Horizontal borders: border-subtle between rows.
 * Hover row: void-overlay background.
 * Numeric columns: right-aligned with tabular-nums.
 * Sticky header support.
 */

import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
  /** If true, applies mono font + tabular-nums */
  numeric?: boolean;
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
  stickyHeader?: boolean;
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
  stickyHeader = false,
}: DataTableProps<T>) {
  const cellPadding = compact ? 'px-3 py-1.5' : 'px-3 py-2';

  return (
    <div
      className={`overflow-x-auto rounded-[var(--radius-lg)] border border-edge-default ${className}`}
    >
      <table className="w-full">
        <thead>
          <tr className={`bg-void-deep ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`
                  ${cellPadding}
                  text-xs font-medium uppercase tracking-[0.04em] text-text-faint
                  ${alignClasses[col.align ?? 'left']}
                `.trim()}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className={`${cellPadding} text-center text-sm text-text-faint py-8`}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={keyExtractor(item, index)}
                onClick={onRowClick ? () => onRowClick(item, index) : undefined}
                className={`
                  border-t border-edge-default
                  ${index % 2 === 0 ? 'bg-void-surface' : 'bg-void-raised/50'}
                  ${onRowClick ? 'hover:bg-void-overlay cursor-pointer' : 'hover:bg-void-raised'}
                  transition-colors duration-100
                `.trim()}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`
                      ${cellPadding} text-sm text-text-default
                      ${alignClasses[col.align ?? 'left']}
                      ${col.numeric ? 'font-mono tabular-nums tracking-[-0.02em]' : ''}
                    `.trim()}
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

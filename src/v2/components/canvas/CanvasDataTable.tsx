/**
 * CanvasDataTable - TanStack Table wrapper with Canvas chamfer styling
 *
 * Wraps TanStack Table with Canvas design language:
 * - Ruled header style with sort indicators
 * - Monochrome chrome with breathing accent edges on hover
 * - Breathing skeleton loading (no shimmer)
 * - Console-style empty state
 *
 * Design: Canvas data table primitive
 */

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';

export interface CanvasDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  accentColor?: string;
  onRowClick?: (row: T) => void;
  sortable?: boolean;
  className?: string;
  /** Enable virtualization for large datasets */
  virtualized?: boolean;
  /** Row height for virtualization (default: 48px) */
  rowHeight?: number;
  /** Max container height when virtualized (default: max-h-[60vh] on desktop, max-h-[50vh] on mobile) */
  maxHeight?: string;
}

export function CanvasDataTable<T>({
  data,
  columns,
  isLoading = false,
  emptyMessage = '[NO DATA]',
  accentColor = 'var(--data-excellent)',
  onRowClick,
  sortable = true,
  className = '',
  virtualized = false,
  rowHeight = 48,
  maxHeight,
}: CanvasDataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSorting: sortable,
  });

  const rows = table.getRowModel().rows;

  // Virtualization setup (only if enabled)
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
    enabled: virtualized,
  });

  const virtualRows = virtualized ? virtualizer.getVirtualItems() : null;
  const totalSize = virtualized ? virtualizer.getTotalSize() : 0;

  // Loading state: 5 skeleton rows
  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="canvas-table-scroll">
          <table className="w-full">
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th
                    key={i}
                    className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted border-b border-white/[0.06]"
                  >
                    {typeof col.header === 'string' ? col.header : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/[0.04] relative">
                  {/* Left accent edge breathing */}
                  <td className="absolute left-0 top-0 bottom-0 w-px">
                    <div
                      className="h-full canvas-accent-breathe"
                      style={{
                        backgroundColor: accentColor,
                        animationDelay: `${i * 0.3}s`,
                      }}
                    />
                  </td>
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-white/[0.04] w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty state: console-style readout
  if (!data || data.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="canvas-table-scroll">
          <table className="w-full">
            <thead>
              <tr>
                {table.getHeaderGroups().map((headerGroup) =>
                  headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted border-b border-white/[0.06]"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))
                )}
              </tr>
            </thead>
          </table>
        </div>
        <div className="py-12 text-center">
          <span className="font-mono text-xs text-ink-muted tracking-wider">{emptyMessage}</span>
        </div>
      </div>
    );
  }

  // Determine container height class — virtualized tables need an explicit height
  // for the scroll container so the virtualizer can calculate visible rows
  const containerHeightClass = maxHeight || (virtualized ? 'h-[50vh] lg:h-[60vh]' : '');

  return (
    <div className={`w-full ${className}`}>
      <div
        ref={tableContainerRef}
        className={`canvas-table-scroll ${containerHeightClass} ${virtualized ? 'overflow-auto' : ''}`}
        style={virtualized ? { contain: 'content' } : undefined}
      >
        <table className="w-full">
          <thead className={virtualized ? 'sticky top-0 z-10 bg-ink-raised' : ''}>
            <tr>
              {table.getHeaderGroups().map((headerGroup) =>
                headerGroup.headers.map((header, colIndex) => {
                  const canSort = header.column.getCanSort();
                  const sortDir = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      className={`text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted border-b border-white/[0.06] ${
                        colIndex === 0 ? 'canvas-table-sticky-col' : ''
                      } ${canSort ? 'cursor-pointer select-none hover:text-ink-secondary' : ''}`}
                    >
                      <div className="flex items-center gap-1.5">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sortDir && (
                          <span className="text-ink-secondary">
                            {sortDir === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })
              )}
            </tr>
          </thead>
          <tbody>
            {virtualized && virtualRows ? (
              <>
                {/* Virtualized rendering */}
                {virtualRows[0]?.start > 0 && (
                  <tr>
                    <td style={{ height: virtualRows[0].start }} colSpan={columns.length} />
                  </tr>
                )}
                {virtualRows.map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  if (!row) return null;

                  return (
                    <tr
                      key={row.id}
                      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                      className={`border-b border-white/[0.04] relative group ${
                        onRowClick ? 'cursor-pointer' : ''
                      } hover:bg-white/[0.02] transition-colors`}
                      style={{ height: rowHeight }}
                    >
                      {/* Left accent edge on hover */}
                      <td className="absolute left-0 top-0 bottom-0 w-px">
                        <div
                          className="h-full opacity-0 group-hover:opacity-100 transition-opacity canvas-accent-breathe"
                          style={{
                            backgroundColor: accentColor,
                          }}
                        />
                      </td>

                      {row.getVisibleCells().map((cell, colIndex) => {
                        const isNumeric = typeof cell.getValue() === 'number';
                        return (
                          <td
                            key={cell.id}
                            className={`px-4 py-3 text-ink-primary ${
                              colIndex === 0 ? 'canvas-table-sticky-col' : ''
                            } ${isNumeric ? 'font-mono tabular-nums' : ''}`}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {virtualRows.length > 0 && virtualRows[virtualRows.length - 1]?.end < totalSize && (
                  <tr>
                    <td
                      style={{
                        height: totalSize - (virtualRows[virtualRows.length - 1]?.end || 0),
                      }}
                      colSpan={columns.length}
                    />
                  </tr>
                )}
              </>
            ) : (
              /* Non-virtualized rendering with motion */
              rows.map((row, i) => (
                <motion.tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={`border-b border-white/[0.04] relative group ${
                    onRowClick ? 'cursor-pointer' : ''
                  } hover:bg-white/[0.02] transition-colors`}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: i * 0.03,
                    duration: 0.3,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {/* Left accent edge on hover */}
                  <td className="absolute left-0 top-0 bottom-0 w-px">
                    <div
                      className="h-full opacity-0 group-hover:opacity-100 transition-opacity canvas-accent-breathe"
                      style={{
                        backgroundColor: accentColor,
                      }}
                    />
                  </td>

                  {row.getVisibleCells().map((cell, colIndex) => {
                    const isNumeric = typeof cell.getValue() === 'number';
                    return (
                      <td
                        key={cell.id}
                        className={`px-4 py-3 text-ink-primary ${
                          colIndex === 0 ? 'canvas-table-sticky-col' : ''
                        } ${isNumeric ? 'font-mono tabular-nums' : ''}`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

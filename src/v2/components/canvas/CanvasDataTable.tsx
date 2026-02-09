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
import { useState } from 'react';
import { motion } from 'framer-motion';

export interface CanvasDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  accentColor?: string;
  onRowClick?: (row: T) => void;
  sortable?: boolean;
  className?: string;
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
}: CanvasDataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

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

  return (
    <div className={`w-full ${className}`}>
      <div className="canvas-table-scroll">
        <table className="w-full">
          <thead>
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
            {table.getRowModel().rows.map((row, i) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useRef, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type Row,
} from '@tanstack/react-table';

export interface VirtualTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  rowHeight?: number;
  overscan?: number;
  onRowClick?: (row: TData) => void;
  selectedId?: string;
  getRowId?: (row: TData) => string;
  className?: string;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function VirtualTable<TData>({
  data,
  columns,
  rowHeight = 50,
  overscan = 20,
  onRowClick,
  selectedId,
  getRowId = (row: any) => row.id,
  className = '',
  emptyMessage = 'No data available',
  isLoading = false,
}: VirtualTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const parentRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId,
  });

  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => rowHeight, [rowHeight]),
    overscan,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  // Padding to maintain scroll height
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0) : 0;

  const handleRowClick = useCallback(
    (row: Row<TData>) => {
      if (onRowClick) {
        onRowClick(row.original);
      }
    },
    [onRowClick]
  );

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-interactive-primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-txt-secondary ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto h-full ${className}`}
      style={{ contain: 'strict' }}
    >
      <table className="w-full border-collapse">
        {/* Fixed Header */}
        <thead className="sticky top-0 z-10 bg-bg-surface-elevated border-b border-ink-border">
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
                      px-4 py-3 text-left text-[10px] font-semibold text-ink-secondary uppercase tracking-[0.15em]
                      ${canSort ? 'cursor-pointer select-none hover:text-accent-copper' : ''}
                    `}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    <div className="flex items-center gap-1.5">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {sortDirection && (
                        <span className="text-accent-copper">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>

        {/* Virtualized Body */}
        <tbody>
          {paddingTop > 0 && (
            <tr>
              <td style={{ height: paddingTop }} colSpan={columns.length} />
            </tr>
          )}

          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index];
            const isSelected = selectedId && getRowId(row.original) === selectedId;

            return (
              <tr
                key={row.id}
                style={{ height: rowHeight }}
                className={`
                  border-b border-bdr-subtle transition-colors
                  ${onRowClick ? 'cursor-pointer' : ''}
                  ${isSelected ? 'bg-accent-copper/[0.08]' : 'hover:bg-accent-copper/[0.04]'}
                `}
                onClick={() => handleRowClick(row)}
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
              <td style={{ height: paddingBottom }} colSpan={columns.length} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default VirtualTable;

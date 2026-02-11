/**
 * SkeletonTable - Table-shaped skeleton loader
 *
 * Matches the shape of data tables: header row + data rows.
 * Used for loading states in athlete tables, erg data tables, etc.
 *
 * @example
 * // Default 5 rows, 4 columns
 * <SkeletonTable />
 *
 * // Custom dimensions
 * <SkeletonTable rows={10} columns={6} />
 */

import { Skeleton } from './Skeleton';

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex gap-4 pb-2 border-b border-bdr-default">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div key={colIndex} className="flex-1">
            <Skeleton variant="title" width="80%" height="18px" />
          </div>
        ))}
      </div>

      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 py-2"
          style={{
            opacity: rowIndex % 2 === 0 ? 1 : 0.9,
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1">
              <Skeleton variant="text" width={colIndex === 0 ? '90%' : '70%'} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

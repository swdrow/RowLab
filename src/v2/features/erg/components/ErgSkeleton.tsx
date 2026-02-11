import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * ErgTableSkeleton - Loading skeleton for ErgTestsTable
 *
 * Matches the layout of ErgTestsTable.tsx:
 * - Header row with 8 columns: Athlete, Type, Date, Time, Split/500m, Watts, SR, Actions
 * - Data rows with name, badges, formatted times, and action buttons
 * - Row height ~56px to match VirtualTable rowHeight
 *
 * Uses react-loading-skeleton with theme-aware CSS custom properties.
 */

interface ErgTableSkeletonProps {
  rows?: number;
  className?: string;
}

export function ErgTableSkeleton({ rows = 8, className = '' }: ErgTableSkeletonProps) {
  return (
    <SkeletonTheme baseColor="var(--color-bg-surface)" highlightColor="var(--color-bg-hover)">
      <div className={`w-full ${className}`}>
        {/* Header Row */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-[var(--color-border-subtle)] bg-bg-active">
          <div className="w-[180px]">
            <Skeleton height={14} width="60%" />
          </div>
          <div className="w-[100px]">
            <Skeleton height={14} width="50%" />
          </div>
          <div className="w-[120px]">
            <Skeleton height={14} width="50%" />
          </div>
          <div className="w-[100px]">
            <Skeleton height={14} width="50%" />
          </div>
          <div className="w-[100px]">
            <Skeleton height={14} width="60%" />
          </div>
          <div className="w-[80px]">
            <Skeleton height={14} width="50%" />
          </div>
          <div className="w-[60px]">
            <Skeleton height={14} width="40%" />
          </div>
          <div className="w-[100px]">
            <Skeleton height={14} width="60%" />
          </div>
        </div>

        {/* Data Rows */}
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 px-4 py-3 border-b border-[var(--color-border-subtle)]"
            style={{ height: 56 }}
          >
            {/* Athlete name */}
            <div className="w-[180px]">
              <Skeleton height={16} width="80%" />
            </div>

            {/* Test type badge */}
            <div className="w-[100px]">
              <Skeleton height={22} width={40} borderRadius={9999} />
            </div>

            {/* Date */}
            <div className="w-[120px]">
              <Skeleton height={14} width="70%" />
            </div>

            {/* Time (monospace) */}
            <div className="w-[100px]">
              <Skeleton height={16} width={65} />
            </div>

            {/* Split */}
            <div className="w-[100px]">
              <Skeleton height={14} width={55} />
            </div>

            {/* Watts */}
            <div className="w-[80px]">
              <Skeleton height={14} width={45} />
            </div>

            {/* Stroke Rate */}
            <div className="w-[60px]">
              <Skeleton height={14} width={30} />
            </div>

            {/* Actions */}
            <div className="w-[100px] flex gap-2">
              <Skeleton circle width={28} height={28} />
              <Skeleton circle width={28} height={28} />
            </div>
          </div>
        ))}
      </div>
    </SkeletonTheme>
  );
}

/**
 * ErgCardSkeleton - Loading skeleton for mobile card view
 *
 * Matches ErgTestCard layout with header, stats grid, and action buttons.
 */
export function ErgCardSkeleton() {
  return (
    <SkeletonTheme baseColor="var(--color-bg-surface)" highlightColor="var(--color-bg-hover)">
      <div className="p-4 bg-bg-surface border border-bdr-default rounded-lg">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <Skeleton height={18} width={150} />
            <Skeleton height={14} width={100} style={{ marginTop: 4 }} />
          </div>
          <Skeleton height={22} width={40} borderRadius={9999} />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex gap-2">
            <Skeleton height={14} width={40} />
            <Skeleton height={14} width={60} />
          </div>
          <div className="flex gap-2">
            <Skeleton height={14} width={35} />
            <Skeleton height={14} width={55} />
          </div>
          <div className="flex gap-2">
            <Skeleton height={14} width={40} />
            <Skeleton height={14} width={50} />
          </div>
          <div className="flex gap-2">
            <Skeleton height={14} width={25} />
            <Skeleton height={14} width={30} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Skeleton height={32} width="50%" borderRadius={6} />
          <Skeleton height={32} width="50%" borderRadius={6} />
        </div>
      </div>
    </SkeletonTheme>
  );
}

/**
 * ErgMobileListSkeleton - Loading skeleton for mobile erg test list
 */
interface ErgMobileListSkeletonProps {
  cards?: number;
  className?: string;
}

export function ErgMobileListSkeleton({ cards = 5, className = '' }: ErgMobileListSkeletonProps) {
  return (
    <div className={`p-4 space-y-3 ${className}`}>
      {Array.from({ length: cards }).map((_, index) => (
        <ErgCardSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * ErgChartSkeleton - Loading skeleton for ErgProgressChart
 *
 * Matches chart area with axis labels and line/bar placeholder.
 */
interface ErgChartSkeletonProps {
  height?: number;
  className?: string;
}

export function ErgChartSkeleton({ height = 300, className = '' }: ErgChartSkeletonProps) {
  return (
    <SkeletonTheme baseColor="var(--color-bg-surface)" highlightColor="var(--color-bg-hover)">
      <div className={`p-4 bg-bg-surface rounded-lg border border-bdr-default ${className}`}>
        {/* Chart title */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton height={20} width={180} />
          <div className="flex gap-2">
            <Skeleton height={28} width={60} borderRadius={6} />
            <Skeleton height={28} width={60} borderRadius={6} />
          </div>
        </div>

        {/* Chart area */}
        <div style={{ height }} className="relative">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={12} width={35} />
            ))}
          </div>

          {/* Chart body placeholder */}
          <div className="ml-14 mr-2 h-full flex items-end gap-2 pb-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end">
                <Skeleton height={Math.random() * 60 + 40 + '%'} width="100%" borderRadius={4} />
              </div>
            ))}
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-14 right-2 flex justify-between">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} height={12} width={40} />
            ))}
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}

/**
 * ErgPageSkeleton - Full page skeleton for ErgTestsPage
 *
 * Matches ErgTestsPage layout: header (title + buttons), filter bar, and table.
 * Used as the auth-loading state to replace the spinner.
 */
export function ErgPageSkeleton({ className = '' }: { className?: string }) {
  return (
    <SkeletonTheme baseColor="var(--color-bg-surface)" highlightColor="var(--color-bg-hover)">
      <div className={`flex flex-col h-full bg-bg-default ${className}`}>
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-bdr-default bg-bg-surface">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Skeleton height={28} width={120} />
              <Skeleton height={14} width={60} style={{ marginTop: 4 }} />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton height={36} width={110} borderRadius={6} />
              <Skeleton height={36} width={120} borderRadius={6} />
              <Skeleton height={36} width={100} borderRadius={6} />
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-3">
            <Skeleton height={36} width={140} borderRadius={6} />
            <Skeleton height={36} width={100} borderRadius={6} />
            <Skeleton height={36} width={100} borderRadius={6} />
            <Skeleton height={36} width={100} borderRadius={6} />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="flex-1 overflow-hidden">
          <ErgTableSkeleton rows={10} />
        </div>
      </div>
    </SkeletonTheme>
  );
}

export default ErgTableSkeleton;

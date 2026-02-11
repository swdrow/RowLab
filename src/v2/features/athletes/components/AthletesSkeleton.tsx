import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * AthletesSkeleton - Loading skeleton for AthletesTable
 *
 * Matches the layout of AthletesTable.tsx:
 * - Header row with 5 columns: Athlete, Side, Capabilities, Weight, Height
 * - Data rows with avatar circle (32px), name/email text, badges, numeric values
 * - Row height ~60px to match VirtualTable rowHeight
 *
 * Uses react-loading-skeleton with theme-aware CSS custom properties.
 */

interface AthletesSkeletonProps {
  rows?: number;
  className?: string;
}

export function AthletesSkeleton({ rows = 8, className = '' }: AthletesSkeletonProps) {
  return (
    <SkeletonTheme
      baseColor="var(--color-bg-surface)"
      highlightColor="var(--color-bg-hover)"
    >
      <div className={`w-full ${className}`}>
        {/* Header Row */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-[var(--color-border-subtle)] bg-bg-active">
          <div className="w-[250px]"><Skeleton height={16} width="60%" /></div>
          <div className="w-[120px]"><Skeleton height={16} width="50%" /></div>
          <div className="w-[140px]"><Skeleton height={16} width="70%" /></div>
          <div className="w-[100px]"><Skeleton height={16} width="60%" /></div>
          <div className="w-[100px]"><Skeleton height={16} width="60%" /></div>
        </div>

        {/* Data Rows */}
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 px-4 py-3 border-b border-[var(--color-border-subtle)]"
            style={{ height: 60 }}
          >
            {/* Athlete column: avatar + name/email */}
            <div className="w-[250px] flex items-center gap-3">
              <Skeleton circle width={32} height={32} />
              <div className="flex-1">
                <Skeleton height={16} width="70%" />
                <Skeleton height={12} width="50%" style={{ marginTop: 4 }} />
              </div>
            </div>

            {/* Side column: badge */}
            <div className="w-[120px]">
              <Skeleton height={20} width={60} borderRadius={9999} />
            </div>

            {/* Capabilities column: badges */}
            <div className="w-[140px] flex gap-1">
              <Skeleton height={20} width={45} borderRadius={9999} />
              <Skeleton height={20} width={35} borderRadius={9999} />
            </div>

            {/* Weight column */}
            <div className="w-[100px]">
              <Skeleton height={16} width={50} />
            </div>

            {/* Height column */}
            <div className="w-[100px]">
              <Skeleton height={16} width={50} />
            </div>
          </div>
        ))}
      </div>
    </SkeletonTheme>
  );
}

/**
 * AthleteCardSkeleton - Loading skeleton for grid/card view
 *
 * Matches AthleteCard layout with avatar, name, and metadata.
 */
export function AthleteCardSkeleton() {
  return (
    <SkeletonTheme
      baseColor="var(--color-bg-surface)"
      highlightColor="var(--color-bg-hover)"
    >
      <div className="p-4 bg-bg-surface border border-bdr-default rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <Skeleton circle width={48} height={48} />
          <div className="flex-1">
            <Skeleton height={18} width="60%" />
            <Skeleton height={14} width="40%" style={{ marginTop: 4 }} />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton height={22} width={70} borderRadius={9999} />
          <Skeleton height={22} width={50} borderRadius={9999} />
        </div>
      </div>
    </SkeletonTheme>
  );
}

/**
 * AthletesGridSkeleton - Loading skeleton for grid view with multiple cards
 */
interface AthletesGridSkeletonProps {
  cards?: number;
  className?: string;
}

export function AthletesGridSkeleton({ cards = 8, className = '' }: AthletesGridSkeletonProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: cards }).map((_, index) => (
        <AthleteCardSkeleton key={index} />
      ))}
    </div>
  );
}

export default AthletesSkeleton;

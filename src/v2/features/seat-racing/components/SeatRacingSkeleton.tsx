import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * SeatRacingSkeleton - Loading skeleton for seat racing feature
 *
 * Matches the layout of SessionList and RankingsTable:
 * - Session cards with date, location, badges
 * - Rankings table with sortable columns
 *
 * Uses react-loading-skeleton with theme-aware CSS custom properties.
 */

interface SeatRacingSkeletonProps {
  className?: string;
}

export function SeatRacingSkeleton({ className = '' }: SeatRacingSkeletonProps) {
  return (
    <SkeletonTheme baseColor="var(--color-ink-well-50)" highlightColor="var(--color-ink-well-30)">
      <div className={`space-y-6 ${className}`}>
        {/* Rankings Section */}
        <RankingsTableSkeleton />

        {/* Sessions Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Skeleton height={24} width={150} />
            <Skeleton height={36} width={140} borderRadius={6} />
          </div>
          <SessionListSkeleton />
        </div>
      </div>
    </SkeletonTheme>
  );
}

/**
 * SessionListSkeleton - List of session cards skeleton
 */
interface SessionListSkeletonProps {
  cards?: number;
  className?: string;
}

export function SessionListSkeleton({ cards = 5, className = '' }: SessionListSkeletonProps) {
  return (
    <SkeletonTheme baseColor="var(--color-ink-well-50)" highlightColor="var(--color-ink-well-30)">
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: cards }).map((_, index) => (
          <SessionCardSkeleton key={index} />
        ))}
      </div>
    </SkeletonTheme>
  );
}

/**
 * SessionCardSkeleton - Individual session card skeleton
 *
 * Matches SessionList card layout:
 * - Date with icon, location with icon
 * - Boat class badge, conditions badge
 * - Description text
 */
function SessionCardSkeleton() {
  return (
    <div className="p-4 bg-bg-surface border border-bdr-default rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          {/* Date line */}
          <div className="flex items-center gap-2 mb-1">
            <Skeleton circle width={16} height={16} />
            <Skeleton height={14} width={120} />
          </div>
          {/* Location line */}
          <div className="flex items-center gap-2">
            <Skeleton circle width={14} height={14} />
            <Skeleton height={12} width={100} />
          </div>
        </div>
        {/* Boat class badge */}
        <Skeleton height={22} width={50} borderRadius={9999} />
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-2">
        <Skeleton height={20} width={60} borderRadius={9999} />
        <Skeleton height={14} width={150} />
      </div>
    </div>
  );
}

/**
 * RankingsTableSkeleton - Rankings table with header and rows
 */
interface RankingsTableSkeletonProps {
  rows?: number;
  className?: string;
}

export function RankingsTableSkeleton({ rows = 8, className = '' }: RankingsTableSkeletonProps) {
  return (
    <SkeletonTheme baseColor="var(--color-ink-well-50)" highlightColor="var(--color-ink-well-30)">
      <div className={`bg-bg-surface rounded-lg border border-bdr-default ${className}`}>
        {/* Header with actions */}
        <div className="flex items-center justify-between p-4 border-b border-bdr-default">
          <Skeleton height={24} width={160} />
          <div className="flex items-center gap-3">
            <Skeleton height={32} width={100} borderRadius={6} />
            <Skeleton height={32} width={110} borderRadius={6} />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header */}
            <thead className="bg-bg-active">
              <tr>
                <th className="px-4 py-3 text-left w-[60px]">
                  <Skeleton height={12} width={35} />
                </th>
                <th className="px-4 py-3 text-left w-[200px]">
                  <Skeleton height={12} width={55} />
                </th>
                <th className="px-4 py-3 text-left w-[100px]">
                  <Skeleton height={12} width={35} />
                </th>
                <th className="px-4 py-3 text-left w-[100px]">
                  <Skeleton height={12} width={70} />
                </th>
                <th className="px-4 py-3 text-left w-[80px]">
                  <Skeleton height={12} width={45} />
                </th>
                <th className="px-4 py-3 text-left w-[120px]">
                  <Skeleton height={12} width={75} />
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-bdr-default">
              {Array.from({ length: rows }).map((_, index) => (
                <tr key={index}>
                  {/* Rank */}
                  <td className="px-4 py-3">
                    <Skeleton height={16} width={20} />
                  </td>
                  {/* Athlete */}
                  <td className="px-4 py-3">
                    <Skeleton height={16} width="80%" />
                  </td>
                  {/* Side */}
                  <td className="px-4 py-3">
                    <Skeleton height={20} width={60} borderRadius={9999} />
                  </td>
                  {/* Rating */}
                  <td className="px-4 py-3">
                    <Skeleton height={16} width={50} />
                  </td>
                  {/* Pieces */}
                  <td className="px-4 py-3">
                    <Skeleton height={14} width={25} />
                  </td>
                  {/* Confidence */}
                  <td className="px-4 py-3">
                    <Skeleton height={20} width={70} borderRadius={9999} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SkeletonTheme>
  );
}

/**
 * RankingsChartSkeleton - Rankings distribution chart skeleton
 */
interface RankingsChartSkeletonProps {
  height?: number;
  className?: string;
}

export function RankingsChartSkeleton({
  height = 200,
  className = '',
}: RankingsChartSkeletonProps) {
  return (
    <SkeletonTheme baseColor="var(--color-ink-well-50)" highlightColor="var(--color-ink-well-30)">
      <div className={`p-4 bg-bg-surface rounded-lg border border-bdr-default ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <Skeleton height={18} width={160} />
          <div className="flex gap-2">
            <Skeleton height={24} width={50} borderRadius={9999} />
            <Skeleton height={24} width={70} borderRadius={9999} />
            <Skeleton height={24} width={60} borderRadius={9999} />
          </div>
        </div>

        {/* Bar chart placeholder */}
        <div style={{ height }} className="flex items-end gap-3 pt-4">
          {Array.from({ length: 12 }).map((_, i) => {
            const barHeight = Math.random() * 60 + 20;
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <Skeleton height={`${barHeight}%`} width="100%" borderRadius={4} />
              </div>
            );
          })}
        </div>
      </div>
    </SkeletonTheme>
  );
}

/**
 * SessionDetailSkeleton - Session detail panel skeleton
 */
export function SessionDetailSkeleton() {
  return (
    <SkeletonTheme baseColor="var(--color-ink-well-50)" highlightColor="var(--color-ink-well-30)">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Skeleton height={28} width={200} />
            <Skeleton height={16} width={150} style={{ marginTop: 8 }} />
          </div>
          <div className="flex gap-2">
            <Skeleton height={36} width={80} borderRadius={6} />
            <Skeleton height={36} width={80} borderRadius={6} />
          </div>
        </div>

        {/* Metadata badges */}
        <div className="flex gap-3">
          <Skeleton height={28} width={70} borderRadius={9999} />
          <Skeleton height={28} width={90} borderRadius={9999} />
          <Skeleton height={28} width={80} borderRadius={9999} />
        </div>

        {/* Pieces */}
        <div className="space-y-4">
          <Skeleton height={20} width={80} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 bg-bg-surface border border-bdr-default rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <Skeleton height={18} width={100} />
                <Skeleton height={14} width={60} />
              </div>
              {/* Boats in piece */}
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-4 px-3 py-2 bg-bg-base rounded">
                    <Skeleton height={14} width={60} />
                    <Skeleton height={16} width={50} />
                    <div className="flex-1 flex gap-1">
                      {Array.from({ length: 4 }).map((_, k) => (
                        <Skeleton key={k} circle width={24} height={24} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkeletonTheme>
  );
}

export default SeatRacingSkeleton;

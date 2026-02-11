import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * AttendanceSkeleton - Loading skeleton for AttendancePage
 *
 * Matches the attendance roster layout:
 * - Date selector at top
 * - Summary stats row (Present, Late, Excused, Unexcused)
 * - Athlete roster with avatar, name, streak badge, and P/L/E/U buttons
 *
 * Uses react-loading-skeleton with theme-aware CSS custom properties.
 */

interface AttendanceSkeletonProps {
  /** Number of athlete rows to show */
  rowCount?: number;
  className?: string;
}

export function AttendanceSkeleton({ rowCount = 8, className = '' }: AttendanceSkeletonProps) {
  return (
    <SkeletonTheme baseColor="var(--color-ink-well-50)" highlightColor="var(--color-ink-well-30)">
      <div className={`space-y-4 ${className}`}>
        {/* Date picker row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton circle width={36} height={36} />
            <Skeleton height={40} width={160} borderRadius={8} />
            <Skeleton circle width={36} height={36} />
          </div>
          <Skeleton height={16} width={180} />
        </div>

        {/* Stats bar + bulk action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Present / Late / Excused / Unexcused stat groups */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton height={16} width={24} />
                <Skeleton height={12} width={50} />
              </div>
            ))}
          </div>
          <Skeleton height={40} width={160} borderRadius={8} />
        </div>

        {/* Athlete roster rows */}
        <div className="space-y-1">
          {Array.from({ length: rowCount }).map((_, i) => (
            <AthleteRowSkeleton key={i} hasStreak={i % 3 === 0} />
          ))}
        </div>
      </div>
    </SkeletonTheme>
  );
}

/**
 * AthleteRowSkeleton - Single athlete row in attendance roster
 */
function AthleteRowSkeleton({ hasStreak }: { hasStreak: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-bg-surface-elevated rounded-lg border border-bdr-default">
      {/* Left: Avatar + name + streak */}
      <div className="flex items-center gap-3">
        <Skeleton circle width={40} height={40} />
        <div>
          <div className="flex items-center gap-2">
            <Skeleton height={16} width={130} />
            <Skeleton height={12} width={20} />
          </div>
          {hasStreak && (
            <div className="mt-0.5">
              <Skeleton height={18} width={60} borderRadius={9999} />
            </div>
          )}
        </div>
      </div>

      {/* Right: P/L/E/U button placeholders */}
      <div className="flex items-center gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={32} width={32} borderRadius={6} />
        ))}
      </div>
    </div>
  );
}

export default AttendanceSkeleton;

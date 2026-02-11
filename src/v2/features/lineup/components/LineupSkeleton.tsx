import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * LineupSkeleton - Loading skeleton for LineupWorkspace
 *
 * Matches the layout of LineupWorkspace.tsx:
 * - Left sidebar athlete bank (280px width)
 * - Main workspace with toolbar, biometrics panel, and boats
 * - Boat diagram with vertical seat arrangement (bow at top)
 *
 * Uses react-loading-skeleton with theme-aware CSS custom properties.
 */

interface LineupSkeletonProps {
  className?: string;
}

export function LineupSkeleton({ className = '' }: LineupSkeletonProps) {
  return (
    <SkeletonTheme baseColor="var(--color-ink-well-50)" highlightColor="var(--color-ink-well-30)">
      <div className={`flex h-full ${className}`}>
        {/* Athlete Bank - Left Sidebar */}
        <AthleteBankSkeleton />

        {/* Main Workspace */}
        <div className="flex-1 overflow-y-auto p-6 bg-bg-base">
          {/* Toolbar */}
          <div className="mb-4">
            <LineupToolbarSkeleton />
          </div>

          {/* Biometrics Panel */}
          <div className="mb-4">
            <BiometricsPanelSkeleton />
          </div>

          {/* Add Boat Button */}
          <div className="mb-6">
            <Skeleton height={44} width={160} borderRadius={8} />
          </div>

          {/* Boats */}
          <div className="space-y-6">
            <BoatViewSkeleton seats={8} />
            <BoatViewSkeleton seats={4} />
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}

/**
 * AthleteBankSkeleton - Sidebar athlete list skeleton
 */
function AthleteBankSkeleton() {
  return (
    <div className="w-[280px] h-full flex flex-col border-r border-bdr-default bg-bg-surface">
      {/* Header */}
      <div className="px-4 py-4 border-b border-bdr-subtle">
        <div className="flex items-center justify-between mb-3">
          <Skeleton height={16} width={120} />
          <Skeleton height={20} width={30} borderRadius={9999} />
        </div>
        {/* Search Input */}
        <Skeleton height={36} width="100%" borderRadius={6} />
      </div>

      {/* Athletes List */}
      <div className="flex-1 overflow-hidden p-2 space-y-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <Skeleton circle width={32} height={32} />
            <div className="flex-1">
              <Skeleton height={14} width="70%" />
              <Skeleton height={12} width="40%" style={{ marginTop: 4 }} />
            </div>
            <Skeleton height={18} width={50} borderRadius={9999} />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-bdr-subtle bg-bg-base">
        <Skeleton height={12} width="80%" />
      </div>
    </div>
  );
}

/**
 * LineupToolbarSkeleton - Toolbar with action buttons skeleton
 */
function LineupToolbarSkeleton() {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-bg-surface rounded-lg border border-bdr-default">
      <div className="flex items-center gap-2">
        <Skeleton height={32} width={32} borderRadius={6} />
        <Skeleton height={32} width={32} borderRadius={6} />
        <Skeleton height={1} width={1} style={{ marginLeft: 8, marginRight: 8 }} />
        <Skeleton height={32} width={80} borderRadius={6} />
        <Skeleton height={32} width={80} borderRadius={6} />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton height={32} width={100} borderRadius={6} />
        <Skeleton height={32} width={100} borderRadius={6} />
      </div>
    </div>
  );
}

/**
 * BiometricsPanelSkeleton - Stats panel skeleton
 */
function BiometricsPanelSkeleton() {
  return (
    <div className="flex items-center gap-6 px-4 py-3 bg-bg-surface rounded-lg border border-bdr-default">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col">
          <Skeleton height={12} width={70} style={{ marginBottom: 4 }} />
          <Skeleton height={20} width={50} />
        </div>
      ))}
    </div>
  );
}

/**
 * BoatViewSkeleton - Single boat diagram skeleton
 */
interface BoatViewSkeletonProps {
  seats?: number;
  showCoxswain?: boolean;
}

export function BoatViewSkeleton({ seats = 8, showCoxswain = true }: BoatViewSkeletonProps) {
  return (
    <SkeletonTheme baseColor="var(--color-ink-well-50)" highlightColor="var(--color-ink-well-30)">
      <div className="flex flex-col gap-4">
        {/* Boat Header */}
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-bg-surface border border-bdr-default">
          <div className="flex-1">
            <Skeleton height={20} width={120} />
            <Skeleton height={14} width={80} style={{ marginTop: 4 }} />
          </div>
          <Skeleton circle width={32} height={32} />
        </div>

        {/* Seats */}
        <div className="space-y-2">
          {/* Bow label */}
          <div className="px-4">
            <Skeleton height={12} width={30} />
          </div>

          {/* Seat slots */}
          {Array.from({ length: seats }).map((_, i) => (
            <SeatSlotSkeleton key={i} />
          ))}

          {/* Stroke label */}
          <div className="px-4 pt-2">
            <Skeleton height={12} width={50} />
          </div>
        </div>

        {/* Coxswain */}
        {showCoxswain && (
          <div className="pt-4 border-t border-bdr-subtle">
            <SeatSlotSkeleton isCoxswain />
          </div>
        )}
      </div>
    </SkeletonTheme>
  );
}

/**
 * SeatSlotSkeleton - Individual seat slot skeleton
 */
function SeatSlotSkeleton({ isCoxswain = false }: { isCoxswain?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-bg-surface border border-bdr-default border-dashed">
      {/* Seat number */}
      <div className="w-8 flex-shrink-0">
        <Skeleton height={16} width={16} />
      </div>

      {/* Side indicator */}
      <div className="w-16 flex-shrink-0">
        <Skeleton height={18} width={50} borderRadius={9999} />
      </div>

      {/* Athlete placeholder or empty */}
      <div className="flex-1 flex items-center gap-3">
        <Skeleton circle width={28} height={28} />
        <div className="flex-1">
          <Skeleton height={14} width="60%" />
        </div>
      </div>

      {/* Remove button placeholder */}
      <Skeleton circle width={24} height={24} />
    </div>
  );
}

/**
 * MobileLineupSkeleton - Mobile-specific lineup skeleton
 */
export function MobileLineupSkeleton() {
  return (
    <SkeletonTheme baseColor="var(--color-ink-well-50)" highlightColor="var(--color-ink-well-30)">
      <div className="h-full flex flex-col p-4">
        {/* Mobile toolbar */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton height={24} width={100} />
          <div className="flex gap-2">
            <Skeleton circle width={36} height={36} />
            <Skeleton circle width={36} height={36} />
          </div>
        </div>

        {/* Boat selector */}
        <Skeleton height={44} width="100%" borderRadius={8} className="mb-4" />

        {/* Seats in compact view */}
        <div className="flex-1 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-3 bg-bg-surface rounded-lg border border-bdr-default"
            >
              <Skeleton height={16} width={24} />
              <Skeleton height={20} width={40} borderRadius={9999} />
              <div className="flex-1 flex items-center gap-2">
                <Skeleton circle width={24} height={24} />
                <Skeleton height={14} width="50%" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom action bar */}
        <div className="pt-4 border-t border-bdr-subtle flex gap-2">
          <Skeleton height={40} width="50%" borderRadius={8} />
          <Skeleton height={40} width="50%" borderRadius={8} />
        </div>
      </div>
    </SkeletonTheme>
  );
}

export default LineupSkeleton;

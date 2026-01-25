import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * RegattaSkeleton - Loading skeleton for regatta feature
 *
 * Matches the layout of RegattaList and RegattaDetail:
 * - Grouped list with upcoming/past sections
 * - Detail view with events and races
 *
 * Uses react-loading-skeleton with theme-aware CSS custom properties.
 */

interface RegattaSkeletonProps {
  className?: string;
}

export function RegattaSkeleton({ className = '' }: RegattaSkeletonProps) {
  return (
    <SkeletonTheme
      baseColor="var(--color-bg-surface)"
      highlightColor="var(--color-bg-hover)"
    >
      <div className={`space-y-6 ${className}`}>
        {/* Header with create button */}
        <div className="flex items-center justify-between">
          <Skeleton height={28} width={120} />
          <Skeleton height={40} width={140} borderRadius={8} />
        </div>

        {/* Regatta list */}
        <RegattaListSkeleton />
      </div>
    </SkeletonTheme>
  );
}

/**
 * RegattaListSkeleton - List of regatta cards with sections
 */
interface RegattaListSkeletonProps {
  className?: string;
}

export function RegattaListSkeleton({ className = '' }: RegattaListSkeletonProps) {
  return (
    <SkeletonTheme
      baseColor="var(--color-bg-surface)"
      highlightColor="var(--color-bg-hover)"
    >
      <div className={`space-y-6 ${className}`}>
        {/* Upcoming section */}
        <section>
          <div className="mb-3">
            <Skeleton height={14} width={80} />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <RegattaCardSkeleton key={i} />
            ))}
          </div>
        </section>

        {/* Past section */}
        <section>
          <div className="mb-3">
            <Skeleton height={14} width={50} />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <RegattaCardSkeleton key={i} isPast />
            ))}
          </div>
        </section>
      </div>
    </SkeletonTheme>
  );
}

/**
 * RegattaCardSkeleton - Individual regatta card skeleton
 *
 * Matches RegattaCard layout:
 * - Date badge on left
 * - Name, date range, location
 * - Race count
 */
function RegattaCardSkeleton({ isPast = false }: { isPast?: boolean }) {
  return (
    <div
      className={`
        bg-surface-elevated rounded-lg border border-bdr-default p-4
        ${isPast ? 'opacity-70' : ''}
      `}
    >
      <div className="flex items-center gap-4">
        {/* Date badge */}
        <div className="flex-shrink-0 w-14 h-14 bg-bg-active rounded-lg flex flex-col items-center justify-center">
          <Skeleton height={12} width={28} />
          <Skeleton height={20} width={20} style={{ marginTop: 2 }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Skeleton height={18} width="70%" />
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <Skeleton circle width={14} height={14} />
              <Skeleton height={14} width={100} />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton circle width={14} height={14} />
              <Skeleton height={14} width={80} />
            </div>
          </div>
          <Skeleton height={12} width={50} style={{ marginTop: 6 }} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Skeleton circle width={32} height={32} />
          <Skeleton circle width={16} height={16} />
        </div>
      </div>
    </div>
  );
}

/**
 * RegattaDetailSkeleton - Full regatta detail view skeleton
 */
export function RegattaDetailSkeleton() {
  return (
    <SkeletonTheme
      baseColor="var(--color-bg-surface)"
      highlightColor="var(--color-bg-hover)"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-surface-elevated rounded-lg p-6 border border-bdr-default">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Skeleton height={28} width="60%" />
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <Skeleton circle width={16} height={16} />
                  <Skeleton height={14} width={150} />
                </div>
                <div className="flex items-center gap-1">
                  <Skeleton circle width={16} height={16} />
                  <Skeleton height={14} width={100} />
                </div>
                <div className="flex items-center gap-1">
                  <Skeleton circle width={16} height={16} />
                  <Skeleton height={14} width={80} />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton circle width={36} height={36} />
              <Skeleton circle width={36} height={36} />
            </div>
          </div>

          {/* Team goals */}
          <div className="mt-4 p-3 bg-bg-active rounded-lg">
            <Skeleton height={14} width={80} style={{ marginBottom: 8 }} />
            <Skeleton height={14} width="90%" />
            <Skeleton height={14} width="70%" style={{ marginTop: 4 }} />
          </div>
        </div>

        {/* Events section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton height={22} width={80} />
            <Skeleton height={36} width={110} borderRadius={8} />
          </div>

          {/* Event cards */}
          {Array.from({ length: 3 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </SkeletonTheme>
  );
}

/**
 * EventCardSkeleton - Event card with expandable races skeleton
 */
function EventCardSkeleton() {
  return (
    <div className="bg-surface-elevated rounded-lg border border-bdr-default overflow-hidden">
      {/* Event header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Skeleton circle width={20} height={20} />
          <div>
            <Skeleton height={16} width={150} />
            <Skeleton height={14} width={100} style={{ marginTop: 4 }} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton circle width={28} height={28} />
          <Skeleton circle width={28} height={28} />
        </div>
      </div>

      {/* Races (collapsed state shows nothing, but show some for skeleton) */}
      <div className="border-t border-bdr-default">
        {Array.from({ length: 2 }).map((_, i) => (
          <RaceRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * RaceRowSkeleton - Individual race row skeleton
 */
function RaceRowSkeleton() {
  return (
    <div className="px-4 py-3 border-b border-bdr-subtle last:border-b-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <Skeleton height={14} width={120} />
            <Skeleton height={12} width={150} style={{ marginTop: 4 }} />
          </div>
          {/* Result badge */}
          <div className="flex items-center gap-2">
            <Skeleton circle width={16} height={16} />
            <Skeleton height={16} width={30} />
            <Skeleton height={18} width={50} borderRadius={9999} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton height={24} width={80} borderRadius={4} />
          <Skeleton circle width={24} height={24} />
        </div>
      </div>
    </div>
  );
}

/**
 * RegattaFormSkeleton - Regatta creation/edit form skeleton
 */
export function RegattaFormSkeleton() {
  return (
    <SkeletonTheme
      baseColor="var(--color-bg-surface)"
      highlightColor="var(--color-bg-hover)"
    >
      <div className="space-y-6 p-6 bg-bg-surface rounded-lg border border-bdr-default">
        {/* Name field */}
        <div>
          <Skeleton height={14} width={100} style={{ marginBottom: 8 }} />
          <Skeleton height={40} width="100%" borderRadius={6} />
        </div>

        {/* Date fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton height={14} width={80} style={{ marginBottom: 8 }} />
            <Skeleton height={40} width="100%" borderRadius={6} />
          </div>
          <div>
            <Skeleton height={14} width={80} style={{ marginBottom: 8 }} />
            <Skeleton height={40} width="100%" borderRadius={6} />
          </div>
        </div>

        {/* Location and course type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton height={14} width={60} style={{ marginBottom: 8 }} />
            <Skeleton height={40} width="100%" borderRadius={6} />
          </div>
          <div>
            <Skeleton height={14} width={90} style={{ marginBottom: 8 }} />
            <Skeleton height={40} width="100%" borderRadius={6} />
          </div>
        </div>

        {/* External URL */}
        <div>
          <Skeleton height={14} width={90} style={{ marginBottom: 8 }} />
          <Skeleton height={40} width="100%" borderRadius={6} />
        </div>

        {/* Team goals */}
        <div>
          <Skeleton height={14} width={80} style={{ marginBottom: 8 }} />
          <Skeleton height={80} width="100%" borderRadius={6} />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-bdr-default">
          <Skeleton height={40} width={80} borderRadius={6} />
          <Skeleton height={40} width={120} borderRadius={6} />
        </div>
      </div>
    </SkeletonTheme>
  );
}

/**
 * RegattaCalendarSkeleton - Regatta calendar view skeleton
 */
export function RegattaCalendarSkeleton() {
  return (
    <SkeletonTheme
      baseColor="var(--color-bg-surface)"
      highlightColor="var(--color-bg-hover)"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton circle width={32} height={32} />
            <Skeleton height={24} width={120} />
            <Skeleton circle width={32} height={32} />
          </div>
          <Skeleton height={32} width={70} borderRadius={6} />
        </div>

        {/* Month grid */}
        <div className="bg-bg-surface rounded-lg border border-bdr-default p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center">
                <Skeleton height={14} width={14} />
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square p-1">
                <Skeleton height={20} width={20} />
                {Math.random() > 0.8 && (
                  <Skeleton height={4} width="80%" style={{ marginTop: 2 }} borderRadius={2} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Events for selected date */}
        <div className="space-y-2">
          <Skeleton height={16} width={150} />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="p-3 bg-bg-surface rounded-lg border border-bdr-default">
              <Skeleton height={16} width="60%" />
              <Skeleton height={12} width="40%" style={{ marginTop: 4 }} />
            </div>
          ))}
        </div>
      </div>
    </SkeletonTheme>
  );
}

export default RegattaSkeleton;

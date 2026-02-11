import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * CalendarSkeleton - Loading skeleton for TrainingCalendar
 *
 * Matches the layout of TrainingCalendar.tsx:
 * - Toolbar with navigation and view controls
 * - Calendar grid with day headers and cells
 * - Event placeholders in cells
 *
 * Uses react-loading-skeleton with theme-aware CSS custom properties.
 */

interface CalendarSkeletonProps {
  view?: 'month' | 'week';
  className?: string;
}

export function CalendarSkeleton({ view = 'month', className = '' }: CalendarSkeletonProps) {
  return (
    <SkeletonTheme baseColor="var(--color-ink-well-50)" highlightColor="var(--color-ink-well-30)">
      <div className={`training-calendar ${className}`}>
        {/* Toolbar */}
        <CalendarToolbarSkeleton />

        {/* Calendar Grid */}
        <div className="h-[600px] relative mt-4">
          {view === 'month' ? <MonthViewSkeleton /> : <WeekViewSkeleton />}
        </div>
      </div>
    </SkeletonTheme>
  );
}

/**
 * CalendarToolbarSkeleton - Toolbar with navigation skeleton
 */
function CalendarToolbarSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 bg-bg-surface rounded-lg border border-bdr-default">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Skeleton circle width={36} height={36} />
        <Skeleton circle width={36} height={36} />
        <Skeleton height={24} width={160} style={{ marginLeft: 12 }} />
      </div>

      {/* Today button and view toggle */}
      <div className="flex items-center gap-3">
        <Skeleton height={32} width={70} borderRadius={6} />
        <div className="flex bg-bg-active rounded-lg p-1">
          <Skeleton height={28} width={60} borderRadius={4} />
          <Skeleton height={28} width={60} borderRadius={4} style={{ marginLeft: 4 }} />
        </div>
      </div>
    </div>
  );
}

/**
 * MonthViewSkeleton - Month view calendar grid skeleton
 */
function MonthViewSkeleton() {
  // 7 days per week, ~5-6 weeks displayed
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeks = 5;

  return (
    <div className="h-full flex flex-col bg-bg-surface rounded-lg border border-bdr-default overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-bdr-default">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="px-2 py-3 text-center border-r border-bdr-default last:border-r-0"
          >
            <Skeleton height={14} width={30} />
          </div>
        ))}
      </div>

      {/* Week rows */}
      <div className="flex-1 grid grid-rows-5">
        {Array.from({ length: weeks }).map((_, weekIndex) => (
          <div
            key={weekIndex}
            className="grid grid-cols-7 border-b border-bdr-default last:border-b-0"
          >
            {Array.from({ length: 7 }).map((_, dayIndex) => (
              <DayCellSkeleton
                key={dayIndex}
                hasEvents={Math.random() > 0.5}
                eventCount={Math.floor(Math.random() * 3)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * DayCellSkeleton - Individual day cell skeleton
 */
function DayCellSkeleton({ hasEvents, eventCount }: { hasEvents: boolean; eventCount: number }) {
  return (
    <div className="min-h-[100px] p-1 border-r border-bdr-default last:border-r-0">
      {/* Date number */}
      <div className="text-right p-1">
        <Skeleton height={16} width={20} />
      </div>

      {/* Events */}
      {hasEvents && (
        <div className="space-y-1 mt-1">
          {Array.from({ length: eventCount }).map((_, i) => (
            <Skeleton
              key={i}
              height={20}
              width="90%"
              borderRadius={4}
              style={{ marginLeft: '5%' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * WeekViewSkeleton - Week view calendar grid skeleton
 */
function WeekViewSkeleton() {
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 12 }, (_, i) => i + 6); // 6am to 6pm

  return (
    <div className="h-full flex flex-col bg-bg-surface rounded-lg border border-bdr-default overflow-hidden">
      {/* All-day header + Day headers */}
      <div className="grid grid-cols-8 border-b border-bdr-default">
        {/* Time gutter header */}
        <div className="w-16 border-r border-bdr-default" />
        {/* Day headers */}
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="px-2 py-3 text-center border-r border-bdr-default last:border-r-0"
          >
            <Skeleton height={12} width={30} />
            <Skeleton height={20} width={25} style={{ marginTop: 4 }} />
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-8">
          {/* Time gutter */}
          <div className="w-16 border-r border-bdr-default">
            {hours.map((hour) => (
              <div key={hour} className="h-12 border-b border-bdr-default px-2 py-1">
                <Skeleton height={12} width={35} />
              </div>
            ))}
          </div>

          {/* Day columns */}
          {daysOfWeek.map((day) => (
            <div key={day} className="border-r border-bdr-default last:border-r-0">
              {hours.map((hour) => (
                <div key={hour} className="h-12 border-b border-bdr-default relative">
                  {/* Random event placeholder */}
                  {Math.random() > 0.85 && (
                    <Skeleton
                      height={40}
                      width="90%"
                      borderRadius={4}
                      style={{
                        position: 'absolute',
                        left: '5%',
                        top: 2,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * WorkoutCardSkeleton - Individual workout event card skeleton
 */
export function WorkoutCardSkeleton() {
  return (
    <SkeletonTheme baseColor="var(--color-ink-well-50)" highlightColor="var(--color-ink-well-30)">
      <div className="p-3 bg-bg-surface rounded-lg border border-bdr-default">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton height={16} width="70%" />
            <Skeleton height={12} width="50%" style={{ marginTop: 4 }} />
          </div>
          <Skeleton height={22} width={50} borderRadius={9999} />
        </div>
        <div className="flex gap-2 mt-2">
          <Skeleton height={14} width={60} />
          <Skeleton height={14} width={40} />
        </div>
      </div>
    </SkeletonTheme>
  );
}

/**
 * WorkoutFormSkeleton - Workout creation/edit form skeleton
 */
export function WorkoutFormSkeleton() {
  return (
    <SkeletonTheme baseColor="var(--color-ink-well-50)" highlightColor="var(--color-ink-well-30)">
      <div className="space-y-6 p-6 bg-bg-surface rounded-lg border border-bdr-default">
        {/* Title field */}
        <div>
          <Skeleton height={14} width={80} style={{ marginBottom: 8 }} />
          <Skeleton height={40} width="100%" borderRadius={6} />
        </div>

        {/* Date and duration row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton height={14} width={50} style={{ marginBottom: 8 }} />
            <Skeleton height={40} width="100%" borderRadius={6} />
          </div>
          <div>
            <Skeleton height={14} width={70} style={{ marginBottom: 8 }} />
            <Skeleton height={40} width="100%" borderRadius={6} />
          </div>
        </div>

        {/* Activity type and intensity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton height={14} width={90} style={{ marginBottom: 8 }} />
            <Skeleton height={40} width="100%" borderRadius={6} />
          </div>
          <div>
            <Skeleton height={14} width={60} style={{ marginBottom: 8 }} />
            <Skeleton height={40} width="100%" borderRadius={6} />
          </div>
        </div>

        {/* Description */}
        <div>
          <Skeleton height={14} width={80} style={{ marginBottom: 8 }} />
          <Skeleton height={100} width="100%" borderRadius={6} />
        </div>

        {/* Exercises section */}
        <div>
          <Skeleton height={16} width={80} style={{ marginBottom: 12 }} />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-bg-base rounded-lg">
                <Skeleton height={14} width={30} />
                <Skeleton height={36} width={150} borderRadius={6} />
                <Skeleton height={36} width={80} borderRadius={6} />
                <Skeleton height={36} width={60} borderRadius={6} />
                <Skeleton circle width={28} height={28} />
              </div>
            ))}
          </div>
          <Skeleton height={36} width={120} borderRadius={6} style={{ marginTop: 12 }} />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-bdr-default">
          <Skeleton height={40} width={80} borderRadius={6} />
          <Skeleton height={40} width={100} borderRadius={6} />
        </div>
      </div>
    </SkeletonTheme>
  );
}

/**
 * ComplianceDashboardSkeleton - NCAA compliance dashboard skeleton
 */
export function ComplianceDashboardSkeleton() {
  return (
    <SkeletonTheme baseColor="var(--color-ink-well-50)" highlightColor="var(--color-ink-well-30)">
      <div className="space-y-6">
        {/* Header with week navigation */}
        <div className="flex items-center justify-between">
          <Skeleton height={28} width={200} />
          <div className="flex items-center gap-2">
            <Skeleton circle width={36} height={36} />
            <Skeleton height={24} width={150} />
            <Skeleton circle width={36} height={36} />
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 bg-bg-surface rounded-lg border border-bdr-default">
              <Skeleton height={12} width={80} style={{ marginBottom: 8 }} />
              <Skeleton height={28} width={60} />
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-bg-active rounded-lg w-fit">
          <Skeleton height={32} width={80} borderRadius={4} />
          <Skeleton height={32} width={60} borderRadius={4} />
          <Skeleton height={32} width={90} borderRadius={4} />
        </div>

        {/* Weekly hours table skeleton */}
        <div className="bg-bg-surface rounded-lg border border-bdr-default overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-8 gap-px bg-bg-active">
            <div className="p-3">
              <Skeleton height={14} width={60} />
            </div>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="p-3 text-center">
                <Skeleton height={14} width={30} />
              </div>
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-8 gap-px border-t border-bdr-default">
              <div className="p-3">
                <Skeleton height={14} width={100} />
              </div>
              {Array.from({ length: 7 }).map((_, j) => (
                <div key={j} className="p-3 text-center">
                  <Skeleton height={16} width={30} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </SkeletonTheme>
  );
}

export default CalendarSkeleton;

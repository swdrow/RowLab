import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useAttendance } from '@v2/hooks/useAttendance';
import type { AttendanceStatus } from '@v2/types/athletes';

// ============================================
// Types
// ============================================

interface QuickMarkAttendanceProps {
  athleteId: string;
  athleteName: string;
  currentStatus?: AttendanceStatus;
}

// ============================================
// Status Button Config
// ============================================

interface StatusOption {
  value: AttendanceStatus;
  label: string;
  colorClasses: string;
  activeColorClasses: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'present',
    label: 'Present',
    colorClasses: 'border-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/10',
    activeColorClasses:
      'bg-green-500/20 border-green-500/40 text-green-600 dark:text-green-400 ring-2 ring-green-500/30',
  },
  {
    value: 'late',
    label: 'Late',
    colorClasses: 'border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10',
    activeColorClasses:
      'bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/30',
  },
  {
    value: 'excused',
    label: 'Excused',
    colorClasses: 'border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10',
    activeColorClasses:
      'bg-blue-500/20 border-blue-500/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/30',
  },
  {
    value: 'unexcused',
    label: 'Unexcused',
    colorClasses: 'border-zinc-500/20 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-500/10',
    activeColorClasses:
      'bg-zinc-500/20 border-zinc-500/40 text-zinc-500 dark:text-zinc-400 ring-2 ring-zinc-500/30',
  },
];

// ============================================
// Helpers
// ============================================

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ============================================
// Main Component
// ============================================

/**
 * One-tap attendance marking for today's date.
 *
 * - Row of status buttons (Present, Late, Excused, Unexcused)
 * - Color coded with active state when current attendance matches
 * - Optimistic UI: immediate update on tap, rollback on error
 * - Sonner toast on create: "{Name} marked as {status}" with "Undo" button
 * - 44px min touch targets for mobile
 */
export function QuickMarkAttendance({
  athleteId,
  athleteName,
  currentStatus,
}: QuickMarkAttendanceProps) {
  const today = getTodayISO();
  const { recordAttendance, attendanceMap } = useAttendance(today);

  // Optimistic local state: tracks what the user tapped (before API confirms)
  const [optimisticStatus, setOptimisticStatus] = useState<AttendanceStatus | null>(null);

  // The effective current status: optimistic if set, otherwise from props or attendance map
  const effectiveStatus =
    optimisticStatus ?? currentStatus ?? attendanceMap[athleteId]?.status ?? null;

  const handleTap = useCallback(
    (status: AttendanceStatus) => {
      // If already marked as this status, treat as a toggle (re-mark with same status)
      // The API handles upsert — marking the same status again is idempotent
      const isAlreadyActive = effectiveStatus === status;
      if (isAlreadyActive) {
        // Tapping the active status again — do nothing (no toggle-off for attendance)
        return;
      }

      // Optimistic update
      setOptimisticStatus(status);

      // Call attendance API
      recordAttendance(
        {
          athleteId,
          date: today,
          status,
        },
        {
          onSuccess: () => {
            // Clear optimistic state — let the query cache take over
            setOptimisticStatus(null);

            // Show success toast with undo
            toast.success(`${athleteName} marked as ${status}`, {
              action: {
                label: 'Undo',
                onClick: () => {
                  // Undo: re-mark with previous status or remove
                  if (currentStatus && currentStatus !== status) {
                    recordAttendance({
                      athleteId,
                      date: today,
                      status: currentStatus,
                    });
                    setOptimisticStatus(currentStatus);
                  } else {
                    // No previous status to restore; clear optimistic
                    setOptimisticStatus(null);
                  }
                },
              },
              duration: 4000,
            });
          },
          onError: () => {
            // Roll back optimistic update
            setOptimisticStatus(null);
            toast.error(`Failed to mark ${athleteName} attendance. Please try again.`);
          },
        }
      );
    },
    [athleteId, athleteName, today, effectiveStatus, currentStatus, recordAttendance]
  );

  return (
    <div>
      <p className="text-xs font-medium text-txt-tertiary uppercase tracking-wider mb-2">
        Today's Attendance
      </p>
      <div className="flex gap-2">
        {STATUS_OPTIONS.map((option) => {
          const isActive = effectiveStatus === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleTap(option.value)}
              className={`
                flex-1 min-h-[44px] px-2 py-2
                text-xs font-medium rounded-lg border
                transition-all duration-150
                active:scale-[0.97]
                ${isActive ? option.activeColorClasses : option.colorClasses}
              `}
              aria-pressed={isActive}
              aria-label={`Mark ${athleteName} as ${option.label}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default QuickMarkAttendance;

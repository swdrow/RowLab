/**
 * Day detail popover for the calendar views.
 * Opens when a day is clicked, showing a compact list of workouts
 * with quick stats (total meters, count, duration).
 */

import { useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { format, isSameDay } from 'date-fns';
import {
  IconWaves,
  IconMountain,
  IconBike,
  IconFootprints,
  IconDumbbell,
  IconHeart,
  IconActivity,
  IconX,
} from '@/components/icons';
import type { IconComponent } from '@/types/icons';

import { getSportFromWorkout, getWorkoutVolume, parseIntervalPattern } from '../utils';
import { SPORT_CONFIG } from '../constants';
import { formatDistance, formatDuration } from '@/lib/format';
import { scaleIn } from '@/lib/animations';
import type { Workout } from '../types';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface DayPopoverProps {
  day: Date;
  workouts: Workout[];
  onClose: () => void;
  anchorRect?: DOMRect;
}

/* ------------------------------------------------------------------ */
/* Icon lookup                                                         */
/* ------------------------------------------------------------------ */

const ICON_MAP: Record<string, IconComponent> = {
  Waves: IconWaves,
  Mountain: IconMountain,
  Bike: IconBike,
  Footprints: IconFootprints,
  Dumbbell: IconDumbbell,
  Heart: IconHeart,
  Activity: IconActivity,
};

/* ------------------------------------------------------------------ */
/* DayPopover                                                          */
/* ------------------------------------------------------------------ */

export function DayPopover({ day, workouts, onClose, anchorRect }: DayPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Filter workouts to this specific day
  const dayWorkouts = useMemo(() => {
    return workouts.filter((w) => {
      const wDate = new Date(w.date.split('T')[0] + 'T00:00:00');
      return isSameDay(wDate, day);
    });
  }, [workouts, day]);

  const stats = useMemo(() => getWorkoutVolume(dayWorkouts), [dayWorkouts]);

  // Close on click outside
  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Position: near anchor or centered
  const popoverStyle = useMemo(() => {
    if (!anchorRect) {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const popoverWidth = 288; // max-w-[18rem]
    const popoverHeight = 300; // estimated
    const gap = 8;

    let top = anchorRect.bottom + gap;
    let left = anchorRect.left + anchorRect.width / 2 - popoverWidth / 2;

    // Clamp to viewport
    if (left < 12) left = 12;
    if (left + popoverWidth > window.innerWidth - 12) left = window.innerWidth - 12 - popoverWidth;
    if (top + popoverHeight > window.innerHeight - 12) {
      top = anchorRect.top - gap - popoverHeight;
    }
    if (top < 12) top = 12;

    return { position: 'fixed' as const, top: `${top}px`, left: `${left}px` };
  }, [anchorRect]);

  return (
    <>
      {/* Transparent backdrop */}
      <div className="fixed inset-0 z-40" aria-hidden="true" />

      {/* Popover */}
      <motion.div
        ref={popoverRef}
        {...scaleIn}
        style={popoverStyle}
        className="z-50 w-[18rem] bg-void-raised border border-edge-default rounded-xl shadow-md p-4"
        role="dialog"
        aria-label={`Workouts for ${format(day, 'EEEE, MMM d')}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-text-bright font-display font-medium text-sm">
            {format(day, 'EEEE, MMM d')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-void-overlay transition-colors"
            aria-label="Close"
          >
            <IconX width={14} height={14} className="text-text-faint" />
          </button>
        </div>

        {/* Quick stats */}
        {dayWorkouts.length > 0 && (
          <div className="flex items-center gap-4 mb-3 pb-3 border-b border-edge-default/50">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-text-faint block">
                Workouts
              </span>
              <span className="text-sm font-mono text-text-bright tabular-nums">{stats.count}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-text-faint block">
                Distance
              </span>
              <span className="text-sm font-mono text-text-bright tabular-nums">
                {formatDistance(stats.totalMeters)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-text-faint block">
                Duration
              </span>
              <span className="text-sm font-mono text-text-bright tabular-nums">
                {formatDuration(stats.totalSeconds)}
              </span>
            </div>
          </div>
        )}

        {/* Workout list */}
        {dayWorkouts.length === 0 ? (
          <p className="text-text-faint text-sm text-center py-3">No workouts this day</p>
        ) : (
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {dayWorkouts.map((w) => {
              const sport = getSportFromWorkout(w);
              const config = SPORT_CONFIG[sport];
              const Icon = ICON_MAP[config.icon] ?? IconActivity;
              const interval = parseIntervalPattern(w.splits, w.workoutType);

              return (
                <div
                  key={w.id}
                  className="flex items-center gap-2.5 py-1.5 px-2 rounded-md hover:bg-void-overlay transition-colors"
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `color-mix(in oklch, var(--color-${config.color}) 15%, transparent)`,
                    }}
                  >
                    <Icon width={14} height={14} className={`text-${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {interval.isInterval ? (
                        <>
                          <span className="text-xs font-medium text-accent-teal font-mono whitespace-nowrap">
                            {interval.pattern}
                          </span>
                          <span className="text-[10px] text-text-faint truncate">
                            {config.label}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-medium text-text-bright truncate">
                          {config.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-text-dim tabular-nums">
                      {formatDistance(w.distanceM)}
                    </span>
                    <span className="text-xs font-mono text-text-faint tabular-nums">
                      {formatDuration(w.durationSeconds)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </>
  );
}

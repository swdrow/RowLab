/**
 * GitHub-style heatmap grid for the monthly calendar.
 * Cells are colored by daily volume intensity instead of showing workout dots.
 * Includes a color-scale legend at the bottom.
 */

import { useMemo } from 'react';
import { isSameMonth, isToday } from 'date-fns';

import { getCalendarDays, getWorkoutVolume } from '../utils';
import { formatNumber } from '@/lib/format';
import type { Workout } from '../types';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface HeatmapGridProps {
  month: Date;
  workouts: Workout[];
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Color intensity levels (Tailwind classes). */
const INTENSITY_CLASSES = [
  'bg-void-deep', // 0 workouts
  'bg-accent-teal/20', // low
  'bg-accent-teal/40', // medium
  'bg-accent-teal/70', // high
  'bg-accent-teal', // max
] as const;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

interface DayData {
  day: Date;
  dateKey: string;
  meters: number;
  count: number;
  isCurrentMonth: boolean;
}

function buildDayData(calendarDays: Date[], workouts: Workout[], month: Date): DayData[] {
  // Group workouts by date key
  const byDate = new Map<string, Workout[]>();
  for (const w of workouts) {
    const key = w.date.split('T')[0] ?? w.date;
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(w);
  }

  return calendarDays.map((day) => {
    const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    const dayWorkouts = byDate.get(dateKey) ?? [];
    const { totalMeters } = getWorkoutVolume(dayWorkouts);

    return {
      day,
      dateKey,
      meters: totalMeters,
      count: dayWorkouts.length,
      isCurrentMonth: isSameMonth(day, month),
    };
  });
}

/**
 * Calculate intensity level (0-4) based on percentile thresholds.
 * Only considers days with > 0 meters for percentile calculation.
 */
function getIntensityLevel(meters: number, count: number, sortedNonZero: number[]): number {
  if (count === 0) return 0;
  if (sortedNonZero.length === 0) return 0;

  const p25 = sortedNonZero[Math.floor(sortedNonZero.length * 0.25)] ?? 0;
  const p50 = sortedNonZero[Math.floor(sortedNonZero.length * 0.5)] ?? 0;
  const p75 = sortedNonZero[Math.floor(sortedNonZero.length * 0.75)] ?? 0;

  if (meters >= p75) return 4;
  if (meters >= p50) return 3;
  if (meters >= p25) return 2;
  return 1;
}

/* ------------------------------------------------------------------ */
/* HeatmapGrid                                                         */
/* ------------------------------------------------------------------ */

export function HeatmapGrid({ month, workouts }: HeatmapGridProps) {
  const calendarDays = useMemo(() => getCalendarDays(month), [month]);
  const dayDataList = useMemo(
    () => buildDayData(calendarDays, workouts, month),
    [calendarDays, workouts, month]
  );

  // Sorted non-zero meter values for percentile thresholds
  const sortedNonZero = useMemo(() => {
    return dayDataList
      .filter((d) => d.meters > 0)
      .map((d) => d.meters)
      .sort((a, b) => a - b);
  }, [dayDataList]);

  // Chunk into weeks
  const weeks = useMemo(() => {
    const result: DayData[][] = [];
    for (let i = 0; i < dayDataList.length; i += 7) {
      result.push(dayDataList.slice(i, i + 7));
    }
    return result;
  }, [dayDataList]);

  return (
    <div className="bg-void-surface rounded-xl border border-edge-default p-3 space-y-3">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_HEADERS.map((name) => (
          <div
            key={name}
            className="text-center text-text-faint text-xs uppercase tracking-wider py-1 font-medium"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      {weeks.map((week, weekIdx) => (
        <div key={weekIdx} className="grid grid-cols-7 gap-1">
          {week.map((d) => {
            const level = getIntensityLevel(d.meters, d.count, sortedNonZero);
            const today = isToday(d.day);
            const intensityClass = INTENSITY_CLASSES[level];

            // Tooltip text
            const tooltipParts: string[] = [
              d.day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            ];
            if (d.count > 0) {
              tooltipParts.push(
                `${d.count} workout${d.count > 1 ? 's' : ''}, ${formatNumber(d.meters)}m`
              );
            } else {
              tooltipParts.push('No workouts');
            }

            return (
              <div
                key={d.dateKey}
                title={tooltipParts.join(': ')}
                className={`
                  aspect-square rounded-md flex items-center justify-center
                  transition-colors
                  ${intensityClass}
                  ${!d.isCurrentMonth ? 'opacity-30' : ''}
                  ${today ? 'ring-1 ring-accent-teal ring-offset-1 ring-offset-void-surface' : ''}
                `}
              >
                <span
                  className={`text-xs leading-none ${
                    level >= 3 ? 'text-void-deep font-medium' : 'text-text-dim'
                  }`}
                >
                  {d.day.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 pt-1">
        <span className="text-[10px] text-text-faint mr-1">Less</span>
        {INTENSITY_CLASSES.map((cls, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
        ))}
        <span className="text-[10px] text-text-faint ml-1">More</span>
      </div>
    </div>
  );
}

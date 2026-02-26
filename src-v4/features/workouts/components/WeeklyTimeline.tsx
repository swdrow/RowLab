/**
 * Weekly timeline view showing horizontal volume bars per day.
 * Each day column has a vertical bar whose height represents total volume,
 * composed of stacked segments colored by sport type.
 */

import { useMemo, useState } from 'react';
import { format, isToday } from 'date-fns';
import { IconChevronLeft, IconChevronRight } from '@/components/icons';

import { getCalendarDays, getSportFromWorkout, getWorkoutVolume } from '../utils';
import { SPORT_CONFIG, type SportType } from '../constants';
import { formatDistance } from '@/lib/format';
import type { Workout } from '../types';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface WeeklyTimelineProps {
  month: Date;
  workouts: Workout[];
}

interface DayBarData {
  day: Date;
  dateKey: string;
  totalMeters: number;
  segments: Array<{ sport: SportType; meters: number }>;
  isToday: boolean;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function buildWeeks(calendarDays: Date[], workouts: Workout[]): DayBarData[][] {
  // Group workouts by date key
  const byDate = new Map<string, Workout[]>();
  for (const w of workouts) {
    const key = w.date.split('T')[0] ?? w.date;
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(w);
  }

  // Build day data
  const allDays = calendarDays.map((day): DayBarData => {
    const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    const dayWorkouts = byDate.get(dateKey) ?? [];

    // Group meters by sport type
    const sportMap = new Map<SportType, number>();
    for (const w of dayWorkouts) {
      const sport = getSportFromWorkout(w);
      const meters = w.distanceM ?? 0;
      sportMap.set(sport, (sportMap.get(sport) ?? 0) + meters);
    }

    const segments = Array.from(sportMap.entries())
      .map(([sport, meters]) => ({ sport, meters }))
      .sort((a, b) => b.meters - a.meters); // Largest segment at bottom

    const { totalMeters } = getWorkoutVolume(dayWorkouts);

    return {
      day,
      dateKey,
      totalMeters,
      segments,
      isToday: isToday(day),
    };
  });

  // Chunk into weeks of 7
  const weeks: DayBarData[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }
  return weeks;
}

const BAR_MAX_HEIGHT = 120;

/* ------------------------------------------------------------------ */
/* WeeklyTimeline                                                      */
/* ------------------------------------------------------------------ */

export function WeeklyTimeline({ month, workouts }: WeeklyTimelineProps) {
  const calendarDays = useMemo(() => getCalendarDays(month), [month]);
  const allWeeks = useMemo(() => buildWeeks(calendarDays, workouts), [calendarDays, workouts]);
  const [weekOffset, setWeekOffset] = useState(0);

  // Determine which week to display
  const currentWeekIdx = useMemo(() => {
    // Default: show the week containing today (or first week of the month)
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let i = 0; i < allWeeks.length; i++) {
      if (allWeeks[i]?.some((d) => d.dateKey === todayKey)) return i;
    }
    return 0;
  }, [allWeeks]);

  const displayWeekIdx = Math.max(0, Math.min(allWeeks.length - 1, currentWeekIdx + weekOffset));
  const displayWeek = allWeeks[displayWeekIdx] ?? [];

  // Find max daily meters across all weeks for consistent scaling
  const maxDailyMeters = useMemo(() => {
    let max = 0;
    for (const week of allWeeks) {
      for (const day of week) {
        if (day.totalMeters > max) max = day.totalMeters;
      }
    }
    return max || 1; // Avoid division by zero
  }, [allWeeks]);

  // Collect unique sports visible in the data for the legend
  const visibleSports = useMemo(() => {
    const sportSet = new Set<SportType>();
    for (const week of allWeeks) {
      for (const day of week) {
        for (const seg of day.segments) {
          sportSet.add(seg.sport);
        }
      }
    }
    return Array.from(sportSet);
  }, [allWeeks]);

  // Week navigation
  const canGoPrev = displayWeekIdx > 0;
  const canGoNext = displayWeekIdx < allWeeks.length - 1;

  // Week date range label
  const weekLabel = useMemo(() => {
    if (displayWeek.length === 0) return '';
    const first = displayWeek[0]!;
    const last = displayWeek[displayWeek.length - 1]!;
    return `${format(first.day, 'MMM d')} \u2013 ${format(last.day, 'MMM d')}`;
  }, [displayWeek]);

  return (
    <div className="bg-void-surface rounded-xl border border-edge-default p-4 space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setWeekOffset((o) => o - 1)}
          disabled={!canGoPrev}
          className="p-1.5 rounded-md hover:bg-void-overlay transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous week"
        >
          <IconChevronLeft width={16} height={16} className="text-text-dim" />
        </button>
        <span className="text-text-dim text-xs font-medium">{weekLabel}</span>
        <button
          type="button"
          onClick={() => setWeekOffset((o) => o + 1)}
          disabled={!canGoNext}
          className="p-1.5 rounded-md hover:bg-void-overlay transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next week"
        >
          <IconChevronRight width={16} height={16} className="text-text-dim" />
        </button>
      </div>

      {/* Bar chart area */}
      <div
        className="flex items-end justify-between gap-2"
        style={{ height: `${BAR_MAX_HEIGHT + 36}px` }}
      >
        {displayWeek.map((d) => {
          const barHeight =
            d.totalMeters > 0 ? Math.max(4, (d.totalMeters / maxDailyMeters) * BAR_MAX_HEIGHT) : 0;

          return (
            <div key={d.dateKey} className="flex-1 flex flex-col items-center gap-1">
              {/* Volume label */}
              {d.totalMeters > 0 && (
                <span className="text-[9px] font-mono text-text-faint tabular-nums">
                  {formatDistance(d.totalMeters)}
                </span>
              )}

              {/* Bar */}
              <div
                className={`w-10 rounded-t-md overflow-hidden flex flex-col-reverse ${
                  d.isToday ? 'ring-1 ring-accent-teal' : ''
                }`}
                style={{ height: `${barHeight}px` }}
                title={`${format(d.day, 'EEE, MMM d')}: ${formatDistance(d.totalMeters)}`}
              >
                {d.segments.length > 0 ? (
                  d.segments.map((seg, i) => {
                    const segHeight =
                      d.totalMeters > 0 ? (seg.meters / d.totalMeters) * barHeight : 0;
                    return (
                      <div
                        key={`${seg.sport}-${i}`}
                        className="w-full"
                        style={{
                          height: `${segHeight}px`,
                          backgroundColor: `var(--color-${SPORT_CONFIG[seg.sport].color})`,
                        }}
                      />
                    );
                  })
                ) : (
                  <div className="w-full h-full bg-edge-default" />
                )}
              </div>

              {/* No-workout baseline */}
              {d.totalMeters === 0 && <div className="w-10 h-0.5 bg-edge-default rounded-full" />}

              {/* Day label */}
              <span
                className={`text-xs leading-none ${
                  d.isToday ? 'text-accent-teal font-medium' : 'text-text-faint'
                }`}
              >
                {format(d.day, 'EEE')}
              </span>
              <span
                className={`text-[10px] leading-none ${
                  d.isToday ? 'text-accent-teal' : 'text-text-faint'
                }`}
              >
                {d.day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Sport legend */}
      {visibleSports.length > 0 && (
        <div className="flex items-center gap-3 pt-2 border-t border-edge-default/50">
          {visibleSports.map((sport) => (
            <div key={sport} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: `var(--color-${SPORT_CONFIG[sport].color})` }}
              />
              <span className="text-[10px] text-text-faint">{SPORT_CONFIG[sport].label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

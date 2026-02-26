/**
 * Monthly calendar grid with workout indicator dots.
 * Shows a traditional 7-column grid for the month with colored dots
 * per workout type, today highlighting, and click-to-detail.
 */

import { useMemo, useCallback, type MouseEvent } from 'react';
import { isSameMonth, isToday } from 'date-fns';

import { getCalendarDays, getSportFromWorkout } from '../utils';
import { SPORT_CONFIG } from '../constants';
import type { Workout } from '../types';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface MonthlyCalendarProps {
  month: Date;
  workouts: Workout[];
  onDayClick: (day: Date, rect?: DOMRect) => void;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_DOTS = 3;

/* ------------------------------------------------------------------ */
/* Day cell                                                            */
/* ------------------------------------------------------------------ */

function DayCell({
  day,
  isCurrentMonth,
  dayWorkouts,
  onDayClick,
}: {
  day: Date;
  isCurrentMonth: boolean;
  dayWorkouts: Workout[];
  onDayClick: (day: Date, rect?: DOMRect) => void;
}) {
  const today = isToday(day);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      onDayClick(day, rect);
    },
    [day, onDayClick]
  );

  // Workout dots: show up to MAX_DOTS, overflow with "+N"
  const dots = dayWorkouts.slice(0, MAX_DOTS);
  const overflow = dayWorkouts.length - MAX_DOTS;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        relative flex flex-col items-center justify-start gap-1 p-1.5 rounded-lg
        transition-colors cursor-pointer min-h-[52px]
        ${today ? 'bg-accent-teal/10 ring-1 ring-accent' : 'hover:bg-void-overlay'}
        ${!isCurrentMonth ? 'opacity-40' : ''}
      `}
      aria-label={`${day.toLocaleDateString()}, ${dayWorkouts.length} workouts`}
    >
      {/* Day number */}
      <span
        className={`text-sm leading-none ${
          today
            ? 'text-accent-teal font-semibold'
            : isCurrentMonth
              ? 'text-text-bright'
              : 'text-text-faint'
        }`}
      >
        {day.getDate()}
      </span>

      {/* Workout dots */}
      {dayWorkouts.length > 0 && (
        <div className="flex items-center gap-0.5">
          {dots.map((w) => {
            const sport = getSportFromWorkout(w);
            const color = SPORT_CONFIG[sport].color;
            return (
              <span
                key={w.id}
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: `var(--color-${color})` }}
              />
            );
          })}
          {overflow > 0 && (
            <span className="text-[9px] text-text-faint leading-none ml-0.5">+{overflow}</span>
          )}
        </div>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* MonthlyCalendar                                                     */
/* ------------------------------------------------------------------ */

export function MonthlyCalendar({ month, workouts, onDayClick }: MonthlyCalendarProps) {
  const calendarDays = useMemo(() => getCalendarDays(month), [month]);

  // Pre-group workouts by date key for O(1) lookup per cell
  const workoutsByDate = useMemo(() => {
    const map = new Map<string, Workout[]>();
    for (const w of workouts) {
      const dateKey = w.date.split('T')[0] ?? w.date;
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(w);
    }
    return map;
  }, [workouts]);

  // Chunk days into weeks (7 per row)
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  return (
    <div className="bg-void-surface rounded-xl border border-edge-default p-3">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_HEADERS.map((name) => (
          <div
            key={name}
            className="text-center text-text-faint text-xs uppercase tracking-wider py-1 font-medium"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Week rows */}
      {weeks.map((week, weekIdx) => (
        <div
          key={weekIdx}
          className={`grid grid-cols-7 gap-1 ${
            weekIdx < weeks.length - 1 ? 'border-b border-edge-default/50 pb-1 mb-1' : ''
          }`}
        >
          {week.map((day) => {
            const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
            const dayWorkouts = workoutsByDate.get(dateKey) ?? [];

            return (
              <DayCell
                key={dateKey}
                day={day}
                isCurrentMonth={isSameMonth(day, month)}
                dayWorkouts={dayWorkouts}
                onDayClick={onDayClick}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

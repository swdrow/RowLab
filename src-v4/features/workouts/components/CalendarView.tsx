/**
 * Calendar view container for the /workouts page Calendar tab.
 * Manages month navigation, monthly/weekly toggle, and grid/heatmap sub-toggle.
 * Fetches all workouts for the visible period via a dedicated useQuery call
 * (not the infinite-scroll feed) so the full month is available at once.
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Grid3X3, BarChart3 } from 'lucide-react';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { WorkoutFilters, WorkoutsData } from '../types';
import type { Workout } from '../types';
import { MonthlyCalendar } from './MonthlyCalendar';
import { HeatmapGrid } from './HeatmapGrid';
import { WeeklyTimeline } from './WeeklyTimeline';
import { DayPopover } from './DayPopover';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface CalendarViewProps {
  filters: WorkoutFilters;
  calendarMode: 'monthly' | 'weekly';
}

/* ------------------------------------------------------------------ */
/* CalendarView                                                        */
/* ------------------------------------------------------------------ */

export function CalendarView({ filters, calendarMode }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [monthlyDisplayMode, setMonthlyDisplayMode] = useState<'grid' | 'heatmap'>('grid');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | undefined>(undefined);

  // Calculate the visible date range based on calendar mode
  const { dateFrom, dateTo } = useMemo(() => {
    if (calendarMode === 'monthly') {
      // Fetch the full visible grid (may include days from adjacent months)
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
      return {
        dateFrom: format(gridStart, 'yyyy-MM-dd'),
        dateTo: format(gridEnd, 'yyyy-MM-dd'),
      };
    }
    // Weekly: fetch from the start of the first week to end of last week in the month
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return {
      dateFrom: format(gridStart, 'yyyy-MM-dd'),
      dateTo: format(gridEnd, 'yyyy-MM-dd'),
    };
  }, [currentMonth, calendarMode]);

  // Dedicated calendar query (all data for the period, no pagination)
  const monthKey = format(currentMonth, 'yyyy-MM');
  const { data, isLoading } = useQuery<WorkoutsData>({
    queryKey: queryKeys.workouts.calendar(monthKey),
    queryFn: async () => {
      const params: Record<string, string> = {
        limit: '200',
        dateFrom,
        dateTo,
      };
      if (filters.type) params.type = filters.type;
      if (filters.source) params.source = filters.source;

      const res = await api.get('/api/u/workouts', { params });
      return res.data.data as WorkoutsData;
    },
    staleTime: 60_000,
  });

  const workouts: Workout[] = data?.items ?? [];

  // Day click handler: opens popover anchored to the clicked cell
  const handleDayClick = (day: Date, rect?: DOMRect) => {
    setSelectedDay(day);
    setAnchorRect(rect);
  };

  const handleClosePopover = () => {
    setSelectedDay(null);
    setAnchorRect(undefined);
  };

  // Month navigation
  const goToPrevMonth = () => setCurrentMonth((m) => subMonths(m, 1));
  const goToNextMonth = () => setCurrentMonth((m) => addMonths(m, 1));

  return (
    <div className="space-y-4">
      {/* Header: month navigation + sub-toggles */}
      <div className="flex items-center justify-between">
        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPrevMonth}
            className="p-1.5 rounded-md hover:bg-ink-hover transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} className="text-ink-secondary" />
          </button>
          <h2 className="text-ink-primary font-medium text-sm min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            type="button"
            onClick={goToNextMonth}
            className="p-1.5 rounded-md hover:bg-ink-hover transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={18} className="text-ink-secondary" />
          </button>
        </div>

        {/* Grid/Heatmap toggle (monthly mode only) */}
        {calendarMode === 'monthly' && (
          <div className="flex items-center gap-1 bg-ink-well rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setMonthlyDisplayMode('grid')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                monthlyDisplayMode === 'grid'
                  ? 'bg-ink-raised text-ink-primary'
                  : 'text-ink-tertiary hover:text-ink-secondary'
              }`}
            >
              <Grid3X3 size={13} />
              Grid
            </button>
            <button
              type="button"
              onClick={() => setMonthlyDisplayMode('heatmap')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                monthlyDisplayMode === 'heatmap'
                  ? 'bg-ink-raised text-ink-primary'
                  : 'text-ink-tertiary hover:text-ink-secondary'
              }`}
            >
              <BarChart3 size={13} />
              Heatmap
            </button>
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="bg-ink-base rounded-xl border border-ink-border p-4">
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-md bg-ink-raised animate-shimmer" />
            ))}
          </div>
        </div>
      )}

      {/* Calendar content */}
      {!isLoading && calendarMode === 'monthly' && monthlyDisplayMode === 'grid' && (
        <MonthlyCalendar month={currentMonth} workouts={workouts} onDayClick={handleDayClick} />
      )}

      {!isLoading && calendarMode === 'monthly' && monthlyDisplayMode === 'heatmap' && (
        <HeatmapGrid month={currentMonth} workouts={workouts} />
      )}

      {!isLoading && calendarMode === 'weekly' && (
        <WeeklyTimeline month={currentMonth} workouts={workouts} />
      )}

      {/* Day popover */}
      {selectedDay && (
        <DayPopover
          day={selectedDay}
          workouts={workouts}
          onClose={handleClosePopover}
          anchorRect={anchorRect}
        />
      )}
    </div>
  );
}

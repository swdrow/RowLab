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
import { IconChevronLeft, IconChevronRight, IconGrid, IconBarChart } from '@/components/icons';

import { TabToggle } from '@/components/ui/TabToggle';
import { useAuth } from '@/features/auth/useAuth';
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
  const { isAuthenticated } = useAuth();
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
    enabled: isAuthenticated,
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
            className="p-1.5 rounded-md hover:bg-void-overlay transition-colors"
            aria-label="Previous month"
          >
            <IconChevronLeft width={18} height={18} className="text-text-dim" />
          </button>
          <h2 className="text-text-bright font-display font-medium text-sm min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            type="button"
            onClick={goToNextMonth}
            className="p-1.5 rounded-md hover:bg-void-overlay transition-colors"
            aria-label="Next month"
          >
            <IconChevronRight width={18} height={18} className="text-text-dim" />
          </button>
        </div>

        {/* Grid/Heatmap toggle (monthly mode only) */}
        {calendarMode === 'monthly' && (
          <TabToggle
            tabs={[
              { id: 'grid', label: 'Grid', icon: <IconGrid width={13} height={13} /> },
              { id: 'heatmap', label: 'Heatmap', icon: <IconBarChart width={13} height={13} /> },
            ]}
            activeTab={monthlyDisplayMode}
            onTabChange={(id) => setMonthlyDisplayMode(id as 'grid' | 'heatmap')}
            layoutId="calendar-display-toggle"
            size="sm"
          />
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="bg-void-surface rounded-xl border border-edge-default p-4">
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-md bg-void-raised animate-shimmer" />
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

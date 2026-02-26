/**
 * CalendarView -- Monthly/weekly/daily calendar for training events.
 *
 * Wraps react-big-calendar with dateFnsLocalizer and a dark-theme
 * override that matches the oarbit design system.
 */
import { useCallback, useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, type Event, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { useQuery } from '@tanstack/react-query';
import { calendarEventsOptions } from '../api';
import type { CalendarEvent, Intensity, WorkoutType } from '../types';

// react-big-calendar base CSS (imported once)
import 'react-big-calendar/lib/css/react-big-calendar.css';

// ---------------------------------------------------------------------------
// Localizer setup (date-fns v4)
// ---------------------------------------------------------------------------

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Monday start
  getDay,
  locales,
});

// ---------------------------------------------------------------------------
// Event color mapping
// ---------------------------------------------------------------------------

const WORKOUT_TYPE_COLORS: Record<WorkoutType, string> = {
  erg: 'oklch(0.55 0.06 195)', // accent-teal
  row: 'oklch(0.55 0.07 200)', // machine-otw
  cross_train: 'oklch(0.72 0.17 142)', // data-excellent green
  strength: 'oklch(0.75 0.14 75)', // data-warning amber
  rest: 'oklch(0.435 0.005 285)', // text-tertiary
};

const INTENSITY_OPACITY: Record<Intensity, number> = {
  easy: 0.6,
  moderate: 0.8,
  hard: 1.0,
  max: 1.0,
};

function getEventColor(event: CalendarEvent): string {
  const base = event.workoutType ? WORKOUT_TYPE_COLORS[event.workoutType] : 'oklch(0.55 0.18 255)';
  return base;
}

function getEventOpacity(event: CalendarEvent): number {
  return event.intensity ? INTENSITY_OPACITY[event.intensity] : 0.85;
}

// ---------------------------------------------------------------------------
// Custom event component
// ---------------------------------------------------------------------------

interface EventComponentProps {
  event: Event & { resource?: CalendarEvent };
}

function EventComponent({ event }: EventComponentProps) {
  const calEvent = event.resource;
  if (!calEvent) {
    return <span className="text-xs truncate">{event.title}</span>;
  }

  const color = getEventColor(calEvent);
  const opacity = getEventOpacity(calEvent);
  const isMax = calEvent.intensity === 'max';

  return (
    <div
      className="flex items-center gap-1 px-1 py-0.5 text-xs leading-tight truncate"
      style={{ opacity }}
    >
      {isMax && <span className="shrink-0 text-[10px]">*</span>}
      <span
        className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="truncate">{event.title}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom toolbar component
// ---------------------------------------------------------------------------

interface ToolbarProps {
  label: string;
  view: View;
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
  onView: (view: View) => void;
}

function Toolbar({ label, view, onNavigate, onView }: ToolbarProps) {
  const views: { key: View; label: string }[] = [
    { key: 'month', label: 'Month' },
    { key: 'week', label: 'Week' },
    { key: 'day', label: 'Day' },
  ];

  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onNavigate('TODAY')}
          className="px-3 py-1.5 text-xs font-medium rounded-md
                     bg-void-raised text-text-default hover:bg-void-overlay
                     transition-colors"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => onNavigate('PREV')}
          className="p-1.5 rounded-md text-text-dim hover:text-text-default
                     hover:bg-void-overlay transition-colors"
          aria-label="Previous"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('NEXT')}
          className="p-1.5 rounded-md text-text-dim hover:text-text-default
                     hover:bg-void-overlay transition-colors"
          aria-label="Next"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 4L10 8L6 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h2 className="text-sm font-display font-semibold text-text-bright ml-1">{label}</h2>
      </div>

      <div className="flex rounded-lg border border-edge-default overflow-hidden">
        {views.map(({ key, label: vLabel }) => (
          <button
            key={key}
            type="button"
            onClick={() => onView(key)}
            className={`px-3 py-1 text-xs font-medium transition-colors
              ${
                view === key
                  ? 'bg-accent-teal text-text-bright'
                  : 'bg-void-surface text-text-dim hover:text-text-default hover:bg-void-raised'
              }`}
          >
            {vLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CalendarView props
// ---------------------------------------------------------------------------

export interface CalendarViewProps {
  /** Called when an empty time slot is selected (for creating a workout). */
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  /** Called when an existing event is clicked. */
  onSelectEvent?: (event: CalendarEvent) => void;
  /** External events to merge (e.g., from parent page). */
  externalEvents?: CalendarEvent[];
  /** CSS class for the wrapper. */
  className?: string;
}

// ---------------------------------------------------------------------------
// CalendarView component
// ---------------------------------------------------------------------------

export default function CalendarView({
  onSelectSlot,
  onSelectEvent,
  externalEvents,
  className,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [currentView, setCurrentView] = useState<View>('month');

  // Compute date range for the current view (with some buffer for month edges)
  const dateRange = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return {
      startDate: addDays(monthStart, -7).toISOString().slice(0, 10),
      endDate: addDays(monthEnd, 7).toISOString().slice(0, 10),
    };
  }, [currentDate]);

  // Fetch events from the API
  const { data: apiEvents = [] } = useQuery(
    calendarEventsOptions({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    })
  );

  // Merge API events with any external events
  const allEvents = useMemo(() => {
    const merged = [...apiEvents];
    if (externalEvents) {
      merged.push(...externalEvents);
    }
    return merged;
  }, [apiEvents, externalEvents]);

  // Transform CalendarEvent[] to react-big-calendar Event[]
  const rbcEvents = useMemo(
    () =>
      allEvents.map((ev) => ({
        title: ev.title,
        start: new Date(ev.start),
        end: new Date(ev.end),
        allDay: true,
        resource: ev,
      })),
    [allEvents]
  );

  // Event style getter
  const eventStyleGetter = useCallback((event: Event & { resource?: CalendarEvent }) => {
    const calEvent = event.resource;
    if (!calEvent) return {};

    const color = getEventColor(calEvent);
    const opacity = getEventOpacity(calEvent);
    const isCompleted = calEvent.isCompleted;

    return {
      style: {
        backgroundColor: color,
        opacity,
        borderRadius: '4px',
        border: 'none',
        color: 'oklch(0.965 0.005 285)',
        fontSize: '0.75rem',
        padding: '1px 4px',
        textDecoration: isCompleted ? 'line-through' : 'none',
      },
    };
  }, []);

  // Handlers
  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date }) => {
      onSelectSlot?.(slotInfo);
    },
    [onSelectSlot]
  );

  const handleSelectEvent = useCallback(
    (event: Event & { resource?: CalendarEvent }) => {
      if (event.resource && onSelectEvent) {
        onSelectEvent(event.resource);
      }
    },
    [onSelectEvent]
  );

  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const handleView = useCallback((view: View) => {
    setCurrentView(view);
  }, []);

  return (
    <div className={`calendar-view-wrapper ${className ?? ''}`}>
      <style>{calendarDarkTheme}</style>
      <Calendar
        localizer={localizer}
        events={rbcEvents}
        date={currentDate}
        view={currentView}
        onNavigate={handleNavigate}
        onView={handleView}
        views={['month', 'week', 'day']}
        selectable={!!onSelectSlot}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
        components={{
          event: EventComponent,
          toolbar: Toolbar,
        }}
        popup
        style={{ minHeight: 600 }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dark theme CSS override (scoped under .calendar-view-wrapper)
// ---------------------------------------------------------------------------

const calendarDarkTheme = `
.calendar-view-wrapper .rbc-calendar {
  font-family: var(--font-body);
  color: oklch(0.72 0.005 285);
}

/* Header row (day names) */
.calendar-view-wrapper .rbc-header {
  padding: 6px 8px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: oklch(0.505 0.005 285);
  border-bottom: 1px solid oklch(0.315 0.005 285 / 0.4);
  border-left: none;
  background: oklch(0.17 0.005 285);
}

.calendar-view-wrapper .rbc-header + .rbc-header {
  border-left: 1px solid oklch(0.315 0.005 285 / 0.2);
}

/* Month view cells */
.calendar-view-wrapper .rbc-month-view {
  border: 1px solid oklch(0.315 0.005 285 / 0.4);
  border-radius: 8px;
  overflow: hidden;
  background: oklch(0.145 0.005 285);
}

.calendar-view-wrapper .rbc-month-row {
  border-top: 1px solid oklch(0.315 0.005 285 / 0.2);
}

.calendar-view-wrapper .rbc-month-row + .rbc-month-row {
  border-top: 1px solid oklch(0.315 0.005 285 / 0.2);
}

.calendar-view-wrapper .rbc-day-bg {
  border-left: 1px solid oklch(0.315 0.005 285 / 0.2);
  transition: background-color 0.15s;
}

.calendar-view-wrapper .rbc-day-bg + .rbc-day-bg {
  border-left: 1px solid oklch(0.315 0.005 285 / 0.2);
}

.calendar-view-wrapper .rbc-day-bg:hover {
  background: oklch(0.195 0.005 285 / 0.5);
}

.calendar-view-wrapper .rbc-today {
  background: oklch(0.62 0.12 55 / 0.08);
}

.calendar-view-wrapper .rbc-off-range-bg {
  background: oklch(0.12 0.005 285);
}

/* Date number in cells */
.calendar-view-wrapper .rbc-date-cell {
  padding: 4px 8px;
  font-size: 0.75rem;
  color: oklch(0.595 0.005 285);
  text-align: right;
}

.calendar-view-wrapper .rbc-date-cell.rbc-now {
  font-weight: 700;
  color: oklch(0.62 0.12 55);
}

.calendar-view-wrapper .rbc-off-range {
  color: oklch(0.375 0.005 285);
}

/* Event rows */
.calendar-view-wrapper .rbc-event {
  border-radius: 4px;
  border: none;
  font-size: 0.75rem;
  padding: 1px 4px;
}

.calendar-view-wrapper .rbc-event:focus {
  outline: 2px solid oklch(0.62 0.12 55 / 0.6);
  outline-offset: 1px;
}

.calendar-view-wrapper .rbc-event-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Show more link */
.calendar-view-wrapper .rbc-show-more {
  font-size: 0.6875rem;
  color: oklch(0.62 0.12 55);
  font-weight: 500;
  padding: 2px 8px;
  background: transparent;
}

.calendar-view-wrapper .rbc-show-more:hover {
  color: oklch(0.72 0.12 55);
}

/* Week / Day views */
.calendar-view-wrapper .rbc-time-view {
  border: 1px solid oklch(0.315 0.005 285 / 0.4);
  border-radius: 8px;
  overflow: hidden;
  background: oklch(0.145 0.005 285);
}

.calendar-view-wrapper .rbc-time-header-content {
  border-left: 1px solid oklch(0.315 0.005 285 / 0.2);
}

.calendar-view-wrapper .rbc-time-content {
  border-top: 1px solid oklch(0.315 0.005 285 / 0.3);
}

.calendar-view-wrapper .rbc-timeslot-group {
  border-bottom: 1px solid oklch(0.315 0.005 285 / 0.15);
  min-height: 48px;
}

.calendar-view-wrapper .rbc-time-slot {
  border-top: none;
}

.calendar-view-wrapper .rbc-day-slot .rbc-time-slot {
  border-top: 1px solid oklch(0.315 0.005 285 / 0.08);
}

.calendar-view-wrapper .rbc-time-gutter {
  font-size: 0.6875rem;
  color: oklch(0.435 0.005 285);
}

.calendar-view-wrapper .rbc-label {
  padding: 0 8px;
  font-size: 0.6875rem;
  color: oklch(0.435 0.005 285);
}

.calendar-view-wrapper .rbc-current-time-indicator {
  background-color: oklch(0.62 0.12 55);
  height: 2px;
}

/* Day slot events */
.calendar-view-wrapper .rbc-day-slot .rbc-event {
  border: none;
  border-radius: 4px;
}

/* Selected slot highlight */
.calendar-view-wrapper .rbc-slot-selection {
  background: oklch(0.62 0.12 55 / 0.2);
  border: 1px dashed oklch(0.62 0.12 55 / 0.5);
  border-radius: 4px;
}

/* Popup overlay ("+N more" dropdown) */
.calendar-view-wrapper .rbc-overlay {
  background: oklch(0.195 0.005 285);
  border: 1px solid oklch(0.315 0.005 285 / 0.5);
  border-radius: 8px;
  box-shadow: 0 4px 24px oklch(0 0 0 / 0.4);
  padding: 8px;
  z-index: 50;
}

.calendar-view-wrapper .rbc-overlay-header {
  font-size: 0.75rem;
  font-weight: 600;
  color: oklch(0.88 0.005 285);
  padding: 4px 8px 8px;
  border-bottom: 1px solid oklch(0.315 0.005 285 / 0.3);
  margin-bottom: 4px;
}

/* Agenda view */
.calendar-view-wrapper .rbc-agenda-view {
  border: 1px solid oklch(0.315 0.005 285 / 0.4);
  border-radius: 8px;
  overflow: hidden;
}

.calendar-view-wrapper .rbc-agenda-view table.rbc-agenda-table {
  border: none;
}

.calendar-view-wrapper .rbc-agenda-view table.rbc-agenda-table thead > tr > th {
  padding: 8px 12px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: oklch(0.505 0.005 285);
  border-bottom: 1px solid oklch(0.315 0.005 285 / 0.4);
  background: oklch(0.17 0.005 285);
}

.calendar-view-wrapper .rbc-agenda-view table.rbc-agenda-table tbody > tr > td {
  padding: 6px 12px;
  border-top: 1px solid oklch(0.315 0.005 285 / 0.15);
  font-size: 0.8125rem;
}

.calendar-view-wrapper .rbc-agenda-date-cell,
.calendar-view-wrapper .rbc-agenda-time-cell {
  white-space: nowrap;
  color: oklch(0.595 0.005 285);
}

.calendar-view-wrapper .rbc-agenda-event-cell {
  color: oklch(0.72 0.005 285);
}

/* Remove default blue button styles */
.calendar-view-wrapper .rbc-btn-group button {
  color: oklch(0.72 0.005 285);
  background: oklch(0.195 0.005 285);
  border: 1px solid oklch(0.315 0.005 285 / 0.4);
}

.calendar-view-wrapper .rbc-btn-group button:hover {
  background: oklch(0.275 0.005 285);
}

.calendar-view-wrapper .rbc-btn-group button.rbc-active {
  background: oklch(0.62 0.12 55);
  color: oklch(0.965 0.005 285);
  border-color: oklch(0.62 0.12 55);
}

/* Selected cell */
.calendar-view-wrapper .rbc-selected-cell {
  background: oklch(0.62 0.12 55 / 0.12);
}
`;

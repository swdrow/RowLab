import { useMemo, useState, useEffect, useCallback } from 'react';
// @ts-expect-error - react-big-calendar has no types
import { Calendar, Views, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isSameDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { RaceDayEvent, RaceDayEventType } from '../../types/regatta';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

type DayTimelineProps = {
  raceDate: Date;
  events: RaceDayEvent[];
  onSelectEvent?: (event: RaceDayEvent) => void;
};

const EVENT_COLORS: Record<RaceDayEventType, string> = {
  race: 'var(--accent-primary)',
  warmup: '#10b981',      // green
  checkin: '#f59e0b',     // amber
  'equipment-prep': '#8b5cf6', // purple
};

export function DayTimeline({ raceDate, events, onSelectEvent }: DayTimelineProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Memoize events to prevent unnecessary re-renders
  const calendarEvents = useMemo(() => {
    return events.map(event => ({
      ...event,
      title: event.title,
      start: event.start,
      end: event.end,
      resource: event,
    }));
  }, [events]);

  const eventStyleGetter = useCallback((event: any) => {
    const type = event.resource?.type as RaceDayEventType;
    return {
      style: {
        backgroundColor: EVENT_COLORS[type] || EVENT_COLORS.race,
        borderRadius: '4px',
        border: 'none',
        color: 'white',
        fontSize: '0.75rem',
        padding: '2px 6px',
        fontWeight: 500,
      },
    };
  }, []);

  const handleSelectEvent = useCallback((event: any) => {
    if (onSelectEvent && event.resource) {
      onSelectEvent(event.resource);
    }
  }, [onSelectEvent]);

  // Calculate position for current time marker
  const showCurrentTime = isSameDay(currentTime, raceDate);
  const currentTimePosition = useMemo(() => {
    if (!showCurrentTime) return null;
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    // Calendar runs 6am to 8pm = 14 hours = 840 minutes
    const startMinutes = 6 * 60;
    const endMinutes = 20 * 60;
    const totalMinutes = endMinutes - startMinutes;
    const currentMinutes = hours * 60 + minutes - startMinutes;
    const percentage = (currentMinutes / totalMinutes) * 100;
    return Math.max(0, Math.min(100, percentage));
  }, [currentTime, showCurrentTime]);

  return (
    <div className="relative h-[600px] day-timeline">
      <Calendar
        localizer={localizer}
        date={raceDate}
        view={Views.DAY}
        onView={() => {}} // Lock to day view
        onNavigate={() => {}} // No navigation
        events={calendarEvents}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={handleSelectEvent}
        step={15}
        timeslots={4}
        min={new Date(raceDate.getFullYear(), raceDate.getMonth(), raceDate.getDate(), 6, 0, 0)}
        max={new Date(raceDate.getFullYear(), raceDate.getMonth(), raceDate.getDate(), 20, 0, 0)}
        toolbar={false}
        className="v2-day-timeline"
      />

      {/* Current time marker */}
      {showCurrentTime && currentTimePosition !== null && (
        <div
          className="absolute left-16 right-0 pointer-events-none z-10"
          style={{ top: `${currentTimePosition}%` }}
        >
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5" />
            <div className="flex-1 h-0.5 bg-red-500" />
          </div>
          <span className="absolute -top-3 left-4 text-xs font-medium text-red-500 bg-surface-default px-1">
            {format(currentTime, 'h:mm a')}
          </span>
        </div>
      )}

      {/* Custom styles */}
      <style>{`
        .day-timeline .rbc-calendar {
          background: var(--surface-default);
          color: var(--txt-primary);
          border-radius: 8px;
          border: 1px solid var(--bdr-default);
        }

        .day-timeline .rbc-time-view {
          border: none;
        }

        .day-timeline .rbc-time-header {
          display: none; /* Hide header for day view */
        }

        .day-timeline .rbc-time-content {
          border-top: none;
        }

        .day-timeline .rbc-time-slot {
          border-color: var(--bdr-subtle);
          min-height: 25px;
        }

        .day-timeline .rbc-time-gutter {
          background: var(--surface-elevated);
          border-right: 1px solid var(--bdr-default);
        }

        .day-timeline .rbc-label {
          font-size: 0.75rem;
          color: var(--txt-tertiary);
          padding: 0 8px;
        }

        .day-timeline .rbc-current-time-indicator {
          display: none; /* We use custom marker */
        }

        .day-timeline .rbc-event {
          cursor: pointer;
        }

        .day-timeline .rbc-event:hover {
          opacity: 0.9;
          transform: scale(1.01);
          transition: all 0.15s ease;
        }

        .day-timeline .rbc-day-slot .rbc-event-content {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
}

// Event type legend
export function TimelineLegend() {
  const items: Array<{ type: RaceDayEventType; label: string }> = [
    { type: 'race', label: 'Race' },
    { type: 'warmup', label: 'Warmup' },
    { type: 'checkin', label: 'Check-in' },
    { type: 'equipment-prep', label: 'Equipment' },
  ];

  return (
    <div className="flex items-center gap-4 text-sm">
      {items.map(({ type, label }) => (
        <div key={type} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: EVENT_COLORS[type] }}
          />
          <span className="text-txt-secondary">{label}</span>
        </div>
      ))}
    </div>
  );
}

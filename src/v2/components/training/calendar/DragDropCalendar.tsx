// src/v2/components/training/calendar/DragDropCalendar.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import withDragAndDrop, { withDragAndDropProps } from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

import { CalendarToolbar } from './CalendarToolbar';
import { WorkoutEventCard, getEventStyle } from './WorkoutEventCard';
import { useCalendarEvents, useRescheduleWorkout } from '../../../hooks/useWorkouts';
import { getMonthBounds, getWeekBounds } from '../../../utils/calendarHelpers';
import type { CalendarEvent } from '../../../types/training';

// Setup date-fns localizer
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Apply drag-and-drop HOC to Calendar
const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar);

interface DragDropCalendarProps {
  planId?: string;
  onSelectEvent?: (event: CalendarEvent) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  onRescheduleSuccess?: (workoutId: string, newDate: Date) => void;
  onRescheduleError?: (error: Error) => void;
  className?: string;
}

/**
 * Training calendar with drag-drop rescheduling support.
 * Uses react-big-calendar's drag-drop addon with optimistic updates.
 */
export function DragDropCalendar({
  planId,
  onSelectEvent,
  onSelectSlot,
  onRescheduleSuccess,
  onRescheduleError,
  className = '',
}: DragDropCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('month');
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);

  // Calculate date range based on current view
  const dateRange = useMemo(() => {
    if (view === 'week') {
      return getWeekBounds(currentDate);
    }
    const monthBounds = getMonthBounds(currentDate);
    return {
      start: subMonths(monthBounds.start, 0),
      end: addMonths(monthBounds.end, 0),
    };
  }, [currentDate, view]);

  // Fetch calendar events
  const { events, isLoading, error } = useCalendarEvents(
    dateRange.start,
    dateRange.end,
    planId
  );

  // Reschedule mutation with optimistic update
  const { rescheduleWorkout, isRescheduling } = useRescheduleWorkout();

  // Handle navigation
  const handleNavigate = useCallback((newDate: Date) => {
    setCurrentDate(newDate);
  }, []);

  // Handle view change
  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    if (!draggingEvent) {
      onSelectEvent?.(event);
    }
  }, [onSelectEvent, draggingEvent]);

  // Handle slot selection (for creating new events)
  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date; action: string }) => {
    if (slotInfo.action === 'click' || slotInfo.action === 'select') {
      onSelectSlot?.({ start: slotInfo.start, end: slotInfo.end });
    }
  }, [onSelectSlot]);

  // Handle drag start
  const handleDragStart = useCallback((args: { event: CalendarEvent }) => {
    setDraggingEvent(args.event);
  }, []);

  // Handle event drop (reschedule)
  const handleEventDrop = useCallback(
    ({ event, start, end, isAllDay }: withDragAndDropProps<CalendarEvent>['onEventDrop'] extends ((args: infer A) => any) ? A : never) => {
      setDraggingEvent(null);

      // Get the workout ID from the event
      const workoutId = event.resource?.workoutId || event.id;
      if (!workoutId) {
        console.error('No workout ID found for event:', event);
        return;
      }

      // Get the planId from the event resource (REQUIRED for reschedule API)
      const eventPlanId = event.resource?.planId;
      if (!eventPlanId) {
        console.error('No planId found for event:', event);
        return;
      }

      // Don't reschedule recurring event instances (need to edit the parent)
      if (event.resource?.isRecurring && event.resource?.parentId) {
        // For now, show a message that recurring events can't be dragged
        // Future: could open a dialog to edit the series or this instance
        console.warn('Cannot reschedule recurring event instance. Edit the parent event instead.');
        return;
      }

      const newDate = start as Date;

      // Trigger the reschedule mutation with planId (optimistic update handled by hook)
      rescheduleWorkout(
        { id: workoutId, planId: eventPlanId, scheduledDate: newDate },
        {
          onSuccess: () => {
            onRescheduleSuccess?.(workoutId, newDate);
          },
          onError: (err) => {
            console.error('Failed to reschedule workout:', err);
            onRescheduleError?.(err as Error);
          },
        }
      );
    },
    [rescheduleWorkout, onRescheduleSuccess, onRescheduleError]
  );

  // Handle event resize (change duration)
  const handleEventResize = useCallback(
    ({ event, start, end }: withDragAndDropProps<CalendarEvent>['onEventResize'] extends ((args: infer A) => any) ? A : never) => {
      // For now, we only support rescheduling (moving events)
      // Resizing would require updating duration, which is a more complex operation
      // Could be added in a future plan if needed
      console.log('Event resize not implemented:', event.title);
    },
    []
  );

  // Determine if an event is draggable
  const draggableAccessor = useCallback((event: CalendarEvent) => {
    // Recurring event instances can't be dragged individually
    if (event.resource?.isRecurring && event.resource?.parentId) {
      return false;
    }
    // Must have planId to be draggable (required for reschedule API)
    if (!event.resource?.planId) {
      return false;
    }
    return true;
  }, []);

  // Determine if an event is resizable
  const resizableAccessor = useCallback(() => {
    // Disable resizing for now
    return false;
  }, []);

  // Custom components
  const components = useMemo(() => ({
    toolbar: CalendarToolbar,
    event: WorkoutEventCard,
  }), []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-txt-tertiary">
        <p>Failed to load calendar events</p>
      </div>
    );
  }

  return (
    <div className={`drag-drop-calendar ${className}`}>
      {/* Loading overlay */}
      {(isLoading || isRescheduling) && (
        <div className="absolute inset-0 bg-surface-default/50 flex items-center justify-center z-10 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-primary" />
            {isRescheduling && (
              <span className="text-sm text-txt-secondary">Rescheduling...</span>
            )}
          </div>
        </div>
      )}

      <div className="h-[600px] relative">
        <DnDCalendar
          localizer={localizer}
          events={events}
          view={view}
          date={currentDate}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          onDragStart={handleDragStart}
          draggableAccessor={draggableAccessor}
          resizableAccessor={resizableAccessor}
          selectable
          resizable={false}
          components={components}
          eventPropGetter={getEventStyle}
          popup
          showMultiDayTimes
          step={30}
          timeslots={2}
          formats={{
            timeGutterFormat: 'h:mm a',
            eventTimeRangeFormat: ({ start, end }, culture, local) =>
              `${local.format(start, 'h:mm a', culture)} - ${local.format(end, 'h:mm a', culture)}`,
          }}
        />
      </div>

      {/* Dragging indicator */}
      {draggingEvent && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-surface-elevated
                        text-txt-primary text-sm rounded-lg shadow-lg border border-bdr-default z-50">
          Moving: <span className="font-medium">{draggingEvent.title}</span>
        </div>
      )}

      {/* Calendar Custom Styles - Same as TrainingCalendar plus drag-drop styles */}
      <style jsx global>{`
        .drag-drop-calendar .rbc-calendar {
          font-family: inherit;
          background-color: var(--surface-default);
          border: 1px solid var(--bdr-default);
          border-radius: 0.5rem;
        }

        .drag-drop-calendar .rbc-header {
          padding: 0.75rem 0.5rem;
          font-weight: 500;
          color: var(--txt-secondary);
          border-bottom: 1px solid var(--bdr-default);
        }

        .drag-drop-calendar .rbc-month-view,
        .drag-drop-calendar .rbc-time-view {
          border: none;
        }

        .drag-drop-calendar .rbc-day-bg {
          background-color: var(--surface-default);
        }

        .drag-drop-calendar .rbc-day-bg + .rbc-day-bg,
        .drag-drop-calendar .rbc-month-row + .rbc-month-row {
          border-color: var(--bdr-default);
        }

        .drag-drop-calendar .rbc-off-range-bg {
          background-color: var(--surface-sunken);
        }

        .drag-drop-calendar .rbc-today {
          background-color: var(--accent-primary-faint, rgba(59, 130, 246, 0.1));
        }

        .drag-drop-calendar .rbc-date-cell {
          padding: 0.25rem 0.5rem;
          text-align: right;
        }

        .drag-drop-calendar .rbc-date-cell > a {
          color: var(--txt-primary);
        }

        .drag-drop-calendar .rbc-date-cell.rbc-now > a {
          color: var(--accent-primary);
          font-weight: 600;
        }

        .drag-drop-calendar .rbc-event {
          border-radius: 4px;
          padding: 0;
          font-size: 0.75rem;
        }

        .drag-drop-calendar .rbc-event:focus {
          outline: 2px solid var(--accent-primary);
          outline-offset: 1px;
        }

        /* Drag-drop specific styles */
        .drag-drop-calendar .rbc-addons-dnd-drag-preview {
          opacity: 0.7;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .drag-drop-calendar .rbc-addons-dnd-dragged-event {
          opacity: 0.3;
        }

        .drag-drop-calendar .rbc-addons-dnd-over-drop-zone {
          background-color: var(--accent-primary-faint, rgba(59, 130, 246, 0.15)) !important;
        }

        .drag-drop-calendar .rbc-addons-dnd-row-body {
          position: relative;
        }

        .drag-drop-calendar .rbc-time-header {
          border-bottom: 1px solid var(--bdr-default);
        }

        .drag-drop-calendar .rbc-time-content {
          border-top: none;
        }

        .drag-drop-calendar .rbc-time-slot {
          border-top: 1px solid var(--bdr-subtle, rgba(255,255,255,0.05));
        }

        .drag-drop-calendar .rbc-timeslot-group {
          border-bottom: 1px solid var(--bdr-default);
        }

        .drag-drop-calendar .rbc-time-gutter {
          color: var(--txt-tertiary);
          font-size: 0.75rem;
        }

        .drag-drop-calendar .rbc-current-time-indicator {
          background-color: var(--accent-destructive, #ef4444);
        }

        .drag-drop-calendar .rbc-show-more {
          color: var(--accent-primary);
          font-size: 0.75rem;
          font-weight: 500;
        }

        /* Dark mode adjustments */
        .v2[data-theme="dark"] .drag-drop-calendar .rbc-day-bg {
          background-color: var(--surface-default);
        }

        .v2[data-theme="dark"] .drag-drop-calendar .rbc-addons-dnd-drag-preview {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
}

export default DragDropCalendar;

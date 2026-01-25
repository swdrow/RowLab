// src/v2/components/training/calendar/WorkoutEventCard.tsx

import React from 'react';
import type { CalendarEvent, WorkoutType, IntensityLevel } from '../../../types/training';
import { getWorkoutTypeColor } from '../../../utils/calendarHelpers';

interface WorkoutEventCardProps {
  event: CalendarEvent;
}

/**
 * Custom event component for react-big-calendar.
 * Displays workout name with type-based color coding.
 */
export function WorkoutEventCard({ event }: WorkoutEventCardProps) {
  const workoutType = event.resource?.type || 'row';
  const intensity = event.resource?.intensity;
  const tss = event.resource?.tss;
  const isRecurring = event.resource?.isRecurring;

  const bgColor = getWorkoutTypeColor(workoutType);

  return (
    <div
      className="h-full px-1.5 py-0.5 rounded text-xs overflow-hidden"
      style={{ backgroundColor: bgColor }}
      title={`${event.title}${tss ? ` | TSS: ${tss}` : ''}${intensity ? ` | ${intensity}` : ''}`}
    >
      <div className="flex items-center gap-1">
        {isRecurring && (
          <svg className="w-3 h-3 flex-shrink-0 opacity-70" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        )}
        <span className="truncate font-medium text-white">
          {event.title}
        </span>
      </div>
      {tss && (
        <div className="text-[10px] text-white/80 truncate">
          TSS: {tss}
        </div>
      )}
    </div>
  );
}

/**
 * Wrapper for react-big-calendar eventPropGetter
 */
export function getEventStyle(event: CalendarEvent) {
  const workoutType = event.resource?.type || 'row';
  const bgColor = getWorkoutTypeColor(workoutType);

  return {
    style: {
      backgroundColor: bgColor,
      borderColor: bgColor,
      color: '#fff',
      borderRadius: '4px',
      border: 'none',
      padding: '2px 4px',
    },
  };
}

export default WorkoutEventCard;

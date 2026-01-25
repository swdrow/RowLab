// src/v2/components/training/compliance/AttendanceTrainingLinkPanel.tsx

import React, { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { useAttendanceTrainingLink } from '../../../hooks/useNcaaCompliance';

interface AttendanceTrainingLinkPanelProps {
  onAthleteClick?: (athleteId: string) => void;
  className?: string;
}

/**
 * Panel showing attendance linked to scheduled training sessions (ATT-04).
 * Shows which athletes attended which scheduled workouts on a given date.
 */
export function AttendanceTrainingLinkPanel({
  onAthleteClick,
  className = '',
}: AttendanceTrainingLinkPanelProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { records, isLoading, error } = useAttendanceTrainingLink(selectedDate);

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate((prev) => direction === 'next' ? addDays(prev, 1) : subDays(prev, 1));
  };

  if (error) {
    return (
      <div className={`p-4 text-center text-txt-tertiary ${className}`}>
        Failed to load attendance-training link data
      </div>
    );
  }

  return (
    <div className={`attendance-training-link-panel ${className}`}>
      {/* Header with date navigation */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-txt-primary">
          Training Attendance
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 text-txt-secondary hover:text-txt-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center min-w-[140px]">
            <div className="text-sm font-medium text-txt-primary">
              {format(selectedDate, 'EEE, MMM d, yyyy')}
            </div>
          </div>
          <button
            onClick={() => navigateDate('next')}
            className="p-2 text-txt-secondary hover:text-txt-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-primary" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-8 text-txt-tertiary">
          <svg className="w-12 h-12 mx-auto mb-3 text-txt-tertiary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>No scheduled training sessions for this date</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record: any) => (
            <div
              key={record.sessionId || record.workoutId}
              className="p-4 bg-surface-elevated rounded-lg border border-bdr-default"
            >
              {/* Session header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-txt-primary">
                    {record.sessionName || record.workoutName || 'Training Session'}
                  </h4>
                  <p className="text-sm text-txt-secondary">
                    {record.scheduledTime && format(new Date(record.scheduledTime), 'h:mm a')}
                    {record.duration && ` - ${record.duration} min`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-txt-primary">
                    {record.attendedCount || 0}/{record.expectedCount || 0}
                  </div>
                  <div className="text-xs text-txt-tertiary">attended</div>
                </div>
              </div>

              {/* Attendance list */}
              {record.athletes && record.athletes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-bdr-default">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {record.athletes.map((athlete: any) => (
                      <button
                        key={athlete.id}
                        onClick={() => onAthleteClick?.(athlete.id)}
                        className={`flex items-center gap-2 p-2 rounded-md text-sm transition-colors
                          ${athlete.attended
                            ? 'bg-accent-success/10 text-accent-success hover:bg-accent-success/20'
                            : 'bg-surface-sunken text-txt-tertiary hover:bg-surface-elevated'
                          }`}
                      >
                        {athlete.attended ? (
                          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className="truncate">{athlete.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary footer */}
              {record.attendedCount < record.expectedCount && (
                <div className="mt-3 pt-3 border-t border-bdr-default text-sm text-accent-warning">
                  {record.expectedCount - record.attendedCount} athlete(s) absent
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AttendanceTrainingLinkPanel;

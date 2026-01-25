// src/v2/components/training/compliance/WeeklyHoursTable.tsx

import React from 'react';
import { parseISO, format, addDays } from 'date-fns';
import { NCAA_WEEKLY_LIMIT, NCAA_WARNING_THRESHOLD } from '../../../utils/ncaaRules';

interface PracticeSession {
  id: string;
  date: string;
  duration: number;
  type: string;
  notes?: string;
}

interface NCAAAuditEntry {
  athleteId: string;
  athleteName: string;
  weekStart: string;
  totalHours: number;
  dailyHours: {
    date: string;
    hours: number;
  }[];
  isNearLimit: boolean;
  isOverLimit: boolean;
  sessions: PracticeSession[];
}

interface WeeklyHoursTableProps {
  entries: NCAAAuditEntry[];
  onAthleteClick?: (athleteId: string) => void;
  className?: string;
}

/**
 * Table showing weekly hours per athlete with NCAA compliance status.
 */
export function WeeklyHoursTable({
  entries,
  onAthleteClick,
  className = '',
}: WeeklyHoursTableProps) {
  if (entries.length === 0) {
    return (
      <div className={`text-center py-8 text-txt-tertiary ${className}`}>
        No compliance data for this week
      </div>
    );
  }

  // Sort by weekly total (highest first to highlight concerns)
  const sortedEntries = [...entries].sort((a, b) => b.totalHours - a.totalHours);

  return (
    <div className={`weekly-hours-table overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-bdr-default">
            <th className="text-left py-3 px-4 text-sm font-medium text-txt-secondary">
              Athlete
            </th>
            <th className="text-center py-3 px-2 text-sm font-medium text-txt-secondary">
              Mon
            </th>
            <th className="text-center py-3 px-2 text-sm font-medium text-txt-secondary">
              Tue
            </th>
            <th className="text-center py-3 px-2 text-sm font-medium text-txt-secondary">
              Wed
            </th>
            <th className="text-center py-3 px-2 text-sm font-medium text-txt-secondary">
              Thu
            </th>
            <th className="text-center py-3 px-2 text-sm font-medium text-txt-secondary">
              Fri
            </th>
            <th className="text-center py-3 px-2 text-sm font-medium text-txt-secondary">
              Sat
            </th>
            <th className="text-center py-3 px-2 text-sm font-medium text-txt-secondary">
              Sun
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-txt-secondary">
              Total
            </th>
            <th className="text-center py-3 px-4 text-sm font-medium text-txt-secondary">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-bdr-default">
          {sortedEntries.map((entry) => {
            const weekStart = parseISO(entry.weekStart);
            const days = Array.from({ length: 7 }, (_, i) => {
              const day = addDays(weekStart, i);
              return format(day, 'yyyy-MM-dd');
            });

            // Convert dailyHours array to map for easier lookup
            const dailyHoursMap = entry.dailyHours.reduce((acc, { date, hours }) => {
              acc[date] = hours;
              return acc;
            }, {} as Record<string, number>);

            return (
              <tr
                key={entry.athleteId}
                className={`hover:bg-surface-elevated/50 transition-colors
                  ${entry.isOverLimit ? 'bg-accent-destructive/10' : ''}
                  ${entry.isNearLimit && !entry.isOverLimit ? 'bg-accent-warning/10' : ''}`}
              >
                <td className="py-3 px-4">
                  <button
                    onClick={() => onAthleteClick?.(entry.athleteId)}
                    className="text-sm font-medium text-txt-primary hover:text-accent-primary transition-colors text-left"
                  >
                    {entry.athleteName}
                  </button>
                </td>
                {days.map((day) => {
                  const hours = dailyHoursMap[day] || 0;
                  const isOverDaily = hours > 4;

                  return (
                    <td
                      key={day}
                      className={`text-center py-3 px-2 text-sm
                        ${isOverDaily ? 'text-accent-destructive font-medium' : 'text-txt-secondary'}
                        ${hours === 0 ? 'text-txt-tertiary' : ''}`}
                    >
                      {hours > 0 ? hours.toFixed(1) : '-'}
                    </td>
                  );
                })}
                <td className={`text-right py-3 px-4 text-sm font-semibold
                  ${entry.isOverLimit ? 'text-accent-destructive' :
                    entry.isNearLimit ? 'text-accent-warning' : 'text-txt-primary'}`}
                >
                  {entry.totalHours.toFixed(1)}h
                </td>
                <td className="text-center py-3 px-4">
                  {entry.isOverLimit ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium
                                     bg-accent-destructive/20 text-accent-destructive rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Over Limit
                    </span>
                  ) : entry.isNearLimit ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium
                                     bg-accent-warning/20 text-accent-warning rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Near Limit
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium
                                     bg-accent-success/20 text-accent-success rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      OK
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 px-4 text-xs text-txt-tertiary">
        <span>NCAA Limits: Daily max 4h, Weekly max {NCAA_WEEKLY_LIMIT}h</span>
        <span>Warning at {NCAA_WARNING_THRESHOLD}h</span>
      </div>
    </div>
  );
}

export default WeeklyHoursTable;

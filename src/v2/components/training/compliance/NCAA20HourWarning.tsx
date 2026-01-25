// src/v2/components/training/compliance/NCAA20HourWarning.tsx

import React from 'react';
import { wouldExceedLimit, NCAA_WEEKLY_LIMIT, NCAA_DAILY_LIMIT } from '../../../utils/ncaaRules';
import type { PracticeSession } from '../../../types/training';

interface NCAA20HourWarningProps {
  athleteId: string;
  athleteName?: string;
  proposedDate: Date;
  proposedDurationMinutes: number;
  isCompetition?: boolean;
  existingSessions: PracticeSession[];
  onProceed?: () => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * Warning component that shows when adding an activity would approach or exceed NCAA limits.
 * Displayed before scheduling a new practice/workout.
 */
export function NCAA20HourWarning({
  athleteId,
  athleteName,
  proposedDate,
  proposedDurationMinutes,
  isCompetition = false,
  existingSessions,
  onProceed,
  onCancel,
  className = '',
}: NCAA20HourWarningProps) {
  const {
    wouldExceedDaily,
    wouldExceedWeekly,
    projectedDailyHours,
    projectedWeeklyHours,
  } = wouldExceedLimit(athleteId, proposedDate, proposedDurationMinutes, isCompetition, existingSessions);

  const hasWarning = wouldExceedDaily || wouldExceedWeekly;
  const isBlocker = wouldExceedDaily || wouldExceedWeekly; // Could be configured to just warn vs block

  if (!hasWarning) {
    return null;
  }

  return (
    <div className={`ncaa-warning p-4 rounded-lg border ${
      wouldExceedWeekly
        ? 'bg-accent-destructive/10 border-accent-destructive/30'
        : 'bg-accent-warning/10 border-accent-warning/30'
    } ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 p-1 rounded-full ${
          wouldExceedWeekly ? 'bg-accent-destructive/20' : 'bg-accent-warning/20'
        }`}>
          <svg
            className={`w-5 h-5 ${wouldExceedWeekly ? 'text-accent-destructive' : 'text-accent-warning'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="flex-1">
          <h4 className={`font-semibold ${
            wouldExceedWeekly ? 'text-accent-destructive' : 'text-accent-warning'
          }`}>
            {wouldExceedWeekly ? 'NCAA 20-Hour Limit Exceeded' : 'Approaching NCAA Limits'}
          </h4>

          <div className="mt-2 space-y-2 text-sm">
            {athleteName && (
              <p className="text-txt-primary">
                <span className="font-medium">{athleteName}</span>
              </p>
            )}

            {wouldExceedDaily && (
              <div className="flex items-center justify-between p-2 bg-surface-default/50 rounded">
                <span className="text-txt-secondary">Projected Daily Hours:</span>
                <span className={`font-semibold ${
                  wouldExceedDaily ? 'text-accent-destructive' : 'text-txt-primary'
                }`}>
                  {projectedDailyHours}h / {NCAA_DAILY_LIMIT}h
                </span>
              </div>
            )}

            <div className="flex items-center justify-between p-2 bg-surface-default/50 rounded">
              <span className="text-txt-secondary">Projected Weekly Hours:</span>
              <span className={`font-semibold ${
                wouldExceedWeekly ? 'text-accent-destructive' :
                projectedWeeklyHours >= 18 ? 'text-accent-warning' : 'text-txt-primary'
              }`}>
                {projectedWeeklyHours}h / {NCAA_WEEKLY_LIMIT}h
              </span>
            </div>

            <p className="text-txt-tertiary text-xs mt-2">
              Adding this {isCompetition ? 'competition (counted as 3h)' : `${proposedDurationMinutes} minute activity`} would
              {wouldExceedWeekly ? ' exceed' : ' approach'} the NCAA 20-hour weekly limit.
            </p>
          </div>

          {(onProceed || onCancel) && (
            <div className="flex items-center justify-end gap-3 mt-4">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-3 py-1.5 text-sm font-medium text-txt-secondary
                             hover:text-txt-primary transition-colors"
                >
                  Cancel
                </button>
              )}
              {onProceed && (
                <button
                  onClick={onProceed}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                    ${wouldExceedWeekly
                      ? 'bg-accent-destructive text-white hover:bg-accent-destructive/90'
                      : 'bg-accent-warning text-white hover:bg-accent-warning/90'
                    }`}
                >
                  {wouldExceedWeekly ? 'Add Anyway (Not Recommended)' : 'Proceed'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline warning badge for quick display in forms/tables
 */
export function NCAAWarningBadge({
  projectedWeeklyHours,
  className = '',
}: {
  projectedWeeklyHours: number;
  className?: string;
}) {
  const isNearLimit = projectedWeeklyHours >= 18;
  const isOverLimit = projectedWeeklyHours > NCAA_WEEKLY_LIMIT;

  if (projectedWeeklyHours < 18) {
    return null;
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full
      ${isOverLimit
        ? 'bg-accent-destructive/20 text-accent-destructive'
        : 'bg-accent-warning/20 text-accent-warning'
      } ${className}`}
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {projectedWeeklyHours.toFixed(1)}h
    </span>
  );
}

export default NCAA20HourWarning;

// src/v2/components/training/calendar/CalendarToolbar.tsx

import React from 'react';
import { format } from 'date-fns';
import type { ToolbarProps, View } from 'react-big-calendar';

interface CalendarToolbarProps extends ToolbarProps {
  onViewChange?: (view: View) => void;
}

/**
 * Custom toolbar for training calendar.
 * Provides navigation buttons and view switcher (month/week).
 */
export function CalendarToolbar({
  label,
  onNavigate,
  onView,
  view,
}: CalendarToolbarProps) {
  const viewOptions: { key: View; label: string }[] = [
    { key: 'month', label: 'Month' },
    { key: 'week', label: 'Week' },
  ];

  return (
    <div className="flex items-center justify-between mb-4 px-2">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-3 py-1.5 text-sm font-medium rounded-md
                     bg-surface-elevated text-txt-primary
                     hover:bg-surface-elevated/80 transition-colors"
        >
          Today
        </button>
        <div className="flex items-center border border-bdr-default rounded-md overflow-hidden">
          <button
            onClick={() => onNavigate('PREV')}
            className="p-1.5 hover:bg-surface-elevated transition-colors"
            aria-label="Previous"
          >
            <svg className="w-5 h-5 text-txt-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => onNavigate('NEXT')}
            className="p-1.5 hover:bg-surface-elevated transition-colors"
            aria-label="Next"
          >
            <svg className="w-5 h-5 text-txt-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Current Date Label */}
      <h2 className="text-lg font-semibold text-txt-primary">
        {label}
      </h2>

      {/* View Switcher */}
      <div className="flex items-center gap-1 p-1 bg-surface-elevated rounded-lg">
        {viewOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => onView(option.key)}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors
              ${view === option.key
                ? 'bg-accent-primary text-white'
                : 'text-txt-secondary hover:text-txt-primary hover:bg-surface-default'
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default CalendarToolbar;

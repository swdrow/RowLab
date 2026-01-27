import React from 'react';

/**
 * CalendarPreview - Mini training calendar
 *
 * Shows a week view with some sessions marked.
 */
export const CalendarPreview: React.FC = () => {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const hasSession = [true, false, true, true, false, true, false];

  return (
    <div className="flex justify-between gap-1 h-16">
      {days.map((day, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-xs text-ink-secondary">{day}</span>
          <div
            className={`
              w-full h-10 rounded
              ${hasSession[i]
                ? 'bg-ink-primary/20 border border-ink-primary/40'
                : 'bg-ink-base border border-ink-border/50'
              }
            `}
          />
        </div>
      ))}
    </div>
  );
};

export default CalendarPreview;

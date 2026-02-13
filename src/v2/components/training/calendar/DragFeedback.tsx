// src/v2/components/training/calendar/DragFeedback.tsx

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { SPRING_FAST } from '../../../utils/animations';
import { ComplianceBadge } from '../compliance/ComplianceBadge';
import { getWorkoutTypeColor } from '../../../utils/calendarHelpers';
import type { CalendarEvent } from '../../../types/training';

type ComplianceStatus = 'ok' | 'warning' | 'violation';

interface DragFeedbackProps {
  event: CalendarEvent;
  newDate: Date | null;
  complianceStatus: ComplianceStatus;
  projectedHours: number;
}

/**
 * Spring physics drag overlay for calendar rescheduling.
 * Shows a glass-card preview with the event title, new date/time,
 * and projected NCAA compliance status if dropped at that position.
 */
export function DragFeedback({
  event,
  newDate,
  complianceStatus,
  projectedHours,
}: DragFeedbackProps) {
  const workoutType = event.resource?.type || 'row';
  const typeColor = getWorkoutTypeColor(workoutType);

  return (
    <motion.div
      initial={{ scale: 1, rotate: 0, opacity: 0.9 }}
      animate={{ scale: 1.03, rotate: 2, opacity: 1 }}
      transition={SPRING_FAST}
      className="pointer-events-none z-50 min-w-[200px] max-w-[280px]"
      style={{ cursor: 'grabbing' }}
    >
      <div
        className="rounded-lg border border-bdr-strong shadow-card-rest overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-float)',
          boxShadow: '0 20px 25px -5px rgba(15, 15, 15, 0.3)',
        }}
      >
        {/* Type color bar */}
        <div className="h-1" style={{ backgroundColor: typeColor }} />

        <div className="p-3 space-y-2">
          {/* Event title */}
          <div className="font-medium text-sm text-txt-primary truncate">{event.title}</div>

          {/* New date/time */}
          {newDate && (
            <div className="text-xs text-txt-secondary font-mono">
              {format(newDate, 'EEE, MMM d')} at {format(newDate, 'h:mm a')}
            </div>
          )}

          {/* Compliance preview */}
          <div className="pt-1 border-t border-bdr-default">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-txt-muted uppercase tracking-wider">
                Week compliance
              </span>
              <ComplianceBadge weeklyHours={projectedHours} size="sm" showHours={true} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default DragFeedback;

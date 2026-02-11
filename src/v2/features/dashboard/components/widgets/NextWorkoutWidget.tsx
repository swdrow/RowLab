import { Link } from 'react-router-dom';
import { Clock, Calendar, Barbell, CaretRight } from '@phosphor-icons/react';
import { useSessions } from '../../../../hooks/useSessions';
import type { WidgetProps } from '../../types';
import type { SessionType } from '../../../../types/session';

const SESSION_TYPE_COLORS: Record<SessionType, string> = {
  ERG: 'bg-blue-500/10 text-blue-500',
  ROW: 'bg-green-500/10 text-green-500',
  LIFT: 'bg-amber-500/10 text-amber-500',
  RUN: 'bg-orange-500/10 text-orange-500',
  CROSS_TRAIN: 'bg-violet-500/10 text-violet-500',
  RECOVERY: 'bg-pink-500/10 text-pink-500',
};

function formatSessionDate(dateString: string): string {
  const sessionDate = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const isToday = sessionDate.toDateString() === today.toDateString();
  const isTomorrow = sessionDate.toDateString() === tomorrow.toDateString();

  if (isToday) return 'Today';
  if (isTomorrow) return 'Tomorrow';

  return sessionDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function NextWorkoutWidget(_props: WidgetProps) {
  const today = new Date().toISOString().split('T')[0];
  const { sessions, isLoading } = useSessions({
    status: 'PLANNED',
    startDate: today,
  });

  const nextSession = sessions[0] ?? null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-ink-bright flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent-copper" />
          Next Workout
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-8 w-3/4 bg-ink-base rounded-lg animate-pulse" />
            <div className="h-6 w-1/3 bg-ink-base rounded-lg animate-pulse" />
            <div className="h-5 w-1/2 bg-ink-base rounded-lg animate-pulse" />
            <div className="h-10 w-full bg-ink-base rounded-lg animate-pulse mt-4" />
          </div>
        ) : !nextSession ? (
          <div className="text-center py-8 text-ink-muted">
            <Barbell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No upcoming sessions scheduled</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Session name */}
            <div>
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${SESSION_TYPE_COLORS[nextSession.type]}`}
              >
                {nextSession.type.replace('_', ' ')}
              </span>
              <h4 className="text-lg font-semibold text-ink-bright">{nextSession.name}</h4>
            </div>

            {/* Date and time */}
            <div className="flex items-center gap-4 text-sm text-ink-muted">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatSessionDate(nextSession.date)}
              </span>
              {nextSession.startTime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {nextSession.startTime}
                </span>
              )}
            </div>

            {/* Description preview */}
            {nextSession.notes && (
              <p className="text-sm text-ink-muted line-clamp-2">{nextSession.notes}</p>
            )}

            {/* View details link */}
            <Link
              to={`/app/training/sessions/${nextSession.id}`}
              className="flex items-center justify-center gap-1.5 mt-auto px-4 py-2.5 rounded-lg
                bg-ink-base border border-white/[0.06] hover:border-white/[0.12]
                text-sm font-medium text-accent-copper transition-colors group"
            >
              View details
              <CaretRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

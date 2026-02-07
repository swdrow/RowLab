import { Link } from 'react-router-dom';
import { Calendar, Clock, CaretRight } from '@phosphor-icons/react';
import { useSessions } from '../../../../hooks/useSessions';
import type { SessionType } from '../../../../types/session';

const SESSION_TYPE_COLORS: Record<SessionType, string> = {
  ERG: 'bg-blue-500/10 text-blue-500',
  ROW: 'bg-green-500/10 text-green-500',
  LIFT: 'bg-amber-500/10 text-amber-500',
  RUN: 'bg-orange-500/10 text-orange-500',
  CROSS_TRAIN: 'bg-violet-500/10 text-violet-500',
  RECOVERY: 'bg-pink-500/10 text-pink-500',
};

export function UpcomingSessionsWidget(_props: import('../../types').WidgetProps) {
  const today = new Date().toISOString().split('T')[0];
  const { sessions, isLoading } = useSessions({
    status: 'PLANNED',
    startDate: today,
  });

  // Get next 5 sessions
  const upcomingSessions = sessions.slice(0, 5);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-txt-primary flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent-primary" />
          Upcoming Sessions
        </h3>
        <Link to="/app/training/sessions" className="text-sm text-accent-primary hover:underline">
          View all
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-surface-default rounded-lg animate-pulse" />
            ))}
          </div>
        ) : upcomingSessions.length === 0 ? (
          <div className="text-center py-8 text-txt-muted">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No upcoming sessions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingSessions.map((session) => (
              <Link
                key={session.id}
                to={`/app/training/sessions/${session.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-default
                  border border-bdr-default hover:border-bdr-focus transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${SESSION_TYPE_COLORS[session.type]}`}
                  >
                    {session.type}
                  </span>
                  <div>
                    <div className="font-medium text-txt-primary text-sm group-hover:text-accent-primary">
                      {session.name}
                    </div>
                    <div className="text-xs text-txt-muted flex items-center gap-2">
                      <span>{new Date(session.date).toLocaleDateString()}</span>
                      {session.startTime && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {session.startTime}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <CaretRight className="w-4 h-4 text-txt-muted group-hover:text-txt-secondary" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

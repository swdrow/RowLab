/**
 * Today's Practice Summary Widget
 * Phase 27-03: Hero dashboard widget with context-aware quick actions
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, Play, Eye, Plus, Clock, Users } from '@phosphor-icons/react';
import { useSessions } from '../../../../hooks/useSessions';
import { EmptyStateAnimated } from '../../empty-states/EmptyStateAnimated';
import type { WidgetProps } from '../../types';
import type { Session } from '../../../../types/session';

interface TodaysPracticeSummaryProps extends WidgetProps {}

/**
 * Context-aware practice summary states
 */
type PracticeState =
  | { type: 'none' }
  | { type: 'upcoming'; session: Session }
  | { type: 'active'; session: Session }
  | { type: 'completed'; session: Session };

/**
 * TodaysPracticeSummary - Hero dashboard widget
 *
 * Per CONTEXT.md: "Coach dashboard hero card should be context-aware:
 * 'Start practice' button before practice, 'View results' after."
 *
 * States:
 * - No practice: "Schedule Practice" CTA
 * - Upcoming: "Start Practice" + session details
 * - Active: "View Live Session" + live indicator
 * - Completed: "View Results" + summary stats
 */
export const TodaysPracticeSummary: React.FC<TodaysPracticeSummaryProps> = ({
  widgetId,
  size,
  isEditing,
}) => {
  const navigate = useNavigate();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Query today's sessions
  const { sessions, isLoading } = useSessions({
    startDate: today,
    endDate: today,
  });

  // Determine most relevant session and state
  const practiceState = useMemo((): PracticeState => {
    if (!sessions || sessions.length === 0) {
      return { type: 'none' };
    }

    // Priority: ACTIVE > upcoming > completed
    const activeSession = sessions.find((s) => s.status === 'ACTIVE');
    if (activeSession) {
      return { type: 'active', session: activeSession };
    }

    const upcomingSession = sessions.find((s) => s.status === 'PLANNED');
    if (upcomingSession) {
      return { type: 'upcoming', session: upcomingSession };
    }

    const completedSession = sessions.find((s) => s.status === 'COMPLETED');
    if (completedSession) {
      return { type: 'completed', session: completedSession };
    }

    return { type: 'none' };
  }, [sessions]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3" role="status" aria-label="Loading">
          <div className="w-8 h-8 border-2 border-[var(--color-interactive-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading today's practice...</p>
        </div>
      </div>
    );
  }

  // No practice today
  if (practiceState.type === 'none') {
    return (
      <EmptyStateAnimated
        animationType="practice"
        title="No Practice Scheduled"
        description="Schedule a practice session to get started with today's training."
        action={{
          label: 'Schedule Practice',
          to: '/app/training/sessions',
          icon: Plus,
        }}
      />
    );
  }

  // Render based on state
  return (
    <div className="h-full flex flex-col justify-between p-4">
      {practiceState.type === 'upcoming' && (
        <UpcomingPracticeView session={practiceState.session} size={size} navigate={navigate} />
      )}
      {practiceState.type === 'active' && (
        <ActivePracticeView session={practiceState.session} size={size} navigate={navigate} />
      )}
      {practiceState.type === 'completed' && (
        <CompletedPracticeView session={practiceState.session} size={size} navigate={navigate} />
      )}
    </div>
  );
};

// ============================================
// STATE-SPECIFIC VIEWS
// ============================================

interface PracticeViewProps {
  session: Session;
  size: WidgetProps['size'];
  navigate: ReturnType<typeof useNavigate>;
}

/**
 * Upcoming practice view - before start time
 */
const UpcomingPracticeView: React.FC<PracticeViewProps> = ({ session, size, navigate }) => {
  const isCompact = size === 'compact';

  return (
    <>
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <CalendarCheck className="w-5 h-5 text-[var(--color-interactive-primary)]" />
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
            Upcoming Practice
          </h3>
        </div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-1">
          {session.name}
        </h2>
        <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
          {session.startTime && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{session.startTime}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>Team Practice</span>
          </div>
        </div>
        {!isCompact && session.notes && (
          <p className="text-sm text-[var(--color-text-secondary)] mt-2 line-clamp-2">
            {session.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className={`flex ${isCompact ? 'flex-col' : 'flex-row'} gap-2 mt-4`}>
        <button
          onClick={() => navigate(`/app/training/sessions/${session.id}/live`)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-interactive-primary)] text-white rounded-lg hover:bg-[var(--color-interactive-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)] focus-visible:ring-offset-2 font-medium"
        >
          <Play className="w-4 h-4" weight="fill" />
          Start Practice
        </button>
        {!isCompact && (
          <button
            onClick={() => navigate(`/app/training/sessions/${session.id}`)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--color-border-default)] text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-surface-elevated)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)] focus-visible:ring-offset-2"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
        )}
      </div>
    </>
  );
};

/**
 * Active practice view - currently in progress
 */
const ActivePracticeView: React.FC<PracticeViewProps> = ({ session, size, navigate }) => {
  const isCompact = size === 'compact';

  return (
    <>
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            <span className="text-sm font-medium text-status-success uppercase tracking-wide">
              Live
            </span>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-1">
          {session.name}
        </h2>
        <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
          {session.startTime && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Started {session.startTime}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>Team Practice</span>
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="mt-4">
        <button
          onClick={() => navigate(`/app/training/sessions/${session.id}/live`)}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-status-success text-white rounded-lg hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-success focus-visible:ring-offset-2 font-medium"
        >
          <Eye className="w-4 h-4" />
          View Live Session
        </button>
      </div>
    </>
  );
};

/**
 * Completed practice view - finished session
 */
const CompletedPracticeView: React.FC<PracticeViewProps> = ({ session, size, navigate }) => {
  const isCompact = size === 'compact';

  return (
    <>
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <CalendarCheck className="w-5 h-5 text-[var(--color-text-secondary)]" />
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
            Completed
          </h3>
        </div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-1">
          {session.name}
        </h2>
        <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
          {session.pieces && session.pieces.length > 0 && (
            <span>{session.pieces.length} pieces completed</span>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="mt-4">
        <button
          onClick={() => navigate(`/app/training/sessions/${session.id}`)}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-interactive-primary)] text-white rounded-lg hover:bg-[var(--color-interactive-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)] focus-visible:ring-offset-2 font-medium"
        >
          <Eye className="w-4 h-4" />
          View Results
        </button>
      </div>
    </>
  );
};

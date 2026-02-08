import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Calendar, ListBullets, CaretRight, Play } from '@phosphor-icons/react';
import { useSessions } from '../../hooks/useSessions';
import { SessionForm } from '../../features/sessions/components/SessionForm';
import { TrainingShortcutsHelp } from '../../features/training/components/TrainingShortcutsHelp';
import { SessionsListSkeleton } from '../../features/sessions/components/SessionSkeleton';
import { useTrainingKeyboard, getTrainingShortcuts } from '../../hooks/useTrainingKeyboard';
import type { SessionType, SessionStatus } from '../../types/session';

const SESSION_TYPE_COLORS: Record<SessionType, string> = {
  ERG: 'bg-data-good/10 text-data-good',
  ROW: 'bg-data-excellent/10 text-data-excellent',
  LIFT: 'bg-data-warning/10 text-data-warning',
  RUN: 'bg-data-warning/10 text-data-warning',
  CROSS_TRAIN: 'bg-accent-copper/10 text-accent-copper',
  RECOVERY: 'bg-data-excellent/10 text-data-excellent',
};

const SESSION_STATUS_COLORS: Record<SessionStatus, string> = {
  PLANNED: 'bg-ink-surface text-ink-secondary',
  ACTIVE: 'bg-data-excellent/10 text-data-excellent',
  COMPLETED: 'bg-data-good/10 text-data-good',
  CANCELLED: 'bg-data-poor/10 text-data-poor',
};

export function SessionsPage() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const { sessions, isLoading, error } = useSessions();

  // Keyboard shortcuts
  const { showHelp, setShowHelp } = useTrainingKeyboard({
    onNewSession: useCallback(() => setShowForm(true), []),
    onEscape: useCallback(() => setShowForm(false), []),
    onToggleView: useCallback(() => setViewMode((v) => (v === 'list' ? 'calendar' : 'list')), []),
  });

  const shortcuts = useMemo(
    () =>
      getTrainingShortcuts({
        hasNewSession: true,
        hasRefresh: true,
        hasEscape: true,
        hasToggleView: true,
      }),
    []
  );

  if (isLoading) {
    return <SessionsListSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-data-poor/10 border border-data-poor/20 rounded-lg p-4 text-data-poor">
          Failed to load sessions. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative px-6 pt-8 pb-6 mb-2 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-copper/[0.06] via-accent-copper/[0.02] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-accent-copper/30 to-transparent" />
        <div className="relative flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-copper mb-2">
              PRACTICE SESSIONS
            </p>
            <h1 className="text-4xl font-display font-bold text-ink-bright tracking-tight">
              Sessions
            </h1>
            <p className="text-sm text-ink-secondary mt-2">View and manage training sessions</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex items-center border border-ink-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-accent-copper/10 text-accent-copper' : 'text-ink-secondary hover:text-ink-primary'}`}
                title="List view"
              >
                <ListBullets className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 transition-colors ${viewMode === 'calendar' ? 'bg-accent-copper/10 text-accent-copper' : 'text-ink-secondary hover:text-ink-primary'}`}
                title="Calendar view"
              >
                <Calendar className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-gradient-to-b from-accent-copper to-accent-copper-hover text-white rounded-xl shadow-glow-copper hover:shadow-glow-copper-lg hover:-translate-y-px active:translate-y-0 transition-all duration-150"
            >
              <Plus className="w-5 h-5" />
              New Session
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Session List */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <div className="backdrop-blur-xl bg-ink-raised/80 border border-ink-border rounded-xl p-12 text-center">
                <Calendar className="w-12 h-12 text-accent-copper/40 mx-auto mb-4" />
                <p className="font-display font-semibold text-lg text-ink-bright mb-2">
                  No sessions yet
                </p>
                <p className="text-ink-secondary mb-6">
                  Create your first training session to get started
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-5 py-2.5 rounded-xl border border-accent-copper/30 text-accent-copper
                    hover:bg-accent-copper/10 transition-colors font-medium"
                >
                  Create your first session
                </button>
              </div>
            ) : (
              sessions.map((session) => (
                <Link
                  key={session.id}
                  to={`/app/training/sessions/${session.id}`}
                  className="relative block backdrop-blur-xl bg-ink-raised/80 border border-ink-border rounded-xl p-4
                    hover:bg-accent-copper/[0.04] hover:border-accent-copper/30 transition-all duration-200 group
                    overflow-hidden"
                >
                  {/* Left accent bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-copper/60 via-accent-copper/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Type badge */}
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${SESSION_TYPE_COLORS[session.type]}`}
                      >
                        {session.type}
                      </span>

                      {/* Session info */}
                      <div>
                        <div className="font-medium text-ink-bright group-hover:text-accent-copper transition-colors">
                          {session.name}
                        </div>
                        <div className="text-sm text-ink-secondary">
                          {new Date(session.date).toLocaleDateString()} · {session.pieces.length}{' '}
                          pieces
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status */}
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${SESSION_STATUS_COLORS[session.status]}`}
                      >
                        {session.status}
                      </span>

                      {/* Live button if active */}
                      {session.status === 'ACTIVE' && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/app/training/sessions/${session.id}/live`);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-data-excellent text-white
                            text-sm font-medium hover:bg-data-excellent/90 transition-colors"
                        >
                          <Play className="w-4 h-4" weight="fill" />
                          Live
                        </button>
                      )}

                      <CaretRight className="w-5 h-5 text-ink-muted group-hover:text-accent-copper transition-colors" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Calendar View (placeholder) */}
        {viewMode === 'calendar' && (
          <div className="backdrop-blur-xl bg-ink-raised/80 border border-ink-border rounded-xl p-8 text-center">
            <p className="text-ink-secondary">
              Calendar view coming soon. Use the existing Training Calendar for now.
            </p>
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="backdrop-blur-xl bg-ink-raised/95 rounded-xl border border-ink-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-copper" />
                <h2 className="text-xl font-display font-semibold text-ink-bright">
                  Create Session
                </h2>
              </div>
              <SessionForm
                onSuccess={() => setShowForm(false)}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <TrainingShortcutsHelp
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        shortcuts={shortcuts}
      />
    </div>
  );
}

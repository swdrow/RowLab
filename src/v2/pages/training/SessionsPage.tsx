import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Calendar, ListBullets, CaretRight, Play } from '@phosphor-icons/react';
import { useSessions } from '../../hooks/useSessions';
import { SessionForm } from '../../features/sessions/components/SessionForm';
import { Breadcrumbs } from '../../features/shared/components/Breadcrumbs';
import { TrainingShortcutsHelp } from '../../features/training/components/TrainingShortcutsHelp';
import { useTrainingKeyboard, getTrainingShortcuts } from '../../hooks/useTrainingKeyboard';
import type { SessionType, SessionStatus } from '../../types/session';

const SESSION_TYPE_COLORS: Record<SessionType, string> = {
  ERG: 'bg-data-good/10 text-data-good',
  ROW: 'bg-data-excellent/10 text-data-excellent',
  LIFT: 'bg-data-warning/10 text-data-warning',
  RUN: 'bg-data-warning/10 text-data-warning',
  CROSS_TRAIN: 'bg-interactive-primary/10 text-interactive-primary',
  RECOVERY: 'bg-data-excellent/10 text-data-excellent',
};

const SESSION_STATUS_COLORS: Record<SessionStatus, string> = {
  PLANNED: 'bg-bg-surface text-txt-secondary',
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
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-bg-surface rounded w-48 animate-pulse" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-bg-surface-elevated rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumbs
            items={[{ label: 'Training', href: '/app/training' }, { label: 'Sessions' }]}
          />
          <h1 className="text-2xl font-semibold text-txt-primary mt-2">Sessions</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border border-bdr-default rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-interactive-primary/10 text-interactive-primary' : 'text-txt-secondary'}`}
              title="List view"
            >
              <ListBullets className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 ${viewMode === 'calendar' ? 'bg-interactive-primary/10 text-interactive-primary' : 'text-txt-secondary'}`}
              title="Calendar view"
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-interactive-primary text-txt-inverse
              font-medium hover:bg-interactive-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Session
          </button>
        </div>
      </div>

      {/* Session List */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-txt-muted mx-auto mb-3" />
              <p className="text-txt-muted">No sessions yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 rounded-lg border border-bdr-default text-txt-secondary
                  hover:text-txt-primary hover:border-bdr-focus transition-colors"
              >
                Create your first session
              </button>
            </div>
          ) : (
            sessions.map((session) => (
              <Link
                key={session.id}
                to={`/app/training/sessions/${session.id}`}
                className="block bg-bg-surface-elevated rounded-lg border border-bdr-default p-4
                  hover:border-bdr-focus transition-colors group"
              >
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
                      <div className="font-medium text-txt-primary group-hover:text-interactive-primary transition-colors">
                        {session.name}
                      </div>
                      <div className="text-sm text-txt-secondary">
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
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-data-excellent text-txt-inverse
                          text-sm font-medium hover:bg-data-excellent/90 transition-colors"
                      >
                        <Play className="w-4 h-4" weight="fill" />
                        Live
                      </button>
                    )}

                    <CaretRight className="w-5 h-5 text-txt-muted group-hover:text-txt-secondary transition-colors" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Calendar View (placeholder) */}
      {viewMode === 'calendar' && (
        <div className="bg-bg-surface-elevated rounded-lg border border-bdr-default p-8 text-center text-txt-muted">
          Calendar view coming soon. Use the existing Training Calendar for now.
        </div>
      )}

      {/* Create Session Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface-elevated rounded-xl border border-bdr-default max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-txt-primary mb-6">Create Session</h2>
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

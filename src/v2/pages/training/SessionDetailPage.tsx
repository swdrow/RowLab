import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, Pencil, Trash, Clock, Users, Copy, Calendar } from '@phosphor-icons/react';
import { useSession, useUpdateSession, useDeleteSession } from '../../hooks/useSessions';
import { Breadcrumbs } from '../../features/shared/components/Breadcrumbs';
import { TrainingShortcutsHelp } from '../../features/training/components/TrainingShortcutsHelp';
import { useTrainingKeyboard, getTrainingShortcuts } from '../../hooks/useTrainingKeyboard';
import type { PieceSegment } from '../../types/session';

const SEGMENT_ORDER: PieceSegment[] = ['WARMUP', 'MAIN', 'COOLDOWN'];
const SEGMENT_LABELS: Record<PieceSegment, string> = {
  WARMUP: 'Warmup',
  MAIN: 'Main Set',
  COOLDOWN: 'Cooldown',
};

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const { session, isLoading, error } = useSession(sessionId || '');
  const { updateSessionAsync, isUpdating } = useUpdateSession();
  const { deleteSessionAsync } = useDeleteSession();

  // Keyboard shortcuts (R=refresh, Escape=back, ?=help)
  const { showHelp, setShowHelp } = useTrainingKeyboard({});

  const shortcuts = useMemo(
    () =>
      getTrainingShortcuts({
        hasNewSession: false,
        hasRefresh: true,
        hasEscape: true,
      }),
    []
  );

  const handleStartLive = async () => {
    if (!sessionId) return;

    try {
      await updateSessionAsync({
        sessionId,
        input: { status: 'ACTIVE' },
      });
      navigate(`/app/training/sessions/${sessionId}/live`);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleDelete = async () => {
    if (!sessionId || !confirm('Are you sure you want to delete this session?')) return;

    try {
      await deleteSessionAsync(sessionId);
      navigate('/app/training/sessions');
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 bg-bg-surface rounded w-48 animate-pulse" />
        <div className="h-24 bg-bg-surface-elevated rounded-lg animate-pulse" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-bg-surface-elevated rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-6">
        <div className="bg-data-poor/10 border border-data-poor/20 rounded-lg p-4 text-data-poor">
          Session not found or failed to load.
        </div>
      </div>
    );
  }

  // Group pieces by segment
  const piecesBySegment = SEGMENT_ORDER.map((segment) => ({
    segment,
    label: SEGMENT_LABELS[segment],
    pieces: session.pieces.filter((p) => p.segment === segment),
  })).filter((g) => g.pieces.length > 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Breadcrumbs
          items={[
            { label: 'Training', href: '/app/training' },
            { label: 'Sessions', href: '/app/training/sessions' },
            { label: session.name },
          ]}
        />
      </div>

      {/* Session Info Card */}
      <div className="bg-bg-surface-elevated rounded-lg border border-bdr-default p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-txt-primary">{session.name}</h1>
              <span className="px-2 py-1 rounded text-xs font-medium bg-data-good/10 text-data-good">
                {session.type}
              </span>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  session.status === 'ACTIVE'
                    ? 'bg-data-excellent/10 text-data-excellent'
                    : 'bg-bg-surface text-txt-secondary'
                }`}
              >
                {session.status}
              </span>
            </div>

            <div className="flex items-center gap-4 text-txt-secondary">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(session.date).toLocaleDateString()}
              </span>
              {session.startTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(session.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {session.pieces.length} pieces
              </span>
            </div>

            {session.notes && <p className="mt-3 text-txt-secondary">{session.notes}</p>}

            {session.sessionCode && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-txt-muted">Session Code:</span>
                <span className="font-mono font-bold text-interactive-primary">
                  {session.sessionCode}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(session.sessionCode || '')}
                  className="p-1 rounded hover:bg-bg-hover transition-colors"
                  title="Copy code"
                >
                  <Copy className="w-4 h-4 text-txt-muted" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {session.status === 'PLANNED' && (
              <button
                onClick={handleStartLive}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-data-excellent text-txt-inverse
                  font-medium hover:bg-data-excellent/90 disabled:opacity-50 transition-colors"
              >
                <Play className="w-5 h-5" weight="fill" />
                Start Live
              </button>
            )}

            {session.status === 'ACTIVE' && (
              <Link
                to={`/app/training/sessions/${session.id}/live`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-data-excellent text-txt-inverse
                  font-medium hover:bg-data-excellent/90 transition-colors"
              >
                <Play className="w-5 h-5" weight="fill" />
                View Live
              </Link>
            )}

            <button
              className="p-2 rounded-lg border border-bdr-default text-txt-secondary
                hover:text-txt-primary hover:border-bdr-focus transition-colors"
              title="Edit session"
            >
              <Pencil className="w-5 h-5" />
            </button>

            <button
              onClick={handleDelete}
              className="p-2 rounded-lg border border-bdr-default text-txt-secondary
                hover:text-data-poor hover:border-data-poor/50 transition-colors"
              title="Delete session"
            >
              <Trash className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Pieces */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-txt-primary">Session Pieces</h2>

        {piecesBySegment.length === 0 ? (
          <div className="bg-bg-surface-elevated rounded-lg border border-bdr-default p-8 text-center text-txt-muted">
            No pieces defined for this session.
          </div>
        ) : (
          piecesBySegment.map((group) => (
            <div key={group.segment} className="space-y-2">
              <h3 className="text-sm font-medium text-txt-muted uppercase tracking-wide">
                {group.label}
              </h3>
              <div className="space-y-2">
                {group.pieces.map((piece) => (
                  <div
                    key={piece.id}
                    className="bg-bg-surface-elevated rounded-lg border border-bdr-default p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-txt-primary">{piece.name}</div>
                        {piece.description && (
                          <div className="text-sm text-txt-secondary mt-1">{piece.description}</div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-txt-secondary font-mono">
                        {piece.distance && <span>{piece.distance}m</span>}
                        {piece.duration && <span>{formatTime(piece.duration)}</span>}
                        {piece.targetSplit && <span>@{formatTime(piece.targetSplit)}/500m</span>}
                        {piece.targetRate && <span>{piece.targetRate}spm</span>}
                      </div>
                    </div>

                    {piece.notes && (
                      <div className="mt-2 text-sm text-txt-muted">{piece.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Keyboard Shortcuts Help */}
      <TrainingShortcutsHelp
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        shortcuts={shortcuts}
      />
    </div>
  );
}

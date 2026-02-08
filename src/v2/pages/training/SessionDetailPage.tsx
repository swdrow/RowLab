import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, Pencil, Trash, Clock, Users, Copy, Calendar } from '@phosphor-icons/react';
import { ChevronLeft } from 'lucide-react';
import { useSession, useUpdateSession, useDeleteSession } from '../../hooks/useSessions';
import { TrainingShortcutsHelp } from '../../features/training/components/TrainingShortcutsHelp';
import { SessionDetailSkeleton } from '../../features/sessions/components/SessionSkeleton';
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
    return <SessionDetailSkeleton />;
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
      {/* Back Link + Header */}
      <div>
        <button
          onClick={() => navigate('/app/training/sessions')}
          className="flex items-center gap-2 text-sm text-accent-copper hover:text-accent-copper-hover
                     transition-colors mb-6 group font-medium"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          All Sessions
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-copper" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent-copper">
            SESSION DETAILS
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-accent-copper/20 to-transparent" />
        </div>
      </div>

      {/* Session Info Card */}
      <div className="backdrop-blur-xl bg-ink-raised/80 border border-ink-border rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-display font-bold text-ink-bright">{session.name}</h1>
              <span className="px-2 py-1 rounded text-xs font-medium bg-data-good/10 text-data-good">
                {session.type}
              </span>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  session.status === 'ACTIVE'
                    ? 'bg-data-excellent/10 text-data-excellent'
                    : 'bg-ink-surface text-ink-secondary'
                }`}
              >
                {session.status}
              </span>
            </div>

            <div className="flex items-center gap-4 text-ink-secondary">
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

            {session.notes && <p className="mt-3 text-ink-secondary">{session.notes}</p>}

            {session.sessionCode && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-ink-muted">Session Code:</span>
                <span className="font-mono font-bold text-accent-copper">
                  {session.sessionCode}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(session.sessionCode || '')}
                  className="p-1 rounded hover:bg-accent-copper/10 transition-colors"
                  title="Copy code"
                >
                  <Copy className="w-4 h-4 text-ink-muted" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {session.status === 'PLANNED' && (
              <button
                onClick={handleStartLive}
                disabled={isUpdating}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-gradient-to-b from-accent-copper to-accent-copper-hover text-white rounded-xl shadow-glow-copper hover:shadow-glow-copper-lg hover:-translate-y-px active:translate-y-0 disabled:opacity-50 transition-all duration-150"
              >
                <Play className="w-5 h-5" weight="fill" />
                Start Live
              </button>
            )}

            {session.status === 'ACTIVE' && (
              <Link
                to={`/app/training/sessions/${session.id}/live`}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-gradient-to-b from-accent-copper to-accent-copper-hover text-white rounded-xl shadow-glow-copper hover:shadow-glow-copper-lg hover:-translate-y-px active:translate-y-0 transition-all duration-150"
              >
                <Play className="w-5 h-5" weight="fill" />
                View Live
              </Link>
            )}

            <button
              className="p-2 rounded-lg border border-ink-border text-ink-secondary
                hover:text-ink-primary hover:border-accent-copper/30 transition-colors"
              title="Edit session"
            >
              <Pencil className="w-5 h-5" />
            </button>

            <button
              onClick={handleDelete}
              className="p-2 rounded-lg border border-ink-border text-ink-secondary
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
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-copper" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent-copper">
            Session Pieces
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-accent-copper/20 to-transparent" />
        </div>

        {piecesBySegment.length === 0 ? (
          <div className="backdrop-blur-xl bg-ink-raised/80 border border-ink-border rounded-xl p-8 text-center text-ink-secondary">
            No pieces defined for this session.
          </div>
        ) : (
          piecesBySegment.map((group) => (
            <div key={group.segment} className="space-y-2">
              <h3 className="text-sm font-medium text-ink-muted uppercase tracking-wide">
                {group.label}
              </h3>
              <div className="space-y-2">
                {group.pieces.map((piece) => (
                  <div
                    key={piece.id}
                    className="relative backdrop-blur-xl bg-ink-raised/80 border border-ink-border rounded-xl p-4 overflow-hidden"
                  >
                    {/* Left accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-copper/40 via-accent-copper/20 to-transparent" />

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-ink-bright">{piece.name}</div>
                        {piece.description && (
                          <div className="text-sm text-ink-secondary mt-1">{piece.description}</div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-ink-secondary font-mono">
                        {piece.distance && (
                          <span className="text-ink-bright">{piece.distance}m</span>
                        )}
                        {piece.duration && (
                          <span className="text-ink-bright">{formatTime(piece.duration)}</span>
                        )}
                        {piece.targetSplit && <span>@{formatTime(piece.targetSplit)}/500m</span>}
                        {piece.targetRate && <span>{piece.targetRate}spm</span>}
                      </div>
                    </div>

                    {piece.notes && (
                      <div className="mt-2 text-sm text-ink-muted">{piece.notes}</div>
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

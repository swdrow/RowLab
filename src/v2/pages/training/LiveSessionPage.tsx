import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Stop } from '@phosphor-icons/react';
import { useSession, useUpdateSession } from '../../hooks/useSessions';
import { LiveErgDashboard } from '../../features/live-erg/components/LiveErgDashboard';
import { TrainingShortcutsHelp } from '../../features/training/components/TrainingShortcutsHelp';
import { SessionDetailSkeleton } from '../../features/sessions/components/SessionSkeleton';
import { useTrainingKeyboard, getTrainingShortcuts } from '../../hooks/useTrainingKeyboard';

export function LiveSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { session, isLoading, error } = useSession(sessionId || '');
  const { updateSessionAsync, isUpdating } = useUpdateSession();

  // Keyboard shortcuts (R=refresh, ?=help)
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

  const handleEndSession = async () => {
    if (!sessionId || !confirm('Are you sure you want to end this session?')) return;

    try {
      await updateSessionAsync({
        sessionId,
        input: { status: 'COMPLETED' },
      });
    } catch (error) {
      console.error('Failed to end session:', error);
    }
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

  if (session.status !== 'ACTIVE') {
    return (
      <div className="p-6">
        <div className="backdrop-blur-xl bg-ink-raised/80 border border-ink-border rounded-xl p-6">
          <div className="bg-data-warning/10 border border-data-warning/20 rounded-lg p-4 text-data-warning">
            <p>This session is not currently active.</p>
            <Link
              to={`/app/training/sessions/${session.id}`}
              className="inline-flex items-center gap-2 mt-2 text-accent-copper hover:text-accent-copper-hover"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to session details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get target pace from first main piece (if erg session)
  const mainPiece = session.pieces.find((p) => p.segment === 'MAIN');
  const targetPace = mainPiece?.targetSplit;

  return (
    <div className="p-6 space-y-6">
      {/* Compact Copper Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-copper animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-copper">
              LIVE SESSION
            </span>
          </div>
          <div className="h-4 w-px bg-ink-border" />
          <h1 className="text-xl font-display font-bold text-ink-bright">{session.name}</h1>
        </div>

        <button
          onClick={handleEndSession}
          disabled={isUpdating}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-gradient-to-b from-data-poor to-data-poor/90 text-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-px active:translate-y-0 disabled:opacity-50 transition-all duration-150"
        >
          <Stop className="w-5 h-5" weight="fill" />
          End Session
        </button>
      </div>

      {/* Live Dashboard with glass morphism wrapper */}
      <div className="backdrop-blur-xl bg-ink-raised/80 border border-ink-border rounded-xl p-6">
        <LiveErgDashboard
          sessionId={session.id}
          sessionName={session.name}
          sessionCode={session.sessionCode}
          targetPace={targetPace}
        />
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

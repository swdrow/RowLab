import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Stop } from '@phosphor-icons/react';
import { useSession, useUpdateSession } from '../../hooks/useSessions';
import { LiveErgDashboard } from '../../features/live-erg/components/LiveErgDashboard';
import { Breadcrumbs } from '../../features/shared/components/Breadcrumbs';
import { TrainingShortcutsHelp } from '../../features/training/components/TrainingShortcutsHelp';
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
    return (
      <div className="p-6">
        <div className="animate-spin w-8 h-8 border-2 border-interactive-primary border-t-transparent rounded-full mx-auto" />
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

  if (session.status !== 'ACTIVE') {
    return (
      <div className="p-6">
        <Breadcrumbs
          items={[
            { label: 'Training', href: '/app/training' },
            { label: 'Sessions', href: '/app/training/sessions' },
            { label: session.name, href: `/app/training/sessions/${session.id}` },
            { label: 'Live' },
          ]}
        />
        <div className="mt-6 bg-data-warning/10 border border-data-warning/20 rounded-lg p-4 text-data-warning">
          <p>This session is not currently active.</p>
          <Link
            to={`/app/training/sessions/${session.id}`}
            className="inline-flex items-center gap-2 mt-2 text-interactive-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to session details
          </Link>
        </div>
      </div>
    );
  }

  // Get target pace from first main piece (if erg session)
  const mainPiece = session.pieces.find((p) => p.segment === 'MAIN');
  const targetPace = mainPiece?.targetSplit;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Training', href: '/app/training' },
              { label: 'Sessions', href: '/app/training/sessions' },
              { label: session.name, href: `/app/training/sessions/${session.id}` },
              { label: 'Live' },
            ]}
          />
        </div>

        <button
          onClick={handleEndSession}
          disabled={isUpdating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-data-poor text-txt-inverse
            font-medium hover:bg-data-poor/90 disabled:opacity-50 transition-colors"
        >
          <Stop className="w-5 h-5" weight="fill" />
          End Session
        </button>
      </div>

      {/* Live Dashboard */}
      <LiveErgDashboard
        sessionId={session.id}
        sessionName={session.name}
        sessionCode={session.sessionCode}
        targetPace={targetPace}
      />

      {/* Keyboard Shortcuts Help */}
      <TrainingShortcutsHelp
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        shortcuts={shortcuts}
      />
    </div>
  );
}

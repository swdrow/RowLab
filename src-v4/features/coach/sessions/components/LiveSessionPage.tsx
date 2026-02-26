/**
 * LiveSessionPage - Live training session with real-time erg dashboard.
 *
 * Shows pulsing LIVE indicator and End Session button when session is ACTIVE.
 * Socket.IO connects lazily only when session status is ACTIVE.
 * States: loading skeleton, not-active warning, active with live dashboard.
 */
import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { sessionDetailOptions, useEndSession } from '../api';
import { LiveErgDashboard } from './LiveErgDashboard';
import { useSocket } from '../hooks/useSocket';
import { IconChevronLeft, IconRadio, IconSquare } from '@/components/icons';

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function LiveSkeleton() {
  return (
    <SkeletonGroup className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton height="0.75rem" width="2rem" rounded="sm" />
        <Skeleton height="1rem" width="4rem" rounded="sm" />
        <Skeleton height="2rem" width="14rem" rounded="sm" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-void-raised border border-edge-default rounded-lg p-4 space-y-3"
          >
            <Skeleton height="0.875rem" width="8rem" rounded="sm" />
            <Skeleton height="2rem" width="5rem" rounded="sm" className="mx-auto" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton height="0.75rem" width="4rem" rounded="sm" />
              <Skeleton height="0.75rem" width="4rem" rounded="sm" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonGroup>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LiveSessionPageProps {
  sessionId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LiveSessionPage({ sessionId }: LiveSessionPageProps) {
  const navigate = useNavigate();
  const [confirmEnd, setConfirmEnd] = useState(false);

  const { data: session, isLoading, error } = useQuery(sessionDetailOptions(sessionId));

  const isActive = session?.status === 'ACTIVE';
  const { isConnected, ergData, sessionEnded } = useSocket(sessionId, isActive);
  const endMutation = useEndSession();

  // If session ended via Socket.IO event, navigate to detail
  useEffect(() => {
    if (sessionEnded) {
      void navigate({ to: '/training/sessions/$sessionId', params: { sessionId } });
    }
  }, [sessionEnded, navigate, sessionId]);

  const handleBack = useCallback(() => {
    void navigate({ to: '/training/sessions/$sessionId', params: { sessionId } });
  }, [navigate, sessionId]);

  const handleEndSession = useCallback(async () => {
    if (!confirmEnd) {
      setConfirmEnd(true);
      // Auto-dismiss confirm after 3 seconds
      setTimeout(() => setConfirmEnd(false), 3000);
      return;
    }
    await endMutation.mutateAsync(sessionId);
    void navigate({ to: '/training/sessions/$sessionId', params: { sessionId } });
  }, [confirmEnd, endMutation, sessionId, navigate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <LiveSkeleton />
      </div>
    );
  }

  // Error / not found
  if (error || !session) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <button
          type="button"
          onClick={() => void navigate({ to: '/training/sessions' })}
          className="flex items-center gap-1 text-sm text-text-dim hover:text-text-bright transition-colors mb-4"
        >
          <IconChevronLeft width={16} height={16} />
          Back to Sessions
        </button>
        <p className="text-text-dim text-sm">Session not found.</p>
      </div>
    );
  }

  // Not active state
  if (!isActive) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-text-dim hover:text-text-bright transition-colors mb-4"
        >
          <IconChevronLeft width={16} height={16} />
          Back to Session
        </button>
        <div className="bg-data-warning/10 border border-data-warning/20 rounded-lg p-6">
          <p className="text-sm font-medium text-data-warning mb-2">Session Not Currently Active</p>
          <p className="text-sm text-text-dim mb-4">
            This session is not currently active. The live dashboard is only available for active
            sessions.
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-edge-default text-sm text-text-dim hover:text-text-bright hover:bg-void-overlay transition-colors"
          >
            <IconChevronLeft width={14} height={14} />
            View Session Details
          </button>
        </div>
      </div>
    );
  }

  // Get target pace from first MAIN piece
  const mainPiece = session.pieces.find((p) => p.segment === 'MAIN');
  const targetPace = mainPiece?.targetSplit ?? null;

  return (
    <div className="h-full flex flex-col">
      {/* Header with live indicator */}
      <div className="px-4 lg:px-6 pt-4 lg:pt-6 pb-4 border-b border-edge-default/30">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Back */}
              <button
                type="button"
                onClick={handleBack}
                className="text-text-dim hover:text-text-bright transition-colors flex-shrink-0"
                aria-label="Back to session"
              >
                <IconChevronLeft width={20} height={20} />
              </button>

              {/* Pulsing LIVE indicator */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-data-good opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-data-good" />
                </div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-data-good">
                  LIVE
                </span>
              </div>

              <div className="hidden sm:block h-5 w-px bg-edge-default/30" />

              {/* Session name */}
              <h1 className="text-lg sm:text-xl font-display font-semibold text-text-bright truncate">
                {session.name}
              </h1>
            </div>

            {/* End Session button */}
            <button
              type="button"
              onClick={handleEndSession}
              disabled={endMutation.isPending}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                confirmEnd
                  ? 'bg-data-poor text-void-deep hover:bg-data-poor/90'
                  : 'bg-data-poor/15 text-data-poor border border-data-poor/30 hover:bg-data-poor/25'
              } disabled:opacity-50`}
            >
              <IconSquare width={14} height={14} />
              {confirmEnd ? 'Confirm End Session' : 'End Session'}
            </button>
          </div>
        </div>
      </div>

      {/* Live Dashboard */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 py-4 lg:py-6">
          <LiveErgDashboard
            ergData={ergData}
            isConnected={isConnected}
            targetPace={targetPace}
            sessionCode={session.sessionCode}
          />
        </div>
      </div>

      {/* Status footer */}
      <div className="border-t border-edge-default/30 px-4 lg:px-6 py-2 bg-void-deep/20">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-[10px] font-mono text-text-faint uppercase tracking-wider">
          <span className="flex items-center gap-2">
            <IconRadio width={10} height={10} />
            {session.name}
          </span>
          <span>{isConnected ? 'CONNECTED' : 'RECONNECTING...'}</span>
          {session.sessionCode && <span>CODE: {session.sessionCode}</span>}
        </div>
      </div>
    </div>
  );
}

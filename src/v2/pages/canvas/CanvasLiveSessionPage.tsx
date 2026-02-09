/**
 * CanvasLiveSessionPage - Live training session with Canvas design language
 *
 * Canvas design philosophy:
 * - Canvas header with pulsing live indicator (CSS animation)
 * - CanvasButton "End Session"
 * - LiveErgDashboard wrapped in Canvas styling container
 * - CanvasConsoleReadout showing session status
 * - NO rounded corners, NO card wrappers
 *
 * Feature parity with V2 LiveSessionPage:
 * - Live session display
 * - End session action
 * - Inactive session warning
 * - LiveErgDashboard integration
 */

import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Square } from 'lucide-react';
import { CanvasButton, CanvasChamferPanel, CanvasConsoleReadout } from '@v2/components/canvas';
import { useSession, useUpdateSession } from '@v2/hooks/useSessions';
import { LiveErgDashboard } from '@v2/features/live-erg/components/LiveErgDashboard';

// ============================================
// ANIMATION VARIANTS
// ============================================

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

// ============================================
// CANVAS LIVE SESSION PAGE
// ============================================

export function CanvasLiveSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { session, isLoading, error } = useSession(sessionId || '');
  const { updateSessionAsync, isUpdating } = useUpdateSession();

  const handleEndSession = async () => {
    if (!sessionId || !confirm('Are you sure you want to end this session?')) return;
    try {
      await updateSessionAsync({
        sessionId,
        input: { status: 'COMPLETED' },
      });
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full bg-void">
        <div className="max-w-5xl mx-auto px-6 pt-8">
          <div className="space-y-4">
            <div className="h-4 w-32 bg-ink-well/50 animate-pulse" />
            <div className="h-8 w-64 bg-ink-well/50 animate-pulse" />
            <CanvasChamferPanel className="p-6 h-96 animate-pulse bg-ink-well/30">
              <div className="h-full" />
            </CanvasChamferPanel>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !session) {
    return (
      <div className="h-full bg-void">
        <div className="max-w-5xl mx-auto px-6 pt-8">
          <CanvasConsoleReadout items={[{ label: 'STATUS', value: 'SESSION NOT FOUND' }]} />
        </div>
      </div>
    );
  }

  // Not active state
  if (session.status !== 'ACTIVE') {
    return (
      <div className="h-full flex flex-col bg-void">
        <div className="max-w-5xl mx-auto px-6 pt-8 flex-1">
          <CanvasChamferPanel className="p-6">
            <p className="text-sm text-data-warning font-mono mb-3">
              [SESSION NOT CURRENTLY ACTIVE]
            </p>
            <p className="text-sm text-ink-secondary mb-4">
              This session is not currently active. Return to the session detail page.
            </p>
            <Link to={`/app/canvas/training/sessions/${session.id}`}>
              <CanvasButton variant="secondary">
                <ChevronLeft className="w-4 h-4" />
                BACK TO SESSION
              </CanvasButton>
            </Link>
          </CanvasChamferPanel>
        </div>

        <div className="border-t border-ink-border/30 px-6 py-3 bg-ink-well/20">
          <div className="max-w-5xl mx-auto">
            <CanvasConsoleReadout
              items={[
                { label: 'SESSION', value: session.name },
                { label: 'STATUS', value: session.status },
              ]}
            />
          </div>
        </div>
      </div>
    );
  }

  // Get target pace from first main piece
  const mainPiece = session.pieces.find((p) => p.segment === 'MAIN');
  const targetPace = mainPiece?.targetSplit;

  return (
    <div className="h-full flex flex-col bg-void">
      {/* Page header with live indicator */}
      <div className="px-4 lg:px-6 pt-4 lg:pt-8 pb-4 lg:pb-6 border-b border-ink-border/30">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 bg-data-excellent"
                  style={{
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                />
                <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-data-excellent">
                  LIVE
                </span>
              </div>
              <div className="hidden sm:block h-5 w-px bg-ink-border/30" />
              <h1 className="text-2xl sm:text-3xl font-semibold text-ink-bright tracking-tight break-words">
                {session.name}
              </h1>
            </div>

            <CanvasButton
              variant="primary"
              onClick={handleEndSession}
              disabled={isUpdating}
              className="!bg-data-poor !border-data-poor hover:!bg-data-poor/90 min-h-[56px] sm:min-h-0 text-sm lg:text-base flex-shrink-0"
            >
              <Square className="w-5 h-5 sm:w-4 sm:h-4" />
              END SESSION
            </CanvasButton>
          </div>
        </div>
      </div>

      {/* Live Dashboard */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 py-4 lg:py-6">
          <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.div variants={fadeUp}>
              <div className="bg-ink-raised border border-white/[0.04] p-4 lg:p-6">
                <LiveErgDashboard
                  sessionId={session.id}
                  sessionName={session.name}
                  sessionCode={session.sessionCode}
                  targetPace={targetPace}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Console readout footer - compact on mobile */}
      <div className="border-t border-ink-border/30 px-4 lg:px-6 py-2 lg:py-3 bg-ink-well/20">
        <div className="max-w-5xl mx-auto">
          <CanvasConsoleReadout
            items={[
              { label: 'SESSION', value: session.name },
              { label: 'STATUS', value: 'LIVE' },
              { label: 'CODE', value: session.sessionCode || 'N/A' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

export default CanvasLiveSessionPage;

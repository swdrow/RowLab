/**
 * CanvasSessionDetailPage - Training session detail with Canvas design language
 *
 * Canvas design philosophy:
 * - Canvas header with back link
 * - CanvasChamferPanel for session info
 * - RuledHeader per segment (Warmup/Main/Cooldown)
 * - CanvasLogEntry or CanvasChamferPanel per piece
 * - CanvasButton for Start Live/Edit/Delete
 * - ScrambleNumber for numeric values
 * - CanvasConsoleReadout footer
 * - NO rounded corners, NO card wrappers
 *
 * Feature parity with V2 SessionDetailPage:
 * - Session info display
 * - Pieces grouped by segment
 * - Start Live / View Live actions
 * - Edit / Delete actions
 * - Session code copy
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Play, Pencil, Trash2, Clock, Users, Copy, Calendar } from 'lucide-react';
import {
  CanvasButton,
  CanvasChamferPanel,
  CanvasConsoleReadout,
  RuledHeader,
  ScrambleNumber,
} from '@v2/components/canvas';
import { useSession, useUpdateSession, useDeleteSession } from '@v2/hooks/useSessions';
import type { PieceSegment } from '@v2/types/session';

const SEGMENT_ORDER: PieceSegment[] = ['WARMUP', 'MAIN', 'COOLDOWN'];
const SEGMENT_LABELS: Record<PieceSegment, string> = {
  WARMUP: 'WARMUP',
  MAIN: 'MAIN SET',
  COOLDOWN: 'COOLDOWN',
};

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
// CANVAS SESSION DETAIL PAGE
// ============================================

export function CanvasSessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const { session, isLoading, error } = useSession(sessionId || '');
  const { updateSessionAsync, isUpdating } = useUpdateSession();
  const { deleteSessionAsync } = useDeleteSession();

  const handleStartLive = async () => {
    if (!sessionId) return;
    try {
      await updateSessionAsync({
        sessionId,
        input: { status: 'ACTIVE' },
      });
      navigate(`/app/canvas/training/sessions/${sessionId}/live`);
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  const handleDelete = async () => {
    if (!sessionId || !confirm('Are you sure you want to delete this session?')) return;
    try {
      await deleteSessionAsync(sessionId);
      navigate('/app/canvas/training/sessions');
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full bg-void">
        <div className="max-w-5xl mx-auto px-6 pt-8">
          <div className="space-y-4">
            <div className="h-4 w-32 bg-ink-well/50 animate-pulse" />
            <div className="h-8 w-64 bg-ink-well/50 animate-pulse" />
            <CanvasChamferPanel className="p-6 h-48 animate-pulse bg-ink-well/30">
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

  // Group pieces by segment
  const piecesBySegment = SEGMENT_ORDER.map((segment) => ({
    segment,
    label: SEGMENT_LABELS[segment],
    pieces: session.pieces.filter((p) => p.segment === segment),
  })).filter((g) => g.pieces.length > 0);

  const totalPieces = session.pieces.length;

  return (
    <div className="h-full flex flex-col bg-void">
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 pt-6 pb-6">
          {/* Back link */}
          <button
            onClick={() => navigate('/app/canvas/training/sessions')}
            className="flex items-center gap-2 text-sm text-ink-secondary hover:text-ink-bright
                       transition-colors mb-6 group font-mono"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            ALL SESSIONS
          </button>

          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
            {/* Header */}
            <motion.div variants={fadeUp}>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-ink-secondary mb-3">
                    TRAINING / SESSION DETAIL
                  </p>
                  <h1 className="text-3xl font-semibold text-ink-bright tracking-tight">
                    {session.name}
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  {session.status === 'PLANNED' && (
                    <CanvasButton variant="primary" onClick={handleStartLive} disabled={isUpdating}>
                      <Play className="w-4 h-4" />
                      START LIVE
                    </CanvasButton>
                  )}

                  {session.status === 'ACTIVE' && (
                    <Link to={`/app/canvas/training/sessions/${session.id}/live`}>
                      <CanvasButton variant="primary">
                        <Play className="w-4 h-4" />
                        VIEW LIVE
                      </CanvasButton>
                    </Link>
                  )}

                  <CanvasButton variant="secondary" className="!px-3 !py-2">
                    <Pencil className="w-4 h-4" />
                  </CanvasButton>

                  <CanvasButton
                    variant="secondary"
                    onClick={handleDelete}
                    className="!px-3 !py-2 hover:!border-data-poor/50 hover:!text-data-poor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </CanvasButton>
                </div>
              </div>
            </motion.div>

            {/* Session Info Panel */}
            <motion.div variants={fadeUp}>
              <CanvasChamferPanel className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 text-xs font-medium font-mono bg-data-good/[0.12] text-data-good">
                        {session.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium font-mono ${
                          session.status === 'ACTIVE'
                            ? 'bg-data-excellent/[0.12] text-data-excellent'
                            : 'bg-ink-well/50 text-ink-secondary'
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-ink-secondary text-sm font-mono">
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
                        <ScrambleNumber value={totalPieces} className="text-ink-bright" />
                        <span className="text-ink-muted">
                          {totalPieces === 1 ? 'PIECE' : 'PIECES'}
                        </span>
                      </span>
                    </div>

                    {session.notes && <p className="text-sm text-ink-secondary">{session.notes}</p>}

                    {session.sessionCode && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-ink-muted font-mono">SESSION CODE</span>
                        <span className="font-mono font-bold text-ink-bright">
                          {session.sessionCode}
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(session.sessionCode || '')}
                          className="p-1 hover:bg-ink-well/50 transition-colors"
                          title="Copy code"
                        >
                          <Copy className="w-3.5 h-3.5 text-ink-muted" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </CanvasChamferPanel>
            </motion.div>

            {/* Pieces by Segment */}
            {piecesBySegment.length === 0 ? (
              <motion.div variants={fadeUp}>
                <CanvasConsoleReadout items={[{ label: 'STATUS', value: 'NO PIECES DEFINED' }]} />
              </motion.div>
            ) : (
              piecesBySegment.map((group) => (
                <motion.div key={group.segment} variants={fadeUp} className="space-y-3">
                  <RuledHeader>{group.label}</RuledHeader>

                  <div className="space-y-2">
                    {group.pieces.map((piece) => (
                      <div
                        key={piece.id}
                        className="p-4 bg-ink-raised border border-white/[0.04]
                                   hover:translate-x-1 transition-transform"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-ink-bright">{piece.name}</div>
                            {piece.description && (
                              <div className="text-sm text-ink-secondary mt-0.5">
                                {piece.description}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm font-mono">
                            {piece.distance && (
                              <span className="text-ink-bright">
                                <ScrambleNumber value={piece.distance} />m
                              </span>
                            )}
                            {piece.duration && (
                              <span className="text-ink-bright">{formatTime(piece.duration)}</span>
                            )}
                            {piece.targetSplit && (
                              <span className="text-ink-secondary">
                                @{formatTime(piece.targetSplit)}/500m
                              </span>
                            )}
                            {piece.targetRate && (
                              <span className="text-ink-secondary">
                                <ScrambleNumber value={piece.targetRate} />
                                spm
                              </span>
                            )}
                          </div>
                        </div>

                        {piece.notes && (
                          <div className="mt-2 text-sm text-ink-muted">{piece.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </div>

      {/* Console readout footer */}
      <div className="border-t border-ink-border/30 px-6 py-3 bg-ink-well/20">
        <div className="max-w-5xl mx-auto">
          <CanvasConsoleReadout
            items={[
              { label: 'SESSION', value: session.name },
              { label: 'STATUS', value: session.status },
              { label: 'TYPE', value: session.type },
              { label: 'PIECES', value: totalPieces.toString() },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

export default CanvasSessionDetailPage;

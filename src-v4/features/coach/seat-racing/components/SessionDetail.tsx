/**
 * SessionDetail: right-side slide-over panel for a seat race session.
 *
 * Renders via React portal at 600px width (desktop) or full-width bottom
 * sheet (mobile). Fetches session detail (nested pieces/boats/assignments)
 * and displays them in a scrollable area with delete confirmation.
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, MapPin } from 'lucide-react';

import { SPRING_GENTLE } from '@/lib/animations';
import { useIsMobile } from '@/hooks/useBreakpoint';
import { Button } from '@/components/ui/Button';
import { sessionDetailOptions, useDeleteSession } from '../api';
import type { Conditions, Side } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SessionDetailProps {
  sessionId: string | null;
  onClose: () => void;
  teamId: string;
  readOnly: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatLongDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(seconds: number | null): string {
  if (seconds == null) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins}:${secs.padStart(4, '0')}`;
}

const CONDITIONS_COLOR: Record<Conditions, string> = {
  calm: 'text-data-excellent bg-data-excellent/10',
  variable: 'text-data-warning bg-data-warning/10',
  rough: 'text-data-poor bg-data-poor/10',
};

const SIDE_COLOR: Record<Side, string> = {
  Port: 'text-data-poor',
  Starboard: 'text-data-excellent',
  Cox: 'text-data-info',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SessionDetail({ sessionId, onClose, teamId, readOnly }: SessionDetailProps) {
  const isMobile = useIsMobile();
  const isOpen = sessionId != null;

  // Fetch detail only when open
  const { data: session, isLoading } = useQuery({
    ...sessionDetailOptions(teamId, sessionId ?? ''),
    enabled: !!teamId && !!sessionId,
  });

  // Delete mutation
  const deleteSession = useDeleteSession(teamId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset delete confirmation when session changes
  useEffect(() => {
    setConfirmDelete(false);
  }, [sessionId]);

  const handleDelete = () => {
    if (!sessionId) return;
    deleteSession.mutate(sessionId, {
      onSuccess: () => {
        setConfirmDelete(false);
        onClose();
      },
    });
  };

  // ---- Body ----

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          {/* Panel */}
          {isMobile ? (
            <motion.div
              key="panel"
              className="fixed bottom-0 left-0 right-0 z-50 h-[90vh] bg-ink-base border-t border-ink-border rounded-t-2xl flex flex-col"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={SPRING_GENTLE}
            >
              <PanelContent
                session={session ?? null}
                isLoading={isLoading}
                readOnly={readOnly}
                confirmDelete={confirmDelete}
                isDeleting={deleteSession.isPending}
                onDelete={handleDelete}
                onConfirmDelete={() => setConfirmDelete(true)}
                onCancelDelete={() => setConfirmDelete(false)}
                onClose={onClose}
              />
            </motion.div>
          ) : (
            <motion.div
              key="panel"
              className="fixed top-0 right-0 h-full z-50 w-[600px] max-w-[90vw] bg-ink-base border-l border-ink-border flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={SPRING_GENTLE}
            >
              <PanelContent
                session={session ?? null}
                isLoading={isLoading}
                readOnly={readOnly}
                confirmDelete={confirmDelete}
                isDeleting={deleteSession.isPending}
                onDelete={handleDelete}
                onConfirmDelete={() => setConfirmDelete(true)}
                onCancelDelete={() => setConfirmDelete(false)}
                onClose={onClose}
              />
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

// ---------------------------------------------------------------------------
// Panel content (shared between mobile/desktop)
// ---------------------------------------------------------------------------

interface PanelContentProps {
  session: import('../types').SessionDetail | null;
  isLoading: boolean;
  readOnly: boolean;
  confirmDelete: boolean;
  isDeleting: boolean;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onClose: () => void;
}

function PanelContent({
  session,
  isLoading,
  readOnly,
  confirmDelete,
  isDeleting,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onClose,
}: PanelContentProps) {
  if (isLoading) {
    return (
      <>
        <SlideOverHeader title="Loading..." onClose={onClose} />
        <div className="flex-1 p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-ink-raised animate-shimmer rounded-lg" />
          ))}
        </div>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <SlideOverHeader title="Session" onClose={onClose} />
        <div className="flex-1 flex items-center justify-center text-ink-secondary text-sm">
          Session not found
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="shrink-0 px-5 py-4 border-b border-ink-border">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-display font-semibold text-ink-primary">
              {formatLongDate(session.date)}
            </h2>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent-copper/10 text-accent-copper">
                {session.boatClass}
              </span>
              {session.conditions && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONDITIONS_COLOR[session.conditions]}`}
                >
                  {session.conditions.charAt(0).toUpperCase() + session.conditions.slice(1)}
                </span>
              )}
            </div>

            {/* Location */}
            {session.location && (
              <div className="flex items-center gap-2 mt-2 text-sm text-ink-secondary">
                <MapPin size={14} className="shrink-0" />
                {session.location}
              </div>
            )}

            {/* Description */}
            {session.description && (
              <p className="mt-2 text-sm text-ink-secondary">{session.description}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-ink-hover transition-colors ml-3"
            aria-label="Close"
          >
            <X size={18} className="text-ink-tertiary" />
          </button>
        </div>

        {/* Delete button */}
        {!readOnly && (
          <div className="mt-3">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-secondary">Delete this session?</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="!text-data-poor !h-7 !px-2 !text-xs"
                  onClick={onDelete}
                  loading={isDeleting}
                >
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="!h-7 !px-2 !text-xs"
                  onClick={onCancelDelete}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onConfirmDelete}
                className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-data-poor transition-colors"
              >
                <Trash2 size={13} />
                Delete Session
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pieces */}
      <div className="flex-1 overflow-y-auto p-5">
        {session.pieces && session.pieces.length > 0 ? (
          <div className="space-y-5">
            {[...session.pieces]
              .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
              .map((piece) => {
                const sortedBoats = [...piece.boats].sort((a, b) => {
                  if (a.finishTimeSeconds == null) return 1;
                  if (b.finishTimeSeconds == null) return -1;
                  return a.finishTimeSeconds - b.finishTimeSeconds;
                });

                return (
                  <div
                    key={piece.id}
                    className="rounded-lg border border-ink-border/50 overflow-hidden"
                  >
                    {/* Piece header */}
                    <div className="px-4 py-2.5 bg-ink-well/40 border-b border-ink-border/30">
                      <h3 className="text-sm font-semibold text-ink-primary">
                        Piece {piece.sequenceOrder}
                      </h3>
                      {piece.distanceMeters && (
                        <span className="text-xs text-ink-tertiary">{piece.distanceMeters}m</span>
                      )}
                    </div>

                    {/* Boats */}
                    <div className="divide-y divide-ink-border/20">
                      {sortedBoats.length > 0 ? (
                        sortedBoats.map((boat, idx) => (
                          <div key={boat.id} className="px-4 py-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2.5">
                                {/* Rank */}
                                <span
                                  className={`
                                    flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                                    ${
                                      idx === 0
                                        ? 'bg-accent-copper/20 text-accent-copper'
                                        : 'bg-ink-well text-ink-tertiary'
                                    }
                                  `.trim()}
                                >
                                  {idx + 1}
                                </span>
                                <span className="text-sm font-medium text-ink-primary">
                                  {boat.name || `Boat ${idx + 1}`}
                                </span>
                              </div>
                              <span className="text-sm font-mono text-ink-secondary">
                                {formatTime(boat.finishTimeSeconds)}
                              </span>
                            </div>

                            {/* Assignments */}
                            {boat.assignments.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 ml-8">
                                {[...boat.assignments]
                                  .sort((a, b) => a.seatNumber - b.seatNumber)
                                  .map((asgn) => (
                                    <span
                                      key={asgn.id}
                                      className="flex items-center gap-1 px-2 py-0.5 text-xs bg-ink-well/40 rounded"
                                    >
                                      <span className="font-medium text-ink-tertiary">
                                        {asgn.seatNumber === 9 ? 'Cox' : asgn.seatNumber}:
                                      </span>
                                      <span className="text-ink-secondary">
                                        {asgn.athlete.firstName} {asgn.athlete.lastName}
                                      </span>
                                      {asgn.side && (
                                        <span
                                          className={`text-xs font-medium ${SIDE_COLOR[asgn.side]}`}
                                        >
                                          {asgn.side === 'Cox'
                                            ? 'C'
                                            : asgn.side === 'Port'
                                              ? 'P'
                                              : 'S'}
                                        </span>
                                      )}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-xs text-ink-tertiary">
                          No boats recorded
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-sm text-ink-secondary">
            No pieces recorded for this session
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function SlideOverHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-ink-border shrink-0">
      <h2 className="text-lg font-display font-semibold text-ink-primary">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        className="p-1.5 rounded-md hover:bg-ink-hover transition-colors"
        aria-label="Close"
      >
        <X size={18} className="text-ink-tertiary" />
      </button>
    </div>
  );
}

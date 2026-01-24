import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Calendar, MapPin } from 'lucide-react';
import type { SeatRaceSession } from '@v2/types/seatRacing';

export interface SessionListProps {
  sessions: SeatRaceSession[];
  isLoading?: boolean;
  onSelectSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}

/**
 * Format date as "Jan 24, 2026" or relative "2 days ago"
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Use relative time for recent dates
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  // Otherwise use formatted date
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Boat class badge
 */
function BoatClassBadge({ boatClass }: { boatClass: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
      {boatClass}
    </span>
  );
}

/**
 * Conditions badge
 */
function ConditionsBadge({ conditions }: { conditions: string }) {
  const colors: Record<string, string> = {
    calm: 'bg-green-500/10 text-green-600 dark:text-green-400',
    variable: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    rough: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };

  const color = colors[conditions] || 'bg-gray-500/10 text-gray-600 dark:text-gray-400';

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {conditions.charAt(0).toUpperCase() + conditions.slice(1)}
    </span>
  );
}

/**
 * Skeleton loading card
 */
function SkeletonCard() {
  return (
    <div className="p-4 bg-bg-surface border border-bdr-default rounded-lg animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2">
          <div className="h-5 w-32 bg-bg-active rounded" />
          <div className="h-4 w-24 bg-bg-active rounded" />
        </div>
        <div className="h-6 w-12 bg-bg-active rounded-full" />
      </div>
      <div className="h-4 w-48 bg-bg-active rounded" />
    </div>
  );
}

/**
 * Delete confirmation dialog
 */
function DeleteConfirmDialog({
  session,
  onConfirm,
  onCancel,
}: {
  session: SeatRaceSession;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-bg-surface border border-bdr-default rounded-lg p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-lg font-semibold text-txt-primary mb-2">Delete Seat Race Session?</h3>
        <p className="text-sm text-txt-secondary mb-4">
          This will permanently delete the session from{' '}
          <span className="font-medium text-txt-primary">{formatDate(session.date)}</span> and all
          associated pieces. This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-txt-primary bg-bg-active rounded-md hover:bg-bg-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
          >
            Delete Session
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * List component showing past seat race sessions
 */
export function SessionList({
  sessions,
  isLoading = false,
  onSelectSession,
  onDeleteSession,
}: SessionListProps) {
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  // Sort by date descending (most recent first)
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleDelete = (sessionId: string) => {
    setDeleteSessionId(sessionId);
  };

  const confirmDelete = () => {
    if (deleteSessionId && onDeleteSession) {
      onDeleteSession(deleteSessionId);
      setDeleteSessionId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6 bg-bg-surface rounded-lg border border-bdr-default">
        <svg
          className="w-16 h-16 text-txt-muted mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="text-lg font-medium text-txt-primary mb-2">No seat races yet</p>
        <p className="text-sm text-txt-secondary">
          Create your first seat race session to start ranking athletes
        </p>
      </div>
    );
  }

  const sessionToDelete = sortedSessions.find((s) => s.id === deleteSessionId);

  return (
    <>
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedSessions.map((session) => (
            <motion.div
              key={session.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group relative p-4 bg-bg-surface border border-bdr-default rounded-lg hover:border-interactive-primary transition-all cursor-pointer"
              onClick={() => onSelectSession?.(session.id)}
            >
              {/* Main content */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-txt-tertiary" />
                    <span className="text-sm font-medium text-txt-primary">
                      {formatDate(session.date)}
                    </span>
                  </div>
                  {session.location && (
                    <div className="flex items-center gap-2 text-sm text-txt-secondary">
                      <MapPin className="w-3.5 h-3.5" />
                      {session.location}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <BoatClassBadge boatClass={session.boatClass} />
                  {onDeleteSession && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-txt-tertiary hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                      title="Delete session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Badges row */}
              <div className="flex items-center gap-2 flex-wrap">
                {session.conditions && <ConditionsBadge conditions={session.conditions} />}
                {/* Note: Piece count would come from pieces relation, not available in base session type */}
                <span className="text-xs text-txt-tertiary">
                  {session.description ? (
                    <span className="truncate block max-w-[300px]">{session.description}</span>
                  ) : (
                    'No description'
                  )}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {sessionToDelete && (
          <DeleteConfirmDialog
            session={sessionToDelete}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteSessionId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

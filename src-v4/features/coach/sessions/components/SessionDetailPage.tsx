/**
 * SessionDetailPage - Detail view for a single training session.
 *
 * Shows session metadata, pieces grouped by segment, and status actions
 * (Start, End, Edit, Delete). Pieces display distance, duration, target
 * split, and target rate.
 */
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { formatDuration } from '@/lib/format';
import {
  sessionDetailOptions,
  useStartSession,
  useEndSession,
  useUpdateSession,
  useDeleteSession,
} from '../api';
import { SessionForm, type SessionFormData } from './SessionForm';
import {
  IconCalendar,
  IconCheck,
  IconChevronLeft,
  IconClock,
  IconCopy,
  IconPencil,
  IconPlay,
  IconSquare,
  IconTrash,
} from '@/components/icons';
import {
  SESSION_TYPE_CONFIG,
  SESSION_STATUS_CONFIG,
  SEGMENT_ORDER,
  SEGMENT_LABELS,
  type UpdateSessionInput,
} from '../types';

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <SkeletonGroup className="space-y-6">
      <div className="space-y-3">
        <Skeleton height="0.875rem" width="6rem" rounded="sm" />
        <Skeleton height="2rem" width="14rem" rounded="sm" />
      </div>
      <div className="bg-void-raised border border-edge-default rounded-lg p-5 space-y-3">
        <Skeleton height="1.5rem" width="5rem" rounded="md" />
        <Skeleton height="0.875rem" width="12rem" rounded="sm" />
        <Skeleton height="0.875rem" width="8rem" rounded="sm" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-void-raised border border-edge-default rounded-lg p-3">
            <Skeleton height="0.875rem" width="10rem" rounded="sm" />
          </div>
        ))}
      </div>
    </SkeletonGroup>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SessionDetailPageProps {
  sessionId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SessionDetailPage({ sessionId }: SessionDetailPageProps) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: session, isLoading, error } = useQuery(sessionDetailOptions(sessionId));
  const startMutation = useStartSession();
  const endMutation = useEndSession();
  const updateMutation = useUpdateSession();
  const deleteMutation = useDeleteSession();

  const handleBack = useCallback(() => {
    void navigate({ to: '/training/sessions' });
  }, [navigate]);

  const handleStart = useCallback(async () => {
    await startMutation.mutateAsync(sessionId);
  }, [startMutation, sessionId]);

  const handleEnd = useCallback(async () => {
    await endMutation.mutateAsync(sessionId);
  }, [endMutation, sessionId]);

  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    await deleteMutation.mutateAsync(sessionId);
    void navigate({ to: '/training/sessions' });
  }, [deleteMutation, sessionId, navigate]);

  const handleUpdate = useCallback(
    async (data: SessionFormData) => {
      const input: UpdateSessionInput = {
        name: data.name,
        type: data.type,
        date: data.date,
        startTime: data.startTime || undefined,
        endTime: data.endTime || undefined,
        notes: data.notes || undefined,
        athleteVisibility: data.athleteVisibility,
      };
      await updateMutation.mutateAsync({ sessionId, input });
      setEditing(false);
    },
    [updateMutation, sessionId]
  );

  const handleCopyCode = useCallback(async () => {
    if (!session?.sessionCode) return;
    await navigator.clipboard.writeText(session.sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [session?.sessionCode]);

  // Loading
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <DetailSkeleton />
      </div>
    );
  }

  // Error / not found
  if (error || !session) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-text-dim hover:text-text-bright transition-colors mb-4"
        >
          <IconChevronLeft width={16} height={16} />
          Back to Sessions
        </button>
        <p className="text-text-dim text-sm">Session not found.</p>
      </div>
    );
  }

  const typeConfig = SESSION_TYPE_CONFIG[session.type];
  const statusConfig = SESSION_STATUS_CONFIG[session.status];

  // Group pieces by segment
  const piecesBySegment = SEGMENT_ORDER.map((segment) => ({
    segment,
    label: SEGMENT_LABELS[segment],
    pieces: session.pieces.filter((p) => p.segment === segment).sort((a, b) => a.order - b.order),
  })).filter((g) => g.pieces.length > 0);

  // Edit dialog
  if (editing) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="flex items-center gap-1 text-sm text-text-dim hover:text-text-bright transition-colors mb-4"
        >
          <IconChevronLeft width={16} height={16} />
          Cancel Edit
        </button>
        <h2 className="text-lg font-display font-semibold text-text-bright mb-4">Edit Session</h2>
        <SessionForm
          session={session}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          isSubmitting={updateMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Back link */}
      <button
        type="button"
        onClick={handleBack}
        className="flex items-center gap-1 text-sm text-text-dim hover:text-text-bright transition-colors mb-4"
      >
        <IconChevronLeft width={16} height={16} />
        All Sessions
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${typeConfig.color}`}>{typeConfig.label}</span>
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
            >
              {statusConfig.label}
            </span>
          </div>
          <h1 className="text-2xl font-display font-semibold text-text-bright break-words">
            {session.name}
          </h1>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {session.status === 'PLANNED' && (
            <button
              type="button"
              onClick={handleStart}
              disabled={startMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-data-good text-void-deep text-sm font-medium hover:bg-data-good/90 disabled:opacity-50 transition-colors"
            >
              <IconPlay width={14} height={14} />
              Start
            </button>
          )}
          {session.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={handleEnd}
              disabled={endMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-data-warning text-void-deep text-sm font-medium hover:bg-data-warning/90 disabled:opacity-50 transition-colors"
            >
              <IconSquare width={14} height={14} />
              End
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-edge-default text-sm font-medium text-text-dim hover:text-text-bright hover:bg-void-overlay transition-colors"
          >
            <IconPencil width={14} height={14} />
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-edge-default text-sm font-medium text-text-dim hover:text-data-poor hover:border-data-poor/30 disabled:opacity-50 transition-colors"
          >
            <IconTrash width={14} height={14} />
          </button>
        </div>
      </div>

      {/* Session info panel */}
      <div className="bg-void-raised border border-edge-default rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4 text-sm text-text-dim">
          <span className="flex items-center gap-1.5">
            <IconCalendar width={14} height={14} />
            {new Date(session.date).toLocaleDateString(undefined, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          {session.startTime && (
            <span className="flex items-center gap-1.5">
              <IconClock width={14} height={14} />
              {session.startTime}
            </span>
          )}
          <span className="text-text-faint">
            {session.pieces.length} {session.pieces.length === 1 ? 'piece' : 'pieces'}
          </span>
        </div>

        {session.notes && <p className="mt-3 text-sm text-text-default">{session.notes}</p>}

        {session.sessionCode && (
          <div className="mt-3 flex items-center gap-2 border-t border-edge-default pt-3">
            <span className="text-xs text-text-faint">Session Code:</span>
            <span className="font-mono font-bold text-text-bright">{session.sessionCode}</span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-1 text-text-faint hover:text-text-bright transition-colors"
              title="Copy code"
            >
              {copied ? (
                <IconCheck width={14} height={14} className="text-data-good" />
              ) : (
                <IconCopy width={14} height={14} />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Pieces by segment */}
      {piecesBySegment.length === 0 ? (
        <p className="text-sm text-text-dim text-center py-8">
          No pieces defined for this session.
        </p>
      ) : (
        <div className="space-y-5">
          {piecesBySegment.map((group) => (
            <div key={group.segment}>
              <h3 className="text-xs font-display font-semibold uppercase tracking-wider text-text-faint mb-2">
                {group.label}
              </h3>
              <div className="space-y-1.5">
                {group.pieces.map((piece) => (
                  <div
                    key={piece.id}
                    className="bg-void-raised border border-edge-default rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-text-bright">{piece.name}</span>
                      <div className="flex items-center gap-3 text-xs text-text-dim font-mono flex-shrink-0">
                        {piece.distance && <span>{piece.distance}m</span>}
                        {piece.duration && <span>{formatDuration(piece.duration)}</span>}
                        {piece.targetSplit && (
                          <span>@{formatDuration(piece.targetSplit)}/500m</span>
                        )}
                        {piece.targetRate && <span>{piece.targetRate}spm</span>}
                      </div>
                    </div>
                    {piece.description && (
                      <p className="text-xs text-text-dim mt-1">{piece.description}</p>
                    )}
                    {piece.notes && <p className="text-xs text-text-faint mt-1">{piece.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

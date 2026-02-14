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
import {
  ChevronLeft,
  Play,
  Square,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Copy,
  Check,
} from 'lucide-react';

import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import {
  sessionDetailOptions,
  useStartSession,
  useEndSession,
  useUpdateSession,
  useDeleteSession,
} from '../api';
import { SessionForm, type SessionFormData } from './SessionForm';
import {
  SESSION_TYPE_CONFIG,
  SESSION_STATUS_CONFIG,
  SEGMENT_ORDER,
  SEGMENT_LABELS,
  type UpdateSessionInput,
} from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

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
      <div className="bg-ink-raised border border-ink-border rounded-lg p-5 space-y-3">
        <Skeleton height="1.5rem" width="5rem" rounded="md" />
        <Skeleton height="0.875rem" width="12rem" rounded="sm" />
        <Skeleton height="0.875rem" width="8rem" rounded="sm" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-ink-raised border border-ink-border rounded-lg p-3">
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
      <div className="max-w-3xl mx-auto px-4 py-6">
        <DetailSkeleton />
      </div>
    );
  }

  // Error / not found
  if (error || !session) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-ink-secondary hover:text-ink-primary transition-colors mb-4"
        >
          <ChevronLeft size={16} />
          Back to Sessions
        </button>
        <p className="text-ink-secondary text-sm">Session not found.</p>
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
      <div className="max-w-3xl mx-auto px-4 py-6">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="flex items-center gap-1 text-sm text-ink-secondary hover:text-ink-primary transition-colors mb-4"
        >
          <ChevronLeft size={16} />
          Cancel Edit
        </button>
        <h2 className="text-lg font-semibold text-ink-primary mb-4">Edit Session</h2>
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
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Back link */}
      <button
        type="button"
        onClick={handleBack}
        className="flex items-center gap-1 text-sm text-ink-secondary hover:text-ink-primary transition-colors mb-4"
      >
        <ChevronLeft size={16} />
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
          <h1 className="text-2xl font-display font-semibold text-ink-primary break-words">
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
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors"
            >
              <Play size={14} />
              Start
            </button>
          )}
          {session.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={handleEnd}
              disabled={endMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              <Square size={14} />
              End
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-ink-border text-sm font-medium text-ink-secondary hover:text-ink-primary hover:bg-ink-hover transition-colors"
          >
            <Pencil size={14} />
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-ink-border text-sm font-medium text-ink-secondary hover:text-data-poor hover:border-data-poor/30 disabled:opacity-50 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Session info panel */}
      <div className="bg-ink-raised border border-ink-border rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4 text-sm text-ink-secondary">
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />
            {new Date(session.date).toLocaleDateString(undefined, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          {session.startTime && (
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {session.startTime}
            </span>
          )}
          <span className="text-ink-muted">
            {session.pieces.length} {session.pieces.length === 1 ? 'piece' : 'pieces'}
          </span>
        </div>

        {session.notes && <p className="mt-3 text-sm text-ink-body">{session.notes}</p>}

        {session.sessionCode && (
          <div className="mt-3 flex items-center gap-2 border-t border-ink-border pt-3">
            <span className="text-xs text-ink-muted">Session Code:</span>
            <span className="font-mono font-bold text-ink-primary">{session.sessionCode}</span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-1 text-ink-muted hover:text-ink-primary transition-colors"
              title="Copy code"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>

      {/* Pieces by segment */}
      {piecesBySegment.length === 0 ? (
        <p className="text-sm text-ink-secondary text-center py-8">
          No pieces defined for this session.
        </p>
      ) : (
        <div className="space-y-5">
          {piecesBySegment.map((group) => (
            <div key={group.segment}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
                {group.label}
              </h3>
              <div className="space-y-1.5">
                {group.pieces.map((piece) => (
                  <div
                    key={piece.id}
                    className="bg-ink-raised border border-ink-border rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-ink-primary">{piece.name}</span>
                      <div className="flex items-center gap-3 text-xs text-ink-secondary font-mono flex-shrink-0">
                        {piece.distance && <span>{piece.distance}m</span>}
                        {piece.duration && <span>{formatTime(piece.duration)}</span>}
                        {piece.targetSplit && <span>@{formatTime(piece.targetSplit)}/500m</span>}
                        {piece.targetRate && <span>{piece.targetRate}spm</span>}
                      </div>
                    </div>
                    {piece.description && (
                      <p className="text-xs text-ink-secondary mt-1">{piece.description}</p>
                    )}
                    {piece.notes && <p className="text-xs text-ink-muted mt-1">{piece.notes}</p>}
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

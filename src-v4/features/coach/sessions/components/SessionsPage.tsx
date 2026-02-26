/**
 * SessionsPage - Training sessions list for coaches.
 *
 * Displays session cards with status badges, filters, and a create form dialog.
 * Active sessions are highlighted at the top.
 */
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { Card } from '@/components/ui/Card';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { sessionsOptions, activeSessionOptions, useCreateSession } from '../api';
import { SessionForm, type SessionFormData } from './SessionForm';
import { IconCalendar, IconClock, IconPlay, IconPlus } from '@/components/icons';
import {
  SESSION_TYPE_CONFIG,
  SESSION_STATUS_CONFIG,
  type TrainingSession,
  type CreateSessionInput,
} from '../types';

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function SessionsSkeleton() {
  return (
    <SkeletonGroup className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-void-raised border border-edge-default rounded-lg p-4"
          aria-hidden
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton height="1rem" width="10rem" rounded="sm" />
              <Skeleton height="0.75rem" width="6rem" rounded="sm" />
            </div>
            <Skeleton height="1.5rem" width="4rem" rounded="md" />
          </div>
        </div>
      ))}
    </SkeletonGroup>
  );
}

// ---------------------------------------------------------------------------
// Session card
// ---------------------------------------------------------------------------

interface SessionCardProps {
  session: TrainingSession;
  onNavigate: (id: string) => void;
}

function SessionCard({ session, onNavigate }: SessionCardProps) {
  const typeConfig = SESSION_TYPE_CONFIG[session.type];
  const statusConfig = SESSION_STATUS_CONFIG[session.status];
  const isActive = session.status === 'ACTIVE';

  return (
    <button
      type="button"
      onClick={() => onNavigate(session.id)}
      className={`w-full text-left rounded-lg border p-4 transition-all hover:border-text-faint group ${
        isActive
          ? 'border-data-excellent/30 bg-data-excellent/5'
          : 'border-edge-default bg-void-raised hover:bg-void-overlay'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${typeConfig.color}`}>{typeConfig.label}</span>
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
            >
              {statusConfig.label}
            </span>
          </div>
          <h3 className="mt-1 text-sm font-display font-medium text-text-bright group-hover:text-text-bright truncate">
            {session.name}
          </h3>
          <div className="mt-1 flex items-center gap-3 text-xs text-text-dim">
            <span className="flex items-center gap-1">
              <IconCalendar width={12} height={12} />
              {new Date(session.date).toLocaleDateString()}
            </span>
            {session.pieces.length > 0 && (
              <span>
                {session.pieces.length} {session.pieces.length === 1 ? 'piece' : 'pieces'}
              </span>
            )}
            {session.startTime && (
              <span className="flex items-center gap-1">
                <IconClock width={12} height={12} />
                {session.startTime}
              </span>
            )}
          </div>
        </div>

        {isActive && (
          <div className="flex items-center gap-1 rounded-md bg-data-excellent/20 px-2.5 py-1 text-xs font-medium text-data-excellent">
            <IconPlay width={12} height={12} />
            Live
          </div>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export function SessionsPage() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  const { data: sessions, isLoading } = useQuery(sessionsOptions());
  const { data: activeSession } = useQuery(activeSessionOptions());

  const createMutation = useCreateSession();

  const handleNavigate = useCallback(
    (id: string) => {
      void navigate({ to: '/training/sessions/$sessionId', params: { sessionId: id } });
    },
    [navigate]
  );

  const handleCreate = useCallback(
    async (data: SessionFormData) => {
      const input: CreateSessionInput = {
        ...data,
        pieces: data.pieces.map((piece, index) => ({
          ...piece,
          order: index,
        })),
      };
      const created = await createMutation.mutateAsync(input);
      setShowForm(false);
      void navigate({ to: '/training/sessions/$sessionId', params: { sessionId: created.id } });
    },
    [createMutation, navigate]
  );

  // Sort: active first, then by date descending
  const sortedSessions = [...(sessions ?? [])].sort((a, b) => {
    if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
    if (b.status === 'ACTIVE' && a.status !== 'ACTIVE') return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-text-bright text-2xl font-display font-semibold">Sessions</h1>
          {activeSession && (
            <p className="text-xs text-data-excellent mt-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-data-excellent animate-pulse" />
              Active session in progress
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-teal text-void-deep text-sm font-medium hover:bg-accent-teal-hover transition-colors"
        >
          <IconPlus width={16} height={16} />
          New Session
        </button>
      </div>

      {/* Session list */}
      {isLoading ? (
        <SessionsSkeleton />
      ) : sortedSessions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-dim text-sm mb-4">No training sessions yet.</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-teal text-void-deep text-sm font-medium hover:bg-accent-teal-hover transition-colors"
          >
            <IconPlus width={16} height={16} />
            Create your first session
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedSessions.map((session) => (
            <SessionCard key={session.id} session={session} onNavigate={handleNavigate} />
          ))}
        </div>
      )}

      {/* Create session dialog */}
      {showForm && (
        <>
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- backdrop overlay dismiss pattern */}
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowForm(false)} />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- stopPropagation prevents backdrop dismiss on content click */}
            <Card
              padding="lg"
              variant="elevated"
              className="max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-display font-semibold text-text-bright mb-4">
                New Session
              </h2>
              <SessionForm
                onSubmit={handleCreate}
                onCancel={() => setShowForm(false)}
                isSubmitting={createMutation.isPending}
              />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

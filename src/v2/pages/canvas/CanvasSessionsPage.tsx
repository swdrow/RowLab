/**
 * CanvasSessionsPage - Training sessions list with Canvas design language
 *
 * Canvas redesign of SessionsPage with:
 * - CanvasTicket for each session (chamfered panels that tilt on hover)
 * - CanvasSelect for status/type filters
 * - CanvasButton for "New Session" action
 * - CanvasConsoleReadout for session summary stats
 * - NO rounded corners, NO card wrappers
 */

import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Calendar, ListBullets, Play } from '@phosphor-icons/react';
import { useSessions } from '../../hooks/useSessions';
import { SessionForm } from '../../features/sessions/components/SessionForm';
import { useTrainingKeyboard } from '../../hooks/useTrainingKeyboard';
import {
  RuledHeader,
  CanvasTicket,
  CanvasSelect,
  CanvasButton,
  CanvasConsoleReadout,
  ScrambleNumber,
} from '@v2/components/canvas';
import { CanvasModal } from '@v2/components/canvas';
import type { SessionType, SessionStatus } from '../../types/session';

const SESSION_TYPE_COLORS: Record<SessionType, string> = {
  ERG: 'var(--data-good)',
  ROW: 'var(--data-excellent)',
  LIFT: 'var(--data-warning)',
  RUN: 'var(--data-warning)',
  CROSS_TRAIN: 'var(--accent-copper)',
  RECOVERY: 'var(--data-excellent)',
};

const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  PLANNED: 'Planned',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// ============================================
// STAGGER ANIMATION HELPERS
// ============================================

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export function CanvasSessionsPage() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { sessions, isLoading } = useSessions();

  // Keyboard shortcuts
  useTrainingKeyboard({
    onNewSession: useCallback(() => setShowForm(true), []),
    onEscape: useCallback(() => setShowForm(false), []),
    onToggleView: useCallback(() => setViewMode((v) => (v === 'list' ? 'calendar' : 'list')), []),
  });

  // Filter sessions
  const filteredSessions = sessions?.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (typeFilter !== 'all' && s.type !== typeFilter) return false;
    return true;
  });

  const totalSessions = sessions?.length || 0;
  const upcomingSessions =
    sessions?.filter((s) => s.status === 'PLANNED' || s.status === 'ACTIVE').length || 0;

  if (isLoading) {
    return (
      <div className="p-6">
        <CanvasConsoleReadout items={[{ label: 'STATUS', value: 'LOADING SESSIONS' }]} />
      </div>
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="space-y-8 px-4 lg:px-0"
    >
      {/* ============================================ */}
      {/* HEADER — text against void */}
      {/* ============================================ */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-2 pb-6"
      >
        <div>
          <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-[0.2em] mb-1">
            Practice Sessions
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-bright tracking-tight leading-none">
            Sessions
          </h1>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          {/* View toggle */}
          <div className="flex items-center border border-white/[0.06] overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 lg:p-2.5 transition-colors ${viewMode === 'list' ? 'bg-white/[0.06] text-ink-bright' : 'text-ink-muted hover:text-ink-primary'}`}
              title="List view"
              style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}
            >
              <ListBullets className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 lg:p-2.5 transition-colors ${viewMode === 'calendar' ? 'bg-white/[0.06] text-ink-bright' : 'text-ink-muted hover:text-ink-primary'}`}
              title="Calendar view"
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>

          <CanvasButton
            variant="primary"
            onClick={() => setShowForm(true)}
            className="text-sm lg:text-base"
          >
            <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="hidden sm:inline">New Session</span>
            <span className="sm:hidden">New</span>
          </CanvasButton>
        </div>
      </motion.div>

      {/* ============================================ */}
      {/* FILTERS */}
      {/* ============================================ */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 lg:gap-4">
        <div className="w-full sm:w-48">
          <CanvasSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'PLANNED', label: 'Planned' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
        </div>
        <div className="w-full sm:w-48">
          <CanvasSelect
            label="Type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'ERG', label: 'Erg' },
              { value: 'ROW', label: 'On Water' },
              { value: 'LIFT', label: 'Lift' },
              { value: 'RUN', label: 'Run' },
              { value: 'CROSS_TRAIN', label: 'Cross Train' },
              { value: 'RECOVERY', label: 'Recovery' },
            ]}
          />
        </div>
      </motion.div>

      {/* ============================================ */}
      {/* SESSION LIST */}
      {/* ============================================ */}
      <motion.div variants={fadeUp}>
        {viewMode === 'list' && (
          <div>
            <RuledHeader>Training Sessions</RuledHeader>

            {!filteredSessions || filteredSessions.length === 0 ? (
              <CanvasConsoleReadout items={[{ label: 'STATUS', value: 'NO SESSIONS SCHEDULED' }]} />
            ) : (
              <div className="space-y-3 mt-4">
                {filteredSessions.map((session, i) => {
                  const typeColor = SESSION_TYPE_COLORS[session.type];

                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.15 + i * 0.05,
                        duration: 0.35,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <Link to={`/app/training/sessions/${session.id}`}>
                        <CanvasTicket>
                          {/* Left accent edge */}
                          <div
                            className="absolute left-0 top-0 bottom-0 w-0.5 canvas-accent-breathe"
                            style={{
                              backgroundColor: typeColor,
                              animationDelay: `${i * 1.5}s`,
                            }}
                          />

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
                              {/* Type badge */}
                              <span
                                className="text-[10px] font-mono font-medium uppercase tracking-wider flex-shrink-0"
                                style={{ color: typeColor }}
                              >
                                {session.type}
                              </span>

                              {/* Session info */}
                              <div className="min-w-0">
                                <div className="font-medium text-sm lg:text-base text-ink-bright group-hover:text-white transition-colors truncate">
                                  {session.name}
                                </div>
                                <div className="text-xs font-mono text-ink-secondary mt-0.5">
                                  {new Date(session.date).toLocaleDateString()} ·{' '}
                                  <ScrambleNumber value={session.pieces.length} /> pieces
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 flex-shrink-0">
                              {/* Status */}
                              <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider">
                                {SESSION_STATUS_LABELS[session.status]}
                              </span>

                              {/* Live button if active */}
                              {session.status === 'ACTIVE' && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    navigate(`/app/training/sessions/${session.id}/live`);
                                  }}
                                  className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-data-excellent text-white hover:bg-data-excellent/90 transition-colors min-h-[44px] sm:min-h-0 sm:py-1.5"
                                  style={{
                                    clipPath:
                                      'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)',
                                  }}
                                >
                                  <Play className="w-3 h-3" weight="fill" />
                                  Live
                                </button>
                              )}
                            </div>
                          </div>
                        </CanvasTicket>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Calendar View (placeholder) */}
        {viewMode === 'calendar' && (
          <CanvasConsoleReadout
            items={[{ label: 'STATUS', value: 'CALENDAR VIEW - COMING SOON' }]}
          />
        )}
      </motion.div>

      {/* ============================================ */}
      {/* CONSOLE READOUT — summary stats */}
      {/* ============================================ */}
      {sessions && sessions.length > 0 && (
        <motion.div variants={fadeUp}>
          <CanvasConsoleReadout
            items={[
              { label: 'TOTAL SESSIONS', value: totalSessions.toString() },
              { label: 'UPCOMING', value: upcomingSessions.toString() },
              { label: 'VIEW', value: viewMode.toUpperCase() },
            ]}
          />
        </motion.div>
      )}

      {/* ============================================ */}
      {/* CREATE SESSION MODAL */}
      {/* ============================================ */}
      <CanvasModal isOpen={showForm} onClose={() => setShowForm(false)} title="Create Session">
        <SessionForm onSuccess={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
      </CanvasModal>
    </motion.div>
  );
}

export default CanvasSessionsPage;

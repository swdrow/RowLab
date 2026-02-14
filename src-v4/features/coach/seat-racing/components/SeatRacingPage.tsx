/**
 * SeatRacingPage: complete seat racing page with Rankings and Sessions tabs.
 *
 * Rankings tab shows RankingsView (ELO chart + ranked table, from plan 07).
 * Sessions tab shows SessionList with detail slide-over.
 * Header has "New Session" button (hidden when readOnly).
 * Keyboard shortcuts: N=new session, R=recalculate, ?=help, Escape=close.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Keyboard, X } from 'lucide-react';

import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { fadeIn } from '@/lib/animations';

import { sessionsOptions, useRecalculate } from '../api';
import { RankingsView } from './RankingsView';
import { SessionList } from './SessionList';
import { SessionDetail } from './SessionDetail';
import { SessionWizard } from './SessionWizard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SeatRacingTab = 'rankings' | 'sessions';

interface SeatRacingPageProps {
  teamId: string;
  readOnly: boolean;
}

// ---------------------------------------------------------------------------
// Shortcuts help overlay
// ---------------------------------------------------------------------------

function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { key: 'N', description: 'New session' },
    { key: 'R', description: 'Recalculate rankings' },
    { key: '?', description: 'Show this help' },
    { key: 'Esc', description: 'Close panel / wizard / help' },
  ];

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-ink-base border border-ink-border rounded-xl shadow-card p-5 w-full max-w-xs"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ink-primary flex items-center gap-2">
            <Keyboard size={16} className="text-ink-tertiary" />
            Keyboard Shortcuts
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-ink-hover transition-colors"
            aria-label="Close"
          >
            <X size={16} className="text-ink-tertiary" />
          </button>
        </div>
        <div className="space-y-2.5">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center justify-between">
              <span className="text-sm text-ink-secondary">{s.description}</span>
              <kbd className="px-2 py-0.5 rounded bg-ink-well text-xs font-mono text-ink-primary border border-ink-border/50">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// SeatRacingPage
// ---------------------------------------------------------------------------

export function SeatRacingPage({ teamId, readOnly }: SeatRacingPageProps) {
  const [activeTab, setActiveTab] = useState<SeatRacingTab>('rankings');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Fetch sessions for the Sessions tab
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery(sessionsOptions(teamId));

  // Recalculate mutation (for keyboard shortcut)
  const { mutate: recalculate } = useRecalculate(teamId);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Guard: ignore when focus is in inputs, textareas, selects, or content-editable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        target.closest('dialog')
      ) {
        return;
      }

      switch (e.key) {
        case 'n':
        case 'N':
          if (!readOnly && !wizardOpen) {
            e.preventDefault();
            setWizardOpen(true);
          }
          break;

        case 'r':
        case 'R':
          e.preventDefault();
          recalculate();
          break;

        case '?':
          e.preventDefault();
          setShowHelp((h) => !h);
          break;

        case 'Escape':
          if (showHelp) {
            setShowHelp(false);
          } else if (wizardOpen) {
            setWizardOpen(false);
          } else if (selectedSessionId) {
            setSelectedSessionId(null);
          }
          break;
      }
    },
    [readOnly, wizardOpen, showHelp, selectedSessionId, recalculate]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <motion.div {...fadeIn} className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Seat Racing</h1>
          <p className="text-sm text-ink-secondary mt-0.5">
            Run seat races and track athlete rankings
          </p>
        </div>
        <div className="flex items-center gap-3">
          {readOnly && <ReadOnlyBadge />}
          {!readOnly && (
            <Button size="sm" onClick={() => setWizardOpen(true)}>
              <Plus size={16} />
              New Session
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-ink-well/40 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('rankings')}
          className={`
            px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
            ${
              activeTab === 'rankings'
                ? 'bg-ink-raised text-ink-primary shadow-sm'
                : 'text-ink-muted hover:text-ink-secondary'
            }
          `.trim()}
        >
          Rankings
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`
            px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
            ${
              activeTab === 'sessions'
                ? 'bg-ink-raised text-ink-primary shadow-sm'
                : 'text-ink-muted hover:text-ink-secondary'
            }
          `.trim()}
        >
          Sessions
          {sessions.length > 0 && (
            <span className="ml-1.5 text-xs text-ink-tertiary">({sessions.length})</span>
          )}
        </button>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'rankings' ? (
          <motion.div key="rankings" {...fadeIn}>
            <RankingsView teamId={teamId} />
          </motion.div>
        ) : (
          <motion.div key="sessions" {...fadeIn}>
            <GlassCard padding="md">
              <SessionList
                sessions={sessions}
                isLoading={sessionsLoading}
                selectedId={selectedSessionId}
                onSelect={setSelectedSessionId}
              />
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session detail slide-over */}
      <SessionDetail
        sessionId={selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
        teamId={teamId}
        readOnly={readOnly}
      />

      {/* Session creation wizard */}
      <SessionWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={() => setActiveTab('sessions')}
        teamId={teamId}
      />

      {/* Shortcuts help modal */}
      <AnimatePresence>
        {showHelp && <ShortcutsHelp onClose={() => setShowHelp(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}

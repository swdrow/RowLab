/**
 * SeatRacingPage: complete seat racing page with Rankings and Sessions tabs.
 *
 * Rankings tab shows RankingsView (ELO chart + ranked table, from plan 07).
 * Sessions tab shows SessionList with detail slide-over.
 * Header uses SectionHeader with Trophy icon and action buttons.
 * Tabs use shared TabToggle with animated sliding indicator.
 * Keyboard shortcuts: N=new session, R=recalculate, ?=help, Escape=close.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TabToggle, type Tab } from '@/components/ui/TabToggle';
import { fadeIn } from '@/lib/animations';

import { sessionsOptions, useRecalculate } from '../api';
import { RankingsView } from './RankingsView';
import { SessionList } from './SessionList';
import { SessionDetail } from './SessionDetail';
import { SessionWizard } from './SessionWizard';
import { IconKeyboard, IconPlus, IconTrophy, IconX } from '@/components/icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SeatRacingTab = 'rankings' | 'sessions';

interface SeatRacingPageProps {
  teamId: string;
  readOnly: boolean;
}

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

const SEAT_RACING_TABS: Tab[] = [
  { id: 'rankings', label: 'Rankings' },
  { id: 'sessions', label: 'Sessions' },
];

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
        className="w-full max-w-xs"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Card padding="lg" variant="elevated">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-display font-semibold text-text-bright flex items-center gap-2">
              <IconKeyboard width={16} height={16} className="text-text-faint" />
              Keyboard Shortcuts
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:bg-void-overlay transition-colors"
              aria-label="Close"
            >
              <IconX width={16} height={16} className="text-text-faint" />
            </button>
          </div>
          <div className="space-y-2.5">
            {shortcuts.map((s) => (
              <div key={s.key} className="flex items-center justify-between">
                <span className="text-sm text-text-dim">{s.description}</span>
                <kbd className="px-2 py-0.5 rounded bg-void-deep text-xs font-mono text-text-bright border border-edge-default/50">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </Card>
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
      {/* Header with SectionHeader */}
      <SectionHeader
        title="Seat Racing"
        description="ELO rankings and race sessions"
        icon={<IconTrophy width={18} height={18} />}
        action={
          <div className="flex items-center gap-3">
            {readOnly && <ReadOnlyBadge />}
            {!readOnly && (
              <Button size="sm" onClick={() => setWizardOpen(true)}>
                <IconPlus width={16} height={16} />
                New Session
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs -- TabToggle with animated indicator */}
      <TabToggle
        tabs={SEAT_RACING_TABS}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as SeatRacingTab)}
        layoutId="seat-racing-tabs"
      />

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'rankings' ? (
          <motion.div key="rankings" {...fadeIn}>
            <RankingsView teamId={teamId} />
          </motion.div>
        ) : (
          <motion.div key="sessions" {...fadeIn}>
            <Card padding="md">
              <SessionList
                sessions={sessions}
                isLoading={sessionsLoading}
                selectedId={selectedSessionId}
                onSelect={setSelectedSessionId}
              />
            </Card>
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

/**
 * CanvasSeatRacingPage - Canvas redesign of seat racing functionality
 *
 * Canvas Design System Features:
 * - ScrambleNumber for ALL ELO ratings and numeric values
 * - CanvasChamferPanel for rankings table rows and metrics
 * - CanvasTabs with ruled line active indicator
 * - CanvasModal for session wizard (multi-step)
 * - CanvasButton for all actions
 * - CanvasConsoleReadout for bottom status bar
 * - NO rounded corners anywhere
 * - Data-color coding (excellent/good/warning/poor) for ratings
 *
 * IMPORTANT: Reuses ALL data hooks, business logic, and most sub-components from V2.
 * Only the page structure and presentation layer are Canvas-styled.
 */

import { useState, Fragment, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { Dialog, Transition } from '@headlessui/react';
import { Plus, X, BarChart3, Calendar, Share2, Beaker, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAthleteRatings, useRecalculateRatings } from '@v2/hooks/useAthleteRatings';
import { useSeatRaceSessions } from '@v2/hooks/useSeatRaceSessions';
import { useAuth } from '@v2/contexts/AuthContext';
import { useIsMobile, useIsTabletOrSmaller } from '@v2/hooks/useBreakpoint';
import {
  RankingsChart,
  SessionList,
  SessionDetail,
  SessionWizard,
} from '@v2/components/seat-racing';
import {
  RankingsTableSkeleton,
  SessionListSkeleton,
} from '@v2/features/seat-racing/components/SeatRacingSkeleton';
import { FADE_IN_VARIANTS, SPRING_CONFIG } from '@v2/utils/animations';
import type { Side } from '@v2/types/seatRacing';
import {
  ScrambleNumber,
  RuledHeader,
  CanvasChamferPanel,
  CanvasButton,
  CanvasConsoleReadout,
} from '@v2/components/canvas';

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function shouldIgnoreEvent(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement;
  return (
    INPUT_TAGS.has(target.tagName) ||
    target.isContentEditable ||
    !!target.closest('[role="dialog"]') ||
    !!target.closest('[role="combobox"]')
  );
}

/**
 * Canvas-styled feature card
 */
interface FeatureCardProps {
  to: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

function CanvasFeatureCard({ to, icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Link to={to} className="block group">
      <CanvasChamferPanel className="p-4 min-h-[80px] transition-all duration-200 hover:-translate-y-1">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-ink-hover min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Icon className="w-5 h-5 text-data-excellent" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-ink-bright group-hover:text-white transition-colors">
              {title}
            </h3>
            <p className="text-xs text-ink-muted mt-1 leading-snug">{description}</p>
          </div>
        </div>
      </CanvasChamferPanel>
    </Link>
  );
}

/**
 * Canvas-styled keyboard shortcuts help modal
 */
function KeyboardShortcutsHelp({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={SPRING_CONFIG}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-96"
          >
            <CanvasChamferPanel className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-mono font-semibold text-ink-bright uppercase tracking-wider">
                  Keyboard Shortcuts
                </h3>
                <button
                  onClick={onClose}
                  className="p-1 text-ink-secondary hover:text-ink-bright transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'New Session', key: 'N' },
                  { label: 'Recalculate Rankings', key: 'R' },
                  { label: 'Show Shortcuts', key: '?' },
                  { label: 'Close', key: 'Escape' },
                ].map((shortcut) => (
                  <div key={shortcut.key} className="flex items-center justify-between">
                    <span className="text-sm text-ink-secondary">{shortcut.label}</span>
                    <kbd className="px-2 py-1 text-xs font-mono bg-ink-raised border border-ink-border">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </CanvasChamferPanel>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Canvas-styled rankings table (wraps V2 table with Canvas presentation)
 */
interface CanvasRankingsTableProps {
  ratings: any[];
  isLoading?: boolean;
  onRecalculate?: () => void;
  onAthleteClick?: (athleteId: string) => void;
}

function CanvasRankingsTable({ ratings, isLoading, onAthleteClick }: CanvasRankingsTableProps) {
  if (isLoading) return <RankingsTableSkeleton />;
  if (ratings.length === 0) {
    return (
      <CanvasChamferPanel className="p-8 text-center">
        <p className="text-sm text-ink-muted">No rankings yet. Create a session to get started.</p>
      </CanvasChamferPanel>
    );
  }

  return (
    <div className="space-y-2">
      {ratings.map((rating, idx) => {
        const rank = idx + 1;
        const eloValue = rating.ratingValue || 1000;
        const confidenceScore = rating.confidenceScore ?? 0;

        // Convert confidence score to level
        let confidenceLevel = 'PROVISIONAL';
        if (confidenceScore >= 0.8) confidenceLevel = 'HIGH';
        else if (confidenceScore >= 0.5) confidenceLevel = 'MEDIUM';
        else if (confidenceScore >= 0.3) confidenceLevel = 'LOW';

        // Data color based on ELO rating
        let ratingColor = 'var(--ink-primary)';
        if (eloValue >= 1200) ratingColor = 'var(--data-excellent)';
        else if (eloValue >= 1000) ratingColor = 'var(--data-good)';
        else if (eloValue >= 800) ratingColor = 'var(--data-warning)';
        else ratingColor = 'var(--data-poor)';

        // Confidence badge color
        let confidenceColor = 'text-ink-muted';
        if (confidenceLevel === 'HIGH') confidenceColor = 'text-data-excellent';
        else if (confidenceLevel === 'MEDIUM') confidenceColor = 'text-data-good';
        else if (confidenceLevel === 'LOW') confidenceColor = 'text-data-warning';

        return (
          <div
            key={rating.athleteId || idx}
            onClick={() => onAthleteClick?.(rating.athleteId)}
            className="cursor-pointer hover:-translate-y-0.5 transition-all"
          >
            <CanvasChamferPanel className="p-4">
              <div className="flex items-center gap-6">
                {/* Rank */}
                <div className="w-10 text-center">
                  <span
                    className={`text-sm font-mono font-bold ${rank <= 3 ? 'text-data-warning' : 'text-ink-primary'}`}
                  >
                    <ScrambleNumber value={rank} />
                  </span>
                </div>

                {/* Athlete name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-bright truncate">
                    {rating.athlete?.firstName} {rating.athlete?.lastName}
                  </p>
                  <p className="text-xs text-ink-muted font-mono mt-0.5">
                    {rating.athlete?.side || '—'}
                  </p>
                </div>

                {/* ELO Rating */}
                <div className="text-right">
                  <div
                    className="text-lg font-mono font-bold tabular-nums"
                    style={{ color: ratingColor }}
                  >
                    <ScrambleNumber value={eloValue} />
                  </div>
                  <p
                    className={`text-[10px] font-mono uppercase tracking-wider mt-0.5 ${confidenceColor}`}
                  >
                    {confidenceLevel}
                  </p>
                </div>
              </div>
            </CanvasChamferPanel>
          </div>
        );
      })}
    </div>
  );
}

/**
 * CanvasSeatRacingPage Component
 *
 * Canvas-styled seat racing page with tabs, rankings, sessions, and wizard modal.
 * Reuses all V2 data hooks and business logic, only changing presentation.
 */
export function CanvasSeatRacingPage() {
  // Tab state
  const [selectedTab, setSelectedTab] = useState(0);

  // Side filter state (for Rankings tab)
  const [sideFilter, setSideFilter] = useState<'all' | Side>('all');

  // Modal/panel state
  const [showWizard, setShowWizard] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Responsive layout
  const isMobile = useIsMobile();
  const isTabletOrSmaller = useIsTabletOrSmaller();

  // Auth - these pages are already guarded by CanvasLayout
  const { isLoading: isAuthLoading } = useAuth();

  // Data hooks (same as V2)
  const { ratings, isLoading: isLoadingRatings } = useAthleteRatings({
    ratingType: 'seat_race_elo',
    side: sideFilter === 'all' ? undefined : sideFilter,
  });
  const { sessions, isLoading: isLoadingSessions } = useSeatRaceSessions();
  const { recalculate, isRecalculating } = useRecalculateRatings();

  const handleOpenWizard = () => {
    setShowWizard(true);
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
  };

  const handleSessionClick = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleCloseDetail = () => {
    setSelectedSessionId(null);
  };

  const handleWizardSuccess = () => {
    handleCloseWizard();
    // Switch to Sessions tab to see the new session
    setSelectedTab(1);
  };

  const handleDeleteSession = () => {
    // SessionDetail handles the deletion internally, just close the panel
    handleCloseDetail();
  };

  // Keyboard shortcuts (same as V2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreEvent(e)) return;

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          handleOpenWizard();
          break;
        case 'r':
          e.preventDefault();
          if (!isRecalculating) {
            recalculate();
          }
          break;
        case '?':
          e.preventDefault();
          setShowShortcutsHelp(true);
          break;
        case 'escape':
          e.preventDefault();
          if (showWizard) handleCloseWizard();
          if (selectedSessionId) handleCloseDetail();
          if (selectedAthleteId) setSelectedAthleteId(null);
          if (showShortcutsHelp) setShowShortcutsHelp(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showWizard, selectedSessionId, selectedAthleteId, showShortcutsHelp, isRecalculating]);

  // Show loading while checking auth
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-ink-default">
        <div className="text-xs font-mono text-ink-muted uppercase tracking-wider">
          Authenticating...
        </div>
      </div>
    );
  }

  // Tab configuration for CanvasTabs
  const tabs = [
    { id: 'rankings', label: 'Rankings' },
    { id: 'sessions', label: 'Sessions' },
  ];

  return (
    <div className="flex flex-col h-full bg-ink-default">
      {/* ============================================ */}
      {/* HEADER — text against void (Canvas pattern) */}
      {/* ============================================ */}
      <div className="flex-shrink-0 px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-ink-muted uppercase tracking-[0.15em] mb-1">
              Analytics
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-ink-bright tracking-tight leading-none">
              Seat Racing
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isMobile && (
              <>
                <button
                  onClick={() => setShowShortcutsHelp(true)}
                  className="p-2 text-ink-secondary hover:text-ink-bright transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Keyboard shortcuts (?)"
                >
                  <HelpCircle size={18} />
                </button>
                <Link to="/app/coach/seat-racing/advanced-rankings">
                  <CanvasButton variant="ghost" size="sm">
                    Advanced Rankings
                  </CanvasButton>
                </Link>
                <Link to="/app/coach/seat-racing/matrix-planner">
                  <CanvasButton variant="ghost" size="sm">
                    Matrix Planner
                  </CanvasButton>
                </Link>
              </>
            )}
            <CanvasButton
              onClick={handleOpenWizard}
              variant="primary"
              size="md"
              className="min-h-[44px]"
            >
              <Plus size={18} />
              {!isMobile && 'New Session'}
            </CanvasButton>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* TABS — Canvas tabs with ruled line */}
      {/* ============================================ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <div className="flex-shrink-0 border-b border-ink-border px-6">
            <Tab.List className="flex gap-6">
              {tabs.map((tab) => (
                <Tab key={tab.id} as={Fragment}>
                  {({ selected }) => (
                    <button
                      className={`
                        relative px-1 py-3 text-sm font-mono uppercase tracking-wider transition-colors
                        ${selected ? 'text-ink-bright' : 'text-ink-secondary hover:text-ink-bright'}
                      `}
                    >
                      {tab.label}
                      {selected && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-data-excellent via-ink-bright to-data-excellent"
                          transition={SPRING_CONFIG}
                        />
                      )}
                    </button>
                  )}
                </Tab>
              ))}
            </Tab.List>
          </div>

          {/* ============================================ */}
          {/* TAB PANELS */}
          {/* ============================================ */}
          <Tab.Panels className="flex-1 overflow-hidden">
            {/* RANKINGS TAB */}
            <Tab.Panel className="h-full flex flex-col overflow-hidden">
              {/* Side filter */}
              <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-ink-border">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-ink-muted uppercase tracking-wider mr-2">
                    Filter:
                  </span>
                  <button
                    onClick={() => setSideFilter('all')}
                    className={`
                      px-3 py-1.5 min-h-[44px] text-xs font-mono uppercase tracking-wider transition-colors
                      ${
                        sideFilter === 'all'
                          ? 'bg-ink-bright text-ink-default'
                          : 'bg-ink-raised text-ink-secondary hover:bg-ink-hover border border-ink-border'
                      }
                    `}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSideFilter('Port')}
                    className={`
                      px-3 py-1.5 min-h-[44px] text-xs font-mono uppercase tracking-wider transition-colors
                      ${
                        sideFilter === 'Port'
                          ? 'bg-data-poor text-white'
                          : 'bg-ink-raised text-ink-secondary hover:bg-data-poor/10 border border-ink-border'
                      }
                    `}
                  >
                    Port
                  </button>
                  <button
                    onClick={() => setSideFilter('Starboard')}
                    className={`
                      px-3 py-1.5 min-h-[44px] text-xs font-mono uppercase tracking-wider transition-colors
                      ${
                        sideFilter === 'Starboard'
                          ? 'bg-data-excellent text-white'
                          : 'bg-ink-raised text-ink-secondary hover:bg-data-excellent/10 border border-ink-border'
                      }
                    `}
                  >
                    Starboard
                  </button>
                </div>
              </div>

              {/* Rankings content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {isLoadingRatings ? (
                  <div className="max-w-4xl mx-auto">
                    <RankingsTableSkeleton />
                  </div>
                ) : (
                  <motion.div
                    variants={FADE_IN_VARIANTS}
                    initial="hidden"
                    animate="visible"
                    className="max-w-4xl mx-auto space-y-8"
                  >
                    {/* Chart section (keep V2 RankingsChart, update wrapper) */}
                    <div>
                      <RuledHeader>ELO Distribution</RuledHeader>
                      <div className="bg-ink-raised border border-ink-border p-4 sm:p-6">
                        <div style={{ height: isMobile ? '200px' : '300px' }}>
                          <RankingsChart ratings={ratings} />
                        </div>
                      </div>
                    </div>

                    {/* Rankings table (Canvas-styled) */}
                    <div>
                      <RuledHeader>Rankings</RuledHeader>
                      <CanvasRankingsTable
                        ratings={ratings}
                        isLoading={false}
                        onRecalculate={recalculate}
                        onAthleteClick={setSelectedAthleteId}
                      />
                    </div>

                    {/* Advanced Analytics feature cards */}
                    <div className="mt-12">
                      <RuledHeader>Advanced Analytics</RuledHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <CanvasFeatureCard
                          to="/app/coach/seat-racing/advanced-rankings"
                          icon={BarChart3}
                          title="Advanced Rankings"
                          description="Bradley-Terry model, composite rankings, and comparison graphs"
                        />
                        <CanvasFeatureCard
                          to="/app/coach/seat-racing/matrix-planner"
                          icon={Calendar}
                          title="Matrix Planner"
                          description="Generate optimal swap schedules for seat racing sessions"
                        />
                        <CanvasFeatureCard
                          to="/app/coach/seat-racing/advanced-rankings#comparison-graph"
                          icon={Share2}
                          title="Comparison Graph"
                          description="Visualize which athletes have been compared"
                        />
                        <CanvasFeatureCard
                          to="/app/coach/seat-racing/advanced-rankings#probability"
                          icon={Beaker}
                          title="Win Probability"
                          description="Heatmap of predicted head-to-head outcomes"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </Tab.Panel>

            {/* SESSIONS TAB */}
            <Tab.Panel className="h-full overflow-hidden">
              {isLoadingSessions ? (
                <div className="p-6">
                  <SessionListSkeleton cards={5} />
                </div>
              ) : (
                <SessionList
                  sessions={sessions}
                  isLoading={false}
                  onSelectSession={handleSessionClick}
                />
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* ============================================ */}
      {/* CONSOLE READOUT — bottom status bar */}
      {/* ============================================ */}
      <div className="flex-shrink-0 border-t border-ink-border px-6">
        <CanvasConsoleReadout
          items={[
            { label: 'ATHLETES RANKED', value: ratings.length.toString() },
            { label: 'SESSIONS', value: sessions.length.toString() },
            {
              label: 'AVG CONFIDENCE',
              value:
                ratings.length > 0
                  ? (() => {
                      const avgConfidence =
                        ratings.reduce((sum, r) => sum + (r.confidenceScore ?? 0), 0) /
                        ratings.length;
                      if (avgConfidence >= 0.8) return 'HIGH';
                      if (avgConfidence >= 0.5) return 'MEDIUM';
                      if (avgConfidence >= 0.3) return 'LOW';
                      return 'PROVISIONAL';
                    })()
                  : '—',
            },
          ]}
        />
      </div>

      {/* ============================================ */}
      {/* MODALS & PANELS */}
      {/* ============================================ */}

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />

      {/* Wizard Modal — Canvas-styled wrapper around V2 SessionWizard */}
      <Transition appear show={showWizard} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCloseWizard}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl">
                  <CanvasChamferPanel className="relative">
                    {/* Close button */}
                    <div className="absolute top-4 right-4 z-10">
                      <button
                        onClick={handleCloseWizard}
                        className="p-2 hover:bg-ink-hover transition-colors"
                        aria-label="Close"
                      >
                        <X size={20} className="text-ink-secondary" />
                      </button>
                    </div>

                    {/* Wizard (reuse V2 component) */}
                    <SessionWizard onComplete={handleWizardSuccess} onCancel={handleCloseWizard} />
                  </CanvasChamferPanel>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Session Detail Slide-out Panel (reuse V2 component) */}
      <Transition appear show={!!selectedSessionId} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCloseDetail}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                    <div className="flex h-full flex-col bg-ink-surface border-l border-ink-border">
                      {selectedSessionId && (
                        <SessionDetail
                          sessionId={selectedSessionId}
                          onClose={handleCloseDetail}
                          onDelete={handleDeleteSession}
                        />
                      )}
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

export default CanvasSeatRacingPage;

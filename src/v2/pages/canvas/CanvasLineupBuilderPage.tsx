/**
 * CanvasLineupBuilderPage - Canvas redesign of the Lineup Builder page
 *
 * This is a full-viewport workspace. The Canvas header is MINIMAL (compact toolbar style).
 * WRAPS the existing LineupWorkspace component entirely — it handles all drag-drop logic,
 * undo/redo, save/load, export, biometrics panel, and margin visualizer.
 *
 * Canvas Design System Features:
 * - Minimal compact toolbar with Canvas styling
 * - bg-ink-deep background
 * - CanvasConsoleReadout for bottom status bar
 * - NO rounded corners on page chrome
 *
 * Does NOT rewrite LineupWorkspace internals.
 */

import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAthletes } from '@v2/hooks/useAthletes';
import { useAuth } from '@v2/contexts/AuthContext';
import { useIsMobile } from '@v2/hooks/useBreakpoint';
import { LineupWorkspace } from '@v2/components/lineup';
import { LineupSkeleton } from '@v2/features/lineup/components/LineupSkeleton';
import { CanvasConsoleReadout, ScrambleNumber } from '@v2/components/canvas';

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

// ============================================
// LOADING STATE
// ============================================

function CanvasLineupLoading() {
  return (
    <div className="flex flex-col h-full bg-ink-default">
      <div className="flex-shrink-0 px-4 py-3 bg-ink-raised border-b border-white/[0.06]">
        <div className="h-4 w-32 bg-ink-hover" />
      </div>
      <div className="flex-1">
        <LineupSkeleton />
      </div>
    </div>
  );
}

// ============================================
// CANVAS LINEUP BUILDER PAGE
// ============================================

export function CanvasLineupBuilderPage() {
  // Auth - these pages are already guarded by CanvasLayout
  const { isLoading: isAuthLoading } = useAuth();

  // Fetch athletes data
  const { allAthletes, isLoading: isAthletesLoading } = useAthletes();

  // Get lineupId from URL params (supports deep-linking)
  const [searchParams] = useSearchParams();
  const lineupId = searchParams.get('id') || null;

  // Responsive layout
  const isMobile = useIsMobile();

  // Show skeleton while checking auth or loading athletes
  if (isAuthLoading || isAthletesLoading) {
    return <CanvasLineupLoading />;
  }

  const athleteCount = allAthletes?.length ?? 0;

  return (
    <div className="flex flex-col h-full bg-ink-default">
      {/* ============================================ */}
      {/* MINIMAL CANVAS TOOLBAR */}
      {/* ============================================ */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex-shrink-0">
        <motion.div
          variants={fadeUp}
          className="relative px-4 py-3 bg-ink-raised border-b border-white/[0.06]"
        >
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-data-excellent/20 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-ink-bright">
              Lineup Builder
            </span>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider">
                Athletes: <ScrambleNumber value={athleteCount} />
              </span>
              {lineupId && (
                <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider">
                  ID: {lineupId.slice(0, 8)}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ============================================ */}
      {/* WRAPPED LINEUP WORKSPACE */}
      {/* ============================================ */}
      <div className="flex-1 overflow-hidden">
        <LineupWorkspace lineupId={lineupId} className="h-full" />
      </div>

      {/* ============================================ */}
      {/* CONSOLE READOUT */}
      {/* ============================================ */}
      <div className="flex-shrink-0 border-t border-white/[0.06] px-4 sm:px-6">
        <CanvasConsoleReadout
          items={[
            { label: 'ATHLETES', value: athleteCount.toString() },
            { label: 'LINEUP', value: lineupId ? lineupId.slice(0, 8).toUpperCase() : 'NEW' },
            { label: 'MODE', value: isMobile ? 'TAP-SELECT' : 'DRAG-DROP' },
            { label: 'STATUS', value: 'READY' },
          ]}
        />
      </div>
    </div>
  );
}

export default CanvasLineupBuilderPage;

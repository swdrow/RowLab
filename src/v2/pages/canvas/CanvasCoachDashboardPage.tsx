/**
 * CanvasCoachDashboardPage - Canvas redesign of the Coach Dashboard
 *
 * WRAPS the existing CoachDashboard feature component (bento grid, widgets, edit mode)
 * in a Canvas-styled page shell. The wrapped component renders with its own styling,
 * which is acceptable as a first pass — Canvas styling applies to the page shell,
 * header, and console readout.
 *
 * Canvas Design System Features:
 * - RuledHeader for page title
 * - CanvasButton for edit layout toggle
 * - CanvasConsoleReadout for bottom status bar
 * - NO rounded corners on page chrome
 * - Stagger/fadeUp motion variants
 */

import { motion } from 'framer-motion';
import { CoachDashboard as CoachDashboardFeature } from '../../features/dashboard/components/CoachDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardLayout } from '../../features/dashboard/hooks/useDashboardLayout';
import { useExceptions } from '../../features/dashboard/hooks/useExceptions';
import { CanvasConsoleReadout } from '@v2/components/canvas';

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
// CANVAS COACH DASHBOARD PAGE
// ============================================

export function CanvasCoachDashboardPage() {
  const { activeTeamId, isAuthenticated, isInitialized } = useAuth();
  const { layout } = useDashboardLayout('coach');
  const { summary: exceptionSummary } = useExceptions(activeTeamId || '');

  // Loading state
  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full bg-ink-default">
        <div className="text-xs font-mono text-ink-muted uppercase tracking-wider">
          Authenticating...
        </div>
      </div>
    );
  }

  const widgetCount = layout.widgets.length;
  const criticalCount = exceptionSummary?.critical ?? 0;
  const warningCount = exceptionSummary?.warning ?? 0;

  return (
    <div className="flex flex-col h-full bg-ink-default">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="flex-shrink-0 px-6 pt-8 pb-6"
      >
        <motion.div variants={fadeUp} className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium text-ink-muted uppercase tracking-[0.15em] mb-1">
              Dashboard
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-ink-bright tracking-tight leading-none">
              Coach Overview
            </h1>
          </div>
        </motion.div>
      </motion.div>

      {/* ============================================ */}
      {/* WRAPPED COACH DASHBOARD FEATURE */}
      {/* ============================================ */}
      <div className="flex-1 overflow-y-auto">
        <CoachDashboardFeature />
      </div>

      {/* ============================================ */}
      {/* CONSOLE READOUT */}
      {/* ============================================ */}
      <div className="flex-shrink-0 border-t border-ink-border px-6">
        <CanvasConsoleReadout
          items={[
            { label: 'WIDGETS', value: widgetCount.toString() },
            { label: 'CRITICAL', value: criticalCount.toString() },
            { label: 'WARNINGS', value: warningCount.toString() },
            { label: 'STATUS', value: criticalCount > 0 ? 'ALERT' : 'NOMINAL' },
          ]}
        />
      </div>
    </div>
  );
}

export default CanvasCoachDashboardPage;

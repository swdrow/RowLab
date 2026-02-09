/**
 * CanvasMatrixPlannerPage - Latin square seat race scheduler with Canvas design language
 *
 * Canvas redesign of MatrixPlannerPage.tsx with:
 * - Canvas header "Analytics / Matrix Planner" with back button
 * - Reuses MatrixPlanner component
 * - Benefits as CanvasChamferPanels
 * - CanvasConsoleReadout at bottom
 * - NO rounded corners, NO card wrappers
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from '@phosphor-icons/react';
import { useIsMobile } from '@v2/hooks/useBreakpoint';
import { MatrixPlanner } from '../../components/seat-racing';
import { CanvasChamferPanel, CanvasConsoleReadout, RuledHeader } from '@v2/components/canvas';
import type { SwapSchedule } from '../../types/advancedRanking';

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

export function CanvasMatrixPlannerPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [generatedSchedule, setGeneratedSchedule] = useState<SwapSchedule | null>(null);

  const handleScheduleGenerated = (schedule: SwapSchedule) => {
    setGeneratedSchedule(schedule);
  };

  const handleClose = () => {
    navigate('/app/coach/seat-racing');
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="space-y-6 sm:space-y-8 p-4 sm:p-6"
    >
      {/* ============================================ */}
      {/* HEADER — text against void with back button */}
      {/* ============================================ */}
      <motion.div variants={fadeUp} className="flex items-end justify-between pt-2 pb-4 sm:pb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-ink-muted hover:text-ink-bright transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-[0.2em] mb-1">
              Analytics
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-ink-bright tracking-tight leading-none">
              Matrix Planner
            </h1>
          </div>
        </div>
      </motion.div>

      {/* ============================================ */}
      {/* PLANNER — reuse existing component */}
      {/* ============================================ */}
      <motion.div variants={fadeUp}>
        <MatrixPlanner onScheduleGenerated={handleScheduleGenerated} onClose={handleClose} />
      </motion.div>

      {/* ============================================ */}
      {/* BENEFITS — CanvasChamferPanels */}
      {/* ============================================ */}
      <motion.div variants={fadeUp}>
        <RuledHeader>Benefits</RuledHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-4">
          <CanvasChamferPanel className="p-4 min-h-[80px]">
            <h4 className="font-medium text-ink-bright mb-1">Optimal Coverage</h4>
            <p className="text-sm text-ink-secondary">
              Ensures all athletes are compared as evenly as possible, maximizing ranking accuracy.
            </p>
          </CanvasChamferPanel>
          <CanvasChamferPanel className="p-4 min-h-[80px]">
            <h4 className="font-medium text-ink-bright mb-1">Fewer Pieces Needed</h4>
            <p className="text-sm text-ink-secondary">
              Latin Square design requires fewer pieces than random swaps to achieve the same
              comparison coverage.
            </p>
          </CanvasChamferPanel>
          <CanvasChamferPanel className="p-4 min-h-[80px]">
            <h4 className="font-medium text-ink-bright mb-1">Statistical Validity</h4>
            <p className="text-sm text-ink-secondary">
              Balanced designs produce more reliable rankings with narrower confidence intervals.
            </p>
          </CanvasChamferPanel>
        </div>
      </motion.div>

      {/* ============================================ */}
      {/* CONSOLE READOUT — summary */}
      {/* ============================================ */}
      <motion.div variants={fadeUp}>
        <CanvasConsoleReadout
          items={[
            {
              label: 'SCHEDULE',
              value: generatedSchedule ? 'GENERATED' : 'PENDING',
            },
            {
              label: 'PIECES',
              value: generatedSchedule?.pieces?.length?.toString() || '0',
            },
            { label: 'METHOD', value: 'LATIN SQUARE' },
          ]}
        />
      </motion.div>
    </motion.div>
  );
}

export default CanvasMatrixPlannerPage;

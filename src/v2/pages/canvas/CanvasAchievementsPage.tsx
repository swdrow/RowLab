/**
 * CanvasAchievementsPage - Achievement badges and streaks with Canvas design language
 *
 * Canvas redesign of AchievementsPage.tsx with:
 * - Canvas header "Gamification / Achievements"
 * - Feature gate check (gamification enabled)
 * - Reuses AchievementGrid and StreakDisplay components
 * - CanvasButton "Check Progress"
 * - CanvasConsoleReadout at bottom
 * - NO rounded corners, NO card wrappers
 */

import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { AchievementGrid, StreakDisplay } from '../../features/gamification';
import { useGamificationEnabled } from '../../hooks/useGamificationPreference';
import { useCheckProgress } from '../../hooks/useAchievements';
import { CanvasButton, CanvasConsoleReadout, RuledHeader } from '@v2/components/canvas';

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

export function CanvasAchievementsPage() {
  const { enabled } = useGamificationEnabled();
  const checkProgress = useCheckProgress();

  if (!enabled) {
    return (
      <div className="p-6">
        <CanvasConsoleReadout
          items={[
            { label: 'MODULE', value: 'ACHIEVEMENTS' },
            { label: 'STATUS', value: 'GAMIFICATION DISABLED — ENABLE IN SETTINGS' },
          ]}
        />
      </div>
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="space-y-6 lg:space-y-8 px-4 lg:px-8"
    >
      {/* ============================================ */}
      {/* HEADER — text against void */}
      {/* ============================================ */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between pt-2 pb-4 lg:pb-6"
      >
        <div>
          <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-[0.2em] mb-1">
            Gamification
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-bright tracking-tight leading-none">
            Achievements
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <CanvasButton
            variant="primary"
            onClick={() => checkProgress.mutate()}
            disabled={checkProgress.isPending}
            className="w-full sm:w-auto"
          >
            <RefreshCw size={16} className={checkProgress.isPending ? 'animate-spin' : ''} />
            Check Progress
          </CanvasButton>
        </div>
      </motion.div>

      {/* ============================================ */}
      {/* STREAKS */}
      {/* ============================================ */}
      <motion.div variants={fadeUp}>
        <RuledHeader>Current Streaks</RuledHeader>
        <div className="mt-4">
          <StreakDisplay />
        </div>
      </motion.div>

      {/* ============================================ */}
      {/* ACHIEVEMENT GRID */}
      {/* ============================================ */}
      <motion.div variants={fadeUp}>
        <RuledHeader>All Achievements</RuledHeader>
        <div className="mt-4">
          <AchievementGrid showLocked />
        </div>
      </motion.div>

      {/* ============================================ */}
      {/* CONSOLE READOUT — summary */}
      {/* ============================================ */}
      <motion.div variants={fadeUp}>
        <CanvasConsoleReadout
          items={[
            { label: 'MODULE', value: 'ACHIEVEMENTS' },
            { label: 'GAMIFICATION', value: 'ENABLED' },
            { label: 'STATUS', value: 'ACTIVE' },
          ]}
        />
      </motion.div>
    </motion.div>
  );
}

export default CanvasAchievementsPage;

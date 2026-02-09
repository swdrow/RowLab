/**
 * CanvasMeDashboard - Personal dashboard with Canvas design language
 *
 * Canvas redesign of MeDashboard.tsx with:
 * - Canvas header with "YOUR OVERVIEW" category
 * - Reuses CoachDashboard / AthleteDashboard by role
 * - CanvasConsoleReadout at bottom with role and team info
 * - NO rounded corners, NO card wrappers
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { CoachDashboard } from '../../features/dashboard/components/CoachDashboard';
import { AthleteDashboard } from '../../features/dashboard/components/AthleteDashboard';
import { OnboardingWizard } from '../../features/dashboard/components/OnboardingWizard';
import { useOnboardingStatus } from '../../features/dashboard/hooks/useOnboardingStatus';
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

export function CanvasMeDashboard() {
  const { user, activeTeamRole } = useAuth();
  const { shouldShowWizard } = useOnboardingStatus();
  const [wizardDismissed, setWizardDismissed] = useState(false);

  const handleWizardComplete = useCallback(() => {
    setWizardDismissed(true);
  }, []);

  const isCoach =
    activeTeamRole === 'OWNER' ||
    activeTeamRole === 'ADMIN' ||
    activeTeamRole === 'COACH' ||
    user?.isAdmin === true;

  return (
    <>
      {shouldShowWizard && !wizardDismissed && (
        <OnboardingWizard onComplete={handleWizardComplete} />
      )}

      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
        {/* ============================================ */}
        {/* HEADER — text against void (no card wrapper) */}
        {/* ============================================ */}
        <motion.div variants={fadeUp} className="flex items-end justify-between pt-2 pb-6">
          <div>
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-[0.2em] mb-1">
              Your Overview
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-ink-bright tracking-tight leading-none">
              Dashboard
            </h1>
          </div>
        </motion.div>

        {/* ============================================ */}
        {/* DASHBOARD CONTENT — role-based */}
        {/* ============================================ */}
        <motion.div variants={fadeUp}>
          {isCoach ? <CoachDashboard /> : <AthleteDashboard />}
        </motion.div>

        {/* ============================================ */}
        {/* CONSOLE READOUT — role & team info */}
        {/* ============================================ */}
        <motion.div variants={fadeUp}>
          <CanvasConsoleReadout
            items={[
              { label: 'ROLE', value: (activeTeamRole || 'MEMBER').toUpperCase() },
              { label: 'USER', value: user?.name?.toUpperCase() || 'UNKNOWN' },
              { label: 'STATUS', value: 'ACTIVE' },
            ]}
          />
        </motion.div>
      </motion.div>
    </>
  );
}

export default CanvasMeDashboard;

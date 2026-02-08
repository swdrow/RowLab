/**
 * MeDashboard Page
 * Phase 27-05: Personal dashboard at /app or /app/dashboard
 * Routes to appropriate dashboard based on user role
 */

import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CoachDashboard } from '../features/dashboard/components/CoachDashboard';
import { AthleteDashboard } from '../features/dashboard/components/AthleteDashboard';
import { OnboardingWizard } from '../features/dashboard/components/OnboardingWizard';
import { useOnboardingStatus } from '../features/dashboard/hooks/useOnboardingStatus';

/**
 * MeDashboard - Personal dashboard page
 *
 * Conditionally renders:
 * - OnboardingWizard overlay for first-time team owners/admins
 * - CoachDashboard for coaches/admins
 * - AthleteDashboard for athletes
 */
export function MeDashboard() {
  const { user, activeTeamRole } = useAuth();
  const { shouldShowWizard } = useOnboardingStatus();
  const [wizardDismissed, setWizardDismissed] = useState(false);

  const handleWizardComplete = useCallback(() => {
    setWizardDismissed(true);
  }, []);

  // Determine if user is a coach/admin based on team role
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

      {/* Condensed Copper Hero for Dashboard */}
      <div className="relative px-6 pt-6 pb-4 mb-2 overflow-hidden border-b border-bdr-subtle">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-copper/[0.04] via-accent-copper/[0.01] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-accent-copper/20 to-transparent" />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-copper mb-2">
            YOUR OVERVIEW
          </p>
          <h1 className="text-3xl font-display font-bold text-ink-bright tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Track your progress and upcoming activities
          </p>
        </div>
      </div>

      {isCoach ? <CoachDashboard /> : <AthleteDashboard />}
    </>
  );
}

export default MeDashboard;

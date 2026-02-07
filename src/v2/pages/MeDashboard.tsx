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
      {isCoach ? <CoachDashboard /> : <AthleteDashboard />}
    </>
  );
}

export default MeDashboard;

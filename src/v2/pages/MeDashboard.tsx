/**
 * MeDashboard Page
 * Phase 27-05: Personal dashboard at /app or /app/dashboard
 * Routes to appropriate dashboard based on user role
 */

import { useAuth } from '../contexts/AuthContext';
import { CoachDashboard } from '../features/dashboard/components/CoachDashboard';
import { AthleteDashboard } from '../features/dashboard/components/AthleteDashboard';

/**
 * MeDashboard - Personal dashboard page
 *
 * Conditionally renders:
 * - CoachDashboard for coaches/admins
 * - AthleteDashboard for athletes
 *
 * All role detection and logic handled by respective feature components.
 */
export function MeDashboard() {
  const { user } = useAuth();

  // Determine if user is a coach/admin
  const isCoach = user?.role === 'coach' || user?.role === 'admin';

  if (isCoach) {
    return <CoachDashboard />;
  }

  return <AthleteDashboard />;
}

export default MeDashboard;

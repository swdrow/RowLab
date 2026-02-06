/**
 * CoachDashboard Page
 * Phase 27-05: Wires the CoachDashboard feature component into routing
 */

import { CoachDashboard as CoachDashboardFeature } from '../../features/dashboard/components/CoachDashboard';

/**
 * CoachDashboard - Coach-specific dashboard page at /app/coach/dashboard
 *
 * Renders the feature component directly.
 * All logic handled by CoachDashboard feature component.
 */
export function CoachDashboard() {
  return <CoachDashboardFeature />;
}

export default CoachDashboard;

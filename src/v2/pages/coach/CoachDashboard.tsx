import { DashboardGrid } from '../../features/dashboard/components/DashboardGrid';

/**
 * CoachDashboard - Coach-specific dashboard page
 *
 * Displays cross-feature widgets:
 * - Upcoming Sessions
 * - Recent Activity
 * - Today's Attendance
 *
 * Uses react-grid-layout for drag-and-drop widget arrangement
 */
export function CoachDashboard() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-txt-primary">Dashboard</h1>
        <p className="text-txt-secondary">Overview of your team's training and activities</p>
      </div>
      <DashboardGrid />
    </div>
  );
}

export default CoachDashboard;

import { useEffect } from 'react';
import { useAthletes } from '@v2/hooks/useAthletes';
import { useRequireAuth } from '../../hooks/useAuth';
import { LineupWorkspace } from '@v2/components/lineup';
import useLineupStore from '@/store/lineupStore';
import { BOAT_CONFIGS } from '@/utils/boatConfig';

/**
 * LineupBuilderPage - Main page for the V2 Lineup Builder
 *
 * Responsibilities:
 * - Loads athletes data on mount
 * - Initializes lineupStore with athletes and boat configs
 * - Renders LineupWorkspace component
 * - Shows loading state while data loads
 *
 * Features available via LineupWorkspace:
 * - Drag-drop athlete assignment (desktop)
 * - Tap-to-select workflow (mobile)
 * - Auto-swap on occupied seats
 * - Validation warnings (port/starboard, coxswain)
 * - Undo/redo with keyboard shortcuts
 * - Save/load lineups with version history
 * - Export as PDF
 * - Live biometrics panel
 * - Margin visualizer
 */
export function LineupBuilderPage() {
  // Auth - redirects to login if not authenticated
  const { isLoading: isAuthLoading } = useRequireAuth();

  // Fetch athletes data
  const { allAthletes, isLoading: isAthletesLoading } = useAthletes();

  // Store actions
  const setAthletes = useLineupStore((state) => state.setAthletes);
  const setBoatConfigs = useLineupStore((state) => state.setBoatConfigs);

  // Initialize store with data when loaded
  useEffect(() => {
    if (allAthletes.length > 0) {
      setAthletes(allAthletes);
    }
  }, [allAthletes, setAthletes]);

  // Initialize boat configs on mount
  useEffect(() => {
    setBoatConfigs(BOAT_CONFIGS);
  }, [setBoatConfigs]);

  // Show loading while checking auth
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-bg-default">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-interactive-primary" />
      </div>
    );
  }

  // Show loading while fetching athletes
  if (isAthletesLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-bg-default">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-interactive-primary" />
          <p className="text-sm text-txt-secondary">Loading lineup builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden bg-bg-default">
      <LineupWorkspace className="h-full" />
    </div>
  );
}

export default LineupBuilderPage;

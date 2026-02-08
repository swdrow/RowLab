import { useAthletes } from '@v2/hooks/useAthletes';
import { useRequireAuth } from '../../hooks/useAuth';
import { LineupWorkspace } from '@v2/components/lineup';
import { LineupSkeleton } from '@v2/features/lineup/components/LineupSkeleton';
import { useSearchParams } from 'react-router-dom';

/**
 * LineupBuilderPage - Main page for the V2 Lineup Builder
 *
 * Responsibilities:
 * - Loads athletes data on mount
 * - Manages lineupId state (URL param or null for new lineup)
 * - Passes lineupId to LineupWorkspace
 * - Shows LineupSkeleton while loading (no spinners)
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
 *
 * Deep-linking: /app/lineup-builder?id=<lineupId>
 */
export function LineupBuilderPage() {
  // Auth - redirects to login if not authenticated
  const { isLoading: isAuthLoading } = useRequireAuth();

  // Fetch athletes data
  const { allAthletes, isLoading: isAthletesLoading } = useAthletes();

  // Get lineupId from URL params (supports deep-linking)
  const [searchParams] = useSearchParams();
  const lineupId = searchParams.get('id') || null;

  // Show skeleton while checking auth or loading athletes
  if (isAuthLoading || isAthletesLoading) {
    return <LineupSkeleton />;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-ink-default">
      {/* Compact copper workspace toolbar */}
      <div className="relative px-4 py-3 bg-ink-raised border-b border-ink-border flex-shrink-0">
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-copper/30 to-transparent" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-copper">
            LINEUP BUILDER
          </span>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 overflow-hidden">
        <LineupWorkspace lineupId={lineupId} className="h-full" />
      </div>
    </div>
  );
}

export default LineupBuilderPage;

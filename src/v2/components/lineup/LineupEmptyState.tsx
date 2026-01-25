import { Ship, Plus, CheckCircle2 } from 'lucide-react';
import { EmptyState } from '@v2/components/common/EmptyState';

/**
 * LineupEmptyState - Display when no lineups/boats exist
 *
 * Shows helpful CTA to create first lineup.
 */
export interface LineupEmptyStateProps {
  /** Handler for Create Lineup button */
  onCreateLineup?: () => void;
}

export const LineupEmptyState: React.FC<LineupEmptyStateProps> = ({
  onCreateLineup,
}) => (
  <EmptyState
    icon={Ship}
    title="No lineups yet"
    description="Start building your boat lineups by adding a boat. Drag and drop athletes to assign seats."
    action={
      onCreateLineup
        ? { label: 'Create Lineup', onClick: onCreateLineup, icon: Plus }
        : undefined
    }
  />
);

/**
 * AthletesBankEmptyState - Display when all athletes have been assigned
 *
 * Shows success state indicating all athletes are in boats.
 */
export interface AthletesBankEmptyStateProps {
  /** Count of assigned athletes */
  assignedCount?: number;
}

export const AthletesBankEmptyState: React.FC<AthletesBankEmptyStateProps> = ({
  assignedCount,
}) => (
  <EmptyState
    icon={CheckCircle2}
    title="All athletes assigned"
    description={
      assignedCount
        ? `All ${assignedCount} athletes have been assigned to boats. Nice work!`
        : 'All athletes have been assigned to boats. Nice work!'
    }
  />
);

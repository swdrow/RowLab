import { Trophy, Plus, Flag, MapPin } from 'lucide-react';
import { EmptyState } from '@v2/components/common/EmptyState';

/**
 * RegattaEmptyState - Display when no regattas exist
 *
 * Shows helpful CTA to add first regatta.
 */
export interface RegattaEmptyStateProps {
  /** Handler for Add Regatta button */
  onAddRegatta?: () => void;
}

export const RegattaEmptyState: React.FC<RegattaEmptyStateProps> = ({
  onAddRegatta,
}) => (
  <EmptyState
    icon={Trophy}
    title="No regattas yet"
    description="Add your first regatta to start tracking races, results, and team rankings."
    action={
      onAddRegatta
        ? { label: 'Add Regatta', onClick: onAddRegatta, icon: Plus }
        : undefined
    }
  />
);

/**
 * RacesEmptyState - Display when a regatta has no races
 *
 * Shows CTA to add first race.
 */
export interface RacesEmptyStateProps {
  /** Handler for Add Race button */
  onAddRace?: () => void;
}

export const RacesEmptyState: React.FC<RacesEmptyStateProps> = ({
  onAddRace,
}) => (
  <EmptyState
    icon={Flag}
    title="No races added"
    description="Add races to this regatta to track lineups, times, and results."
    action={
      onAddRace
        ? { label: 'Add Race', onClick: onAddRace, icon: Plus }
        : undefined
    }
  />
);

/**
 * RaceDayEmptyState - Display when no active race day is selected
 *
 * Guides user to select a regatta for race day command center.
 */
export interface RaceDayEmptyStateProps {
  /** Handler for Select Regatta button */
  onSelectRegatta?: () => void;
}

export const RaceDayEmptyState: React.FC<RaceDayEmptyStateProps> = ({
  onSelectRegatta,
}) => (
  <EmptyState
    icon={MapPin}
    title="No active race day"
    description="Select a regatta to access the Race Day Command Center with warmup schedules and checklists."
    action={
      onSelectRegatta
        ? { label: 'Select Regatta', onClick: onSelectRegatta, icon: Trophy }
        : undefined
    }
  />
);

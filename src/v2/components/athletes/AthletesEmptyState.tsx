import { Users, UserPlus, Upload, Search } from 'lucide-react';
import { EmptyState } from '@v2/components/common/EmptyState';

/**
 * AthletesEmptyState - Display when no athletes exist in the roster
 *
 * Shows helpful CTAs to add first athlete or import from CSV.
 */
export interface AthletesEmptyStateProps {
  /** Handler for Add Athlete button */
  onAddAthlete?: () => void;
  /** Handler for Import CSV button */
  onImportCsv?: () => void;
}

export const AthletesEmptyState: React.FC<AthletesEmptyStateProps> = ({
  onAddAthlete,
  onImportCsv,
}) => (
  <EmptyState
    icon={Users}
    title="No athletes yet"
    description="Add your first athlete to start building your roster. You can add athletes manually or import from a CSV file."
    action={
      onAddAthlete
        ? { label: 'Add Athlete', onClick: onAddAthlete, icon: UserPlus }
        : undefined
    }
    secondaryAction={
      onImportCsv
        ? { label: 'Import CSV', onClick: onImportCsv, icon: Upload }
        : undefined
    }
  />
);

/**
 * AthletesNoResultsState - Display when filters return no matching athletes
 *
 * Guides user to adjust filters or clear search.
 */
export interface AthletesNoResultsStateProps {
  /** The current search query (if any) */
  searchQuery?: string;
  /** Handler to clear all filters */
  onClearFilters?: () => void;
}

export const AthletesNoResultsState: React.FC<AthletesNoResultsStateProps> = ({
  searchQuery,
  onClearFilters,
}) => (
  <EmptyState
    icon={Search}
    title="No athletes found"
    description={
      searchQuery
        ? `No athletes match "${searchQuery}". Try adjusting your search or filters.`
        : 'No athletes match the current filters. Try adjusting your selection.'
    }
    action={
      onClearFilters
        ? { label: 'Clear Filters', onClick: onClearFilters }
        : undefined
    }
  />
);

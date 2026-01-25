import { Activity, Plus, Upload, Search } from 'lucide-react';
import { EmptyState } from '@v2/components/common/EmptyState';

/**
 * ErgEmptyState - Display when no erg tests exist
 *
 * Shows helpful CTAs to add first test or import from CSV.
 */
export interface ErgEmptyStateProps {
  /** Handler for Add Test button */
  onAddTest?: () => void;
  /** Handler for Import CSV button */
  onImportCsv?: () => void;
}

export const ErgEmptyState: React.FC<ErgEmptyStateProps> = ({
  onAddTest,
  onImportCsv,
}) => (
  <EmptyState
    icon={Activity}
    title="No erg tests yet"
    description="Record your first erg test to start tracking performance. Import from CSV or add tests manually."
    action={
      onAddTest
        ? { label: 'Add Test', onClick: onAddTest, icon: Plus }
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
 * ErgNoResultsState - Display when filters return no matching erg tests
 *
 * Guides user to adjust filters or clear search.
 */
export interface ErgNoResultsStateProps {
  /** The active filter description */
  filterDescription?: string;
  /** Handler to clear all filters */
  onClearFilters?: () => void;
}

export const ErgNoResultsState: React.FC<ErgNoResultsStateProps> = ({
  filterDescription,
  onClearFilters,
}) => (
  <EmptyState
    icon={Search}
    title="No tests match filters"
    description={
      filterDescription
        ? `No erg tests found for ${filterDescription}. Try adjusting your filters.`
        : 'No erg tests match the current filters. Try adjusting your selection.'
    }
    action={
      onClearFilters
        ? { label: 'Clear Filters', onClick: onClearFilters }
        : undefined
    }
  />
);

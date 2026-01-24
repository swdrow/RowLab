import { useState, useEffect } from 'react';
import { useAthletes } from '@v2/hooks/useAthletes';
import {
  ViewToggle,
  AthleteFilters,
  AthletesTable,
  AthleteCard,
  AthleteEditPanel,
} from '@v2/components/athletes';
import type { ViewMode } from '@v2/components/athletes';
import type { Athlete, AthleteFilters as FilterState } from '@v2/types/athletes';

const STORAGE_KEY_VIEW = 'rowlab-athletes-view';

/**
 * Main Athletes page with grid/list views, search, filters, and editing
 */
export function AthletesPage() {
  // View preference (persisted to localStorage)
  const [view, setView] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_VIEW);
    return (stored === 'grid' || stored === 'list') ? stored : 'list';
  });

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    side: 'all',
    canScull: null,
    canCox: null,
  });

  // Edit panel state
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);

  // Fetch athletes with filters
  const { athletes, isLoading, updateAthlete, isUpdating } = useAthletes(filters);

  // Persist view preference
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VIEW, view);
  }, [view]);

  const handleAthleteClick = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setIsEditPanelOpen(true);
  };

  const handleCloseEditPanel = () => {
    setIsEditPanelOpen(false);
    // Delay clearing selection to allow panel close animation
    setTimeout(() => setSelectedAthlete(null), 300);
  };

  const handleSaveAthlete = (data: Partial<Athlete> & { id: string }) => {
    updateAthlete(data, {
      onSuccess: () => {
        handleCloseEditPanel();
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-bg-default">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-bdr-default bg-bg-surface">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-txt-primary">Athletes</h1>
            <p className="text-sm text-txt-tertiary mt-1">
              {athletes.length} {athletes.length === 1 ? 'athlete' : 'athletes'}
            </p>
          </div>

          <ViewToggle view={view} onChange={setView} />
        </div>

        {/* Filters */}
        <AthleteFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'list' ? (
          <AthletesTable
            athletes={athletes}
            onAthleteClick={handleAthleteClick}
            selectedId={selectedAthlete?.id}
            isLoading={isLoading}
            className="h-full"
          />
        ) : (
          <div className="h-full overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-interactive-primary" />
              </div>
            ) : athletes.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-txt-secondary">
                No athletes found
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {athletes.map((athlete) => (
                  <AthleteCard
                    key={athlete.id}
                    athlete={athlete}
                    onClick={() => handleAthleteClick(athlete)}
                    isSelected={selectedAthlete?.id === athlete.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Panel */}
      <AthleteEditPanel
        athlete={selectedAthlete}
        isOpen={isEditPanelOpen}
        onClose={handleCloseEditPanel}
        onSave={handleSaveAthlete}
        isSaving={isUpdating}
      />
    </div>
  );
}

export default AthletesPage;

import { useState, useMemo } from 'react';
import { useTeamAvailability, useUpdateAvailability } from '../hooks/useAvailability';
import { AvailabilityGrid, AvailabilityEditor } from '../components/availability';
import { CrudModal } from '../components/common';
import { useV2Auth } from '../hooks/useSharedStores';
import type { AvailabilityDay, AthleteAvailability } from '../types/coach';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CoachAvailability() {
  // Date range state (default: current week starting Monday)
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    return new Date(today.setDate(diff));
  });
  const numDays = 7;

  // Editing state
  const [editingAthlete, setEditingAthlete] = useState<AthleteAvailability | null>(null);

  // Calculate end date
  const endDate = useMemo(() => {
    const end = new Date(startDate);
    end.setDate(end.getDate() + numDays - 1);
    return end;
  }, [startDate, numDays]);

  // Hooks
  const { data: availability, isLoading } = useTeamAvailability(startDate, endDate);
  const updateMutation = useUpdateAvailability();

  // Auth
  const authStore = useV2Auth();
  const user = authStore((state) => state.user);
  const isCoach = user?.activeTeamRole === 'COACH' || user?.activeTeamRole === 'OWNER';

  // Navigation
  const goToPreviousWeek = () => {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() - 7);
    setStartDate(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() + 7);
    setStartDate(newStart);
  };

  const goToThisWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    setStartDate(new Date(today.setDate(diff)));
  };

  // Handle athlete click (coaches can edit any, athletes only their own)
  const handleAthleteClick = (athleteId: string) => {
    const canEditThis = isCoach || user?.athleteId === athleteId;
    if (canEditThis) {
      const athlete = availability?.find((a) => a.athleteId === athleteId);
      if (athlete) {
        setEditingAthlete(athlete);
      }
    }
  };

  // Handle save
  const handleSave = (data: AvailabilityDay[]) => {
    if (!editingAthlete) return;
    updateMutation.mutate(
      { athleteId: editingAthlete.athleteId, availability: data },
      { onSuccess: () => setEditingAthlete(null) }
    );
  };

  // Format date range for header
  const dateRangeLabel = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-txt-primary">Team Availability</h1>

        {/* Week navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousWeek}
            className="p-2 rounded-lg border border-bdr-primary hover:bg-surface-hover transition-colors"
          >
            <ChevronLeft size={18} className="text-txt-secondary" />
          </button>
          <button
            onClick={goToThisWeek}
            className="px-3 py-1.5 text-sm border border-bdr-primary rounded-lg hover:bg-surface-hover transition-colors"
          >
            This Week
          </button>
          <span className="text-sm text-txt-secondary min-w-[160px] text-center">
            {dateRangeLabel}
          </span>
          <button
            onClick={goToNextWeek}
            className="p-2 rounded-lg border border-bdr-primary hover:bg-surface-hover transition-colors"
          >
            <ChevronRight size={18} className="text-txt-secondary" />
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="animate-pulse h-64 bg-surface rounded-xl" />
      ) : (
        <AvailabilityGrid
          data={availability || []}
          startDate={startDate}
          numDays={numDays}
          onAthleteClick={handleAthleteClick}
        />
      )}

      {/* Edit Modal */}
      <CrudModal
        isOpen={!!editingAthlete}
        onClose={() => setEditingAthlete(null)}
        title="Edit Availability"
      >
        {editingAthlete && (
          <AvailabilityEditor
            athleteName={editingAthlete.athleteName}
            initialData={editingAthlete.dates}
            startDate={startDate}
            numDays={numDays}
            onSave={handleSave}
            onCancel={() => setEditingAthlete(null)}
            isSaving={updateMutation.isPending}
          />
        )}
      </CrudModal>
    </div>
  );
}

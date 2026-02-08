import { useState, useMemo } from 'react';
import { useTeamAvailability, useUpdateAvailability } from '../hooks/useAvailability';
import { AvailabilityGrid, AvailabilityEditor } from '../components/availability';
import { CrudModal } from '../components/common';
import { useAuth } from '../contexts/AuthContext';
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
  const { activeTeamRole, user } = useAuth();
  const isCoach = activeTeamRole === 'COACH' || activeTeamRole === 'OWNER';

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
    <div>
      {/* Hero Header */}
      <div className="relative px-6 pt-8 pb-6 mb-2 overflow-hidden">
        {/* Warm gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent-copper/[0.06] via-accent-copper/[0.02] to-transparent pointer-events-none" />
        {/* Decorative copper line at bottom */}
        <div className="absolute bottom-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-accent-copper/30 to-transparent" />

        <div className="relative flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-copper mb-2">
              Team Scheduling
            </p>
            <h1 className="text-4xl font-display font-bold text-ink-bright tracking-tight">
              Availability
            </h1>
            <p className="text-sm text-ink-secondary mt-2">View and manage team availability</p>
          </div>

          {/* Week navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className="p-2 rounded-lg border border-ink-border hover:bg-ink-hover transition-colors"
            >
              <ChevronLeft size={18} className="text-ink-secondary" />
            </button>
            <button
              onClick={goToThisWeek}
              className="px-3 py-1.5 text-sm border border-ink-border rounded-lg hover:bg-ink-hover transition-colors"
            >
              This Week
            </button>
            <span className="text-sm text-ink-secondary min-w-[160px] text-center">
              {dateRangeLabel}
            </span>
            <button
              onClick={goToNextWeek}
              className="p-2 rounded-lg border border-ink-border hover:bg-ink-hover transition-colors"
            >
              <ChevronRight size={18} className="text-ink-secondary" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6">
        {/* Grid */}
        {isLoading ? (
          <div className="animate-pulse h-64 bg-ink-raised rounded-xl" />
        ) : (
          <AvailabilityGrid
            data={availability || []}
            startDate={startDate}
            numDays={numDays}
            onAthleteClick={handleAthleteClick}
          />
        )}
      </div>

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

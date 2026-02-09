/**
 * CanvasAvailabilityPage - Team availability with Canvas design language
 *
 * Canvas design philosophy:
 * - Canvas header with week navigation (CanvasButton prev/next)
 * - Reuse AvailabilityGrid component (wrapped in Canvas container)
 * - CanvasModal for editing availability
 * - CanvasConsoleReadout showing week range and athlete count
 * - NO rounded corners, NO card wrappers
 *
 * Feature parity with V2 CoachAvailability:
 * - Week navigation (prev/next/today)
 * - Availability heatmap grid
 * - Click to edit (role-based)
 * - Edit modal
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  CanvasButton,
  CanvasModal,
  CanvasConsoleReadout,
  CanvasChamferPanel,
} from '@v2/components/canvas';
import { useTeamAvailability, useUpdateAvailability } from '@v2/hooks/useAvailability';
import { AvailabilityGrid, AvailabilityEditor } from '@v2/components/availability';
import { useAuth } from '@v2/contexts/AuthContext';
import type { AvailabilityDay, AthleteAvailability } from '@v2/types/coach';

// ============================================
// ANIMATION VARIANTS
// ============================================

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

// ============================================
// CANVAS AVAILABILITY PAGE
// ============================================

export function CanvasAvailabilityPage() {
  // Date range state (default: current week starting Monday)
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
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

  // Generate date objects for the week range
  const weekDates = useMemo(() => {
    return Array.from({ length: numDays }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [startDate, numDays]);

  // Handle athlete click
  const handleAthleteClick = (athleteId: string) => {
    const canEditThis = isCoach || (user as any)?.athleteId === athleteId;
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

  // Format date range
  const dateRangeLabel = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const athleteCount = availability?.length || 0;

  return (
    <div className="h-full flex flex-col bg-void">
      {/* Page header */}
      <div className="px-4 lg:px-6 pt-6 lg:pt-8 pb-4 lg:pb-6 border-b border-ink-border/30">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-ink-secondary mb-3">
                TEAM / AVAILABILITY
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-ink-bright tracking-tight">
                Availability
              </h1>
            </div>

            {/* Week navigation */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <CanvasButton
                  variant="secondary"
                  onClick={goToPreviousWeek}
                  className="!px-3 !py-2 flex-1 sm:flex-initial"
                >
                  <ChevronLeft className="w-4 h-4" />
                </CanvasButton>
                <CanvasButton
                  variant="secondary"
                  onClick={goToThisWeek}
                  className="flex-1 sm:flex-initial"
                >
                  THIS WEEK
                </CanvasButton>
                <CanvasButton
                  variant="secondary"
                  onClick={goToNextWeek}
                  className="!px-3 !py-2 flex-1 sm:flex-initial"
                >
                  <ChevronRight className="w-4 h-4" />
                </CanvasButton>
              </div>
              <span className="text-xs sm:text-sm text-ink-secondary font-mono text-center sm:min-w-[180px]">
                {dateRangeLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 py-4 lg:py-6">
          <motion.div variants={stagger} initial="hidden" animate="visible">
            {isLoading ? (
              <motion.div variants={fadeUp}>
                <CanvasChamferPanel className="p-4 lg:p-6 h-64 animate-pulse bg-ink-well/30">
                  <div className="h-full" />
                </CanvasChamferPanel>
              </motion.div>
            ) : (
              <motion.div variants={fadeUp}>
                <div className="bg-ink-raised border border-white/[0.04] p-3 lg:p-4 overflow-x-auto">
                  <AvailabilityGrid
                    data={availability || []}
                    startDate={startDate}
                    numDays={numDays}
                    onAthleteClick={handleAthleteClick}
                  />
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Console readout footer */}
      <div className="border-t border-ink-border/30 px-4 lg:px-6 py-3 bg-ink-well/20">
        <div className="max-w-5xl mx-auto">
          <CanvasConsoleReadout
            items={[
              { label: 'WEEK', value: dateRangeLabel },
              { label: 'ATHLETES', value: athleteCount.toString() },
              { label: 'DAYS', value: numDays.toString() },
            ]}
          />
        </div>
      </div>

      {/* Edit Modal */}
      <CanvasModal
        isOpen={!!editingAthlete}
        onClose={() => setEditingAthlete(null)}
        title="EDIT AVAILABILITY"
      >
        {editingAthlete && (
          <AvailabilityEditor
            athleteId={editingAthlete.athleteId}
            athleteName={editingAthlete.athleteName}
            dates={weekDates}
            availability={editingAthlete.dates}
            onSave={handleSave}
            onCancel={() => setEditingAthlete(null)}
          />
        )}
      </CanvasModal>
    </div>
  );
}

export default CanvasAvailabilityPage;

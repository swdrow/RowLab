/**
 * TrainingPage -- Tabbed training management page.
 *
 * Three tabs: Calendar | Compliance | Plans.
 * Calendar tab integrates CalendarView with plan filter and workout creation.
 * Keyboard shortcuts: N = new workout, Escape = close modal.
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { Button } from '@/components/ui/Button';
import { plansOptions } from '../api';
import CalendarView from './CalendarView';
import { ComplianceDashboard } from './ComplianceDashboard';
import { PlansList } from './PlansList';
import { WorkoutFormModal } from './WorkoutFormModal';
import { IconCalendar, IconClipboardList, IconPlus, IconShield } from '@/components/icons';
import type { IconComponent } from '@/types/icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'calendar' | 'compliance' | 'plans';

interface TrainingPageProps {
  teamId: string;
  readOnly: boolean;
}

const TABS: { key: Tab; label: string; icon: IconComponent }[] = [
  { key: 'calendar', label: 'Calendar', icon: IconCalendar },
  { key: 'compliance', label: 'Compliance', icon: IconShield },
  { key: 'plans', label: 'Plans', icon: IconClipboardList },
];

// ---------------------------------------------------------------------------
// TrainingPage
// ---------------------------------------------------------------------------

export function TrainingPage({ teamId, readOnly }: TrainingPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('calendar');
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [workoutInitialDate, setWorkoutInitialDate] = useState<Date | undefined>(undefined);

  // Fetch plans for filter dropdown and plan ID for workout creation
  const { data: plans = [] } = useQuery(plansOptions());
  const [selectedPlanId, setSelectedPlanId] = useState<string | ''>('');

  // Default to first plan when plans load
  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      const firstActive = plans.find((p) => !p.isTemplate);
      if (firstActive) setSelectedPlanId(firstActive.id);
    }
  }, [plans, selectedPlanId]);

  // TODO(50-16): Plan stats for Plans tab sidebar badge counts (plans.filter by isTemplate)

  // Handlers
  const openWorkoutModal = useCallback((date?: Date) => {
    setWorkoutInitialDate(date);
    setShowWorkoutModal(true);
  }, []);

  const closeWorkoutModal = useCallback(() => {
    setShowWorkoutModal(false);
    setWorkoutInitialDate(undefined);
  }, []);

  const handleCalendarSlotSelect = useCallback(
    (slotInfo: { start: Date; end: Date }) => {
      if (!readOnly) {
        openWorkoutModal(slotInfo.start);
      }
    },
    [readOnly, openWorkoutModal]
  );

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Guard: skip if focus is inside input, textarea, select, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        if (!readOnly && !showWorkoutModal) {
          e.preventDefault();
          openWorkoutModal();
        }
      }

      if (e.key === 'Escape') {
        if (showWorkoutModal) {
          e.preventDefault();
          closeWorkoutModal();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [readOnly, showWorkoutModal, openWorkoutModal, closeWorkoutModal]);

  return (
    <div className="mx-auto max-w-6xl p-4 pb-24 md:p-6">
      {/* Page header */}
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-faint mb-1">
          COACH
        </p>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-semibold text-text-bright tracking-tight lg:text-3xl">
            Training
          </h1>
          {readOnly && <ReadOnlyBadge />}
        </div>
        <p className="mt-1 text-sm text-text-dim">Plan, schedule, and track training sessions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-void-deep/50 p-1 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-void-raised text-text-bright shadow-sm'
                : 'text-text-dim hover:text-text-bright'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'calendar' && (
        <CalendarTab
          teamId={teamId}
          readOnly={readOnly}
          plans={plans}
          selectedPlanId={selectedPlanId}
          onSelectPlan={setSelectedPlanId}
          onAddWorkout={() => openWorkoutModal()}
          onSelectSlot={handleCalendarSlotSelect}
        />
      )}

      {activeTab === 'compliance' && <ComplianceDashboard teamId={teamId} />}

      {activeTab === 'plans' && (
        <PlansList
          teamId={teamId}
          readOnly={readOnly}
          onSelectPlan={(id) => setSelectedPlanId(id)}
        />
      )}

      {/* Workout modal */}
      <WorkoutFormModal
        isOpen={showWorkoutModal}
        onClose={closeWorkoutModal}
        teamId={teamId}
        planId={selectedPlanId || undefined}
        initialDate={workoutInitialDate}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendar tab
// ---------------------------------------------------------------------------

interface CalendarTabProps {
  teamId: string;
  readOnly: boolean;
  plans: Array<{ id: string; name: string; isTemplate: boolean }>;
  selectedPlanId: string;
  onSelectPlan: (id: string) => void;
  onAddWorkout: () => void;
  onSelectSlot: (slotInfo: { start: Date; end: Date }) => void;
}

function CalendarTab({
  teamId: _teamId,
  readOnly,
  plans,
  selectedPlanId,
  onSelectPlan,
  onAddWorkout,
  onSelectSlot,
}: CalendarTabProps) {
  const activePlans = useMemo(() => plans.filter((p) => !p.isTemplate), [plans]);

  return (
    <div className="space-y-4">
      {/* Controls bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {/* Plan filter */}
          {activePlans.length > 0 && (
            <select
              value={selectedPlanId}
              onChange={(e) => onSelectPlan(e.target.value)}
              className="rounded-lg border border-edge-default bg-void-raised px-3 py-2 text-sm text-text-bright transition-colors focus:border-accent-teal/50 focus:outline-none"
            >
              <option value="">All Plans</option>
              {activePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {!readOnly && (
          <Button variant="primary" size="sm" onClick={onAddWorkout}>
            <IconPlus className="h-4 w-4" />
            Add Workout
            <kbd className="ml-1.5 hidden rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">
              N
            </kbd>
          </Button>
        )}
      </div>

      {/* Calendar */}
      <CalendarView onSelectSlot={readOnly ? undefined : onSelectSlot} className="min-h-[600px]" />
    </div>
  );
}

export default TrainingPage;

// src/v2/pages/CoachTrainingPage.tsx

import { useState, useCallback, useMemo } from 'react';
import { Tab, Dialog, Transition } from '@headlessui/react';
import { format, startOfWeek } from 'date-fns';
import { Calendar, Shield, Clipboard, Plus, FileText } from 'lucide-react';
import {
  DragDropCalendar,
  PeriodizationTimeline,
  ComplianceDashboard,
  WorkoutForm,
  AssignmentManager,
  NCAAAuditReport,
} from '../components/training';
import { useTrainingPlans } from '../hooks/useTrainingPlans';
import { useCreateWorkout } from '../hooks/useWorkouts';
import { useTrainingKeyboard, getTrainingShortcuts } from '../hooks/useTrainingKeyboard';
import { TrainingShortcutsHelp } from '../features/training/components/TrainingShortcutsHelp';
import type { CalendarEvent, PeriodizationBlock } from '../types/training';
import { Fragment } from 'react';

type TabType = 'calendar' | 'compliance' | 'plans';

/**
 * CoachTrainingPage Component
 *
 * Main page for training management with three tabs:
 * - Calendar: Visual workout scheduling with drag-drop
 * - Compliance: NCAA 20-hour rule tracking and reports
 * - Plans: Training plan management and assignment
 *
 * Features:
 * - Periodization timeline across all tabs
 * - Workout creation modal with recurring patterns
 * - Plan assignment to athletes
 * - Compliance dashboard with audit reports
 * - Responsive mobile layout
 */
export function CoachTrainingPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('calendar');

  // Modal/panel state
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Data hooks
  const { plans, isLoading: loadingPlans } = useTrainingPlans();
  const { createWorkout, isCreating } = useCreateWorkout();

  // Close all open modals/panels
  const closeAllModals = useCallback(() => {
    setShowWorkoutModal(false);
    setShowAssignmentModal(false);
    setShowAuditModal(false);
    setSelectedSlot(null);
    setSelectedEvent(null);
  }, []);

  // Keyboard shortcuts
  const { showHelp, setShowHelp } = useTrainingKeyboard({
    onNewSession: () => setShowWorkoutModal(true),
    onEscape: closeAllModals,
  });

  const shortcuts = useMemo(
    () =>
      getTrainingShortcuts({
        hasNewSession: true,
        hasRefresh: true,
        hasEscape: true,
      }),
    []
  );

  // Resolve CSS vars for periodization block colors
  const blockColors = useMemo(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      base: style.getPropertyValue('--data-good').trim() || '#3b82f6',
      build: style.getPropertyValue('--data-warning').trim() || '#f59e0b',
    };
  }, []);

  // Demo periodization blocks (would come from API in production)
  const periodizationBlocks: PeriodizationBlock[] = [
    {
      id: '1',
      name: 'Spring Base',
      phase: 'base',
      startDate: '2026-01-06',
      endDate: '2026-03-01',
      weeklyTSSTarget: 400,
      focusAreas: ['Aerobic Endurance', 'Technique'],
      color: blockColors.base,
    },
    {
      id: '2',
      name: 'Build Phase',
      phase: 'build',
      startDate: '2026-03-02',
      endDate: '2026-04-15',
      weeklyTSSTarget: 500,
      focusAreas: ['Power Development', 'Race Pace'],
      color: blockColors.build,
    },
  ];

  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
    setSelectedSlot(slotInfo);
    setShowWorkoutModal(true);
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    // Could open edit modal or slide-out panel
    console.log('Selected event:', event);
  }, []);

  const handleBlockClick = useCallback((block: PeriodizationBlock) => {
    console.log('Selected block:', block);
    // Could open edit modal
  }, []);

  const handleWorkoutSubmit = (data: any) => {
    createWorkout(data, {
      onSuccess: () => {
        setShowWorkoutModal(false);
        setSelectedSlot(null);
      },
    });
  };

  const handleAthleteClick = useCallback((athleteId: string) => {
    console.log('View athlete:', athleteId);
    // Could navigate to athlete training view
  }, []);

  const tabs = [
    { key: 'calendar' as const, label: 'Calendar', icon: Calendar },
    { key: 'compliance' as const, label: 'Compliance', icon: Shield },
    { key: 'plans' as const, label: 'Plans', icon: Clipboard },
  ];

  return (
    <div className="coach-training-page">
      {/* Hero Header */}
      <div className="relative px-6 pt-8 pb-6 mb-2 overflow-hidden">
        {/* Warm gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent-copper/[0.06] via-accent-copper/[0.02] to-transparent pointer-events-none" />
        {/* Decorative copper line at bottom */}
        <div className="absolute bottom-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-accent-copper/30 to-transparent" />

        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-copper mb-2">
            Training Program
          </p>
          <h1 className="text-4xl font-display font-bold text-ink-bright tracking-tight">
            Training
          </h1>
          <p className="text-sm text-ink-secondary mt-2">
            Plan, schedule, and track training sessions
          </p>
        </div>
      </div>

      <div className="px-6">
        {/* Periodization Timeline */}
        <div className="mb-6 p-4 bg-ink-raised rounded-lg border border-ink-border">
          <PeriodizationTimeline
            blocks={periodizationBlocks}
            startDate={new Date('2026-01-01')}
            endDate={new Date('2026-06-30')}
            onBlockClick={handleBlockClick}
            onAddBlock={() => console.log('Add block')}
          />
        </div>

        {/* Tab Navigation */}
        <Tab.Group
          selectedIndex={tabs.findIndex((t) => t.key === activeTab)}
          onChange={(index) => setActiveTab(tabs[index].key)}
        >
          <Tab.List className="flex items-center gap-1 p-1 bg-ink-raised rounded-lg mb-6 border border-ink-border">
            {tabs.map((tab) => (
              <Tab
                key={tab.key}
                className={({ selected }) =>
                  `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-150
                ${
                  selected
                    ? 'bg-accent-copper text-white shadow-sm'
                    : 'text-ink-secondary hover:text-ink-body hover:bg-ink-hover'
                }`
                }
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels>
            {/* Calendar Tab */}
            <Tab.Panel>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <select
                    value={selectedPlanId || ''}
                    onChange={(e) => setSelectedPlanId(e.target.value || null)}
                    className="px-3 py-2 bg-ink-base border border-ink-border rounded-md
                             text-ink-bright text-sm
                             focus:outline-none focus:ring-2 focus:ring-accent-copper/30"
                    aria-label="Filter training calendar by plan"
                  >
                    <option value="">All Plans</option>
                    {plans?.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setShowWorkoutModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                           bg-gradient-to-b from-accent-copper to-accent-copper-hover text-white shadow-glow-copper rounded-md
                           hover:shadow-glow-copper-lg hover:-translate-y-px active:translate-y-0 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Workout
                </button>
              </div>

              <DragDropCalendar
                planId={selectedPlanId || undefined}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                className="bg-ink-raised rounded-lg border border-ink-border p-4"
              />
            </Tab.Panel>

            {/* Compliance Tab */}
            <Tab.Panel>
              <div className="flex items-center justify-end mb-4">
                <button
                  onClick={() => setShowAuditModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                           border border-ink-border text-ink-bright rounded-md
                           hover:bg-ink-raised transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Generate Audit Report
                </button>
              </div>

              <ComplianceDashboard onAthleteClick={handleAthleteClick} />
            </Tab.Panel>

            {/* Plans Tab */}
            <Tab.Panel>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Plan List */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-ink-bright">Training Plans</h3>
                    <button
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                               bg-gradient-to-b from-accent-copper to-accent-copper-hover text-white shadow-glow-copper rounded-md
                               hover:shadow-glow-copper-lg hover:-translate-y-px active:translate-y-0 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      New Plan
                    </button>
                  </div>

                  {loadingPlans ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-16 bg-ink-raised rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : !plans || plans.length === 0 ? (
                    <div className="text-center py-12 text-ink-muted">
                      No training plans yet. Create your first plan to get started.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {plans.map((plan) => (
                        <div
                          key={plan.id}
                          className="p-4 bg-ink-raised rounded-lg border border-ink-border
                                   hover:border-accent-copper/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedPlanId(plan.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-ink-bright">{plan.name}</h4>
                              {plan.description && (
                                <p className="text-sm text-ink-muted mt-1 line-clamp-1">
                                  {plan.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {plan.phase && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-accent-copper/[0.12] text-accent-copper rounded">
                                  {plan.phase}
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPlanId(plan.id);
                                  setShowAssignmentModal(true);
                                }}
                                className="px-2 py-1 text-xs font-medium text-accent-copper
                                         hover:bg-accent-copper/[0.08] rounded transition-colors"
                              >
                                Assign
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="space-y-4">
                  <div className="p-4 bg-ink-raised rounded-lg border border-ink-border">
                    <h4 className="font-medium text-ink-bright mb-3">Quick Stats</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-ink-secondary">Active Plans</span>
                        <span className="font-medium font-mono text-ink-bright">
                          {plans?.filter((p) => !p.isTemplate).length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-secondary">Templates</span>
                        <span className="font-medium font-mono text-ink-bright">
                          {plans?.filter((p) => p.isTemplate).length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>

        {/* Workout Modal */}
        <Transition appear show={showWorkoutModal} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-50"
            onClose={() => {
              setShowWorkoutModal(false);
              setSelectedSlot(null);
            }}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
            </Transition.Child>

            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl bg-ink-base rounded-lg shadow-xl border border-ink-border p-6">
                  <Dialog.Title className="text-lg font-semibold text-ink-bright mb-4">
                    {selectedSlot ? 'Create Workout' : 'Add Workout'}
                  </Dialog.Title>
                  <WorkoutForm
                    planId={selectedPlanId || plans?.[0]?.id || ''}
                    initialDate={selectedSlot?.start}
                    onSubmit={handleWorkoutSubmit}
                    onCancel={() => {
                      setShowWorkoutModal(false);
                      setSelectedSlot(null);
                    }}
                    isSubmitting={isCreating}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>

        {/* Assignment Modal */}
        <Transition appear show={showAssignmentModal} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setShowAssignmentModal(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
            </Transition.Child>

            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl bg-ink-base rounded-lg shadow-xl border border-ink-border p-6">
                  <Dialog.Title className="text-lg font-semibold text-ink-bright mb-4">
                    Assign Training Plan
                  </Dialog.Title>
                  <AssignmentManager
                    plan={plans?.find((p) => p.id === selectedPlanId)}
                    onSuccess={() => setShowAssignmentModal(false)}
                    onCancel={() => setShowAssignmentModal(false)}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>

        {/* Audit Report Modal */}
        <Transition appear show={showAuditModal} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setShowAuditModal(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
            </Transition.Child>

            <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl bg-ink-base rounded-lg shadow-xl border border-ink-border p-6 my-8">
                  <NCAAAuditReport
                    weekStart={startOfWeek(new Date(), { weekStartsOn: 1 })}
                    teamName="Team"
                    onClose={() => setShowAuditModal(false)}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>

        {/* Keyboard Shortcuts Help */}
        <TrainingShortcutsHelp
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
          shortcuts={shortcuts}
        />
      </div>
    </div>
  );
}

export default CoachTrainingPage;

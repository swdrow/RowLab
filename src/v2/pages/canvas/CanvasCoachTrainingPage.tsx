/**
 * CanvasCoachTrainingPage - Training management with Canvas design
 *
 * Canvas-specific elements:
 * - CanvasTabs for 3-tab navigation (calendar/compliance/plans)
 * - Flat calendar cells (NO chamfer on calendar grids)
 * - Canvas-wrapped existing DragDropCalendar (preserve DnD logic)
 * - CanvasModal for workout creation
 * - CanvasButton for all actions
 * - Canvas color tokens for periodization blocks
 * - CanvasConsoleReadout for compliance stats
 *
 * Feature parity with V2 CoachTrainingPage:
 * - Calendar tab with drag-drop workout scheduling
 * - Compliance tab with NCAA hours tracking
 * - Plans tab with training plan management
 * - Periodization timeline across all tabs
 * - Workout creation modal
 * - Plan assignment modal
 * - Audit report generation
 */

import { useState, useCallback, useMemo, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { startOfWeek } from 'date-fns';
import { Plus, FileText } from 'lucide-react';
import { useIsMobile } from '@v2/hooks/useBreakpoint';
import {
  CanvasTabs,
  CanvasButton,
  CanvasChamferPanel,
  RuledHeader,
  ScrambleNumber,
  CanvasConsoleReadout,
  CanvasSelect,
} from '@v2/components/canvas';
import {
  DragDropCalendar,
  PeriodizationTimeline,
  ComplianceDashboard,
  WorkoutForm,
  AssignmentManager,
  NCAAAuditReport,
} from '@v2/components/training';
import { useTrainingPlans } from '@v2/hooks/useTrainingPlans';
import { useCreateWorkout } from '@v2/hooks/useWorkouts';
import { useTrainingKeyboard, getTrainingShortcuts } from '@v2/hooks/useTrainingKeyboard';
import { TrainingShortcutsHelp } from '@v2/features/training/components/TrainingShortcutsHelp';
import type { CalendarEvent, PeriodizationBlock, TrainingPlan } from '@v2/types/training';

type TabType = 'calendar' | 'compliance' | 'plans';

export function CanvasCoachTrainingPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('calendar');

  // Modal/panel state
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);

  // Responsive layout
  const isMobile = useIsMobile();

  // Data hooks
  const { plans, isLoading: loadingPlans } = useTrainingPlans();
  const { createWorkout, isCreating } = useCreateWorkout();

  // Close all open modals/panels
  const closeAllModals = useCallback(() => {
    setShowWorkoutModal(false);
    setShowAssignmentModal(false);
    setShowAuditModal(false);
    setSelectedSlot(null);
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
      peak: style.getPropertyValue('--data-excellent').trim() || '#10b981',
      taper: style.getPropertyValue('--data-poor').trim() || '#ef4444',
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
    console.log('Selected event:', event);
  }, []);

  const handleBlockClick = useCallback((block: PeriodizationBlock) => {
    console.log('Selected block:', block);
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
  }, []);

  const tabs = [
    { id: 'calendar' as const, label: 'Calendar' },
    { id: 'compliance' as const, label: 'Compliance' },
    { id: 'plans' as const, label: 'Plans' },
  ];

  return (
    <div className="h-full bg-void text-ink-primary">
      {/* Page Header — text against void */}
      <div className="relative px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6 mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted mb-2">
            COACH
          </p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-ink-bright tracking-tight">
            Training
          </h1>
          <p className="text-sm text-ink-secondary mt-2">
            Plan, schedule, and track training sessions
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-6">
        {/* Periodization Timeline */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-ink-raised border border-white/[0.04]">
          <PeriodizationTimeline
            blocks={periodizationBlocks}
            startDate={new Date('2026-01-01')}
            endDate={new Date('2026-06-30')}
            onBlockClick={handleBlockClick}
            onAddBlock={() => console.log('Add block')}
          />
        </div>

        {/* Tab Navigation */}
        <CanvasTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as TabType)}
        />

        <div className="mt-4 sm:mt-6">
          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <CanvasSelect
                    value={selectedPlanId || ''}
                    onChange={(value) => setSelectedPlanId(value || null)}
                    options={[
                      { value: '', label: 'All Plans' },
                      ...(plans?.map((plan) => ({
                        value: plan.id,
                        label: plan.name,
                      })) || []),
                    ]}
                  />
                </div>

                <CanvasButton
                  variant="primary"
                  onClick={() => setShowWorkoutModal(true)}
                  className="min-h-[44px] w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Workout
                </CanvasButton>
              </div>

              {/* Calendar wrapper — Canvas-styled, preserves DnD */}
              <div className="bg-ink-raised border border-white/[0.04] p-2 sm:p-4 canvas-calendar-wrapper">
                <DragDropCalendar
                  planId={selectedPlanId || undefined}
                  onSelectEvent={handleSelectEvent}
                  onSelectSlot={handleSelectSlot}
                />
              </div>
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === 'compliance' && (
            <div>
              <div className="flex items-center justify-end mb-4">
                <CanvasButton
                  variant="ghost"
                  onClick={() => setShowAuditModal(true)}
                  className="flex items-center gap-2 min-h-[44px]"
                >
                  <FileText className="w-4 h-4" />
                  {!isMobile && 'Generate Audit Report'}
                </CanvasButton>
              </div>

              {/* Canvas-wrapped compliance dashboard */}
              <div className="bg-ink-raised border border-white/[0.04] p-3 sm:p-4">
                <ComplianceDashboard onAthleteClick={handleAthleteClick} />
              </div>
            </div>
          )}

          {/* Plans Tab */}
          {activeTab === 'plans' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Plan List */}
              <div className="lg:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <RuledHeader>TRAINING PLANS</RuledHeader>
                  <CanvasButton variant="primary" className="min-h-[44px] w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    New Plan
                  </CanvasButton>
                </div>

                {loadingPlans ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-16 bg-ink-raised animate-pulse border border-white/[0.04]"
                      />
                    ))}
                  </div>
                ) : !plans || plans.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-ink-muted font-mono text-sm">[NO TRAINING PLANS]</p>
                    <p className="text-ink-muted text-xs mt-2">
                      Create your first plan to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className="p-4 bg-ink-raised border border-white/[0.04]
                                   hover:border-accent-primary/30 transition-colors cursor-pointer"
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
                              <span className="px-2 py-0.5 text-xs font-medium font-mono bg-accent-primary/[0.12] text-accent-primary">
                                {plan.phase.toUpperCase()}
                              </span>
                            )}
                            <CanvasButton
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPlanId(plan.id);
                                setShowAssignmentModal(true);
                              }}
                              className="min-h-[44px]"
                            >
                              ASSIGN
                            </CanvasButton>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <CanvasChamferPanel>
                  <RuledHeader className="mb-3">QUICK STATS</RuledHeader>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-baseline">
                      <span className="text-ink-muted uppercase tracking-wide text-xs">
                        Active Plans
                      </span>
                      <ScrambleNumber
                        value={plans?.filter((p) => !p.isTemplate).length || 0}
                        className="text-lg text-ink-bright"
                      />
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-ink-muted uppercase tracking-wide text-xs">
                        Templates
                      </span>
                      <ScrambleNumber
                        value={plans?.filter((p) => p.isTemplate).length || 0}
                        className="text-lg text-ink-bright"
                      />
                    </div>
                  </div>
                </CanvasChamferPanel>

                <CanvasConsoleReadout
                  items={[
                    { label: 'PLANS', value: String(plans?.length || 0) },
                    {
                      label: 'ACTIVE',
                      value: String(plans?.filter((p) => !p.isTemplate).length || 0),
                    },
                  ]}
                />
              </div>
            </div>
          )}
        </div>

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
              <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
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
                <Dialog.Panel className="w-full max-w-2xl bg-ink-base border border-white/[0.08] p-6 shadow-xl">
                  <Dialog.Title className="text-lg font-semibold text-ink-bright mb-4 uppercase tracking-wide">
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
              <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
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
                <Dialog.Panel className="w-full max-w-2xl bg-ink-base border border-white/[0.08] p-6 shadow-xl">
                  <Dialog.Title className="text-lg font-semibold text-ink-bright mb-4 uppercase tracking-wide">
                    Assign Training Plan
                  </Dialog.Title>
                  <AssignmentManager
                    plan={plans?.find((p) => p.id === selectedPlanId) as TrainingPlan | undefined}
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
              <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
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
                <Dialog.Panel className="w-full max-w-4xl bg-ink-base border border-white/[0.08] p-6 shadow-xl my-8">
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

export default CanvasCoachTrainingPage;

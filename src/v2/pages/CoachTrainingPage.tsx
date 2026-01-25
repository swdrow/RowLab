// src/v2/pages/CoachTrainingPage.tsx

import { useState, useCallback } from 'react';
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
      color: '#3b82f6',
    },
    {
      id: '2',
      name: 'Build Phase',
      phase: 'build',
      startDate: '2026-03-02',
      endDate: '2026-04-15',
      weeklyTSSTarget: 500,
      focusAreas: ['Power Development', 'Race Pace'],
      color: '#f59e0b',
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
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-txt-primary">Training</h1>
        <p className="text-txt-secondary mt-1">
          Manage training plans, schedules, and NCAA compliance
        </p>
      </div>

      {/* Periodization Timeline */}
      <div className="mb-6 p-4 bg-surface-elevated rounded-lg border border-bdr-default">
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
        <Tab.List className="flex items-center gap-1 p-1 bg-surface-elevated rounded-lg mb-6">
          {tabs.map((tab) => (
            <Tab
              key={tab.key}
              className={({ selected }) =>
                `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors
                ${selected
                  ? 'bg-accent-primary text-white'
                  : 'text-txt-secondary hover:text-txt-primary hover:bg-surface-default'
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
                  className="px-3 py-2 bg-surface-default border border-bdr-default rounded-md
                             text-txt-primary text-sm
                             focus:outline-none focus:ring-2 focus:ring-accent-primary"
                >
                  <option value="">All Plans</option>
                  {plans?.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowWorkoutModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                           bg-accent-primary text-white rounded-md
                           hover:bg-accent-primary-hover transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Workout
              </button>
            </div>

            <DragDropCalendar
              planId={selectedPlanId || undefined}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              className="bg-surface-elevated rounded-lg border border-bdr-default p-4"
            />
          </Tab.Panel>

          {/* Compliance Tab */}
          <Tab.Panel>
            <div className="flex items-center justify-end mb-4">
              <button
                onClick={() => setShowAuditModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                           border border-bdr-default text-txt-primary rounded-md
                           hover:bg-surface-elevated transition-colors"
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
                  <h3 className="text-lg font-semibold text-txt-primary">Training Plans</h3>
                  <button
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                               bg-accent-primary text-white rounded-md
                               hover:bg-accent-primary-hover transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New Plan
                  </button>
                </div>

                {loadingPlans ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary" />
                  </div>
                ) : !plans || plans.length === 0 ? (
                  <div className="text-center py-12 text-txt-tertiary">
                    No training plans yet. Create your first plan to get started.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className="p-4 bg-surface-elevated rounded-lg border border-bdr-default
                                   hover:border-accent-primary/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedPlanId(plan.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-txt-primary">{plan.name}</h4>
                            {plan.description && (
                              <p className="text-sm text-txt-tertiary mt-1 line-clamp-1">
                                {plan.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {plan.phase && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-accent-primary/20 text-accent-primary rounded">
                                {plan.phase}
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPlanId(plan.id);
                                setShowAssignmentModal(true);
                              }}
                              className="px-2 py-1 text-xs font-medium text-accent-primary
                                         hover:bg-accent-primary/10 rounded transition-colors"
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
                <div className="p-4 bg-surface-elevated rounded-lg border border-bdr-default">
                  <h4 className="font-medium text-txt-primary mb-3">Quick Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-txt-secondary">Active Plans</span>
                      <span className="font-medium text-txt-primary">
                        {plans?.filter((p) => !p.isTemplate).length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-txt-secondary">Templates</span>
                      <span className="font-medium text-txt-primary">
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
              <Dialog.Panel className="w-full max-w-2xl bg-surface-default rounded-lg shadow-xl border border-bdr-default p-6">
                <Dialog.Title className="text-lg font-semibold text-txt-primary mb-4">
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
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setShowAssignmentModal(false)}
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
              <Dialog.Panel className="w-full max-w-2xl bg-surface-default rounded-lg shadow-xl border border-bdr-default p-6">
                <Dialog.Title className="text-lg font-semibold text-txt-primary mb-4">
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
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setShowAuditModal(false)}
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
              <Dialog.Panel className="w-full max-w-4xl bg-surface-default rounded-lg shadow-xl border border-bdr-default p-6 my-8">
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
    </div>
  );
}

export default CoachTrainingPage;

/**
 * SessionWizard: multi-step modal for creating a new seat race session.
 *
 * Steps:
 *  1. Session info (name/date, boat class, conditions, location)
 *  2. Select athletes from team roster
 *  3. Configure boats (number of boats, seats per boat)
 *  4. Assign athletes to boats/seats
 *  5. Enter piece times
 *
 * Uses react-hook-form per step with motion transitions.
 * Renders via React portal as a centered modal overlay.
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'motion/react';

import { SPRING_SMOOTH, SPRING_GENTLE } from '@/lib/animations';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateSession } from '../api';
import type { Conditions } from '../types';
import {
  IconArmchair,
  IconCalendar,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconShip,
  IconTimer,
  IconUsers,
  IconX,
} from '@/components/icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SessionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: string;
}

interface SessionFormData {
  date: string;
  boatClass: string;
  conditions: Conditions | '';
  location: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Step config
// ---------------------------------------------------------------------------

const STEPS = [
  { label: 'Session Info', icon: IconCalendar },
  { label: 'Athletes', icon: IconUsers },
  { label: 'Boats', icon: IconShip },
  { label: 'Assignments', icon: IconArmchair },
  { label: 'Times', icon: IconTimer },
] as const;

const BOAT_CLASSES = ['8+', '4+', '4-', '4x', '2-', '2x', '1x'] as const;
const CONDITIONS: { value: Conditions; label: string }[] = [
  { value: 'calm', label: 'Calm' },
  { value: 'variable', label: 'Variable' },
  { value: 'rough', label: 'Rough' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SessionWizard({ isOpen, onClose, onSuccess, teamId }: SessionWizardProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  // Step 2: selected athlete IDs (placeholder for future roster integration)
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  // Step 3: boat configuration
  const [boatCount, setBoatCount] = useState(2);
  const [seatsPerBoat, setSeatsPerBoat] = useState(8);
  // Step 4-5: assignments and times are deferred to real implementation

  const createSession = useCreateSession(teamId);

  const form = useForm<SessionFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      boatClass: '8+',
      conditions: '',
      location: '',
      description: '',
    },
  });

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      setDirection('forward');
      setSelectedAthletes([]);
      setBoatCount(2);
      setSeatsPerBoat(8);
      form.reset();
    }
  }, [isOpen, form]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const goNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setDirection('forward');
      setStep((s) => s + 1);
    }
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 0) {
      setDirection('back');
      setStep((s) => s - 1);
    }
  }, [step]);

  const handleCreate = form.handleSubmit(async (data) => {
    createSession.mutate(
      {
        date: new Date(data.date).toISOString(),
        boatClass: data.boatClass,
        conditions: data.conditions || null,
        location: data.location || null,
        description: data.description || null,
      },
      {
        onSuccess: () => {
          onSuccess();
          onClose();
        },
      }
    );
  });

  // Animation variants for step slides
  const slideVariants = {
    enter: (dir: 'forward' | 'back') => ({
      x: dir === 'forward' ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: 'forward' | 'back') => ({
      x: dir === 'forward' ? -80 : 80,
      opacity: 0,
    }),
  };

  const isLastStep = step === STEPS.length - 1;
  const isFirstStep = step === 0;

  const portal = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="wizard-backdrop"
            className="fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="wizard-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-xl max-h-[85vh]"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={SPRING_GENTLE}
              onClick={(e) => e.stopPropagation()}
            >
              <Card padding="none" variant="elevated" className="flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-edge-default shrink-0">
                  <h2 className="text-lg font-display font-semibold text-text-bright">
                    New Seat Race Session
                  </h2>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-md hover:bg-void-overlay transition-colors"
                    aria-label="Close"
                  >
                    <IconX width={18} height={18} className="text-text-faint" />
                  </button>
                </div>

                {/* Step indicator */}
                <div className="px-5 py-3 border-b border-edge-default/50 shrink-0">
                  <div className="flex items-center gap-1">
                    {STEPS.map((s, idx) => {
                      const StepIcon = s.icon;
                      const isActive = idx === step;
                      const isDone = idx < step;
                      return (
                        <div key={s.label} className="flex items-center">
                          <div
                            className={`
                            flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors
                            ${isActive ? 'bg-accent-teal/10 text-accent-teal' : ''}
                            ${isDone ? 'text-data-excellent' : ''}
                            ${!isActive && !isDone ? 'text-text-faint' : ''}
                          `.trim()}
                          >
                            <StepIcon width={13} height={13} />
                            <span className="hidden sm:inline">{s.label}</span>
                          </div>
                          {idx < STEPS.length - 1 && (
                            <div
                              className={`w-4 h-px mx-0.5 ${
                                idx < step ? 'bg-data-excellent' : 'bg-edge-default'
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step content */}
                <div className="flex-1 overflow-y-auto px-5 py-5 relative min-h-[260px]">
                  <AnimatePresence initial={false} mode="wait" custom={direction}>
                    <motion.div
                      key={step}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={SPRING_SMOOTH}
                    >
                      {step === 0 && <Step1SessionInfo form={form} />}
                      {step === 1 && (
                        <Step2Athletes selected={selectedAthletes} onChange={setSelectedAthletes} />
                      )}
                      {step === 2 && (
                        <Step3Boats
                          boatCount={boatCount}
                          seatsPerBoat={seatsPerBoat}
                          onBoatCountChange={setBoatCount}
                          onSeatsChange={setSeatsPerBoat}
                        />
                      )}
                      {step === 3 && (
                        <Step4Assignments
                          athletes={selectedAthletes}
                          boatCount={boatCount}
                          seatsPerBoat={seatsPerBoat}
                        />
                      )}
                      {step === 4 && <Step5Times boatCount={boatCount} />}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Footer navigation */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-edge-default shrink-0">
                  <div>
                    {!isFirstStep && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goBack}
                        disabled={createSession.isPending}
                      >
                        <IconChevronLeft width={16} height={16} />
                        Back
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      disabled={createSession.isPending}
                    >
                      Cancel
                    </Button>
                    {isLastStep ? (
                      <Button size="sm" onClick={handleCreate} loading={createSession.isPending}>
                        <IconCheck width={16} height={16} />
                        Create Session
                      </Button>
                    ) : (
                      <Button size="sm" onClick={goNext}>
                        Next
                        <IconChevronRight width={16} height={16} />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(portal, document.body);
}

// ---------------------------------------------------------------------------
// Step 1: Session Info
// ---------------------------------------------------------------------------

function Step1SessionInfo({ form }: { form: ReturnType<typeof useForm<SessionFormData>> }) {
  const { register, watch, setValue } = form;
  const selectedClass = watch('boatClass');
  const selectedConditions = watch('conditions');

  return (
    <div className="space-y-5">
      <Input label="Date" type="date" {...register('date', { required: true })} />

      <div>
        <label className="text-sm font-medium text-text-default block mb-1.5">Boat Class</label>
        <div className="flex flex-wrap gap-2">
          {BOAT_CLASSES.map((bc) => (
            <button
              key={bc}
              type="button"
              onClick={() => setValue('boatClass', bc)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${
                  selectedClass === bc
                    ? 'bg-accent-teal text-void-deep shadow-focus'
                    : 'bg-void-raised text-text-dim border border-edge-default hover:border-edge-hover'
                }
              `.trim()}
            >
              {bc}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-text-default block mb-1.5">Conditions</label>
        <div className="flex gap-2">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setValue('conditions', selectedConditions === c.value ? '' : c.value)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${
                  selectedConditions === c.value
                    ? 'bg-accent-teal text-void-deep shadow-focus'
                    : 'bg-void-raised text-text-dim border border-edge-default hover:border-edge-hover'
                }
              `.trim()}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <Input label="Location" placeholder="e.g. Boathouse stretch" {...register('location')} />
      <Input label="Description" placeholder="Optional notes" {...register('description')} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Athletes (placeholder -- real roster query will be wired)
// ---------------------------------------------------------------------------

function Step2Athletes({
  selected,
  onChange: _onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-dim">
        Select athletes from your team roster to participate in this seat race.
      </p>

      <div className="rounded-lg border border-edge-default/50 p-6 text-center">
        <IconUsers width={32} height={32} className="mx-auto text-text-faint mb-3" />
        <p className="text-sm text-text-dim">Athlete selection will load from your team roster.</p>
        <p className="text-xs text-text-faint mt-1">
          {selected.length > 0
            ? `${selected.length} athletes selected`
            : 'No athletes selected yet'}
        </p>
      </div>

      <p className="text-xs text-text-faint">
        Tip: Athletes are assigned to boats in step 4. You can proceed without selecting here.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Boats
// ---------------------------------------------------------------------------

function Step3Boats({
  boatCount,
  seatsPerBoat,
  onBoatCountChange,
  onSeatsChange,
}: {
  boatCount: number;
  seatsPerBoat: number;
  onBoatCountChange: (n: number) => void;
  onSeatsChange: (n: number) => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-text-dim">
        Configure how many boats and seats per boat for this session.
      </p>

      <div>
        <label className="text-sm font-medium text-text-default block mb-1.5">
          Number of Boats
        </label>
        <div className="flex gap-2">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onBoatCountChange(n)}
              className={`
                w-12 h-10 rounded-lg text-sm font-medium transition-all
                ${
                  boatCount === n
                    ? 'bg-accent-teal text-void-deep shadow-focus'
                    : 'bg-void-raised text-text-dim border border-edge-default hover:border-edge-hover'
                }
              `.trim()}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-text-default block mb-1.5">Seats per Boat</label>
        <div className="flex gap-2">
          {[1, 2, 4, 8].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onSeatsChange(n)}
              className={`
                w-12 h-10 rounded-lg text-sm font-medium transition-all
                ${
                  seatsPerBoat === n
                    ? 'bg-accent-teal text-void-deep shadow-focus'
                    : 'bg-void-raised text-text-dim border border-edge-default hover:border-edge-hover'
                }
              `.trim()}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 p-3 rounded-lg bg-void-deep/40 text-xs text-text-dim">
        Configuration: {boatCount} boats with {seatsPerBoat} seat{seatsPerBoat !== 1 ? 's' : ''}{' '}
        each ({boatCount * seatsPerBoat} total positions)
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Assignments (simplified -- real drag-drop to be built later)
// ---------------------------------------------------------------------------

function Step4Assignments({
  athletes,
  boatCount,
  seatsPerBoat,
}: {
  athletes: string[];
  boatCount: number;
  seatsPerBoat: number;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-dim">
        Assign athletes to boats and seat positions. Athletes can be dragged between seats.
      </p>

      <div className="space-y-3">
        {Array.from({ length: boatCount }, (_, i) => (
          <div key={i} className="rounded-lg border border-edge-default/50 p-4">
            <h4 className="text-sm font-display font-medium text-text-bright mb-2">Boat {i + 1}</h4>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: seatsPerBoat }, (_, s) => (
                <div
                  key={s}
                  className="h-9 rounded bg-void-deep/40 flex items-center justify-center text-xs text-text-faint border border-dashed border-edge-default/30"
                >
                  Seat {s + 1}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-text-faint">
        {athletes.length > 0
          ? `${athletes.length} athletes available for assignment`
          : 'No athletes selected. You can add assignments after creation.'}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Times
// ---------------------------------------------------------------------------

function Step5Times({ boatCount }: { boatCount: number }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-dim">
        Enter piece times for each boat. Times can also be entered after session creation.
      </p>

      <div className="space-y-3">
        {Array.from({ length: boatCount }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-sm font-medium text-text-bright w-16">Boat {i + 1}</span>
            <Input placeholder="mm:ss.t" className="font-mono" />
          </div>
        ))}
      </div>

      <div className="mt-3 p-3 rounded-lg bg-accent-teal/5 border border-accent-teal/20 text-xs text-text-dim">
        Tip: You can skip times now and enter them later in the session detail view. Click
        &quot;Create Session&quot; to save with the current configuration.
      </div>
    </div>
  );
}

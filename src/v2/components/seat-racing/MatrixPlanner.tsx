import { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Users, Play, Info } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAthletes } from '../../hooks/useAthletes';
import { useGenerateSchedule } from '../../hooks/useMatrixPlanner';
import { SwapScheduleView } from './SwapScheduleView';
import { SessionWizard } from './wizard/SessionWizard';
import { matrixPlannerInputSchema } from '../../types/advancedRanking';
import type { SwapSchedule, Side } from '../../types/advancedRanking';
import { SPRING_CONFIG, FADE_IN_VARIANTS } from '../../utils/animations';

interface MatrixPlannerProps {
  onScheduleGenerated?: (schedule: SwapSchedule) => void;
  onClose?: () => void;
}

const BOAT_CLASSES = [
  { value: '8+', label: 'Eight (8+)', minAthletes: 18 },
  { value: '4+', label: 'Four with cox (4+)', minAthletes: 10 },
  { value: '4-', label: 'Four (4-)', minAthletes: 8 },
  { value: '2-', label: 'Pair (2-)', minAthletes: 4 },
  { value: '2x', label: 'Double (2x)', minAthletes: 4 },
];

type FormData = {
  boatClass: string;
  pieceCount: number | undefined;
  selectedAthletes: string[];
};

const TOUR_KEY = 'rowlab-matrix-planner-toured';

export function MatrixPlanner({ onScheduleGenerated, onClose }: MatrixPlannerProps) {
  const [step, setStep] = useState<'select' | 'configure' | 'result'>('select');
  const [sideFilter, setSideFilter] = useState<Side | 'All'>('All');
  const [generatedSchedule, setGeneratedSchedule] = useState<SwapSchedule | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  const { athletes, isLoading: athletesLoading } = useAthletes();
  const { generateAsync, isGenerating, error: generateError } = useGenerateSchedule();

  const form = useForm<FormData>({
    resolver: zodResolver(matrixPlannerInputSchema.pick({ boatClass: true })),
    defaultValues: {
      boatClass: '4-',
      pieceCount: undefined,
      selectedAthletes: [],
    },
  });

  const selectedAthletes = form.watch('selectedAthletes');
  const boatClass = form.watch('boatClass');

  // Filter athletes by side
  const filteredAthletes = useMemo(() => {
    if (!athletes) return [];
    if (sideFilter === 'All') return athletes.filter((a) => a.status === 'active');
    return athletes.filter((a) => a.status === 'active' && a.side === sideFilter);
  }, [athletes, sideFilter]);

  // Check if enough athletes selected
  const boatConfig = BOAT_CLASSES.find((b) => b.value === boatClass);
  const minAthletes = boatConfig?.minAthletes || 4;
  const hasEnoughAthletes = selectedAthletes.length >= minAthletes;

  // Driver.js guided tour on first visit
  useEffect(() => {
    const hasSeenTour = localStorage.getItem(TOUR_KEY);
    if (!hasSeenTour && step === 'select') {
      // Delay tour slightly to allow DOM elements to render
      setTimeout(() => {
        startTour();
      }, 300);
    }
  }, [step]);

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      overlayClickNext: false,
      steps: [
        {
          element: '#matrix-athletes',
          popover: {
            title: 'Select Athletes & Boats',
            description:
              'Choose the athletes and boat classes for your seat race plan. The planner will create an optimal swap schedule.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#balance-score',
          popover: {
            title: 'Balance Score',
            description:
              'Shows how evenly distributed seat swaps are across pieces. Higher scores mean better balance (all athletes get equal racing opportunities).',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '#swap-schedule',
          popover: {
            title: 'Swap Schedule',
            description:
              'Each row shows which athletes change seats between pieces. Colors indicate boat assignments.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#generate-session-btn',
          popover: {
            title: 'Generate Session',
            description:
              'Creates a pre-filled session with boats and assignments ready for review. You can adjust before saving.',
            side: 'top',
            align: 'start',
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem(TOUR_KEY, 'true');
      },
    });

    driverObj.drive();
  };

  const toggleAthlete = (athleteId: string) => {
    const current = form.getValues('selectedAthletes');
    if (current.includes(athleteId)) {
      form.setValue(
        'selectedAthletes',
        current.filter((id) => id !== athleteId)
      );
    } else {
      form.setValue('selectedAthletes', [...current, athleteId]);
    }
  };

  const selectAll = () => {
    form.setValue(
      'selectedAthletes',
      filteredAthletes.map((a) => a.id)
    );
  };

  const clearSelection = () => {
    form.setValue('selectedAthletes', []);
  };

  const handleGenerate = async () => {
    try {
      const schedule = await generateAsync({
        athleteIds: selectedAthletes,
        boatClass,
        pieceCount: form.getValues('pieceCount'),
      });

      setGeneratedSchedule(schedule);
      setStep('result');
      onScheduleGenerated?.(schedule);
    } catch (err) {
      console.error('Failed to generate schedule:', err);
    }
  };

  const handleGenerateSession = () => {
    if (!generatedSchedule) return;

    // Transform swap schedule into wizard initial data
    const initialData = {
      date: new Date().toISOString().split('T')[0],
      boatClass: generatedSchedule.boatClass,
      location: '',
      description: `Latin Square session - ${generatedSchedule.pieceCount} pieces`,
      pieces: generatedSchedule.pieces.map((piece) => ({
        sequenceOrder: piece.pieceNumber,
        distanceMeters: 2000, // Default distance
        direction: 'Downstream' as const,
        notes: piece.swapDescription,
        boats: piece.boats.map((boat) => ({
          name: boat.boatName,
          finishTimeSeconds: null,
          handicapSeconds: 0,
          assignments: boat.athleteIds.map((athleteId, idx) => {
            const seatAssignment = boat.seatAssignments?.[idx];
            return {
              athleteId,
              seatNumber: seatAssignment?.seatNumber || idx + 1,
              side: seatAssignment?.side || null,
            };
          }),
        })),
      })),
    };

    setShowWizard(true);
    // Pass initialData to wizard via state
    (window as any).__matrixPlannerInitialData = initialData;
  };

  // Calculate balance score (0-100)
  const balanceScore = useMemo(() => {
    if (!generatedSchedule) return 0;
    const rawBalance = generatedSchedule.statistics.balance;
    return Math.round(rawBalance * 100);
  }, [generatedSchedule]);

  // Get balance color
  const getBalanceColor = (score: number) => {
    if (score >= 80) return 'data-excellent';
    if (score >= 60) return 'data-good';
    if (score >= 40) return 'data-warning';
    return 'data-poor';
  };

  return (
    <>
      <div className="bg-bg-surface rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-bdr-default flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-txt-primary">Matrix Session Planner</h2>
            <p className="text-sm text-txt-secondary">
              {step === 'select' && 'Select athletes for the seat race'}
              {step === 'configure' && 'Configure session parameters'}
              {step === 'result' && 'Review generated schedule'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {step === 'select' && (
              <button
                onClick={startTour}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-txt-secondary hover:text-txt-primary rounded-lg hover:bg-bg-hover transition-colors"
              >
                <Info size={16} />
                Take Tour
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-txt-secondary hover:text-txt-primary rounded-lg hover:bg-hover transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {step === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={SPRING_CONFIG}
                className="space-y-4"
                id="matrix-athletes"
              >
                {/* Boat class selector */}
                <div>
                  <label className="block text-sm font-medium text-txt-primary mb-2">
                    Boat Class
                  </label>
                  <select
                    {...form.register('boatClass')}
                    className="w-full px-3 py-2 bg-bg-base border border-bdr-default rounded-lg text-txt-primary focus:ring-2 focus:ring-interactive-primary focus:border-interactive-primary"
                  >
                    {BOAT_CLASSES.map((boat) => (
                      <option key={boat.value} value={boat.value}>
                        {boat.label} (min {boat.minAthletes} athletes)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Side filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-txt-secondary">Filter by side:</span>
                  {(['All', 'Port', 'Starboard'] as const).map((side) => (
                    <button
                      key={side}
                      onClick={() => setSideFilter(side)}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        sideFilter === side
                          ? 'bg-interactive-primary text-white'
                          : 'bg-bg-raised text-txt-secondary hover:bg-bg-hover'
                      }`}
                    >
                      {side}
                    </button>
                  ))}
                </div>

                {/* Selection actions */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-txt-secondary">
                    {selectedAthletes.length} of {filteredAthletes.length} athletes selected
                    {!hasEnoughAthletes && (
                      <span className="text-data-warning ml-2">(need at least {minAthletes})</span>
                    )}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-sm text-interactive-primary hover:underline"
                    >
                      Select all
                    </button>
                    <button
                      onClick={clearSelection}
                      className="text-sm text-txt-secondary hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Athlete grid */}
                {athletesLoading ? (
                  <div className="text-center py-8 text-txt-secondary">Loading athletes...</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                    {filteredAthletes.map((athlete) => (
                      <button
                        key={athlete.id}
                        onClick={() => toggleAthlete(athlete.id)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedAthletes.includes(athlete.id)
                            ? 'border-interactive-primary bg-interactive-primary/10'
                            : 'border-bdr-default bg-bg-raised hover:bg-bg-hover'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              athlete.side === 'Port'
                                ? 'bg-data-poor'
                                : athlete.side === 'Starboard'
                                  ? 'bg-data-excellent'
                                  : 'bg-txt-tertiary'
                            }`}
                          />
                          <span className="text-sm font-medium text-txt-primary truncate">
                            {athlete.firstName} {athlete.lastName}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === 'result' && generatedSchedule && (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={SPRING_CONFIG}
                className="space-y-4"
              >
                {/* Balance Score Display */}
                <div
                  id="balance-score"
                  className="p-4 bg-bg-raised rounded-lg border border-bdr-default"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-txt-secondary">Balance Score</span>
                    <span
                      className={`text-2xl font-mono font-semibold text-${getBalanceColor(balanceScore)}`}
                    >
                      {balanceScore}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-bg-base rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${balanceScore}%` }}
                      transition={SPRING_CONFIG}
                      className={`h-full bg-${getBalanceColor(balanceScore)} rounded-full`}
                    />
                  </div>
                  <p className="text-xs text-txt-tertiary mt-1">
                    Higher scores mean more evenly distributed comparisons
                  </p>
                </div>

                {/* Swap Schedule */}
                <div id="swap-schedule">
                  <SwapScheduleView schedule={generatedSchedule} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error display */}
          {generateError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-data-poor/10 border border-data-poor rounded-lg text-sm text-data-poor"
            >
              {generateError.message}
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-bdr-default flex items-center justify-between">
          {step === 'result' ? (
            <>
              <button
                onClick={() => {
                  setStep('select');
                  setGeneratedSchedule(null);
                }}
                className="px-4 py-2 text-sm text-txt-secondary hover:text-txt-primary transition-colors"
              >
                Start Over
              </button>
              <div className="flex gap-3">
                <button
                  id="generate-session-btn"
                  onClick={handleGenerateSession}
                  className="flex items-center gap-2 px-4 py-2 bg-interactive-primary text-white rounded-lg hover:bg-interactive-primary-hover transition-colors"
                >
                  <Play size={16} />
                  Generate Session
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-bg-raised text-txt-primary rounded-lg hover:bg-bg-hover transition-colors"
                >
                  Done
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm text-txt-secondary">
                <Users size={16} className="inline mr-1" />
                {selectedAthletes.length} selected
              </div>
              <button
                onClick={handleGenerate}
                disabled={!hasEnoughAthletes || isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-interactive-primary text-white rounded-lg hover:bg-interactive-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Play size={16} />
                {isGenerating ? 'Generating...' : 'Generate Schedule'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Session Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={SPRING_CONFIG}
            className="w-full max-w-4xl bg-bg-surface rounded-xl shadow-2xl"
          >
            <SessionWizard
              initialData={(window as any).__matrixPlannerInitialData}
              onComplete={() => {
                setShowWizard(false);
                delete (window as any).__matrixPlannerInitialData;
                onClose?.();
              }}
              onCancel={() => {
                setShowWizard(false);
                delete (window as any).__matrixPlannerInitialData;
              }}
            />
          </motion.div>
        </div>
      )}
    </>
  );
}

export default MatrixPlanner;

import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { XMarkIcon, UserGroupIcon, PlayIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useAthletes } from '../../hooks/useAthletes';
import { useGenerateSchedule } from '../../hooks/useMatrixPlanner';
import { SwapScheduleView } from './SwapScheduleView';
import { matrixPlannerInputSchema } from '../../types/advancedRanking';
import type { SwapSchedule, Side } from '../../types/advancedRanking';

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

export function MatrixPlanner({ onScheduleGenerated, onClose }: MatrixPlannerProps) {
  const [step, setStep] = useState<'select' | 'configure' | 'result'>('select');
  const [sideFilter, setSideFilter] = useState<Side | 'All'>('All');
  const [generatedSchedule, setGeneratedSchedule] = useState<SwapSchedule | null>(null);

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
    if (sideFilter === 'All') return athletes.filter(a => a.status === 'active');
    return athletes.filter(a => a.status === 'active' && a.side === sideFilter);
  }, [athletes, sideFilter]);

  // Check if enough athletes selected
  const boatConfig = BOAT_CLASSES.find(b => b.value === boatClass);
  const minAthletes = boatConfig?.minAthletes || 4;
  const hasEnoughAthletes = selectedAthletes.length >= minAthletes;

  const toggleAthlete = (athleteId: string) => {
    const current = form.getValues('selectedAthletes');
    if (current.includes(athleteId)) {
      form.setValue('selectedAthletes', current.filter(id => id !== athleteId));
    } else {
      form.setValue('selectedAthletes', [...current, athleteId]);
    }
  };

  const selectAll = () => {
    form.setValue('selectedAthletes', filteredAthletes.map(a => a.id));
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

  return (
    <div className="bg-surface-primary rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-bdr-primary flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-txt-primary">Matrix Session Planner</h2>
          <p className="text-sm text-txt-secondary">
            {step === 'select' && 'Select athletes for the seat race'}
            {step === 'configure' && 'Configure session parameters'}
            {step === 'result' && 'Review generated schedule'}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-txt-secondary hover:text-txt-primary rounded-lg hover:bg-surface-hover"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
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
              className="space-y-4"
            >
              {/* Boat class selector */}
              <div>
                <label className="block text-sm font-medium text-txt-primary mb-2">
                  Boat Class
                </label>
                <select
                  {...form.register('boatClass')}
                  className="w-full px-3 py-2 bg-surface-secondary border border-bdr-primary rounded-lg text-txt-primary focus:ring-2 focus:ring-accent-primary"
                >
                  {BOAT_CLASSES.map(boat => (
                    <option key={boat.value} value={boat.value}>
                      {boat.label} (min {boat.minAthletes} athletes)
                    </option>
                  ))}
                </select>
              </div>

              {/* Side filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-txt-secondary">Filter by side:</span>
                {(['All', 'Port', 'Starboard'] as const).map(side => (
                  <button
                    key={side}
                    onClick={() => setSideFilter(side)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      sideFilter === side
                        ? 'bg-accent-primary text-white'
                        : 'bg-surface-secondary text-txt-secondary hover:bg-surface-hover'
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
                    <span className="text-amber-600 ml-2">
                      (need at least {minAthletes})
                    </span>
                  )}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-sm text-accent-primary hover:underline"
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
                  {filteredAthletes.map(athlete => (
                    <button
                      key={athlete.id}
                      onClick={() => toggleAthlete(athlete.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedAthletes.includes(athlete.id)
                          ? 'border-accent-primary bg-accent-primary/10'
                          : 'border-bdr-primary bg-surface-secondary hover:bg-surface-hover'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          athlete.side === 'Port' ? 'bg-red-500' :
                          athlete.side === 'Starboard' ? 'bg-green-500' :
                          'bg-gray-400'
                        }`} />
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
            >
              <SwapScheduleView schedule={generatedSchedule} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error display */}
        {generateError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {generateError.message}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-bdr-primary flex items-center justify-between">
        {step === 'result' ? (
          <>
            <button
              onClick={() => {
                setStep('select');
                setGeneratedSchedule(null);
              }}
              className="px-4 py-2 text-sm text-txt-secondary hover:text-txt-primary"
            >
              Start Over
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover"
            >
              Done
            </button>
          </>
        ) : (
          <>
            <div className="text-sm text-txt-secondary">
              <UserGroupIcon className="w-4 h-4 inline mr-1" />
              {selectedAthletes.length} selected
            </div>
            <button
              onClick={handleGenerate}
              disabled={!hasEnoughAthletes || isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlayIcon className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Generate Schedule'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default MatrixPlanner;

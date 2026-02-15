import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ErgTest, CreateErgTestInput, UpdateErgTestInput, TestType } from '@v2/types/ergTests';
import type { Athlete } from '@v2/types/athletes';

export interface ErgTestFormProps {
  initialData?: ErgTest;
  onSubmit: (data: CreateErgTestInput | UpdateErgTestInput) => void;
  onCancel: () => void;
  athletes: Athlete[];
  isSubmitting?: boolean;
}

// Test type options
const TEST_TYPES: TestType[] = ['2k', '6k', '30min', '500m'];

// Distance mapping for test types
const TEST_TYPE_DISTANCES: Record<TestType, number> = {
  '2k': 2000,
  '6k': 6000,
  '30min': 0, // Time-based, not distance
  '500m': 500,
};

// Validation schema
const ergTestSchema = z.object({
  athleteId: z.string().min(1, 'Athlete is required'),
  testType: z.enum(['2k', '6k', '30min', '500m'] as const),
  testDate: z.string().min(1, 'Test date is required'),
  timeSeconds: z.number().positive('Time must be positive'),
  distanceM: z.number().positive().nullable().optional(),
  splitSeconds: z.number().positive().nullable().optional(),
  watts: z.number().positive().nullable().optional(),
  strokeRate: z.number().min(10).max(60).nullable().optional(),
  weightKg: z.number().positive().max(300).nullable().optional(),
  notes: z.string().nullable().optional(),
});

type ErgTestFormData = z.infer<typeof ergTestSchema>;

/**
 * Convert time in MM:SS.s format to seconds
 */
function parseTimeInput(value: string): number {
  // If already a number, return it
  if (!isNaN(Number(value))) {
    return Number(value);
  }

  // Parse MM:SS.s format
  const parts = value.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }

  return parseFloat(value) || 0;
}

/**
 * Format seconds to MM:SS.s format
 */
function formatTimeDisplay(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${minutes}:${secs.padStart(4, '0')}`;
}

/**
 * Calculate split from watts using Concept2 formula
 * Formula: Watts = 2.80 / pace³ where pace is seconds per meter
 * Returns split in seconds per 500m
 */
function wattsToSplit(watts: number): number {
  // pace = (2.80 / watts)^(1/3) seconds per meter
  // split per 500m = pace * 500
  const pacePerMeter = Math.pow(2.80 / watts, 1/3);
  return pacePerMeter * 500;
}

/**
 * Calculate watts from split using Concept2 formula
 * Formula: Watts = 2.80 / pace³ where pace is seconds per meter
 * Split is in seconds per 500m
 */
function splitToWatts(splitSeconds: number): number {
  // Convert split per 500m to pace per meter
  const pacePerMeter = splitSeconds / 500;
  return 2.80 / Math.pow(pacePerMeter, 3);
}

/**
 * Calculate split per 500m from total time and distance
 */
function timeToSplit(timeSeconds: number, distanceM: number): number {
  if (distanceM <= 0) return 0;
  return (timeSeconds / distanceM) * 500;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function ErgTestForm({
  initialData,
  onSubmit,
  onCancel,
  athletes,
  isSubmitting = false,
}: ErgTestFormProps) {
  const isEditMode = !!initialData;
  const [timeInput, setTimeInput] = useState('');
  const [splitInput, setSplitInput] = useState('');
  const [wattsInput, setWattsInput] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ErgTestFormData>({
    resolver: zodResolver(ergTestSchema),
    defaultValues: initialData
      ? {
          athleteId: initialData.athleteId,
          testType: initialData.testType,
          testDate: initialData.testDate.split('T')[0],
          timeSeconds: initialData.timeSeconds,
          distanceM: initialData.distanceM || undefined,
          splitSeconds: initialData.splitSeconds || undefined,
          watts: initialData.watts || undefined,
          strokeRate: initialData.strokeRate || undefined,
          weightKg: initialData.weightKg || undefined,
          notes: initialData.notes || '',
        }
      : {
          // Smart defaults for new tests
          testType: '2k',
          testDate: getTodayDate(),
          distanceM: 2000,
        },
  });

  // Initialize display values from initialData
  useEffect(() => {
    if (initialData) {
      setTimeInput(formatTimeDisplay(initialData.timeSeconds));
      if (initialData.splitSeconds) {
        setSplitInput(formatTimeDisplay(initialData.splitSeconds));
      }
      if (initialData.watts) {
        setWattsInput(initialData.watts.toFixed(0));
      }
    }
  }, [initialData]);

  // Watch form fields for auto-calculation and smart defaults
  const athleteId = watch('athleteId');
  const testType = watch('testType');
  const timeSeconds = watch('timeSeconds');
  const distanceM = watch('distanceM');

  // Pre-fill weight from athlete profile when athlete is selected
  useEffect(() => {
    if (athleteId && !isEditMode) {
      const selectedAthlete = athletes.find((a) => a.id === athleteId);
      if (selectedAthlete?.weightKg) {
        setValue('weightKg', selectedAthlete.weightKg);
      }
    }
  }, [athleteId, athletes, isEditMode, setValue]);

  // Update distance when test type changes (only for new tests)
  useEffect(() => {
    if (!isEditMode && testType) {
      const defaultDistance = TEST_TYPE_DISTANCES[testType];
      if (defaultDistance > 0) {
        setValue('distanceM', defaultDistance);
      }
    }
  }, [testType, isEditMode, setValue]);

  // Auto-calculate split and watts from time when time changes
  useEffect(() => {
    if (timeSeconds > 0 && distanceM && distanceM > 0 && timeInput) {
      const calculatedSplit = timeToSplit(timeSeconds, distanceM);
      if (calculatedSplit > 0 && !splitInput) {
        setSplitInput(formatTimeDisplay(calculatedSplit));
        setValue('splitSeconds', calculatedSplit);
        
        // Also calculate watts from the split
        const calculatedWatts = splitToWatts(calculatedSplit);
        setWattsInput(calculatedWatts.toFixed(0));
        setValue('watts', calculatedWatts);
      }
    }
  }, [timeSeconds, distanceM, timeInput, splitInput, setValue]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTimeInput(value);
    const seconds = parseTimeInput(value);
    setValue('timeSeconds', seconds);
    
    // Clear split and watts to trigger auto-calculation
    setSplitInput('');
    setWattsInput('');
  };

  const handleSplitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSplitInput(value);
    setWattsInput(''); // Clear watts to trigger recalc
    const seconds = parseTimeInput(value);
    setValue('splitSeconds', seconds);
    
    // Auto-calculate watts from split
    if (seconds > 0) {
      const calculatedWatts = splitToWatts(seconds);
      setWattsInput(calculatedWatts.toFixed(0));
      setValue('watts', calculatedWatts);
    }
  };

  const handleWattsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWattsInput(value);
    setSplitInput(''); // Clear split to trigger recalc
    const wattsNum = parseFloat(value);
    setValue('watts', wattsNum || undefined);
    
    // Auto-calculate split from watts
    if (wattsNum > 0) {
      const calculatedSplit = wattsToSplit(wattsNum);
      setSplitInput(formatTimeDisplay(calculatedSplit));
      setValue('splitSeconds', calculatedSplit);
    }
  };

  const handleFormSubmit = (data: ErgTestFormData) => {
    // Clean up optional fields
    const payload = {
      ...data,
      distanceM: data.distanceM || null,
      splitSeconds: data.splitSeconds || null,
      watts: data.watts || null,
      strokeRate: data.strokeRate || null,
      weightKg: data.weightKg || null,
      notes: data.notes || null,
    };

    onSubmit(payload as any);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Athlete selection */}
      <div>
        <label htmlFor="athleteId" className="block text-sm font-medium text-txt-primary mb-1">
          Athlete *
        </label>
        <select
          id="athleteId"
          {...register('athleteId')}
          disabled={isEditMode || isSubmitting}
          className="w-full px-3 py-2 bg-bg-surface border border-bdr-default rounded-md text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select athlete...</option>
          {athletes.map((athlete) => (
            <option key={athlete.id} value={athlete.id}>
              {athlete.firstName} {athlete.lastName}
            </option>
          ))}
        </select>
        {errors.athleteId && (
          <p className="mt-1 text-sm text-status-error">{errors.athleteId.message}</p>
        )}
      </div>

      {/* Test type and date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="testType" className="block text-sm font-medium text-txt-primary mb-1">
            Test Type *
          </label>
          <select
            id="testType"
            {...register('testType')}
            disabled={isSubmitting}
            className="w-full px-3 py-2 bg-bg-surface border border-bdr-default rounded-md text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary disabled:opacity-50"
          >
            {TEST_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.testType && (
            <p className="mt-1 text-sm text-status-error">{errors.testType.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="testDate" className="block text-sm font-medium text-txt-primary mb-1">
            Test Date *
          </label>
          <input
            id="testDate"
            type="date"
            {...register('testDate')}
            disabled={isSubmitting}
            className="w-full px-3 py-2 bg-bg-surface border border-bdr-default rounded-md text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary disabled:opacity-50"
          />
          {errors.testDate && (
            <p className="mt-1 text-sm text-status-error">{errors.testDate.message}</p>
          )}
        </div>
      </div>

      {/* Time */}
      <div>
        <label htmlFor="timeSeconds" className="block text-sm font-medium text-txt-primary mb-1">
          Time * <span className="text-txt-tertiary text-xs">(MM:SS.s or seconds) — auto-calculates split & watts</span>
        </label>
        <input
          id="timeSeconds"
          type="text"
          value={timeInput}
          onChange={handleTimeChange}
          disabled={isSubmitting}
          placeholder="6:30.5"
          className="w-full px-3 py-2 bg-bg-surface border border-bdr-default rounded-md text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary disabled:opacity-50"
        />
        {errors.timeSeconds && (
          <p className="mt-1 text-sm text-status-error">{errors.timeSeconds.message}</p>
        )}
      </div>

      {/* Split and Watts (auto-calculated) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="splitSeconds" className="block text-sm font-medium text-txt-primary mb-1">
            Split/500m <span className="text-txt-tertiary text-xs">(auto-calculated)</span>
          </label>
          <input
            id="splitSeconds"
            type="text"
            value={splitInput}
            onChange={handleSplitChange}
            disabled={isSubmitting}
            placeholder="1:45.0"
            className="w-full px-3 py-2 bg-bg-surface border border-bdr-default rounded-md text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="watts" className="block text-sm font-medium text-txt-primary mb-1">
            Watts <span className="text-txt-tertiary text-xs">(auto-calculated)</span>
          </label>
          <input
            id="watts"
            type="number"
            value={wattsInput}
            onChange={handleWattsChange}
            disabled={isSubmitting}
            placeholder="250"
            className="w-full px-3 py-2 bg-bg-surface border border-bdr-default rounded-md text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary disabled:opacity-50"
          />
        </div>
      </div>

      {/* Distance and stroke rate */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="distanceM" className="block text-sm font-medium text-txt-primary mb-1">
            Distance (m)
          </label>
          <input
            id="distanceM"
            type="number"
            {...register('distanceM')}
            disabled={isSubmitting}
            placeholder="2000"
            className="w-full px-3 py-2 bg-bg-surface border border-bdr-default rounded-md text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="strokeRate" className="block text-sm font-medium text-txt-primary mb-1">
            Stroke Rate
          </label>
          <input
            id="strokeRate"
            type="number"
            {...register('strokeRate')}
            disabled={isSubmitting}
            placeholder="32"
            min="10"
            max="60"
            className="w-full px-3 py-2 bg-bg-surface border border-bdr-default rounded-md text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary disabled:opacity-50"
          />
        </div>
      </div>

      {/* Weight */}
      <div>
        <label htmlFor="weightKg" className="block text-sm font-medium text-txt-primary mb-1">
          Weight (kg) <span className="text-txt-tertiary text-xs">(optional, auto-filled from profile)</span>
        </label>
        <input
          id="weightKg"
          type="number"
          {...register('weightKg')}
          disabled={isSubmitting}
          placeholder="75"
          className="w-full px-3 py-2 bg-bg-surface border border-bdr-default rounded-md text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary disabled:opacity-50"
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-txt-primary mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          {...register('notes')}
          disabled={isSubmitting}
          rows={3}
          placeholder="Additional notes..."
          className="w-full px-3 py-2 bg-bg-surface border border-bdr-default rounded-md text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary disabled:opacity-50 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-txt-secondary hover:text-txt-primary transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-interactive-primary text-white rounded-md hover:bg-interactive-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : isEditMode ? 'Update Test' : 'Create Test'}
        </button>
      </div>
    </form>
  );
}

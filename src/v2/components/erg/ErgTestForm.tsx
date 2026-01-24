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

// Validation schema
const ergTestSchema = z.object({
  athleteId: z.string().min(1, 'Athlete is required'),
  testType: z.enum(['2k', '6k', '30min', '500m'] as const, {
    errorMap: () => ({ message: 'Invalid test type' }),
  }),
  testDate: z.string().min(1, 'Test date is required'),
  timeSeconds: z.coerce.number().positive('Time must be positive'),
  distanceM: z.coerce.number().positive().nullable().optional(),
  splitSeconds: z.coerce.number().positive().nullable().optional(),
  watts: z.coerce.number().positive().nullable().optional(),
  strokeRate: z.coerce.number().min(10).max(60).nullable().optional(),
  weightKg: z.coerce.number().positive().max(300).nullable().optional(),
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
 * Calculate split from watts
 */
function wattsToSplit(watts: number): number {
  return Math.pow(2.80 / watts, 1 / 3);
}

/**
 * Calculate watts from split
 */
function splitToWatts(splitSeconds: number): number {
  return 2.80 / Math.pow(splitSeconds, 3);
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
    reset,
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
      : undefined,
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

  // Watch split and watts for auto-calculation
  const splitSeconds = watch('splitSeconds');
  const watts = watch('watts');

  // Auto-calculate watts from split
  useEffect(() => {
    if (splitInput && !wattsInput) {
      const split = parseTimeInput(splitInput);
      if (split > 0) {
        const calculatedWatts = splitToWatts(split);
        setWattsInput(calculatedWatts.toFixed(0));
        setValue('watts', calculatedWatts);
      }
    }
  }, [splitInput, wattsInput, setValue]);

  // Auto-calculate split from watts
  useEffect(() => {
    if (wattsInput && !splitInput) {
      const wattsNum = parseFloat(wattsInput);
      if (wattsNum > 0) {
        const calculatedSplit = wattsToSplit(wattsNum);
        setSplitInput(formatTimeDisplay(calculatedSplit));
        setValue('splitSeconds', calculatedSplit);
      }
    }
  }, [wattsInput, splitInput, setValue]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTimeInput(value);
    const seconds = parseTimeInput(value);
    setValue('timeSeconds', seconds);
  };

  const handleSplitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSplitInput(value);
    setWattsInput(''); // Clear watts to trigger recalc
    const seconds = parseTimeInput(value);
    setValue('splitSeconds', seconds);
  };

  const handleWattsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWattsInput(value);
    setSplitInput(''); // Clear split to trigger recalc
    setValue('watts', parseFloat(value) || undefined);
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
          <p className="mt-1 text-sm text-red-600">{errors.athleteId.message}</p>
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
            <p className="mt-1 text-sm text-red-600">{errors.testType.message}</p>
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
            <p className="mt-1 text-sm text-red-600">{errors.testDate.message}</p>
          )}
        </div>
      </div>

      {/* Time */}
      <div>
        <label htmlFor="timeSeconds" className="block text-sm font-medium text-txt-primary mb-1">
          Time * <span className="text-txt-tertiary text-xs">(MM:SS.s or seconds)</span>
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
          <p className="mt-1 text-sm text-red-600">{errors.timeSeconds.message}</p>
        )}
      </div>

      {/* Split and Watts (auto-calculated) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="splitSeconds" className="block text-sm font-medium text-txt-primary mb-1">
            Split/500m <span className="text-txt-tertiary text-xs">(MM:SS.s)</span>
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
            Watts <span className="text-txt-tertiary text-xs">(auto from split)</span>
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
          Weight (kg)
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

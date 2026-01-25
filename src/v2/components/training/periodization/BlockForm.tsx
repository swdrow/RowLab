// src/v2/components/training/periodization/BlockForm.tsx

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO, differenceInWeeks } from 'date-fns';
import { getPeriodizationColor } from '../../../utils/calendarHelpers';
import type { PeriodizationBlock, PeriodizationPhase } from '../../../types/training';

// Phase guidelines for validation
const PHASE_GUIDELINES: Record<PeriodizationPhase, { minWeeks: number; maxWeeks: number; description: string }> = {
  base: { minWeeks: 6, maxWeeks: 12, description: 'Build aerobic foundation and technique' },
  build: { minWeeks: 4, maxWeeks: 8, description: 'Increase intensity and race-specific work' },
  peak: { minWeeks: 2, maxWeeks: 4, description: 'Race-specific high intensity training' },
  taper: { minWeeks: 1, maxWeeks: 2, description: 'Reduce volume, maintain intensity' },
};

const blockSchema = z.object({
  name: z.string().min(1, 'Block name is required').max(50),
  phase: z.enum(['base', 'build', 'peak', 'taper']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  weeklyTSSTarget: z.number().min(0).max(2000).optional(),
  focusAreas: z.array(z.string()).default([]),
  color: z.string().optional(),
}).refine(
  (data) => {
    const start = parseISO(data.startDate);
    const end = parseISO(data.endDate);
    return end > start;
  },
  { message: 'End date must be after start date', path: ['endDate'] }
);

type BlockFormValues = z.infer<typeof blockSchema>;

interface BlockFormProps {
  block?: PeriodizationBlock;
  initialStartDate?: Date;
  onSubmit: (data: Omit<PeriodizationBlock, 'id'> & { id?: string }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const focusAreaOptions = [
  'Aerobic Endurance',
  'Technique',
  'Power Development',
  'Race Pace',
  'Sprint Work',
  'Recovery',
  'Strength',
  'Mental Preparation',
];

/**
 * Form for creating and editing periodization blocks.
 */
export function BlockForm({
  block,
  initialStartDate,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: BlockFormProps) {
  const isEditing = !!block;

  const defaultValues: BlockFormValues = {
    name: block?.name || '',
    phase: block?.phase || 'base',
    startDate: block?.startDate || (initialStartDate ? format(initialStartDate, 'yyyy-MM-dd') : ''),
    endDate: block?.endDate || '',
    weeklyTSSTarget: block?.weeklyTSSTarget,
    focusAreas: block?.focusAreas || [],
    color: block?.color,
  };

  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<BlockFormValues>({
    resolver: zodResolver(blockSchema),
    defaultValues,
  });

  const watchPhase = watch('phase');
  const watchStartDate = watch('startDate');
  const watchEndDate = watch('endDate');

  // Calculate block duration
  const blockWeeks = watchStartDate && watchEndDate
    ? differenceInWeeks(parseISO(watchEndDate), parseISO(watchStartDate))
    : 0;

  const guidelines = PHASE_GUIDELINES[watchPhase];

  // Check if duration is within guidelines
  const isDurationValid = blockWeeks >= guidelines.minWeeks && blockWeeks <= guidelines.maxWeeks;

  const handleFormSubmit = (data: BlockFormValues) => {
    onSubmit({
      ...data,
      id: block?.id,
      color: data.color || getPeriodizationColor(data.phase),
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-txt-primary mb-1">
            Block Name *
          </label>
          <input
            id="name"
            {...register('name')}
            className="w-full px-3 py-2 bg-surface-default border border-bdr-default rounded-md
                       text-txt-primary placeholder:text-txt-tertiary
                       focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
            placeholder="e.g., Spring Base Phase"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-accent-destructive">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="phase" className="block text-sm font-medium text-txt-primary mb-1">
            Phase Type *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(['base', 'build', 'peak', 'taper'] as PeriodizationPhase[]).map((phase) => (
              <label
                key={phase}
                className={`relative flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer
                           transition-all ${
                             watchPhase === phase
                               ? 'border-accent-primary bg-accent-primary/10'
                               : 'border-bdr-default hover:border-bdr-default/80'
                           }`}
              >
                <input
                  type="radio"
                  {...register('phase')}
                  value={phase}
                  className="sr-only"
                />
                <div className="text-center">
                  <div
                    className="w-6 h-6 rounded-full mx-auto mb-1"
                    style={{ backgroundColor: getPeriodizationColor(phase) }}
                  />
                  <span className="text-sm font-medium text-txt-primary capitalize">{phase}</span>
                </div>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-txt-tertiary">{guidelines.description}</p>
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-txt-primary mb-1">
            Start Date *
          </label>
          <input
            id="startDate"
            type="date"
            {...register('startDate')}
            className="w-full px-3 py-2 bg-surface-default border border-bdr-default rounded-md
                       text-txt-primary
                       focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-accent-destructive">{errors.startDate.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-txt-primary mb-1">
            End Date *
          </label>
          <input
            id="endDate"
            type="date"
            {...register('endDate')}
            className="w-full px-3 py-2 bg-surface-default border border-bdr-default rounded-md
                       text-txt-primary
                       focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-accent-destructive">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      {/* Duration indicator */}
      {blockWeeks > 0 && (
        <div className={`p-3 rounded-lg ${isDurationValid ? 'bg-accent-success/10' : 'bg-accent-warning/10'}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-txt-primary">
              Duration: <span className="font-semibold">{blockWeeks} weeks</span>
            </span>
            <span className={`text-xs ${isDurationValid ? 'text-accent-success' : 'text-accent-warning'}`}>
              Recommended: {guidelines.minWeeks}-{guidelines.maxWeeks} weeks
            </span>
          </div>
        </div>
      )}

      {/* TSS Target */}
      <div>
        <label htmlFor="weeklyTSSTarget" className="block text-sm font-medium text-txt-primary mb-1">
          Weekly TSS Target (optional)
        </label>
        <input
          id="weeklyTSSTarget"
          type="number"
          min={0}
          max={2000}
          {...register('weeklyTSSTarget', { valueAsNumber: true })}
          className="w-full px-3 py-2 bg-surface-default border border-bdr-default rounded-md
                     text-txt-primary placeholder:text-txt-tertiary
                     focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
          placeholder="e.g., 500"
        />
        <p className="mt-1 text-xs text-txt-tertiary">
          Target Training Stress Score per week for this phase
        </p>
      </div>

      {/* Focus Areas */}
      <div>
        <label className="block text-sm font-medium text-txt-primary mb-2">
          Focus Areas
        </label>
        <Controller
          control={control}
          name="focusAreas"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {focusAreaOptions.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => {
                    const current = field.value || [];
                    if (current.includes(area)) {
                      field.onChange(current.filter((a) => a !== area));
                    } else {
                      field.onChange([...current, area]);
                    }
                  }}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors
                    ${(field.value || []).includes(area)
                      ? 'bg-accent-primary text-white border-accent-primary'
                      : 'bg-surface-default text-txt-secondary border-bdr-default hover:border-accent-primary'
                    }`}
                >
                  {area}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-bdr-default">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-txt-secondary
                     hover:text-txt-primary transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-accent-primary
                     rounded-md hover:bg-accent-primary-hover
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Block' : 'Create Block'}
        </button>
      </div>
    </form>
  );
}

export default BlockForm;

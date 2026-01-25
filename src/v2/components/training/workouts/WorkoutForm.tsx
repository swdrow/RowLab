// src/v2/components/training/workouts/WorkoutForm.tsx

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { ExerciseFieldArray } from './ExerciseFieldArray';
import { estimateTSSFromPlan } from '../../../utils/tssCalculator';
import type { WorkoutFormData, WorkoutType, IntensityLevel, PlannedWorkout } from '../../../types/training';

// Validation schema
const exerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name required'),
  sets: z.number().min(1).max(20).optional(),
  reps: z.number().min(1).max(100).optional(),
  duration: z.number().min(0).optional(),
  intensity: z.string().optional(),
  notes: z.string().optional(),
});

const workoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required').max(100),
  type: z.enum(['erg', 'row', 'cross_train', 'strength', 'recovery']),
  description: z.string().max(500).optional(),
  scheduledDate: z.string().optional(),
  duration: z.number().min(1).max(480).optional(), // minutes
  distance: z.number().min(0).optional(),
  targetPace: z.number().min(60).max(180).optional(), // seconds per 500m
  targetHeartRate: z.number().min(60).max(220).optional(),
  intensity: z.enum(['easy', 'moderate', 'hard', 'max']).optional(),
  exercises: z.array(exerciseSchema).optional(),
  estimatedTSS: z.number().optional(),
});

type WorkoutFormValues = z.infer<typeof workoutSchema>;

interface WorkoutFormProps {
  workout?: PlannedWorkout;
  planId: string;
  initialDate?: Date;
  onSubmit: (data: WorkoutFormData & { planId: string }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const workoutTypeOptions: { value: WorkoutType; label: string; description: string }[] = [
  { value: 'erg', label: 'Erg', description: 'Indoor rowing machine workout' },
  { value: 'row', label: 'On-Water', description: 'Rowing on the water' },
  { value: 'cross_train', label: 'Cross-Train', description: 'Cycling, running, etc.' },
  { value: 'strength', label: 'Strength', description: 'Weight training' },
  { value: 'recovery', label: 'Recovery', description: 'Active recovery or rest' },
];

const intensityOptions: { value: IntensityLevel; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'hard', label: 'Hard' },
  { value: 'max', label: 'Max' },
];

/**
 * Form for creating and editing workouts.
 * Uses react-hook-form with Zod validation.
 */
export function WorkoutForm({
  workout,
  planId,
  initialDate,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: WorkoutFormProps) {
  const isEditing = !!workout;

  const defaultValues: WorkoutFormValues = {
    name: workout?.name || '',
    type: (workout?.type as WorkoutType) || 'row',
    description: workout?.description || '',
    scheduledDate: workout?.scheduledDate
      ? format(parseISO(workout.scheduledDate), "yyyy-MM-dd'T'HH:mm")
      : initialDate
        ? format(initialDate, "yyyy-MM-dd'T'HH:mm")
        : '',
    duration: workout?.duration ? Math.round(workout.duration / 60) : undefined, // Convert to minutes
    distance: workout?.distance || undefined,
    targetPace: workout?.targetPace || undefined,
    targetHeartRate: workout?.targetHeartRate || undefined,
    intensity: (workout?.intensity as IntensityLevel) || undefined,
    exercises: workout?.exercises?.map(e => ({
      name: e.name,
      sets: e.sets,
      reps: e.reps,
      duration: e.duration,
      intensity: e.intensity,
      notes: e.notes || '',
    })) || [],
    estimatedTSS: workout?.estimatedTSS || undefined,
  };

  const methods = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutSchema),
    defaultValues,
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = methods;

  const watchDuration = watch('duration');
  const watchIntensity = watch('intensity');

  // Auto-calculate estimated TSS when duration/intensity changes
  React.useEffect(() => {
    if (watchDuration && watchIntensity) {
      const tss = estimateTSSFromPlan(watchDuration, watchIntensity);
      setValue('estimatedTSS', tss);
    }
  }, [watchDuration, watchIntensity, setValue]);

  const handleFormSubmit = (data: WorkoutFormValues) => {
    onSubmit({
      ...data,
      planId,
      duration: data.duration ? data.duration * 60 : undefined, // Convert back to seconds
    });
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-txt-primary mb-1">
              Workout Name *
            </label>
            <input
              id="name"
              {...register('name')}
              className="w-full px-3 py-2 bg-surface-default border border-bdr-default rounded-md
                         text-txt-primary placeholder:text-txt-tertiary
                         focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
              placeholder="e.g., Morning 2k Test"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-accent-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-txt-primary mb-1">
                Type *
              </label>
              <select
                id="type"
                {...register('type')}
                className="w-full px-3 py-2 bg-surface-default border border-bdr-default rounded-md
                           text-txt-primary
                           focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
              >
                {workoutTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="scheduledDate" className="block text-sm font-medium text-txt-primary mb-1">
                Scheduled Date & Time
              </label>
              <input
                id="scheduledDate"
                type="datetime-local"
                {...register('scheduledDate')}
                className="w-full px-3 py-2 bg-surface-default border border-bdr-default rounded-md
                           text-txt-primary
                           focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-txt-primary mb-1">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={2}
              className="w-full px-3 py-2 bg-surface-default border border-bdr-default rounded-md
                         text-txt-primary placeholder:text-txt-tertiary resize-none
                         focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
              placeholder="Workout details and notes..."
            />
          </div>
        </div>

        {/* Targets */}
        <div>
          <h3 className="text-sm font-medium text-txt-primary mb-3">Targets</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="duration" className="block text-xs text-txt-secondary mb-1">
                Duration (min)
              </label>
              <input
                id="duration"
                type="number"
                min={1}
                max={480}
                {...register('duration', { valueAsNumber: true })}
                className="w-full px-3 py-2 bg-surface-default border border-bdr-default rounded-md
                           text-txt-primary text-center
                           focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="distance" className="block text-xs text-txt-secondary mb-1">
                Distance (m)
              </label>
              <input
                id="distance"
                type="number"
                min={0}
                {...register('distance', { valueAsNumber: true })}
                className="w-full px-3 py-2 bg-surface-default border border-bdr-default rounded-md
                           text-txt-primary text-center
                           focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="targetPace" className="block text-xs text-txt-secondary mb-1">
                Target Pace (s/500m)
              </label>
              <input
                id="targetPace"
                type="number"
                min={60}
                max={180}
                step={0.1}
                {...register('targetPace', { valueAsNumber: true })}
                className="w-full px-3 py-2 bg-surface-default border border-bdr-default rounded-md
                           text-txt-primary text-center
                           focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="intensity" className="block text-xs text-txt-secondary mb-1">
                Intensity
              </label>
              <select
                id="intensity"
                {...register('intensity')}
                className="w-full px-3 py-2 bg-surface-default border border-bdr-default rounded-md
                           text-txt-primary
                           focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
              >
                <option value="">--</option>
                {intensityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Estimated TSS */}
          <div className="mt-3 p-3 bg-surface-sunken rounded-lg flex items-center justify-between">
            <span className="text-sm text-txt-secondary">Estimated TSS:</span>
            <span className="text-lg font-semibold text-txt-primary">
              {watch('estimatedTSS') || '--'}
            </span>
          </div>
        </div>

        {/* Exercises */}
        <ExerciseFieldArray />

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
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Workout' : 'Create Workout'}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}

export default WorkoutForm;

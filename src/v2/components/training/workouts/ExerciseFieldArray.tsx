// src/v2/components/training/workouts/ExerciseFieldArray.tsx

import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import type { WorkoutFormData } from '../../../types/training';

interface ExerciseFieldArrayProps {
  className?: string;
}

const intensityOptions: { value: string; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'hard', label: 'Hard' },
  { value: 'max', label: 'Max' },
];

/**
 * Dynamic exercise list for workout form.
 * Uses react-hook-form useFieldArray for proper form state management.
 */
export function ExerciseFieldArray({ className = '' }: ExerciseFieldArrayProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<WorkoutFormData>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'exercises',
  });

  const addExercise = () => {
    append({
      name: '',
      sets: 1,
      reps: undefined,
      duration: undefined,
      intensity: undefined,
      notes: '',
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-txt-primary">Exercises</label>
        <button
          type="button"
          onClick={addExercise}
          className="flex items-center gap-1 px-2 py-1 text-sm font-medium
                     text-interactive-primary hover:text-interactive-hover
                     transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Exercise
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-6 text-txt-tertiary text-sm border border-dashed border-bdr-default rounded-lg">
          No exercises added. Click "Add Exercise" to begin.
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="p-4 bg-bg-surface-elevated rounded-lg border border-bdr-default"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <input
                    {...register(`exercises.${index}.name` as const)}
                    placeholder="Exercise name"
                    className="w-full px-3 py-2 bg-bg-surface border border-bdr-default rounded-md
                               text-txt-primary placeholder:text-txt-tertiary
                               focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent"
                  />
                  {errors.exercises?.[index]?.name && (
                    <p className="mt-1 text-xs text-data-poor">
                      {errors.exercises[index]?.name?.message}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-1.5 text-txt-tertiary hover:text-data-poor transition-colors"
                  aria-label="Remove exercise"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Sets */}
                <div>
                  <label className="block text-xs text-txt-secondary mb-1">Sets</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    {...register(`exercises.${index}.sets` as const, { valueAsNumber: true })}
                    className="w-full px-3 py-2 bg-bg-surface border border-bdr-default rounded-md
                               text-txt-primary text-center font-mono
                               focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent"
                  />
                </div>

                {/* Reps */}
                <div>
                  <label className="block text-xs text-txt-secondary mb-1">Reps</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    placeholder="--"
                    {...register(`exercises.${index}.reps` as const, { valueAsNumber: true })}
                    className="w-full px-3 py-2 bg-bg-surface border border-bdr-default rounded-md
                               text-txt-primary text-center font-mono placeholder:text-txt-tertiary
                               focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent"
                  />
                </div>

                {/* Duration (seconds) */}
                <div>
                  <label className="block text-xs text-txt-secondary mb-1">Duration (sec)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="--"
                    {...register(`exercises.${index}.duration` as const, { valueAsNumber: true })}
                    className="w-full px-3 py-2 bg-bg-surface border border-bdr-default rounded-md
                               text-txt-primary text-center font-mono placeholder:text-txt-tertiary
                               focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent"
                  />
                </div>

                {/* Intensity */}
                <div>
                  <label className="block text-xs text-txt-secondary mb-1">Intensity</label>
                  <select
                    {...register(`exercises.${index}.intensity` as const)}
                    className="w-full px-3 py-2 bg-bg-surface border border-bdr-default rounded-md
                               text-txt-primary
                               focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent"
                  >
                    <option value="">--</option>
                    {intensityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="mt-3">
                <input
                  {...register(`exercises.${index}.notes` as const)}
                  placeholder="Notes (optional)"
                  className="w-full px-3 py-2 bg-bg-surface border border-bdr-default rounded-md
                             text-txt-primary placeholder:text-txt-tertiary text-sm
                             focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExerciseFieldArray;

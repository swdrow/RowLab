// src/v2/components/training/periodization/TemplateApplicator.tsx

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import type { TrainingPlan, PlannedWorkout } from '../../../types/training';

const applyTemplateSchema = z.object({
  templateId: z.string().min(1, 'Select a template'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  replaceExisting: z.boolean().default(false),
}).refine(
  (data) => parseISO(data.endDate) > parseISO(data.startDate),
  { message: 'End date must be after start date', path: ['endDate'] }
);

type ApplyTemplateValues = z.infer<typeof applyTemplateSchema>;

interface TemplateApplicatorProps {
  templates: TrainingPlan[];
  existingWorkouts?: PlannedWorkout[];
  onApply: (data: {
    templateId: string;
    startDate: Date;
    endDate: Date;
    replaceExisting: boolean;
  }) => void;
  onCancel: () => void;
  isApplying?: boolean;
}

/**
 * Component for applying workout templates to a date range.
 * Shows preview of conflicts with existing workouts.
 */
export function TemplateApplicator({
  templates,
  existingWorkouts = [],
  onApply,
  onCancel,
  isApplying = false,
}: TemplateApplicatorProps) {
  const [showConflicts, setShowConflicts] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ApplyTemplateValues>({
    resolver: zodResolver(applyTemplateSchema),
    defaultValues: {
      templateId: '',
      startDate: '',
      endDate: '',
      replaceExisting: false,
    },
  });

  const watchTemplateId = watch('templateId');
  const watchStartDate = watch('startDate');
  const watchEndDate = watch('endDate');

  const selectedTemplate = templates.find((t) => t.id === watchTemplateId);

  // Find conflicting workouts in the date range
  const conflicts = React.useMemo(() => {
    if (!watchStartDate || !watchEndDate) return [];

    const start = parseISO(watchStartDate);
    const end = parseISO(watchEndDate);
    const days = eachDayOfInterval({ start, end });
    const dateSet = new Set(days.map((d) => format(d, 'yyyy-MM-dd')));

    return existingWorkouts.filter((w) => {
      if (!w.scheduledDate) return false;
      const workoutDate = format(parseISO(w.scheduledDate), 'yyyy-MM-dd');
      return dateSet.has(workoutDate);
    });
  }, [watchStartDate, watchEndDate, existingWorkouts]);

  const handleFormSubmit = (data: ApplyTemplateValues) => {
    onApply({
      templateId: data.templateId,
      startDate: parseISO(data.startDate),
      endDate: parseISO(data.endDate),
      replaceExisting: data.replaceExisting,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Template Selection */}
      <div>
        <label htmlFor="templateId" className="block text-sm font-medium text-txt-primary mb-1">
          Select Template *
        </label>
        <select
          id="templateId"
          {...register('templateId')}
          className="w-full px-3 py-2 bg-surface-default border border-bdr-default rounded-md
                     text-txt-primary
                     focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
        >
          <option value="">Choose a template...</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
              {template.phase && ` (${template.phase})`}
            </option>
          ))}
        </select>
        {errors.templateId && (
          <p className="mt-1 text-sm text-accent-destructive">{errors.templateId.message}</p>
        )}
      </div>

      {/* Template Preview */}
      {selectedTemplate && (
        <div className="p-4 bg-surface-elevated rounded-lg border border-bdr-default">
          <h4 className="text-sm font-medium text-txt-primary mb-2">{selectedTemplate.name}</h4>
          {selectedTemplate.description && (
            <p className="text-sm text-txt-tertiary mb-2">{selectedTemplate.description}</p>
          )}
          <div className="text-xs text-txt-secondary">
            {selectedTemplate.workouts?.length || 0} workouts in template
          </div>
        </div>
      )}

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-txt-primary mb-1">
            Apply From *
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
            Apply To *
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

      {/* Conflict Warning */}
      {conflicts.length > 0 && (
        <div className="p-4 bg-accent-warning/10 border border-accent-warning/30 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-medium text-accent-warning">
                {conflicts.length} existing workout{conflicts.length > 1 ? 's' : ''} in this range
              </h4>
              <p className="text-xs text-txt-secondary mt-1">
                Choose how to handle existing workouts
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowConflicts(!showConflicts)}
              className="text-xs text-accent-primary hover:underline"
            >
              {showConflicts ? 'Hide' : 'Show'} details
            </button>
          </div>

          {showConflicts && (
            <ul className="mt-3 space-y-1">
              {conflicts.slice(0, 5).map((workout) => (
                <li key={workout.id} className="text-xs text-txt-secondary flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent-warning rounded-full" />
                  {workout.name} - {workout.scheduledDate && format(parseISO(workout.scheduledDate), 'MMM d')}
                </li>
              ))}
              {conflicts.length > 5 && (
                <li className="text-xs text-txt-tertiary">
                  ...and {conflicts.length - 5} more
                </li>
              )}
            </ul>
          )}

          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('replaceExisting')}
              className="w-4 h-4 rounded border-bdr-default bg-surface-default
                         text-accent-primary focus:ring-accent-primary focus:ring-offset-0"
            />
            <span className="text-sm text-txt-primary">Replace existing workouts</span>
          </label>
        </div>
      )}

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
          disabled={isApplying || !watchTemplateId}
          className="px-4 py-2 text-sm font-medium text-white bg-accent-primary
                     rounded-md hover:bg-accent-primary-hover
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          {isApplying ? 'Applying...' : 'Apply Template'}
        </button>
      </div>
    </form>
  );
}

export default TemplateApplicator;

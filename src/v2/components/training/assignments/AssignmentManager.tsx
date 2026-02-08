// src/v2/components/training/assignments/AssignmentManager.tsx

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO, addWeeks } from 'date-fns';
import { useAthletes } from '../../../hooks/useAthletes';
import { useTrainingPlans } from '../../../hooks/useTrainingPlans';
import { useCreateAssignment, useAssignments } from '../../../hooks/useAssignments';
import type { TrainingPlan, WorkoutAssignment } from '../../../types/training';

const assignmentSchema = z.object({
  planId: z.string().min(1, 'Select a training plan'),
  athleteIds: z.array(z.string()).min(1, 'Select at least one athlete'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

interface AssignmentManagerProps {
  plan?: TrainingPlan;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * Interface for coaches to assign training plans to athletes or groups.
 */
export function AssignmentManager({
  plan,
  onSuccess,
  onCancel,
  className = '',
}: AssignmentManagerProps) {
  const [selectAll, setSelectAll] = useState(false);

  const { athletes, isLoading: loadingAthletes } = useAthletes();
  const { plans, isLoading: loadingPlans } = useTrainingPlans();
  const { assignments: existingAssignments } = useAssignments(plan ? { planId: plan.id } : {});
  const { createAssignment, isCreating } = useCreateAssignment();

  const defaultStartDate = format(new Date(), 'yyyy-MM-dd');
  const defaultEndDate = plan?.endDate || format(addWeeks(new Date(), 4), 'yyyy-MM-dd');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      planId: plan?.id || '',
      athleteIds: [],
      startDate: plan?.startDate || defaultStartDate,
      endDate: defaultEndDate,
    },
  });

  const watchAthleteIds = watch('athleteIds');
  const watchPlanId = watch('planId');

  const selectedPlan = plan || plans.find((p) => p.id === watchPlanId);

  // Get athletes already assigned to this plan
  const assignedAthleteIds = new Set(
    existingAssignments.filter((a) => a.status === 'active').map((a) => a.athleteId)
  );

  // Handle select all toggle
  const handleSelectAll = () => {
    if (selectAll) {
      setValue('athleteIds', []);
    } else {
      const availableIds = athletes.filter((a) => !assignedAthleteIds.has(a.id)).map((a) => a.id);
      setValue('athleteIds', availableIds);
    }
    setSelectAll(!selectAll);
  };

  const handleFormSubmit = (data: AssignmentFormValues) => {
    createAssignment(
      {
        planId: data.planId,
        athleteIds: data.athleteIds,
        startDate: parseISO(data.startDate),
        endDate: data.endDate ? parseISO(data.endDate) : undefined,
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      }
    );
  };

  const isLoading = loadingAthletes || loadingPlans;

  return (
    <div className={`assignment-manager ${className}`}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Plan Selection (if not pre-selected) */}
        {!plan && (
          <div>
            <label htmlFor="planId" className="block text-sm font-medium text-txt-primary mb-1">
              Training Plan *
            </label>
            <select
              id="planId"
              {...register('planId')}
              className="w-full px-3 py-2 bg-bg-surface border border-bdr-default rounded-md
                         text-txt-primary
                         focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent"
            >
              <option value="">Select a plan...</option>
              {plans
                .filter((p) => !p.isTemplate)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
            {errors.planId && (
              <p className="mt-1 text-sm text-data-poor">{errors.planId.message}</p>
            )}
          </div>
        )}

        {/* Selected Plan Info */}
        {selectedPlan && (
          <div className="p-4 bg-bg-surface-elevated rounded-lg border border-bdr-default">
            <h4 className="font-medium text-txt-primary">{selectedPlan.name}</h4>
            {selectedPlan.description && (
              <p className="text-sm text-txt-tertiary mt-1">{selectedPlan.description}</p>
            )}
            {selectedPlan.phase && (
              <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-interactive-primary/20 text-interactive-primary rounded">
                {selectedPlan.phase}
              </span>
            )}
          </div>
        )}

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
              className="w-full px-3 py-2 bg-bg-surface border border-bdr-default rounded-md
                         text-txt-primary
                         focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent"
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-data-poor">{errors.startDate.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-txt-primary mb-1">
              End Date (optional)
            </label>
            <input
              id="endDate"
              type="date"
              {...register('endDate')}
              className="w-full px-3 py-2 bg-bg-surface border border-bdr-default rounded-md
                         text-txt-primary
                         focus:outline-none focus:ring-2 focus:ring-interactive-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Athlete Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-txt-primary">Assign to Athletes *</label>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-interactive-primary hover:text-interactive-primary-hover"
            >
              {selectAll ? 'Deselect All' : 'Select All Available'}
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-txt-tertiary">
              Loading athletes...
            </div>
          ) : (
            <Controller
              control={control}
              name="athleteIds"
              render={({ field }) => (
                <div className="max-h-64 overflow-y-auto border border-bdr-default rounded-lg divide-y divide-bdr-default">
                  {athletes.map((athlete) => {
                    const isAssigned = assignedAthleteIds.has(athlete.id);
                    const isSelected = (field.value || []).includes(athlete.id);

                    return (
                      <label
                        key={athlete.id}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer
                          ${isAssigned ? 'opacity-50 cursor-not-allowed' : 'hover:bg-bg-surface-elevated'}
                          ${isSelected ? 'bg-interactive-primary/10' : ''}`}
                      >
                        <input
                          type="checkbox"
                          disabled={isAssigned}
                          checked={isSelected}
                          onChange={(e) => {
                            const newValue = e.target.checked
                              ? [...(field.value || []), athlete.id]
                              : (field.value || []).filter((id) => id !== athlete.id);
                            field.onChange(newValue);
                          }}
                          className="w-4 h-4 rounded border-bdr-default bg-bg-surface
                                     text-interactive-primary focus:ring-interactive-primary focus:ring-offset-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-txt-primary truncate">
                            {athlete.name}
                          </div>
                          {athlete.side && (
                            <span
                              className={`text-xs ${
                                athlete.side === 'Port'
                                  ? 'text-data-poor'
                                  : athlete.side === 'Starboard'
                                    ? 'text-data-excellent'
                                    : 'text-txt-tertiary'
                              }`}
                            >
                              {athlete.side}
                            </span>
                          )}
                        </div>
                        {isAssigned && (
                          <span className="text-xs text-txt-tertiary">Already assigned</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            />
          )}

          {errors.athleteIds && (
            <p className="mt-1 text-sm text-data-poor">{errors.athleteIds.message}</p>
          )}

          <div className="mt-2 text-sm text-txt-secondary">
            {watchAthleteIds.length} athlete{watchAthleteIds.length !== 1 ? 's' : ''} selected
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-bdr-default">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-txt-secondary
                         hover:text-txt-primary transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isCreating || watchAthleteIds.length === 0}
            className="px-4 py-2 text-sm font-medium text-txt-inverse bg-interactive-primary
                       rounded-md hover:bg-interactive-primary-hover
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            {isCreating
              ? 'Assigning...'
              : `Assign to ${watchAthleteIds.length} Athlete${watchAthleteIds.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AssignmentManager;

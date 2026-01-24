import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sessionCreateSchema, type SessionCreateInput } from '@/v2/types/seatRacing';
import { useSessionWizard, WIZARD_STEPS } from '@/v2/hooks/useSessionWizard';
import { StepIndicator } from './StepIndicator';
import { SessionMetadataStep } from './SessionMetadataStep';
import { PieceManagerStep } from './PieceManagerStep';
import { AthleteAssignmentStep } from './AthleteAssignmentStep';

export interface SessionWizardProps {
  onComplete: (data: SessionCreateInput) => void | Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<SessionCreateInput>;
}

/**
 * Helper function to get fields to validate for each step
 */
function getStepFields(step: number): string[] {
  switch (step) {
    case 0: // Session metadata
      return ['date', 'boatClass'];
    case 1: // Pieces
      return ['pieces'];
    case 2: // Assignments (validated in Plan 05)
      return [];
    case 3: // Review (no validation)
      return [];
    default:
      return [];
  }
}

/**
 * Multi-step session creation wizard
 *
 * Steps:
 * 1. Session Info: Date, boat class, conditions, location
 * 2. Add Pieces: Create pieces with boats (Plan 04)
 * 3. Assign Athletes: Place athletes in seats (Plan 05)
 * 4. Review & Submit: Verify and create session (Plan 06)
 *
 * Features:
 * - Step-by-step validation
 * - Form state persistence across steps
 * - Click navigation to previously visited steps
 * - Visual progress indicator
 */
export function SessionWizard({ onComplete, onCancel, initialData }: SessionWizardProps) {
  const wizard = useSessionWizard();
  const methods = useForm<any>({
    // Note: Using 'any' here because the wizard form includes pieces/boats
    // which are not part of SessionCreateInput. The wizard transforms this
    // into proper API calls in the onComplete handler.
    defaultValues: initialData || {
      date: new Date().toISOString().split('T')[0],
      boatClass: '',
      conditions: null,
      location: '',
      description: '',
      pieces: [], // Empty array, user adds pieces in Step 2
    },
    mode: 'onChange', // Validate on change for step validation
  });

  const handleNext = async () => {
    // Validate current step fields before advancing
    const fieldsToValidate = getStepFields(wizard.step);

    if (fieldsToValidate.length > 0) {
      const isValid = await methods.trigger(fieldsToValidate);
      if (!isValid) {
        return; // Don't advance if validation fails
      }
    }

    wizard.nextStep();
  };

  const handleSubmit = methods.handleSubmit(async (data) => {
    wizard.setIsSubmitting(true);
    try {
      await onComplete(data);
    } finally {
      wizard.setIsSubmitting(false);
    }
  });

  // Step components
  const stepComponents = [
    <SessionMetadataStep key="metadata" />,
    <PieceManagerStep key="pieces" />,
    <AthleteAssignmentStep key="assignments" />,
    <div key="review" className="text-center text-txt-secondary py-8">
      <p className="text-lg">Step 4: Review & Submit</p>
      <p className="text-sm mt-2">Coming in Plan 06</p>
    </div>,
  ];

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step indicator */}
        <StepIndicator
          currentStep={wizard.step}
          steps={WIZARD_STEPS}
          maxReachable={wizard.maxStepReached}
          onStepClick={wizard.goToStep}
        />

        {/* Current step content */}
        <div className="min-h-[300px]">
          {stepComponents[wizard.step]}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-6 border-t border-bdr-default">
          <div>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={wizard.isSubmitting}
                className="px-4 py-2 text-txt-secondary hover:text-txt-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            )}
          </div>
          <div className="flex gap-3">
            {!wizard.isFirstStep && (
              <button
                type="button"
                onClick={wizard.prevStep}
                disabled={wizard.isSubmitting}
                className="px-4 py-2 bg-bg-surface border border-bdr-default text-txt-primary rounded-md hover:bg-bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
            )}
            {wizard.isLastStep ? (
              <button
                type="submit"
                disabled={wizard.isSubmitting}
                className="px-4 py-2 bg-interactive-primary text-white rounded-md hover:bg-interactive-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {wizard.isSubmitting ? 'Creating...' : 'Create Session'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={wizard.isSubmitting}
                className="px-4 py-2 bg-interactive-primary text-white rounded-md hover:bg-interactive-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

import { useState, useMemo } from 'react';

/**
 * Wizard step definitions
 */
export const WIZARD_STEPS = [
  { id: 0, name: 'Session Info', description: 'Date, boat class, conditions' },
  { id: 1, name: 'Add Pieces', description: 'Create pieces with boats' },
  { id: 2, name: 'Assign Athletes', description: 'Place athletes in seats' },
  { id: 3, name: 'Review & Submit', description: 'Verify and create session' },
] as const;

export type WizardStep = typeof WIZARD_STEPS[number];

export interface UseSessionWizardReturn {
  step: number;
  maxStepReached: number;
  isSubmitting: boolean;
  steps: typeof WIZARD_STEPS;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (n: number) => void;
  setIsSubmitting: (v: boolean) => void;
  reset: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoToStep: (n: number) => boolean;
}

/**
 * Hook for managing multi-step wizard state
 *
 * Manages:
 * - Current step index (0-3)
 * - Maximum step reached (for validation)
 * - Submission state
 * - Navigation between steps
 *
 * Note: This is independent of react-hook-form.
 * Form state is managed separately in the wizard container.
 */
export function useSessionWizard(): UseSessionWizardReturn {
  const [step, setStep] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextStep = () => {
    if (step < WIZARD_STEPS.length - 1) {
      const newStep = step + 1;
      setStep(newStep);
      // Update max step reached
      if (newStep > maxStepReached) {
        setMaxStepReached(newStep);
      }
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const goToStep = (n: number) => {
    // Can only go to steps that have been reached
    if (n >= 0 && n < WIZARD_STEPS.length && n <= maxStepReached) {
      setStep(n);
    }
  };

  const canGoToStep = (n: number): boolean => {
    return n >= 0 && n < WIZARD_STEPS.length && n <= maxStepReached;
  };

  const reset = () => {
    setStep(0);
    setMaxStepReached(0);
    setIsSubmitting(false);
  };

  const isFirstStep = useMemo(() => step === 0, [step]);
  const isLastStep = useMemo(() => step === WIZARD_STEPS.length - 1, [step]);

  return {
    step,
    maxStepReached,
    isSubmitting,
    steps: WIZARD_STEPS,
    nextStep,
    prevStep,
    goToStep,
    setIsSubmitting,
    reset,
    isFirstStep,
    isLastStep,
    canGoToStep,
  };
}

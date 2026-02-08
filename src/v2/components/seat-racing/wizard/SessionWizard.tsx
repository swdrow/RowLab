import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { sessionCreateSchema, type SessionCreateInput } from '@/v2/types/seatRacing';
import { useSessionWizard, WIZARD_STEPS } from '@/v2/hooks/useSessionWizard';
import {
  useCreateSession,
  useAddPiece,
  useAddBoat,
  useSetAssignments,
  useProcessSession,
} from '@/v2/hooks/useSeatRaceSessions';
import { SPRING_CONFIG } from '@/v2/utils/animations';
import { StepIndicator } from './StepIndicator';
import { SessionMetadataStep } from './SessionMetadataStep';
import { PiecesAndAthletesStep } from './PiecesAndAthletesStep';
import { ReviewStep } from './ReviewStep';

export interface SessionWizardProps {
  onComplete: (session: any) => void | Promise<void>;
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
    case 1: // Pieces + Athletes (combined)
      return ['pieces'];
    case 2: // Review (no validation)
      return [];
    default:
      return [];
  }
}

/**
 * Multi-step session creation wizard (3-step flow)
 *
 * Steps:
 * 1. Session Info: Date, boat class, conditions, location
 * 2. Pieces & Athletes: Create pieces with boats, assign athletes (combined)
 * 3. Review & Submit: Verify and create session with rankings preview
 *
 * Features:
 * - Step-by-step validation
 * - Form state persistence across steps
 * - Horizontal slide transitions (forward left, back right)
 * - Click navigation to previously visited steps
 * - Visual progress indicator
 */
export function SessionWizard({ onComplete, onCancel, initialData }: SessionWizardProps) {
  const wizard = useSessionWizard();
  const createSessionMutation = useCreateSession();
  const addPieceMutation = useAddPiece();
  const addBoatMutation = useAddBoat();
  const setAssignmentsMutation = useSetAssignments();
  const processSessionMutation = useProcessSession();

  // Track navigation direction for horizontal slide animation
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

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

    setDirection('forward');
    wizard.nextStep();
  };

  const handleBack = () => {
    setDirection('back');
    wizard.prevStep();
  };

  const handleSubmit = methods.handleSubmit(async (data) => {
    wizard.setIsSubmitting(true);
    try {
      // 1. Create session
      const sessionResult = await createSessionMutation.createSessionAsync({
        date: new Date(data.date).toISOString(),
        boatClass: data.boatClass,
        conditions: data.conditions,
        location: data.location,
        description: data.description,
      });
      const sessionId = sessionResult.id;

      // 2. Add pieces with boats and assignments (hierarchical POST pattern)
      for (const piece of data.pieces || []) {
        const pieceResult = await addPieceMutation.addPieceAsync({
          sessionId,
          sequenceOrder: piece.sequenceOrder,
          distanceMeters: piece.distanceMeters,
          direction: piece.direction,
          notes: piece.notes,
        });
        const pieceId = pieceResult.id;

        // 3. Add boats for this piece
        for (const boat of piece.boats || []) {
          const boatResult = await addBoatMutation.addBoatAsync({
            pieceId,
            sessionId, // Required for query invalidation
            name: boat.name,
            finishTimeSeconds: boat.finishTimeSeconds,
            handicapSeconds: boat.handicapSeconds || 0,
          });
          const boatId = boatResult.id;

          // 4. Set assignments for this boat
          if (boat.assignments && boat.assignments.length > 0) {
            await setAssignmentsMutation.setAssignmentsAsync({
              boatId,
              sessionId, // Required for query invalidation
              assignments: boat.assignments,
            });
          }
        }
      }

      // 5. Process session to calculate ratings (SEAT-06)
      await processSessionMutation.processSessionAsync({ sessionId });

      // 6. Call completion callback with created session
      await onComplete(sessionResult);
    } catch (error) {
      console.error('Failed to create session:', error);
      // Error handling - mutations will show errors via their error states
    } finally {
      wizard.setIsSubmitting(false);
    }
  });

  // Step components (3 steps)
  const stepComponents = [
    <SessionMetadataStep key="metadata" />,
    <PiecesAndAthletesStep key="pieces-athletes" />,
    <ReviewStep key="review" />,
  ];

  // Animation variants for horizontal slide
  const slideVariants = {
    enter: (direction: 'forward' | 'back') => ({
      x: direction === 'forward' ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'forward' | 'back') => ({
      x: direction === 'forward' ? '-100%' : '100%',
      opacity: 0,
    }),
  };

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

        {/* Current step content with horizontal slide transition */}
        <div className="relative overflow-hidden min-h-[300px]">
          <AnimatePresence initial={false} mode="wait" custom={direction}>
            <motion.div
              key={wizard.step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SPRING_CONFIG}
            >
              {stepComponents[wizard.step]}
            </motion.div>
          </AnimatePresence>
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
                onClick={handleBack}
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

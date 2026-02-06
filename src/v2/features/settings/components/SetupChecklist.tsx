/**
 * SetupChecklist Component
 * Phase 27-06: Setup progress checklist for settings page
 *
 * Per CONTEXT.md (ES-04): "User can see setup checklist in settings for incomplete onboarding."
 *
 * Features:
 * - Shows onboarding progress when incomplete
 * - Hides when onboarding fully complete (returns null)
 * - Checkboxes for each step (completed/pending/skipped)
 * - Re-launch wizard button
 * - Quick action buttons for pending steps
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, Minus, PlayCircle } from 'lucide-react';
import { useOnboardingStatus } from '../../dashboard/hooks/useOnboardingStatus';
import { ONBOARDING_STEPS } from '../../dashboard/config/onboardingSteps';
import { OnboardingWizard } from '../../dashboard/components/OnboardingWizard';

/**
 * SetupChecklist - Shows incomplete onboarding steps in settings
 */
export const SetupChecklist: React.FC = () => {
  const {
    isOnboardingComplete,
    completedSteps,
    skippedSteps,
    progress,
    isStepComplete,
    isStepSkipped,
    resetOnboarding,
  } = useOnboardingStatus();

  const navigate = useNavigate();
  const [showWizard, setShowWizard] = useState(false);

  // Don't render if onboarding is complete
  if (isOnboardingComplete) {
    return null;
  }

  const handleRelaunchWizard = () => {
    resetOnboarding();
    setShowWizard(true);
  };

  const handleStepAction = (stepId: string) => {
    // Navigate to relevant page based on step
    switch (stepId) {
      case 'import-athletes':
        navigate('/app/athletes');
        break;
      case 'setup-practice':
        navigate('/app/sessions');
        break;
      case 'explore':
        setShowWizard(true);
        break;
      default:
        setShowWizard(true);
    }
  };

  const completedCount = completedSteps.length;
  const totalCount = ONBOARDING_STEPS.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <>
      <div className="glass-card p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-txt-primary mb-1">Setup Checklist</h3>
            <p className="text-sm text-txt-secondary">
              Complete these steps to get the most out of RowLab
            </p>
          </div>
          <button
            onClick={handleRelaunchWizard}
            className="px-3 py-1.5 text-sm bg-interactive-primary text-white rounded-lg hover:bg-interactive-hover transition-colors font-medium inline-flex items-center gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            Re-launch Wizard
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-txt-secondary">
              {completedCount} of {totalCount} steps complete
            </span>
            <span className="font-medium text-txt-primary">{progressPercent}%</span>
          </div>
          <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
            <div
              className="h-full bg-interactive-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Checklist items */}
        <div className="space-y-3">
          {ONBOARDING_STEPS.map((step) => {
            const completed = isStepComplete(step.id);
            const skipped = isStepSkipped(step.id);

            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  completed
                    ? 'bg-status-success/5 border-status-success/20'
                    : skipped
                      ? 'bg-surface-base border-bdr-muted'
                      : 'bg-surface-hover border-bdr-default'
                }`}
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {completed ? (
                    <CheckCircle className="w-5 h-5 text-status-success" />
                  ) : skipped ? (
                    <Minus className="w-5 h-5 text-txt-tertiary" />
                  ) : (
                    <Circle className="w-5 h-5 text-txt-tertiary" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4
                    className={`font-medium mb-0.5 ${
                      completed
                        ? 'text-txt-secondary line-through'
                        : skipped
                          ? 'text-txt-tertiary'
                          : 'text-txt-primary'
                    }`}
                  >
                    {step.title}
                  </h4>
                  <p className="text-sm text-txt-tertiary">{step.description}</p>
                </div>

                {/* Action */}
                {!completed && (
                  <button
                    onClick={() => handleStepAction(step.id)}
                    className="flex-shrink-0 px-3 py-1.5 text-sm bg-interactive-primary/10 text-interactive-primary rounded-md hover:bg-interactive-primary/20 transition-colors font-medium"
                  >
                    {skipped ? 'Resume' : 'Complete'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Info note */}
        <p className="text-xs text-txt-tertiary mt-4 text-center">
          All steps are optional. You can skip any step and complete them later.
        </p>
      </div>

      {/* Onboarding wizard modal */}
      {showWizard && (
        <OnboardingWizard
          onComplete={() => setShowWizard(false)}
          onStartTour={() => {
            setShowWizard(false);
            // TODO(phase-27-07): Integrate with tour system
          }}
        />
      )}
    </>
  );
};

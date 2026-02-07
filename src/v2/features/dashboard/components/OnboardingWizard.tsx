/**
 * OnboardingWizard Component
 * Phase 27-06: Progressive onboarding wizard for first-time users
 *
 * Per CONTEXT.md: "Progressive onboarding: step-by-step wizard on first login —
 * Welcome > Import athletes > Set up first practice — every step skippable."
 *
 * Features:
 * - Lightweight 4-step wizard (not a 10-step interrogation)
 * - Every step has a skip button
 * - Implicit completion detection (has athletes = step auto-complete)
 * - Full-screen overlay with glass card
 * - Progress indicator with step circles
 * - Smart defaults pre-filled
 */

import React, { useState, useCallback } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';
import { ONBOARDING_STEPS, getNextStepId, getPreviousStepId } from '../config/onboardingSteps';
import { getOnboardingDefaults } from '../config/smartDefaults';
import { GeometricAnimation } from '../empty-states/GeometricAnimation';
import { EMPTY_STATE_ANIMATIONS } from '../empty-states/animations';
import {
  MODAL_VARIANTS,
  SPRING_CONFIG,
  usePrefersReducedMotion,
  SPRING_FAST,
} from '../../../utils/animations';

interface OnboardingWizardProps {
  onComplete: () => void;
  onStartTour?: () => void;
}

/**
 * Welcome Step - Greeting and introduction
 */
const WelcomeStep: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const defaults = getOnboardingDefaults();

  return (
    <div className="text-center space-y-6">
      {/* Rocket animation */}
      <GeometricAnimation
        config={EMPTY_STATE_ANIMATIONS.onboarding}
        className="w-32 h-32 mx-auto"
      />

      <div>
        <h2 className="text-2xl font-semibold text-txt-primary mb-2">Welcome to RowLab</h2>
        <p className="text-base text-txt-secondary max-w-md mx-auto">
          Let's set up your team in a few quick steps. You can skip any step and come back later.
        </p>
      </div>

      <div className="bg-surface-base/50 rounded-lg p-4 border border-bdr-muted max-w-sm mx-auto">
        <p className="text-sm text-txt-secondary">
          <span className="font-medium text-txt-primary">Current Season:</span>{' '}
          {defaults.season.name} ({defaults.season.formatted})
        </p>
      </div>

      <button
        onClick={onNext}
        className="px-6 py-2 bg-interactive-primary text-white rounded-lg hover:bg-interactive-hover transition-colors font-medium inline-flex items-center gap-2"
      >
        Let's Go <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Import Athletes Step - CSV import or manual add
 */
const ImportAthletesStep: React.FC<{
  onNext: () => void;
  athletesCount: number;
}> = ({ onNext, athletesCount }) => {
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualSide, setManualSide] = useState<'Port' | 'Starboard' | 'Both'>('Both');

  const handleManualAdd = () => {
    // TODO(phase-27-06): Integrate with useCreateAthlete mutation
    console.log('Create athlete:', { name: manualName, sidePreference: manualSide });
    onNext();
  };

  // Already has athletes
  if (athletesCount > 0) {
    return (
      <div className="text-center space-y-6">
        <CheckCircle className="w-16 h-16 mx-auto text-status-success" />
        <div>
          <h2 className="text-2xl font-semibold text-txt-primary mb-2">Athletes Added!</h2>
          <p className="text-base text-txt-secondary">
            You already have {athletesCount} athlete{athletesCount !== 1 ? 's' : ''} on your team.
          </p>
        </div>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-interactive-primary text-white rounded-lg hover:bg-interactive-hover transition-colors font-medium inline-flex items-center gap-2"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-txt-primary mb-2">Add Your Athletes</h2>
        <p className="text-base text-txt-secondary">
          Import your roster from CSV or add athletes manually to get started.
        </p>
      </div>

      {/* Two options: CSV or Manual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {/* CSV Import Card */}
        <button
          onClick={() => setShowCSVImport(true)}
          className="glass-card p-6 text-left hover:border-interactive-primary transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-interactive-primary/10 rounded-lg group-hover:bg-interactive-primary/20 transition-colors">
              <svg
                className="w-6 h-6 text-interactive-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-txt-primary mb-1">Import CSV</h3>
              <p className="text-sm text-txt-secondary">
                Upload a CSV file with your athlete roster
              </p>
            </div>
          </div>
        </button>

        {/* Manual Add Card */}
        <div className="glass-card p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-accent-copper/10 rounded-lg">
              <svg
                className="w-6 h-6 text-accent-copper"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-txt-primary mb-1">Add Manually</h3>
              <p className="text-sm text-txt-secondary">Add your first athlete</p>
            </div>
          </div>

          {/* Inline form */}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Athlete name"
              aria-label="Athlete name"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              className="w-full px-3 py-2 bg-surface-base border border-bdr-default rounded-lg text-txt-primary placeholder:text-txt-tertiary focus:outline-none focus:ring-2 focus:ring-interactive-primary"
            />
            <select
              value={manualSide}
              onChange={(e) => setManualSide(e.target.value as any)}
              className="w-full px-3 py-2 bg-surface-base border border-bdr-default rounded-lg text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary"
            >
              <option value="Port">Port</option>
              <option value="Starboard">Starboard</option>
              <option value="Both">Both Sides</option>
            </select>
            <button
              onClick={handleManualAdd}
              disabled={!manualName.trim()}
              className="w-full px-4 py-2 bg-accent-copper text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Athlete
            </button>
          </div>
        </div>
      </div>

      {/* TODO: Integrate actual CSV import modal */}
      {showCSVImport && (
        <div className="text-center text-sm text-txt-secondary">
          CSV import modal would appear here (reuse existing CSVImportModal component)
        </div>
      )}
    </div>
  );
};

/**
 * Setup Practice Step - Create first session
 */
const SetupPracticeStep: React.FC<{
  onNext: () => void;
  sessionsCount: number;
}> = ({ onNext, sessionsCount }) => {
  const defaults = getOnboardingDefaults();
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionTime, setSessionTime] = useState(defaults.practice.time);
  const [sessionType, setSessionType] = useState(defaults.practice.type);

  const handleCreateSession = () => {
    // TODO(phase-27-06): Integrate with useCreateSession mutation
    console.log('Create session:', { date: sessionDate, time: sessionTime, type: sessionType });
    onNext();
  };

  // Already has sessions
  if (sessionsCount > 0) {
    return (
      <div className="text-center space-y-6">
        <CheckCircle className="w-16 h-16 mx-auto text-status-success" />
        <div>
          <h2 className="text-2xl font-semibold text-txt-primary mb-2">Session Created!</h2>
          <p className="text-base text-txt-secondary">
            You already have {sessionsCount} session{sessionsCount !== 1 ? 's' : ''} scheduled.
          </p>
        </div>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-interactive-primary text-white rounded-lg hover:bg-interactive-hover transition-colors font-medium inline-flex items-center gap-2"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-txt-primary mb-2">
          Schedule Your First Practice
        </h2>
        <p className="text-base text-txt-secondary">
          Create a practice session to start tracking attendance and erg data.
        </p>
      </div>

      {/* Inline session form */}
      <div className="glass-card p-6 max-w-md mx-auto space-y-4">
        <div>
          <label className="block text-sm font-medium text-txt-primary mb-2">Date</label>
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="w-full px-3 py-2 bg-surface-base border border-bdr-default rounded-lg text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-txt-primary mb-2">Time</label>
          <input
            type="time"
            value={sessionTime}
            onChange={(e) => setSessionTime(e.target.value)}
            className="w-full px-3 py-2 bg-surface-base border border-bdr-default rounded-lg text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-txt-primary mb-2">Type</label>
          <select
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value as any)}
            className="w-full px-3 py-2 bg-surface-base border border-bdr-default rounded-lg text-txt-primary focus:outline-none focus:ring-2 focus:ring-interactive-primary"
          >
            <option value="ERG">Erg Session</option>
            <option value="WATER">Water Practice</option>
            <option value="WEIGHTS">Weights</option>
            <option value="RUN">Run</option>
          </select>
        </div>

        <button
          onClick={handleCreateSession}
          className="w-full px-4 py-2 bg-interactive-primary text-white rounded-lg hover:bg-interactive-hover transition-colors font-medium"
        >
          Create Practice
        </button>
      </div>

      <p className="text-sm text-txt-tertiary text-center max-w-md mx-auto">
        Pre-filled with smart defaults: {defaults.season.name} season, {defaults.practice.time}{' '}
        {sessionType.toLowerCase()} session
      </p>
    </div>
  );
};

/**
 * Explore Step - Feature discovery + tour CTA
 */
const ExploreStep: React.FC<{
  onComplete: () => void;
  onStartTour?: () => void;
}> = ({ onComplete, onStartTour }) => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-status-success/10 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-status-success" />
        </div>
        <h2 className="text-2xl font-semibold text-txt-primary mb-2">You're All Set!</h2>
        <p className="text-base text-txt-secondary">
          Your dashboard is ready. Take a quick tour or start exploring.
        </p>
      </div>

      {/* Feature cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
        <div className="glass-card p-4 text-center">
          <div className="w-10 h-10 bg-data-excellent/10 rounded-lg flex items-center justify-center mx-auto mb-2">
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-sm font-medium text-txt-primary">Athletes</p>
        </div>

        <div className="glass-card p-4 text-center">
          <div className="w-10 h-10 bg-data-good/10 rounded-lg flex items-center justify-center mx-auto mb-2">
            <span className="text-2xl">🚣</span>
          </div>
          <p className="text-sm font-medium text-txt-primary">Lineups</p>
        </div>

        <div className="glass-card p-4 text-center">
          <div className="w-10 h-10 bg-accent-copper/10 rounded-lg flex items-center justify-center mx-auto mb-2">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-sm font-medium text-txt-primary">Erg Data</p>
        </div>

        <div className="glass-card p-4 text-center">
          <div className="w-10 h-10 bg-chart-2/10 rounded-lg flex items-center justify-center mx-auto mb-2">
            <span className="text-2xl">🏆</span>
          </div>
          <p className="text-sm font-medium text-txt-primary">Seat Racing</p>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {onStartTour && (
          <button
            onClick={onStartTour}
            className="px-6 py-2 bg-accent-copper text-white rounded-lg hover:opacity-90 transition-opacity font-medium inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Take a Tour
          </button>
        )}
        <button
          onClick={onComplete}
          className="px-6 py-2 bg-interactive-primary text-white rounded-lg hover:bg-interactive-hover transition-colors font-medium"
        >
          Start Exploring
        </button>
      </div>
    </div>
  );
};

/**
 * OnboardingWizard - Main component
 */
export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, onStartTour }) => {
  const {
    currentStep,
    totalSteps,
    progress,
    completeStep,
    skipStep,
    dismissOnboarding,
    completedSteps,
    isStepComplete,
  } = useOnboardingStatus();

  // Always start at step 0 (welcome) so users see the greeting,
  // even though the welcome step is implicitly "complete"
  const [localStep, setLocalStep] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Mock data for demo (TODO: replace with actual queries)
  const athletesCount = completedSteps.includes('import-athletes') ? 1 : 0;
  const sessionsCount = completedSteps.includes('setup-practice') ? 1 : 0;

  const currentStepId = ONBOARDING_STEPS[localStep]?.id;

  const handleNext = useCallback(() => {
    const stepId = ONBOARDING_STEPS[localStep].id;
    completeStep(stepId);

    if (localStep < totalSteps - 1) {
      setLocalStep(localStep + 1);
    } else {
      // Last step
      dismissOnboarding();
      onComplete();
    }
  }, [localStep, totalSteps, completeStep, dismissOnboarding, onComplete]);

  const handleBack = useCallback(() => {
    if (localStep > 0) {
      setLocalStep(localStep - 1);
    }
  }, [localStep]);

  const handleSkip = useCallback(() => {
    const stepId = ONBOARDING_STEPS[localStep].id;
    skipStep(stepId);
    handleNext();
  }, [localStep, skipStep, handleNext]);

  const handleDismiss = useCallback(() => {
    dismissOnboarding();
    onComplete();
  }, [dismissOnboarding, onComplete]);

  // Render current step content
  const renderStepContent = () => {
    switch (currentStepId) {
      case 'welcome':
        return <WelcomeStep onNext={handleNext} />;
      case 'import-athletes':
        return <ImportAthletesStep onNext={handleNext} athletesCount={athletesCount} />;
      case 'setup-practice':
        return <SetupPracticeStep onNext={handleNext} sessionsCount={sessionsCount} />;
      case 'explore':
        return <ExploreStep onComplete={handleNext} onStartTour={onStartTour} />;
      default:
        return null;
    }
  };

  const isLastStep = localStep === totalSteps - 1;

  return (
    <Dialog open={true} onClose={handleDismiss} className="relative z-50">
      <DialogBackdrop
        as={motion.div}
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={prefersReducedMotion ? {} : { hidden: { opacity: 0 }, visible: { opacity: 1 } }}
        transition={SPRING_CONFIG}
        className="fixed inset-0 bg-inkwell-900/60 backdrop-blur-sm"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          as={motion.div}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={prefersReducedMotion ? {} : MODAL_VARIANTS}
          transition={SPRING_CONFIG}
          className="relative w-full max-w-3xl glass-card p-8"
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-surface-hover transition-colors text-txt-secondary hover:text-txt-primary"
            aria-label="Close wizard"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-txt-secondary">
                Step {localStep + 1} of {totalSteps}
              </span>
              <button
                onClick={handleDismiss}
                className="text-sm text-txt-tertiary hover:text-txt-secondary transition-colors"
              >
                Skip all
              </button>
            </div>

            {/* Step circles */}
            <div className="flex items-center gap-2">
              {ONBOARDING_STEPS.map((step, idx) => (
                <div key={step.id} className="flex-1">
                  <div
                    className={`h-2 rounded-full transition-colors ${
                      idx <= localStep ? 'bg-interactive-primary' : 'bg-surface-hover'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="mb-8">{renderStepContent()}</div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleBack}
              disabled={localStep === 0}
              className="px-4 py-2 text-txt-secondary hover:text-txt-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex items-center gap-3">
              {!isLastStep && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-txt-secondary hover:text-txt-primary transition-colors"
                >
                  Skip
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-interactive-primary text-white rounded-lg hover:bg-interactive-hover transition-colors font-medium inline-flex items-center gap-2"
              >
                {isLastStep ? 'Finish' : 'Continue'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

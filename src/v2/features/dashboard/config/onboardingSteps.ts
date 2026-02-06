/**
 * Onboarding Steps Configuration
 * Phase 27-06: Lightweight 4-step onboarding wizard (not a 10-step interrogation)
 *
 * Per CONTEXT.md: "Progressive onboarding: step-by-step wizard on first login —
 * Welcome > Import athletes > Set up first practice — every step skippable."
 */

import type { ComponentType } from 'react';

export interface OnboardingStepConfig {
  id: string;
  title: string;
  description: string;
  isSkippable: boolean; // always true per CONTEXT.md
  ctaLabel?: string; // optional CTA button label
}

/**
 * Onboarding wizard steps
 *
 * Lightweight 4-step flow:
 * 1. Welcome - introduce RowLab
 * 2. Import athletes - get roster started
 * 3. Setup practice - schedule first session
 * 4. Explore - feature discovery + optional tour
 */
export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    id: 'welcome',
    title: 'Welcome to RowLab',
    description:
      "Let's set up your team in a few quick steps. You can skip any step and come back later.",
    isSkippable: true,
    ctaLabel: "Let's Go",
  },
  {
    id: 'import-athletes',
    title: 'Add Your Athletes',
    description: 'Import your roster from CSV or add athletes manually to get started.',
    isSkippable: true,
    ctaLabel: 'Continue',
  },
  {
    id: 'setup-practice',
    title: 'Schedule Your First Practice',
    description: 'Create a practice session to start tracking attendance and erg data.',
    isSkippable: true,
    ctaLabel: 'Create Practice',
  },
  {
    id: 'explore',
    title: "You're All Set!",
    description: 'Your dashboard is ready. Take a quick tour or start exploring.',
    isSkippable: true,
    ctaLabel: 'Start Exploring',
  },
];

/**
 * Get step config by ID
 */
export function getStepById(stepId: string): OnboardingStepConfig | undefined {
  return ONBOARDING_STEPS.find((step) => step.id === stepId);
}

/**
 * Get step index by ID
 */
export function getStepIndex(stepId: string): number {
  return ONBOARDING_STEPS.findIndex((step) => step.id === stepId);
}

/**
 * Get next step ID
 */
export function getNextStepId(currentStepId: string): string | null {
  const currentIndex = getStepIndex(currentStepId);
  if (currentIndex === -1 || currentIndex === ONBOARDING_STEPS.length - 1) {
    return null;
  }
  return ONBOARDING_STEPS[currentIndex + 1].id;
}

/**
 * Get previous step ID
 */
export function getPreviousStepId(currentStepId: string): string | null {
  const currentIndex = getStepIndex(currentStepId);
  if (currentIndex <= 0) {
    return null;
  }
  return ONBOARDING_STEPS[currentIndex - 1].id;
}

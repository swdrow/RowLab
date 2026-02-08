/**
 * Onboarding Status Hook
 * Phase 27-06: Tracks onboarding wizard completion with localStorage persistence
 *
 * Features:
 * - Tracks completed/skipped steps
 * - Implicit completion detection (has athletes = import step auto-complete)
 * - Permission check (only show wizard to team owners/admins)
 * - Dismissal and reset capabilities
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import api from '../../../utils/api';

const STORAGE_KEY = 'rowlab_onboarding_status';
const ONBOARDING_VERSION = 1;

// Step IDs matching onboardingSteps.ts
const STEP_IDS = ['welcome', 'import-athletes', 'setup-practice', 'explore'] as const;
type StepId = (typeof STEP_IDS)[number];

interface OnboardingStorage {
  completedSteps: string[];
  skippedSteps: string[];
  dismissed: boolean;
  version: number;
}

interface OnboardingStatusReturn {
  isOnboardingComplete: boolean;
  completedSteps: string[];
  skippedSteps: string[];
  currentStep: number;
  totalSteps: number;
  progress: number; // 0 to 1
  completeStep: (stepId: string) => void;
  skipStep: (stepId: string) => void;
  dismissOnboarding: () => void;
  resetOnboarding: () => void;
  shouldShowWizard: boolean;
  isStepComplete: (stepId: string) => boolean;
  isStepSkipped: (stepId: string) => boolean;
}

/**
 * Load onboarding status from localStorage
 */
function loadOnboardingStatus(): OnboardingStorage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as OnboardingStorage;
      // Check version compatibility
      if (parsed.version === ONBOARDING_VERSION) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse onboarding status:', e);
  }

  // Default empty state
  return {
    completedSteps: [],
    skippedSteps: [],
    dismissed: false,
    version: ONBOARDING_VERSION,
  };
}

/**
 * Save onboarding status to localStorage
 */
function saveOnboardingStatus(status: OnboardingStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
  } catch (e) {
    console.error('Failed to save onboarding status:', e);
  }
}

/**
 * Fetch athletes count for implicit completion detection
 */
async function fetchAthletesCount(): Promise<number> {
  const response = await api.get('/api/v1/athletes');
  if (response.data.success && response.data.data?.athletes) {
    return response.data.data.athletes.length;
  }
  return 0;
}

/**
 * Fetch sessions count for implicit completion detection
 */
async function fetchSessionsCount(): Promise<number> {
  const response = await api.get('/api/v1/sessions?limit=1');
  if (response.data.success && response.data.data?.sessions) {
    return response.data.data.sessions.length;
  }
  return 0;
}

/**
 * Hook to manage onboarding wizard status
 */
export function useOnboardingStatus(): OnboardingStatusReturn {
  const { isAuthenticated, isInitialized, activeTeamRole, activeTeamId } = useAuth();

  // Load from localStorage on mount
  const [storage, setStorage] = useState<OnboardingStorage>(loadOnboardingStatus);

  // Fetch athletes count for implicit completion
  const { data: athletesCount = 0 } = useQuery({
    queryKey: queryKeys.athletes.count(activeTeamId || ''),
    queryFn: fetchAthletesCount,
    enabled: isAuthenticated && isInitialized && !!activeTeamId && !storage.dismissed,
    staleTime: 30_000, // 30s
  });

  // Fetch sessions count for implicit completion
  const { data: sessionsCount = 0 } = useQuery({
    queryKey: queryKeys.sessions.count(activeTeamId || ''),
    queryFn: fetchSessionsCount,
    enabled: isAuthenticated && isInitialized && !!activeTeamId && !storage.dismissed,
    staleTime: 30_000, // 30s
  });

  // Update localStorage when storage changes
  useEffect(() => {
    saveOnboardingStatus(storage);
  }, [storage]);

  // Determine implicit step completion
  const implicitlyCompletedSteps = useMemo(() => {
    const completed: string[] = [];

    // Welcome step is always auto-complete (just informational)
    completed.push('welcome');

    // Import athletes step: complete if team has athletes
    if (athletesCount > 0) {
      completed.push('import-athletes');
    }

    // Setup practice step: complete if team has sessions
    if (sessionsCount > 0) {
      completed.push('setup-practice');
    }

    // Explore step: auto-complete if team already has athletes AND sessions
    // (user has clearly already set up their team — no need for onboarding)
    if (athletesCount > 0 && sessionsCount > 0) {
      completed.push('explore');
    }

    return completed;
  }, [athletesCount, sessionsCount]);

  // Merge explicit + implicit completion
  const allCompletedSteps = useMemo(() => {
    const combined = new Set([...storage.completedSteps, ...implicitlyCompletedSteps]);
    return Array.from(combined);
  }, [storage.completedSteps, implicitlyCompletedSteps]);

  // Check if step is complete (explicit OR implicit)
  const isStepComplete = useCallback(
    (stepId: string) => {
      return allCompletedSteps.includes(stepId);
    },
    [allCompletedSteps]
  );

  // Check if step is skipped
  const isStepSkipped = useCallback(
    (stepId: string) => {
      return storage.skippedSteps.includes(stepId);
    },
    [storage.skippedSteps]
  );

  // Calculate current step (first incomplete, non-skipped step)
  const currentStep = useMemo(() => {
    for (let i = 0; i < STEP_IDS.length; i++) {
      const stepId = STEP_IDS[i];
      if (!isStepComplete(stepId) && !isStepSkipped(stepId)) {
        return i;
      }
    }
    return STEP_IDS.length; // All complete
  }, [isStepComplete, isStepSkipped]);

  // Check if onboarding is complete
  const isOnboardingComplete = useMemo(() => {
    if (storage.dismissed) return true;

    // Complete if all steps are either completed or skipped
    return STEP_IDS.every((stepId) => isStepComplete(stepId) || isStepSkipped(stepId));
  }, [storage.dismissed, isStepComplete, isStepSkipped]);

  // Calculate progress (0 to 1)
  const progress = useMemo(() => {
    const doneCount = STEP_IDS.filter(
      (stepId) => isStepComplete(stepId) || isStepSkipped(stepId)
    ).length;
    return doneCount / STEP_IDS.length;
  }, [isStepComplete, isStepSkipped]);

  // Permission check: show wizard to team owners/admins/coaches
  const canManageTeam = useMemo(() => {
    return activeTeamRole === 'OWNER' || activeTeamRole === 'ADMIN' || activeTeamRole === 'COACH';
  }, [activeTeamRole]);

  const shouldShowWizard = useMemo(() => {
    return (
      isAuthenticated && isInitialized && !isOnboardingComplete && canManageTeam && !!activeTeamId
    );
  }, [isAuthenticated, isInitialized, isOnboardingComplete, canManageTeam, activeTeamId]);

  // Mark step as complete
  const completeStep = useCallback((stepId: string) => {
    setStorage((prev) => {
      const updated = { ...prev };
      if (!updated.completedSteps.includes(stepId)) {
        updated.completedSteps = [...updated.completedSteps, stepId];
      }
      // Remove from skipped if it was there
      updated.skippedSteps = updated.skippedSteps.filter((id) => id !== stepId);
      return updated;
    });
  }, []);

  // Mark step as skipped
  const skipStep = useCallback((stepId: string) => {
    setStorage((prev) => {
      const updated = { ...prev };
      if (!updated.skippedSteps.includes(stepId)) {
        updated.skippedSteps = [...updated.skippedSteps, stepId];
      }
      return updated;
    });
  }, []);

  // Dismiss entire wizard
  const dismissOnboarding = useCallback(() => {
    setStorage((prev) => ({
      ...prev,
      dismissed: true,
    }));
  }, []);

  // Reset onboarding (for re-launch from settings)
  const resetOnboarding = useCallback(() => {
    setStorage({
      completedSteps: [],
      skippedSteps: [],
      dismissed: false,
      version: ONBOARDING_VERSION,
    });
  }, []);

  return {
    isOnboardingComplete,
    completedSteps: allCompletedSteps,
    skippedSteps: storage.skippedSteps,
    currentStep,
    totalSteps: STEP_IDS.length,
    progress,
    completeStep,
    skipStep,
    dismissOnboarding,
    resetOnboarding,
    shouldShowWizard,
    isStepComplete,
    isStepSkipped,
  };
}

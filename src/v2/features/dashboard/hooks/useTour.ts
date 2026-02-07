/**
 * useTour Hook
 * Phase 27-07: Driver.js integration for guided dashboard tours
 *
 * Features:
 * - Auto-start tours on first visit (localStorage persistence)
 * - Waits for async elements to be available
 * - Respects prefers-reduced-motion
 * - Custom RowLab styling for popovers
 */

import { useEffect, useRef, useState } from 'react';
import { driver, DriveStep, Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import '../tours/tour-styles.css';
import { TOUR_REGISTRY } from '../tours';

export interface UseTourOptions {
  autoStart?: boolean;
  delay?: number; // Delay before auto-start (default 800ms)
}

export interface UseTourResult {
  startTour: () => void;
  hasSeenTour: boolean;
  resetTour: () => void;
}

/**
 * Hook for managing driver.js guided tours
 *
 * @param tourId - Unique identifier for the tour (matches key in TOUR_REGISTRY)
 * @param options - Configuration options
 * @returns Tour control interface
 */
export function useTour(tourId: string, options: UseTourOptions = {}): UseTourResult {
  const { autoStart = false, delay = 800 } = options;

  const driverRef = useRef<Driver | null>(null);
  const [hasSeenTour, setHasSeenTour] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const key = `rowlab_tour_${tourId}_seen`;
      return localStorage.getItem(key) === 'true';
    } catch {
      return false;
    }
  });

  /**
   * Wait for an element to be available in the DOM
   * Polls every 100ms for up to 2 seconds
   */
  const waitForElement = async (selector: string, timeout = 2000): Promise<boolean> => {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (document.querySelector(selector)) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return false;
  };

  /**
   * Start the tour
   */
  const startTour = async () => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Get tour steps from registry
    const tourSteps = TOUR_REGISTRY[tourId];
    if (!tourSteps || tourSteps.length === 0) {
      console.warn(`[useTour] Tour "${tourId}" not found in registry`);
      return;
    }

    // Wait for elements and filter out steps whose elements don't exist
    const availableSteps: DriveStep[] = [];

    for (const step of tourSteps) {
      // If step has an element selector, wait for it
      if (step.element) {
        // Handle element as string selector only
        const selector = typeof step.element === 'string' ? step.element : '';
        if (selector) {
          const isAvailable = await waitForElement(selector);
          if (!isAvailable) {
            console.warn(`[useTour] Element "${selector}" not found, skipping step`);
            continue;
          }
        }
      }
      availableSteps.push(step);
    }

    if (availableSteps.length === 0) {
      console.warn(`[useTour] No available steps for tour "${tourId}"`);
      return;
    }

    // Create driver instance
    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      progressText: '{{current}} of {{total}}',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Done',
      popoverClass: 'rowlab-tour-popover',
      animate: !prefersReducedMotion,
      smoothScroll: !prefersReducedMotion,
      steps: availableSteps,
      onDestroyed: () => {
        // Mark tour as seen when completed or dismissed
        try {
          const key = `rowlab_tour_${tourId}_seen`;
          localStorage.setItem(key, 'true');
        } catch {
          // localStorage may be unavailable (private browsing, quota exceeded)
        }
        setHasSeenTour(true);
      },
    });

    driverRef.current = driverObj;
    driverObj.drive();
  };

  /**
   * Reset tour seen state (for testing or "Show me again")
   */
  const resetTour = () => {
    try {
      const key = `rowlab_tour_${tourId}_seen`;
      localStorage.removeItem(key);
    } catch {
      // localStorage may be unavailable
    }
    setHasSeenTour(false);
  };

  // Auto-start tour if configured
  useEffect(() => {
    if (!autoStart || hasSeenTour) return;

    const timeoutId = setTimeout(() => {
      startTour();
    }, delay);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, hasSeenTour, delay, tourId]);

  // Cleanup driver on unmount
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, []);

  return {
    startTour,
    hasSeenTour,
    resetTour,
  };
}

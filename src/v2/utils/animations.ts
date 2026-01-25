import { useState, useEffect } from 'react';

/**
 * Centralized animation configuration for V2 components
 *
 * All animations should use these constants for consistency.
 * Per POLISH-03: "standardized Framer Motion spring configs across all animations"
 */

/**
 * Spring physics configuration for smooth, natural animations
 * Used for: drag-drop, modal transitions, button press, hover states
 */
export const SPRING_CONFIG = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 28,
  restDelta: 0.00001,
  restSpeed: 0.00001,
} as const;

/**
 * Faster spring for micro-interactions (button hover, focus)
 */
export const SPRING_FAST = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
} as const;

/**
 * Slower spring for larger elements (modal, page transitions)
 */
export const SPRING_SLOW = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 25,
} as const;

/**
 * Standard transition durations (for non-spring animations)
 */
export const TRANSITION_DURATION = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
} as const;

/**
 * Reduced motion detection hook
 * Returns true if user prefers reduced motion (POLISH-11 accessibility)
 */
export const usePrefersReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return prefersReducedMotion;
};

/**
 * Get animation config respecting reduced motion preference
 */
export const getAnimationConfig = (prefersReducedMotion: boolean) => {
  if (prefersReducedMotion) {
    return { duration: 0 };
  }
  return SPRING_CONFIG;
};

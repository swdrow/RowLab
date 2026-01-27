import { useState, useEffect } from 'react';

/**
 * Centralized Animation Configuration for V2 Components
 *
 * Implements the "Rowing Instrument" animation philosophy:
 * - High-impact moments get satisfying spring physics
 * - Always restrained - no parallax, no auto-playing backgrounds
 * - Respects reduced motion preferences
 *
 * Spring values per CONTEXT.md specification (Phase 17 Design Overhaul)
 */

// ========================================
// SPRING PHYSICS CONSTANTS
// ========================================

/**
 * Standard spring physics - drag-drop, modal transitions, general interactions
 * Per CONTEXT.md: stiffness 400, damping 17
 */
export const SPRING_CONFIG = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 17,
} as const;

/**
 * Fast spring for micro-interactions - button hover/tap, focus states
 * Per CONTEXT.md: stiffness 500, damping 25
 */
export const SPRING_FAST = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 25,
} as const;

/**
 * Gentle spring for subtle animations - fade reveals, list transitions
 * Per CONTEXT.md: stiffness 300, damping 20
 */
export const SPRING_GENTLE = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 20,
} as const;

/**
 * @deprecated Use SPRING_GENTLE instead for slow animations
 * Kept for backwards compatibility
 */
export const SPRING_SLOW = SPRING_GENTLE;

// ========================================
// TRANSITION DURATIONS (non-spring)
// ========================================

/**
 * Standard transition durations (for non-spring animations)
 */
export const TRANSITION_DURATION = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
} as const;

// ========================================
// ANIMATION PRESETS
// ========================================

/**
 * Button press animation - tactile 0.96 scale on tap
 * Creates physical "push" feeling per DESIGN-03 spec
 */
export const BUTTON_PRESS = {
  whileTap: { scale: 0.96 },
  transition: SPRING_FAST,
} as const;

/**
 * Card hover animation - subtle lift with shadow
 * Creates depth perception without parallax effects
 */
export const CARD_HOVER = {
  whileHover: { scale: 1.01, y: -2 },
  transition: SPRING_CONFIG,
} as const;

/**
 * Drag overlay animation - lift with shadow expansion
 * Physical feel for drag-drop per DESIGN-04 spec
 */
export const DRAG_LIFT = {
  scale: 1.02,
  boxShadow: '0 20px 25px -5px rgba(15, 15, 15, 0.3)',
  cursor: 'grabbing',
} as const;

/**
 * Modal enter/exit animation variants
 * Smooth, satisfying transitions that don't overstay welcome
 */
export const MODAL_VARIANTS = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
} as const;

/**
 * Slide panel variants (for side panels/drawers)
 * Used for athlete detail panels, settings drawers, etc.
 */
export const SLIDE_PANEL_VARIANTS = {
  hidden: { x: '100%' },
  visible: { x: 0 },
  exit: { x: '100%' },
} as const;

/**
 * Fade in animation for list items and content reveals
 */
export const FADE_IN_VARIANTS = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
} as const;

/**
 * Staggered children animation config
 * Use with AnimatePresence for list animations
 */
export const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
} as const;

// ========================================
// ACCESSIBILITY HOOKS
// ========================================

/**
 * Reduced motion detection hook
 * Returns true if user prefers reduced motion (WCAG/POLISH-11 accessibility)
 *
 * Usage:
 * const prefersReducedMotion = usePrefersReducedMotion();
 * const transition = prefersReducedMotion ? { duration: 0 } : SPRING_CONFIG;
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
 * Returns instant transition when user prefers reduced motion
 */
export const getAnimationConfig = (prefersReducedMotion: boolean) => {
  if (prefersReducedMotion) {
    return { duration: 0 };
  }
  return SPRING_CONFIG;
};

/**
 * Get spring config respecting reduced motion preference
 * More explicit version for spring-specific animations
 */
export const getSpringConfig = (
  prefersReducedMotion: boolean,
  springType: 'standard' | 'fast' | 'gentle' = 'standard'
) => {
  if (prefersReducedMotion) {
    return { duration: 0 };
  }

  switch (springType) {
    case 'fast':
      return SPRING_FAST;
    case 'gentle':
      return SPRING_GENTLE;
    default:
      return SPRING_CONFIG;
  }
};

/**
 * Motion animation presets for consistent animations across the app.
 * Uses `motion` package (v12+) — import from 'motion/react'.
 *
 * Spring configs define the physics of motion.
 * Transition presets are ready-to-spread motion component props.
 */

import type { Transition, Variant } from 'motion/react';

/* === SPRING CONFIGS === */

/** Smooth, natural motion for most UI transitions */
export const SPRING_SMOOTH: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

/** Quick, snappy for micro-interactions (toggles, buttons) */
export const SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 35,
  mass: 0.5,
};

/** Gentle, relaxed for larger elements (modals, panels) */
export const SPRING_GENTLE: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
  mass: 1,
};

/* === TRANSITION PRESETS === */

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
} as const;

export const slideUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: SPRING_SMOOTH,
} as const;

export const slideInFromLeft = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
  transition: SPRING_SMOOTH,
} as const;

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: SPRING_SNAPPY,
} as const;

/* === STAGGER HELPERS === */

export function staggerChildren(staggerDelay = 0.05): Transition {
  return {
    staggerChildren: staggerDelay,
  };
}

/* === VARIANT FACTORIES === */

export const listItemVariants: Record<string, Variant> = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export const listContainerVariants: Record<string, Variant> = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

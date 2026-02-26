/**
 * oarbit motion animation presets.
 * Uses `motion` package (v12+) — import from 'motion/react'.
 *
 * Spring configs align with design-system/tokens.ts motion tokens.
 * Transition presets are ready-to-spread motion component props.
 */

import type { Transition } from 'motion/react';
import { motion as motionTokens } from '@/design-system';

/* === SPRING CONFIGS (from design system) === */

/** Standard: panel open/close, dropdown, accordion */
export const SPRING_SMOOTH: Transition = {
  type: 'spring',
  ...motionTokens.spring.standard,
};

/** Snap: button press, toggle flip, checkbox */
export const SPRING_SNAPPY: Transition = {
  type: 'spring',
  ...motionTokens.spring.snap,
};

/** Flow: page transitions, modal entrance */
export const SPRING_GENTLE: Transition = {
  type: 'spring',
  ...motionTokens.spring.flow,
};

/** Data: number count-up, chart draw-in (zero overshoot) */
export const SPRING_DATA: Transition = {
  type: 'spring',
  ...motionTokens.spring.data,
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

/** Deeper offset for hero/feature elements */
export const slideUpDramatic = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
  transition: SPRING_GENTLE,
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

/* === CARD INTERACTION PRESETS === */

/** Hover state for interactive cards — subtle upward lift */
export const cardHover = {
  y: -2,
  transition: { type: 'spring', stiffness: 400, damping: 25 } as Transition,
} as const;

/** Tap/active state for interactive cards — press down effect */
export const cardTap = {
  y: 0,
  scale: 0.99,
  transition: { type: 'spring', stiffness: 500, damping: 30 } as Transition,
} as const;

/* === PAGE TRANSITION === */

export const pageTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
} as const;

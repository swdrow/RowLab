/**
 * Geometric Rocket Animation
 *
 * Upward motion shapes
 * For onboarding empty states
 */

import type { GeometricAnimationConfig } from './index';

export const geometricRocket: GeometricAnimationConfig = {
  type: 'rocket',
  shapes: [
    {
      type: 'rect',
      color: 'var(--color-accent-copper)',
      size: 48,
      delay: 0,
    },
    {
      type: 'circle',
      color: 'var(--color-accent-primary)',
      size: 16,
      delay: 0.1,
    },
    {
      type: 'circle',
      color: 'var(--color-accent-secondary)',
      size: 12,
      delay: 0.2,
    },
    {
      type: 'circle',
      color: 'var(--color-ink-tertiary)',
      size: 8,
      delay: 0.3,
    },
  ],
};

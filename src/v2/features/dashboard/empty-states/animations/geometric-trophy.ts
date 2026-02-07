/**
 * Geometric Trophy Animation
 *
 * Star/trophy shape assembling
 * For PRs/achievements empty states
 */

import type { GeometricAnimationConfig } from './index';

export const geometricTrophy: GeometricAnimationConfig = {
  type: 'trophy',
  shapes: [
    {
      type: 'circle',
      color: 'var(--color-accent-copper)',
      size: 32,
      delay: 0,
    },
    {
      type: 'rect',
      color: 'var(--color-accent-copper)',
      size: 16,
      delay: 0.1,
    },
    {
      type: 'rect',
      color: 'var(--color-accent-secondary)',
      size: 24,
      delay: 0.2,
    },
  ],
};

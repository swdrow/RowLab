/**
 * Geometric Chart Animation
 *
 * Rising bar chart lines
 * For erg/metrics empty states
 */

import type { GeometricAnimationConfig } from './index';

export const geometricChart: GeometricAnimationConfig = {
  type: 'chart',
  shapes: [
    {
      type: 'rect',
      color: 'var(--color-data-poor)',
      size: 30,
      delay: 0,
    },
    {
      type: 'rect',
      color: 'var(--color-data-good)',
      size: 50,
      delay: 0.1,
    },
    {
      type: 'rect',
      color: 'var(--color-data-excellent)',
      size: 70,
      delay: 0.2,
    },
    {
      type: 'rect',
      color: 'var(--color-accent-copper)',
      size: 60,
      delay: 0.3,
    },
  ],
};

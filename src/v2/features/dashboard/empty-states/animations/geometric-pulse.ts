/**
 * Geometric Pulse Animation
 *
 * Concentric circles pulsing outward
 * For general empty states
 */

import type { GeometricAnimationConfig } from './index';

export const geometricPulse: GeometricAnimationConfig = {
  type: 'pulse',
  shapes: [
    {
      type: 'circle',
      color: 'var(--color-accent-primary)',
      size: 40,
      delay: 0,
    },
    {
      type: 'circle',
      color: 'var(--color-accent-secondary)',
      size: 60,
      delay: 0.1,
    },
    {
      type: 'circle',
      color: 'var(--color-ink-tertiary)',
      size: 80,
      delay: 0.2,
    },
  ],
};

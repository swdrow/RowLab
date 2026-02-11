/**
 * Geometric Team Animation
 *
 * Circles forming a group
 * For attendance/roster empty states
 */

import type { GeometricAnimationConfig } from './index';

export const geometricTeam: GeometricAnimationConfig = {
  type: 'team',
  shapes: [
    {
      type: 'circle',
      color: 'var(--color-accent-primary)',
      size: 24,
      delay: 0,
    },
    {
      type: 'circle',
      color: 'var(--color-accent-secondary)',
      size: 24,
      delay: 0.08,
    },
    {
      type: 'circle',
      color: 'var(--color-ink-tertiary)',
      size: 24,
      delay: 0.16,
    },
    {
      type: 'circle',
      color: 'var(--color-border-subtle)',
      size: 24,
      delay: 0.24,
    },
  ],
};

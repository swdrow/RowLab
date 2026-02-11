/**
 * Geometric Calendar Animation
 *
 * Grid with dots appearing
 * For sessions/schedule empty states
 */

import type { GeometricAnimationConfig } from './index';

export const geometricCalendar: GeometricAnimationConfig = {
  type: 'calendar',
  shapes: [
    {
      type: 'circle',
      color: 'var(--color-accent-copper)',
      size: 8,
      delay: 0,
    },
    {
      type: 'circle',
      color: 'var(--color-accent-copper)',
      size: 8,
      delay: 0.1,
    },
    {
      type: 'circle',
      color: 'var(--color-accent-primary)',
      size: 8,
      delay: 0.2,
    },
    {
      type: 'circle',
      color: 'var(--color-ink-tertiary)',
      size: 8,
      delay: 0.3,
    },
    {
      type: 'circle',
      color: 'var(--color-ink-tertiary)',
      size: 8,
      delay: 0.4,
    },
    {
      type: 'circle',
      color: 'var(--color-ink-tertiary)',
      size: 8,
      delay: 0.5,
    },
  ],
};

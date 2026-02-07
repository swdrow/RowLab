/**
 * Geometric Animation System
 *
 * CSS/Framer Motion based geometric animations that achieve
 * Lottie-quality visuals but are code-native.
 *
 * Per CONTEXT.md: Abstract/minimal icons for empty states with
 * clean geometric icons with subtle gradients (Linear/Vercel style)
 */

export interface GeometricAnimationConfig {
  type: 'pulse' | 'chart' | 'calendar' | 'team' | 'trophy' | 'rocket';
  shapes: Array<{
    type: 'circle' | 'rect' | 'line' | 'arc';
    color: string; // CSS variable reference
    size: number;
    delay: number;
  }>;
}

// Import all animation configs
import { geometricPulse } from './geometric-pulse';
import { geometricChart } from './geometric-chart';
import { geometricCalendar } from './geometric-calendar';
import { geometricTeam } from './geometric-team';
import { geometricTrophy } from './geometric-trophy';
import { geometricRocket } from './geometric-rocket';

/**
 * Mapping of empty state contexts to animation configs
 */
export const EMPTY_STATE_ANIMATIONS = {
  roster: geometricTeam,
  practice: geometricCalendar,
  erg: geometricChart,
  general: geometricPulse,
  achievement: geometricTrophy,
  onboarding: geometricRocket,
} as const;

export type EmptyStateAnimationType = keyof typeof EMPTY_STATE_ANIMATIONS;

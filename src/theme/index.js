/**
 * Liquid Glass Design System
 * Main Theme Export
 *
 * Inspired by Apple iOS 26 design language
 * Combining translucency, vibrant gradients, soft lighting, and subtle depth
 */

import { liquidGlassColors } from './colors';
import { liquidGlassShadows } from './shadows';
import { liquidGlassTypography } from './typography';
import { liquidGlassAnimations } from './animations';
import { liquidGlassSpacing } from './spacing';

export const liquidGlassTheme = {
  colors: liquidGlassColors,
  shadows: liquidGlassShadows,
  typography: liquidGlassTypography,
  animations: liquidGlassAnimations,
  spacing: liquidGlassSpacing,
};

// Re-export individual modules for selective imports
export {
  liquidGlassColors,
  liquidGlassShadows,
  liquidGlassTypography,
  liquidGlassAnimations,
  liquidGlassSpacing,
};

export default liquidGlassTheme;

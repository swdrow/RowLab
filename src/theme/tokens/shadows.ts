/**
 * NOIR SPECTRUM Design System - Shadow Tokens
 * Dark-mode optimized elevation system
 * Inspired by: Netflix, Apple, Linear
 */

// ========================================
// STANDARD ELEVATION SHADOWS
// Optimized for dark backgrounds
// ========================================
export const shadows = {
  none: 'none',

  // Standard elevations (darker for dark mode)
  xs: '0 1px 2px rgba(0, 0, 0, 0.4)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.5)',
  DEFAULT: '0 2px 4px rgba(0, 0, 0, 0.5)',
  md: '0 4px 8px rgba(0, 0, 0, 0.5)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.5)',
  xl: '0 16px 32px rgba(0, 0, 0, 0.6)',
  '2xl': '0 24px 48px rgba(0, 0, 0, 0.7)',
  '3xl': '0 32px 64px rgba(0, 0, 0, 0.8)',

  // Inner shadows
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
  innerSm: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
  innerLg: 'inset 0 4px 8px rgba(0, 0, 0, 0.4)',
} as const;

// ========================================
// CARD SHADOWS
// With subtle top highlight for glass effect
// ========================================
export const cardShadows = {
  // Base card shadow
  base: '0 1px 3px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03)',

  // Elevated card (hover state)
  elevated: '0 8px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06)',

  // Active/selected card
  active: '0 2px 8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 112, 243, 0.3)',

  // Floating card (modals, dropdowns)
  floating: '0 16px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.05)',

  // Glass card with blur
  glass: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',

  // Kanban column
  column: '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04)',

  // Dragging card
  dragging: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(0, 112, 243, 0.4)',
} as const;

// ========================================
// GLOW SHADOWS (Accent colors)
// For hover states and emphasis
// ========================================
export const glowShadows = {
  // Primary accent (blade blue)
  accent: '0 0 20px rgba(0, 112, 243, 0.35), 0 0 40px rgba(0, 112, 243, 0.15)',
  accentSm: '0 0 12px rgba(0, 112, 243, 0.3)',
  accentLg: '0 0 30px rgba(0, 112, 243, 0.4), 0 0 60px rgba(0, 112, 243, 0.2)',

  // Blade blue specific
  bladeBlue: '0 0 20px rgba(0, 112, 243, 0.4)',
  bladeBlueIntense: '0 0 10px rgba(0, 112, 243, 0.5), 0 0 30px rgba(0, 112, 243, 0.3)',

  // Spectrum colors
  blue: '0 0 20px rgba(0, 112, 243, 0.35), 0 0 40px rgba(0, 112, 243, 0.15)',
  purple: '0 0 20px rgba(155, 114, 203, 0.35), 0 0 40px rgba(155, 114, 203, 0.15)',
  rose: '0 0 20px rgba(217, 101, 112, 0.35), 0 0 40px rgba(217, 101, 112, 0.15)',
  cyan: '0 0 20px rgba(6, 182, 212, 0.35), 0 0 40px rgba(6, 182, 212, 0.15)',
  emerald: '0 0 20px rgba(16, 185, 129, 0.35), 0 0 40px rgba(16, 185, 129, 0.15)',
  amber: '0 0 20px rgba(245, 158, 11, 0.35), 0 0 40px rgba(245, 158, 11, 0.15)',

  // Semantic colors
  success: '0 0 16px rgba(34, 197, 94, 0.3)',
  warning: '0 0 16px rgba(245, 158, 11, 0.3)',
  error: '0 0 16px rgba(239, 68, 68, 0.3)',
  info: '0 0 16px rgba(6, 182, 212, 0.3)',

  // Multi-color shimmer glow (Gemini-style)
  shimmer: '0 0 30px rgba(0, 112, 243, 0.25), 0 0 60px rgba(155, 114, 203, 0.15), 0 0 90px rgba(217, 101, 112, 0.10)',

  // Rowing specific
  port: '0 0 20px rgba(217, 101, 112, 0.35), 0 0 40px rgba(217, 101, 112, 0.15)',
  starboard: '0 0 20px rgba(16, 185, 129, 0.35), 0 0 40px rgba(16, 185, 129, 0.15)',
  coxswain: '0 0 20px rgba(155, 114, 203, 0.35), 0 0 40px rgba(155, 114, 203, 0.15)',
} as const;

// ========================================
// HIGHLIGHT SHADOWS
// Top edge highlight for depth
// ========================================
export const highlights = {
  subtle: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
  default: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  strong: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
  shimmer: 'inset 0 1px 0 rgba(255, 255, 255, 0.10)',
} as const;

// ========================================
// FOCUS SHADOWS
// For keyboard navigation
// ========================================
export const focusShadows = {
  default: '0 0 0 2px rgba(0, 112, 243, 0.5)',
  bladeBlue: '0 0 0 3px rgba(0, 112, 243, 0.15)',
  error: '0 0 0 2px rgba(239, 68, 68, 0.5)',
  success: '0 0 0 2px rgba(34, 197, 94, 0.5)',
} as const;

// ========================================
// COMBINED SHADOW UTILITIES
// Pre-composed for common use cases
// ========================================
export const composedShadows = {
  // Interactive button (hover)
  buttonHover: `${shadows.md}, ${glowShadows.accentSm}`,

  // Floating modal/dialog
  modal: `${cardShadows.floating}`,

  // Command palette
  commandPalette: '0 24px 80px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.08)',

  // Tooltip
  tooltip: '0 4px 12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06)',

  // Dropdown menu
  dropdown: '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.05)',

  // Sidebar
  sidebar: '4px 0 24px rgba(0, 0, 0, 0.4)',

  // Kanban card dragging
  cardDragging: `${cardShadows.dragging}`,

  // Athlete card on hover
  athleteCard: `${cardShadows.elevated}, ${highlights.strong}`,

  // Seat slot when drag over
  seatDropTarget: `${focusShadows.default}, ${glowShadows.accentSm}`,
} as const;

export default {
  shadows,
  cardShadows,
  glowShadows,
  highlights,
  focusShadows,
  composedShadows,
};

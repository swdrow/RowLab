/**
 * NOIR SPECTRUM Design System - Color Tokens
 * Deep blacks + Rainbow shimmer accents
 * Inspired by: Apple, Netflix, Stripe, Gemini, Linear
 */

// ========================================
// SURFACE PALETTE - Deep blacks/charcoals
// Netflix/Apple dark mode inspired
// ========================================
export const surface = {
  950: '#000000',      // True black - modal backdrop, deepest layer
  900: '#0a0a0a',      // Primary background - main app canvas
  850: '#0f0f0f',      // Elevated background - sidebar collapsed
  800: '#141414',      // Card background - primary containers
  750: '#1a1a1a',      // Raised cards - hover states
  700: '#212121',      // Interactive hover - buttons, inputs
  650: '#2a2a2a',      // Active states - pressed buttons
  600: '#333333',      // Borders strong
  500: '#404040',      // Borders default
  400: '#525252',      // Borders subtle
  300: '#6b6b6b',      // Disabled text
  200: '#8a8a8a',      // Placeholder text
  100: '#a3a3a3',      // Secondary text light
} as const;

// ========================================
// BLADE BLUE - Primary accent
// ========================================
export const blade = {
  blue: '#0070F3',       // Primary action
  hover: '#2186EB',      // Hover state
  active: '#0062D1',     // Active/pressed
  subtle: 'rgba(0, 112, 243, 0.15)',
  muted: 'rgba(0, 112, 243, 0.08)',
  glow: 'rgba(0, 112, 243, 0.4)',
} as const;

// ========================================
// SPECTRUM PALETTE - Rainbow shimmer colors
// Gemini 74deg gradient inspired
// ========================================
export const spectrum = {
  blue: '#0070F3',       // Blade blue - primary actions
  indigo: '#6366F1',     // Secondary accent - CTAs
  violet: '#8B5CF6',     // Secondary accent
  purple: '#9B72CB',     // Gemini purple
  fuchsia: '#D946EF',    // Highlights
  pink: '#EC4899',       // Special accents
  rose: '#D96570',       // Gemini rose/coral - PORT SIDE
  red: '#EF4444',        // Errors/danger
  orange: '#F97316',     // Warnings
  amber: '#F59E0B',      // Performance metrics
  yellow: '#EAB308',     // Attention
  lime: '#84CC16',       // Lime
  green: '#22C55E',      // Success
  emerald: '#10B981',    // STARBOARD SIDE
  teal: '#14B8A6',       // Teal accents
  cyan: '#06B6D4',       // Data/speed metrics
} as const;

// ========================================
// PRIMARY ACCENT SCALE (Blade Blue)
// ========================================
export const accent = {
  50: '#EBF5FF',
  100: '#D6EBFF',
  200: '#ADD6FF',
  300: '#85C2FF',
  400: '#5CADFF',
  500: '#0070F3',    // DEFAULT - Blade Blue
  600: '#0062D1',
  700: '#0054B4',
  800: '#004697',
  900: '#00387A',
  950: '#002A5C',
} as const;

// ========================================
// SEMANTIC COLORS
// ========================================
export const semantic = {
  success: {
    light: '#86EFAC',
    base: '#22C55E',
    dark: '#16A34A',
    muted: 'rgba(34, 197, 94, 0.15)',
  },
  warning: {
    light: '#FCD34D',
    base: '#F59E0B',
    dark: '#D97706',
    muted: 'rgba(245, 158, 11, 0.15)',
  },
  error: {
    light: '#FCA5A5',
    base: '#EF4444',
    dark: '#DC2626',
    muted: 'rgba(239, 68, 68, 0.15)',
  },
  info: {
    light: '#67E8F9',
    base: '#06B6D4',
    dark: '#0891B2',
    muted: 'rgba(6, 182, 212, 0.15)',
  },
} as const;

// ========================================
// TEXT COLORS (alpha-based for consistency)
// ========================================
export const text = {
  primary: 'rgba(255, 255, 255, 0.95)',
  secondary: 'rgba(255, 255, 255, 0.70)',
  tertiary: 'rgba(255, 255, 255, 0.50)',
  muted: 'rgba(255, 255, 255, 0.35)',
  disabled: 'rgba(255, 255, 255, 0.25)',
} as const;

// ========================================
// BORDER COLORS
// ========================================
export const border = {
  subtle: 'rgba(255, 255, 255, 0.06)',
  default: 'rgba(255, 255, 255, 0.10)',
  strong: 'rgba(255, 255, 255, 0.15)',
  accent: 'rgba(0, 112, 243, 0.40)',
  focus: 'rgba(0, 112, 243, 0.60)',
} as const;

// ========================================
// ROWING-SPECIFIC COLORS
// ========================================
export const rowing = {
  port: {
    base: '#D96570',
    light: '#F5A3AD',
    dark: '#B74D57',
    muted: 'rgba(217, 101, 112, 0.15)',
    border: 'rgba(217, 101, 112, 0.30)',
  },
  starboard: {
    base: '#10B981',
    light: '#6EE7B7',
    dark: '#059669',
    muted: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.30)',
  },
  coxswain: {
    base: '#9B72CB',
    light: '#C4A8E0',
    dark: '#7C5BA3',
    muted: 'rgba(155, 114, 203, 0.15)',
    border: 'rgba(155, 114, 203, 0.30)',
  },
} as const;

// ========================================
// GRADIENT DEFINITIONS
// ========================================
export const gradients = {
  // Blade blue gradient (primary)
  bladeBlue: 'linear-gradient(135deg, #0070F3 0%, #2186EB 100%)',
  bladeBlueSubtle: 'linear-gradient(135deg, rgba(0, 112, 243, 0.15) 0%, rgba(33, 134, 235, 0.10) 100%)',

  // Gemini-style shimmer (74deg angle, animated)
  shimmer: 'linear-gradient(74deg, #0070F3 0%, #9B72CB 15%, #D96570 30%, #0070F3 45%, #9B72CB 60%, #D96570 75%, #0070F3 90%, #9B72CB 100%)',
  shimmerSubtle: 'linear-gradient(74deg, rgba(0, 112, 243, 0.15) 0%, rgba(155, 114, 203, 0.15) 25%, rgba(217, 101, 112, 0.15) 50%, rgba(0, 112, 243, 0.15) 75%, rgba(155, 114, 203, 0.15) 100%)',

  // Primary gradient
  primary: 'linear-gradient(135deg, #0070F3 0%, #2186EB 50%, #6366F1 100%)',
  primarySubtle: 'linear-gradient(135deg, rgba(0, 112, 243, 0.15) 0%, rgba(99, 102, 241, 0.10) 100%)',

  // Accent gradients
  accent: 'linear-gradient(135deg, #0070F3 0%, #2186EB 50%, #6366F1 100%)',
  warm: 'linear-gradient(135deg, #D96570 0%, #EC4899 50%, #9B72CB 100%)',
  cool: 'linear-gradient(135deg, #06B6D4 0%, #0070F3 50%, #6366F1 100%)',

  // Full rainbow
  rainbow: 'linear-gradient(90deg, #0070F3, #6366F1, #8B5CF6, #9B72CB, #D946EF, #EC4899, #D96570, #F97316, #F59E0B, #22C55E, #14B8A6, #06B6D4, #0070F3)',

  // Background mesh (Stripe-inspired)
  mesh: `
    radial-gradient(ellipse 80% 50% at 20% 30%, rgba(0, 112, 243, 0.08) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 20%, rgba(139, 92, 246, 0.06) 0%, transparent 60%),
    radial-gradient(ellipse 50% 50% at 60% 80%, rgba(217, 101, 112, 0.04) 0%, transparent 60%)
  `,

  // Hero glow
  heroGlow: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0, 112, 243, 0.15) 0%, transparent 70%)',

  // Sidebar gradient
  sidebar: 'linear-gradient(180deg, rgba(20, 20, 20, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',

  // Command palette glow
  commandGlow: 'radial-gradient(ellipse 100% 100% at 50% 0%, rgba(0, 112, 243, 0.10) 0%, transparent 50%)',
} as const;

// ========================================
// GLOW EFFECTS
// ========================================
export const glows = {
  accent: '0 0 20px rgba(0, 112, 243, 0.35), 0 0 40px rgba(0, 112, 243, 0.15)',
  blue: '0 0 20px rgba(0, 112, 243, 0.35), 0 0 40px rgba(0, 112, 243, 0.15)',
  bladeBlue: '0 0 20px rgba(0, 112, 243, 0.4)',
  bladeBlueIntense: '0 0 10px rgba(0, 112, 243, 0.5), 0 0 30px rgba(0, 112, 243, 0.3)',
  purple: '0 0 20px rgba(155, 114, 203, 0.35), 0 0 40px rgba(155, 114, 203, 0.15)',
  rose: '0 0 20px rgba(217, 101, 112, 0.35), 0 0 40px rgba(217, 101, 112, 0.15)',
  cyan: '0 0 20px rgba(6, 182, 212, 0.35), 0 0 40px rgba(6, 182, 212, 0.15)',
  emerald: '0 0 20px rgba(16, 185, 129, 0.35), 0 0 40px rgba(16, 185, 129, 0.15)',
  shimmer: '0 0 30px rgba(0, 112, 243, 0.25), 0 0 60px rgba(155, 114, 203, 0.15), 0 0 90px rgba(217, 101, 112, 0.10)',
} as const;

export default {
  blade,
  surface,
  spectrum,
  accent,
  semantic,
  text,
  border,
  rowing,
  gradients,
  glows,
};

/**
 * NOIR SPECTRUM Design System - Color Tokens
 * Deep blacks + Rainbow shimmer accents
 * Inspired by: Apple, Netflix, Stripe, Gemini, Tailwind
 */

export const noirSpectrumColors = {
  // ========================================
  // SURFACE PALETTE - Deep blacks/charcoals
  // ========================================
  surface: {
    950: '#000000',      // True black - modal backdrop
    900: '#0a0a0a',      // Primary background
    850: '#0f0f0f',      // Elevated background
    800: '#141414',      // Card background
    750: '#1a1a1a',      // Raised cards
    700: '#212121',      // Interactive hover
    650: '#2a2a2a',      // Active states
    600: '#333333',      // Borders strong
    500: '#404040',      // Borders default
    400: '#525252',      // Borders subtle
  },

  // ========================================
  // BLADE BLUE - Primary accent
  // ========================================
  blade: {
    blue: '#0070F3',       // Primary action
    hover: '#2186EB',      // Hover state
    active: '#0062D1',     // Active/pressed
    subtle: 'rgba(0, 112, 243, 0.15)',
    muted: 'rgba(0, 112, 243, 0.08)',
    glow: 'rgba(0, 112, 243, 0.4)',
  },

  // ========================================
  // SPECTRUM PALETTE - Rainbow shimmer colors
  // ========================================
  spectrum: {
    blue: '#0070F3',       // Blade blue - primary actions
    indigo: '#6366F1',     // Indigo - secondary accent
    violet: '#8B5CF6',     // Violet - secondary accent
    purple: '#9B72CB',     // Gemini purple
    fuchsia: '#D946EF',    // Fuchsia - highlights
    pink: '#EC4899',       // Pink - special
    rose: '#D96570',       // Gemini rose/coral - port side
    red: '#EF4444',        // Red - errors/danger
    orange: '#F97316',     // Orange - warnings
    amber: '#F59E0B',      // Amber - performance
    yellow: '#EAB308',     // Yellow - attention
    lime: '#84CC16',       // Lime
    green: '#22C55E',      // Green - success
    emerald: '#10B981',    // Emerald - starboard side
    teal: '#14B8A6',       // Teal
    cyan: '#06B6D4',       // Cyan - data/speed
  },

  // ========================================
  // PRIMARY ACCENT SCALE (Blade Blue)
  // ========================================
  accent: {
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
  },

  // ========================================
  // SEMANTIC COLORS
  // ========================================
  semantic: {
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
  },

  // ========================================
  // TEXT COLORS
  // ========================================
  text: {
    // Dark mode (default)
    dark: {
      primary: 'rgba(255, 255, 255, 0.95)',
      secondary: 'rgba(255, 255, 255, 0.70)',
      tertiary: 'rgba(255, 255, 255, 0.50)',
      muted: 'rgba(255, 255, 255, 0.35)',
      disabled: 'rgba(255, 255, 255, 0.25)',
    },
    // Light mode
    light: {
      primary: 'rgba(0, 0, 0, 0.90)',
      secondary: 'rgba(0, 0, 0, 0.65)',
      tertiary: 'rgba(0, 0, 0, 0.45)',
      muted: 'rgba(0, 0, 0, 0.30)',
      disabled: 'rgba(0, 0, 0, 0.20)',
    },
  },

  // ========================================
  // BORDER COLORS
  // ========================================
  border: {
    // Dark mode (default)
    dark: {
      subtle: 'rgba(255, 255, 255, 0.06)',
      default: 'rgba(255, 255, 255, 0.10)',
      strong: 'rgba(255, 255, 255, 0.15)',
      accent: 'rgba(0, 112, 243, 0.40)',
    },
    // Light mode
    light: {
      subtle: 'rgba(0, 0, 0, 0.06)',
      default: 'rgba(0, 0, 0, 0.10)',
      strong: 'rgba(0, 0, 0, 0.15)',
      accent: 'rgba(0, 112, 243, 0.30)',
    },
  },

  // ========================================
  // ROWING-SPECIFIC COLORS
  // ========================================
  rowing: {
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
  },

  // ========================================
  // GRADIENT DEFINITIONS
  // ========================================
  gradients: {
    // Blade blue gradient (primary)
    bladeBlue: 'linear-gradient(135deg, #0070F3 0%, #2186EB 100%)',
    bladeBlueSubtle: 'linear-gradient(135deg, rgba(0, 112, 243, 0.15) 0%, rgba(33, 134, 235, 0.10) 100%)',

    // Gemini-style shimmer (animated)
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

    // Background mesh
    mesh: `
      radial-gradient(ellipse 80% 50% at 20% 30%, rgba(0, 112, 243, 0.06) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 20%, rgba(139, 92, 246, 0.04) 0%, transparent 60%),
      radial-gradient(ellipse 50% 50% at 60% 80%, rgba(217, 101, 112, 0.03) 0%, transparent 60%)
    `,

    // Hero glow
    heroGlow: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0, 112, 243, 0.12) 0%, transparent 70%)',
  },

  // ========================================
  // GLOW EFFECTS
  // ========================================
  glows: {
    accent: '0 0 20px rgba(0, 112, 243, 0.35), 0 0 40px rgba(0, 112, 243, 0.15)',
    blue: '0 0 20px rgba(0, 112, 243, 0.35), 0 0 40px rgba(0, 112, 243, 0.15)',
    bladeBlue: '0 0 20px rgba(0, 112, 243, 0.4)',
    bladeBlueIntense: '0 0 10px rgba(0, 112, 243, 0.5), 0 0 30px rgba(0, 112, 243, 0.3)',
    purple: '0 0 20px rgba(155, 114, 203, 0.35), 0 0 40px rgba(155, 114, 203, 0.15)',
    rose: '0 0 20px rgba(217, 101, 112, 0.35), 0 0 40px rgba(217, 101, 112, 0.15)',
    cyan: '0 0 20px rgba(6, 182, 212, 0.35), 0 0 40px rgba(6, 182, 212, 0.15)',
    emerald: '0 0 20px rgba(16, 185, 129, 0.35), 0 0 40px rgba(16, 185, 129, 0.15)',
    shimmer: '0 0 30px rgba(0, 112, 243, 0.25), 0 0 60px rgba(155, 114, 203, 0.15), 0 0 90px rgba(217, 101, 112, 0.10)',
  },
};

// Export for backward compatibility
export const liquidGlassColors = noirSpectrumColors;

export default noirSpectrumColors;

/**
 * Liquid Glass Color System
 * Inspired by Apple iOS 26 design language
 *
 * Philosophy:
 * - Luminous, translucent colors with subtle iridescence
 * - Light/Dark mode adaptive palettes
 * - Glassmorphic layering with depth hierarchy
 */

export const liquidGlassColors = {
  // Primary Glass Tints (Light Mode)
  glass: {
    subtle: 'rgba(255, 255, 255, 0.4)',
    base: 'rgba(255, 255, 255, 0.6)',
    elevated: 'rgba(255, 255, 255, 0.8)',
    strong: 'rgba(255, 255, 255, 0.95)',
  },

  // Primary Glass Tints (Dark Mode)
  glassDark: {
    subtle: 'rgba(20, 20, 30, 0.4)',
    base: 'rgba(28, 28, 40, 0.6)',
    elevated: 'rgba(35, 35, 50, 0.8)',
    strong: 'rgba(45, 45, 60, 0.95)',
  },

  // Accent Colors - Luminous iOS-inspired gradients
  accent: {
    // Primary Blue (iOS Control Center style)
    blue: {
      light: '#64B5F6',
      base: '#0A84FF',
      dark: '#0066CC',
      glow: 'rgba(10, 132, 255, 0.3)',
    },

    // Purple (Liquid effect)
    purple: {
      light: '#CE93D8',
      base: '#BF5AF2',
      dark: '#9D4EDD',
      glow: 'rgba(191, 90, 242, 0.3)',
    },

    // Teal (Vibrant accent)
    teal: {
      light: '#4DD0E1',
      base: '#00C7BE',
      dark: '#00A39C',
      glow: 'rgba(0, 199, 190, 0.3)',
    },

    // Pink (Highlight color)
    pink: {
      light: '#F48FB1',
      base: '#FF2D55',
      dark: '#CC0044',
      glow: 'rgba(255, 45, 85, 0.3)',
    },

    // Amber (Warm accent)
    amber: {
      light: '#FFD54F',
      base: '#FFAB00',
      dark: '#FF8F00',
      glow: 'rgba(255, 171, 0, 0.3)',
    },
  },

  // Rowing-specific Colors (enhanced with glass effect)
  rowing: {
    port: {
      light: '#EF5350',
      base: '#EF4444',
      dark: '#C62828',
      glass: 'rgba(239, 68, 68, 0.15)',
    },
    starboard: {
      light: '#66BB6A',
      base: '#22C55E',
      dark: '#2E7D32',
      glass: 'rgba(34, 197, 94, 0.15)',
    },
    gold: {
      light: '#FFD740',
      base: '#FFC107',
      dark: '#FFA000',
      glass: 'rgba(255, 193, 7, 0.15)',
    },
  },

  // Semantic Colors
  semantic: {
    success: {
      light: '#81C784',
      base: '#4CAF50',
      dark: '#388E3C',
      glass: 'rgba(76, 175, 80, 0.15)',
    },
    warning: {
      light: '#FFB74D',
      base: '#FF9800',
      dark: '#F57C00',
      glass: 'rgba(255, 152, 0, 0.15)',
    },
    error: {
      light: '#E57373',
      base: '#F44336',
      dark: '#D32F2F',
      glass: 'rgba(244, 67, 54, 0.15)',
    },
    info: {
      light: '#64B5F6',
      base: '#2196F3',
      dark: '#1976D2',
      glass: 'rgba(33, 150, 243, 0.15)',
    },
  },

  // Border Colors (glass edges)
  border: {
    light: {
      subtle: 'rgba(255, 255, 255, 0.1)',
      base: 'rgba(255, 255, 255, 0.2)',
      strong: 'rgba(255, 255, 255, 0.4)',
    },
    dark: {
      subtle: 'rgba(255, 255, 255, 0.05)',
      base: 'rgba(255, 255, 255, 0.1)',
      strong: 'rgba(255, 255, 255, 0.2)',
    },
  },

  // Gradient Presets (iOS-inspired)
  gradients: {
    // Control Center style gradients
    blueViolet: 'linear-gradient(135deg, #0A84FF 0%, #BF5AF2 100%)',
    tealBlue: 'linear-gradient(135deg, #00C7BE 0%, #0A84FF 100%)',
    pinkOrange: 'linear-gradient(135deg, #FF2D55 0%, #FF9500 100%)',
    purplePink: 'linear-gradient(135deg, #BF5AF2 0%, #FF2D55 100%)',

    // Glass surface gradients (light mode)
    glassLight: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
    glassLightSubtle: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.2) 100%)',

    // Glass surface gradients (dark mode)
    glassDark: 'linear-gradient(135deg, rgba(40, 40, 60, 0.9) 0%, rgba(20, 20, 35, 0.6) 100%)',
    glassDarkSubtle: 'linear-gradient(135deg, rgba(35, 35, 50, 0.7) 0%, rgba(20, 20, 30, 0.4) 100%)',

    // Ambient mesh backgrounds
    meshLight: `
      radial-gradient(at 0% 0%, rgba(10, 132, 255, 0.08) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(191, 90, 242, 0.08) 0px, transparent 50%),
      radial-gradient(at 100% 100%, rgba(0, 199, 190, 0.08) 0px, transparent 50%),
      radial-gradient(at 0% 100%, rgba(255, 45, 85, 0.08) 0px, transparent 50%)
    `,
    meshDark: `
      radial-gradient(at 0% 0%, rgba(10, 132, 255, 0.12) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(191, 90, 242, 0.12) 0px, transparent 50%),
      radial-gradient(at 100% 100%, rgba(0, 199, 190, 0.12) 0px, transparent 50%),
      radial-gradient(at 0% 100%, rgba(255, 45, 85, 0.12) 0px, transparent 50%)
    `,
  },

  // Glow/Bloom effects
  glow: {
    blue: '0 0 20px rgba(10, 132, 255, 0.3), 0 0 40px rgba(10, 132, 255, 0.15)',
    purple: '0 0 20px rgba(191, 90, 242, 0.3), 0 0 40px rgba(191, 90, 242, 0.15)',
    teal: '0 0 20px rgba(0, 199, 190, 0.3), 0 0 40px rgba(0, 199, 190, 0.15)',
    pink: '0 0 20px rgba(255, 45, 85, 0.3), 0 0 40px rgba(255, 45, 85, 0.15)',
    white: '0 0 20px rgba(255, 255, 255, 0.2), 0 0 40px rgba(255, 255, 255, 0.1)',
  },
};

export default liquidGlassColors;

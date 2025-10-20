/**
 * Liquid Glass Typography System
 *
 * Philosophy:
 * - Apple San Francisco inspired font stack
 * - Adaptive sizing and weights
 * - Optimal legibility over translucent backgrounds
 */

export const liquidGlassTypography = {
  // Font families
  fonts: {
    // Primary UI font (San Francisco style)
    primary: [
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"SF Pro Display"',
      '"SF Pro Text"',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(', '),

    // Monospace (for data/code)
    mono: [
      '"SF Mono"',
      'ui-monospace',
      'Menlo',
      'Monaco',
      '"Cascadia Code"',
      '"Courier New"',
      'monospace',
    ].join(', '),

    // Display (for hero text)
    display: [
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"SF Pro Display"',
      'sans-serif',
    ].join(', '),
  },

  // Font sizes (rem-based for accessibility)
  sizes: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
  },

  // Font weights
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line heights
  lineHeights: {
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.02em',
    tight: '-0.01em',
    normal: '0',
    wide: '0.01em',
    wider: '0.02em',
    widest: '0.05em',
  },

  // Preset text styles for common use cases
  presets: {
    // Page titles
    hero: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },

    // Section headings
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.375,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.375,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },

    // Body text
    bodyLarge: {
      fontSize: '1.125rem',
      fontWeight: 400,
      lineHeight: 1.625,
    },
    body: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    bodySmall: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },

    // UI labels
    label: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.375,
      letterSpacing: '0.01em',
    },
    labelSmall: {
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: 1.375,
      letterSpacing: '0.02em',
    },

    // Button text
    button: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '0.01em',
    },
    buttonSmall: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '0.01em',
    },

    // Caption/helper text
    caption: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.375,
    },
    captionSmall: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.375,
    },

    // Monospace for data
    mono: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    monoSmall: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
  },

  // Text color opacity levels for glass backgrounds
  opacity: {
    primary: {
      light: 0.95,    // Dark text on light glass
      dark: 0.95,     // Light text on dark glass
    },
    secondary: {
      light: 0.7,     // Muted text
      dark: 0.7,
    },
    tertiary: {
      light: 0.5,     // Subtle text
      dark: 0.5,
    },
    disabled: {
      light: 0.3,
      dark: 0.3,
    },
  },
};

export default liquidGlassTypography;

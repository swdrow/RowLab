/**
 * Liquid Glass Shadow & Blur System
 *
 * Philosophy:
 * - Multi-layered shadows for depth
 * - Adaptive blur values for glass effect
 * - Elevation hierarchy from subtle to floating
 */

export const liquidGlassShadows = {
  // Blur intensities (backdrop-filter)
  blur: {
    none: '0px',
    subtle: '8px',
    base: '16px',
    strong: '24px',
    intense: '40px',
  },

  // Shadow layers for glass depth
  shadows: {
    // No elevation
    none: 'none',

    // Subtle glass - minimal depth
    subtle: {
      light: '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
      dark: '0 2px 8px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4)',
    },

    // Base glass - standard cards
    base: {
      light: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
      dark: '0 4px 16px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.5)',
    },

    // Elevated glass - hover states, interactive elements
    elevated: {
      light: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
      dark: '0 8px 24px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.6)',
    },

    // Strong glass - modals, dropdowns
    strong: {
      light: '0 16px 48px rgba(0, 0, 0, 0.16), 0 8px 16px rgba(0, 0, 0, 0.12)',
      dark: '0 16px 48px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.7)',
    },

    // Floating glass - top-most overlays
    floating: {
      light: '0 24px 64px rgba(0, 0, 0, 0.2), 0 16px 32px rgba(0, 0, 0, 0.14)',
      dark: '0 24px 64px rgba(0, 0, 0, 0.8), 0 16px 32px rgba(0, 0, 0, 0.85)',
    },
  },

  // Inner shadows for glass thickness effect
  innerShadows: {
    subtle: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
    base: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
    strong: 'inset 0 3px 6px rgba(0, 0, 0, 0.08)',
  },

  // Glow effects (for focus/active states)
  glows: {
    blue: {
      subtle: '0 0 0 2px rgba(10, 132, 255, 0.2)',
      base: '0 0 0 3px rgba(10, 132, 255, 0.3), 0 0 12px rgba(10, 132, 255, 0.2)',
      strong: '0 0 0 4px rgba(10, 132, 255, 0.4), 0 0 20px rgba(10, 132, 255, 0.3)',
    },
    purple: {
      subtle: '0 0 0 2px rgba(191, 90, 242, 0.2)',
      base: '0 0 0 3px rgba(191, 90, 242, 0.3), 0 0 12px rgba(191, 90, 242, 0.2)',
      strong: '0 0 0 4px rgba(191, 90, 242, 0.4), 0 0 20px rgba(191, 90, 242, 0.3)',
    },
    teal: {
      subtle: '0 0 0 2px rgba(0, 199, 190, 0.2)',
      base: '0 0 0 3px rgba(0, 199, 190, 0.3), 0 0 12px rgba(0, 199, 190, 0.2)',
      strong: '0 0 0 4px rgba(0, 199, 190, 0.4), 0 0 20px rgba(0, 199, 190, 0.3)',
    },
    white: {
      subtle: '0 0 0 2px rgba(255, 255, 255, 0.2)',
      base: '0 0 0 3px rgba(255, 255, 255, 0.3), 0 0 12px rgba(255, 255, 255, 0.15)',
      strong: '0 0 0 4px rgba(255, 255, 255, 0.4), 0 0 20px rgba(255, 255, 255, 0.2)',
    },
  },

  // Combined shadow + glow for interactive states
  interactive: {
    hover: {
      light: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.3)',
      dark: '0 8px 24px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    },
    active: {
      light: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.06), inset 0 2px 4px rgba(0, 0, 0, 0.04)',
      dark: '0 2px 8px rgba(0, 0, 0, 0.4), 0 1px 4px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(0, 0, 0, 0.3)',
    },
  },

  // Edge highlights (for glass realism)
  highlights: {
    top: 'inset 0 1px 0 rgba(255, 255, 255, 0.4)',
    topSubtle: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    topDark: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  },
};

export default liquidGlassShadows;

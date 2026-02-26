/**
 * oarbit Design System Tokens
 *
 * Source of truth: docs/plans/2026-02-21-oarbit-rebrand-design.md
 * All colors in oklch. Void hue 270 (blue-violet) for surfaces.
 * Multicolor accent system: teal (interactive), sand (warm emphasis),
 * coral (alert/highlight), ivory (light accent).
 */

// ---------------------------------------------------------------------------
// Color Tokens
// ---------------------------------------------------------------------------

export const colors = {
  void: {
    deep: 'oklch(0.06 0.012 270)',
    surface: 'oklch(0.13 0.008 270)',
    raised: 'oklch(0.15 0.007 270)',
    overlay: 'oklch(0.19 0.006 270)',
  },

  text: {
    bright: 'oklch(0.92 0.005 80)',
    default: 'oklch(0.75 0.006 80)',
    dim: 'oklch(0.55 0.008 270)',
    faint: 'oklch(0.40 0.006 270)',
  },

  accent: {
    teal: 'oklch(0.55 0.06 195)',
    sand: 'oklch(0.68 0.04 80)',
    coral: 'oklch(0.58 0.05 30)',
    ivory: 'oklch(0.85 0.02 90)',
  },

  edge: {
    default: 'oklch(0.26 0.008 270 / 0.6)',
    hover: 'oklch(0.30 0.01 270 / 0.5)',
  },

  data: {
    excellent: {
      base: 'oklch(0.72 0.17 152)',
      subtle: 'oklch(0.72 0.17 152 / 0.10)',
    },
    good: {
      base: 'oklch(0.62 0.15 240)',
      subtle: 'oklch(0.62 0.15 240 / 0.10)',
    },
    warning: {
      base: 'oklch(0.75 0.14 82)',
      subtle: 'oklch(0.75 0.14 82 / 0.10)',
    },
    poor: {
      base: 'oklch(0.60 0.19 28)',
      subtle: 'oklch(0.60 0.19 28 / 0.10)',
    },
  },

  machine: {
    rower: 'oklch(0.55 0.06 195)',
    bike: 'oklch(0.55 0.05 320)',
    ski: 'oklch(0.55 0.05 145)',
    otw: 'oklch(0.55 0.07 200)',
  },

  nebula: {
    blue: 'oklch(0.35 0.06 260)',
    violet: 'oklch(0.30 0.06 300)',
    amber: 'oklch(0.40 0.05 75)',
    teal: 'oklch(0.32 0.05 200)',
    rose: 'oklch(0.35 0.05 350)',
  },

  zone: {
    ut2: 'oklch(0.62 0.13 240)',
    ut1: 'oklch(0.68 0.14 155)',
    at: 'oklch(0.72 0.13 82)',
    tr: 'oklch(0.60 0.16 28)',
  },
} as const satisfies Record<string, Record<string, string | Record<string, string>>>;

// ---------------------------------------------------------------------------
// Typography Tokens
// ---------------------------------------------------------------------------

export const typography = {
  fontFamily: {
    display: "'Space Grotesk', sans-serif",
    body: "'Inter', sans-serif",
    mono: "'Space Mono', monospace",
  },

  fontSize: {
    heroMetric: '2rem', // 32px
    h1: '1.75rem', // 28px
    h2: '1rem', // 16px
    sectionLabel: '0.8125rem', // 13px
    body: '0.875rem', // 14px
    small: '0.8125rem', // 13px
    caption: '0.75rem', // 12px
    micro: '0.6875rem', // 11px
    data: '0.8125rem', // 13px (mono)
    dataLg: '1.125rem', // 18px (mono)
    dataXl: '1.5rem', // 24px (mono)
  },

  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    display: '1.2',
    h1: '1.2',
    h2: '1.3',
    body: '1.5',
    small: '1.45',
    caption: '1.4',
    data: '1.2',
  },

  letterSpacing: {
    caps: '0.08em',
    data: '-0.02em',
    default: '0',
  },
} as const satisfies {
  fontFamily: Record<string, string>;
  fontSize: Record<string, string>;
  fontWeight: Record<string, number>;
  lineHeight: Record<string, string>;
  letterSpacing: Record<string, string>;
};

// ---------------------------------------------------------------------------
// Spacing Tokens (4px base)
// ---------------------------------------------------------------------------

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
} as const satisfies Record<number, string>;

// ---------------------------------------------------------------------------
// Border Radius Tokens
// ---------------------------------------------------------------------------

export const radius = {
  sm: '4px',
  md: '5px',
  lg: '6px',
  xl: '8px',
} as const satisfies Record<string, string>;

// ---------------------------------------------------------------------------
// Shadow Tokens
// ---------------------------------------------------------------------------

export const shadows = {
  sm: '0 1px 2px oklch(0 0 0 / 0.25)',
  md: '0 2px 8px oklch(0 0 0 / 0.3), 0 1px 2px oklch(0 0 0 / 0.2)',
  lg: '0 8px 32px oklch(0.01 0.012 270 / 0.7), inset 0 1px 0 oklch(0.30 0.01 270 / 0.08)',
  ring: '0 0 0 1px oklch(0.26 0.008 270 / 0.5)',
  focus: '0 0 0 2px oklch(0.55 0.06 195 / 0.2)',
} as const satisfies Record<string, string>;

// ---------------------------------------------------------------------------
// Motion Tokens
// ---------------------------------------------------------------------------

export const motion = {
  spring: {
    snap: { stiffness: 400, damping: 30, mass: 0.8 },
    standard: { stiffness: 250, damping: 25, mass: 1.0 },
    flow: { stiffness: 160, damping: 28, mass: 1.0 },
    data: { stiffness: 300, damping: 35, mass: 1.0 },
  },

  duration: {
    instant: '0ms',
    micro: '100ms',
    standard: '200ms',
    emphasis: '350ms',
  },

  easing: {
    out: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    comet: 'cubic-bezier(0.22, 0.1, 0.36, 1)',
  },
} as const satisfies {
  spring: Record<string, { stiffness: number; damping: number; mass: number }>;
  duration: Record<string, string>;
  easing: Record<string, string>;
};

// ---------------------------------------------------------------------------
// Composite Exports
// ---------------------------------------------------------------------------

export const tokens = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  motion,
} as const;

export type DesignTokens = typeof tokens;
export type ColorTokens = typeof colors;
export type TypographyTokens = typeof typography;
export type SpacingTokens = typeof spacing;
export type RadiusTokens = typeof radius;
export type ShadowTokens = typeof shadows;
export type MotionTokens = typeof motion;

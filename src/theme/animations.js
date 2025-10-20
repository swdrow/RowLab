/**
 * Liquid Glass Animation System
 *
 * Philosophy:
 * - Fluid, organic motion inspired by liquid/glass physics
 * - Apple-style easing curves (cubic-bezier)
 * - Subtle, never jarring
 */

export const liquidGlassAnimations = {
  // Easing curves (iOS-inspired)
  easings: {
    // Standard iOS easing
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',

    // Deceleration (ease-out) - for entrances
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',

    // Acceleration (ease-in) - for exits
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',

    // Sharp - for quick transitions
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',

    // Smooth - for glass morphing
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',

    // Bounce - for playful interactions
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

    // Glass liquid - custom curve for glass effect
    liquid: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // Duration presets
  durations: {
    instant: '100ms',
    fast: '200ms',
    normal: '300ms',
    slow: '400ms',
    slower: '600ms',
    slowest: '800ms',
  },

  // Keyframe animations
  keyframes: {
    // Fade effects
    fadeIn: {
      name: 'fadeIn',
      frames: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `,
    },
    fadeOut: {
      name: 'fadeOut',
      frames: `
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `,
    },

    // Scale effects
    scaleIn: {
      name: 'scaleIn',
      frames: `
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `,
    },
    scaleOut: {
      name: 'scaleOut',
      frames: `
        @keyframes scaleOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.9);
          }
        }
      `,
    },

    // Slide effects
    slideUp: {
      name: 'slideUp',
      frames: `
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `,
    },
    slideDown: {
      name: 'slideDown',
      frames: `
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `,
    },
    slideLeft: {
      name: 'slideLeft',
      frames: `
        @keyframes slideLeft {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `,
    },
    slideRight: {
      name: 'slideRight',
      frames: `
        @keyframes slideRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `,
    },

    // Glass-specific effects
    glassBlur: {
      name: 'glassBlur',
      frames: `
        @keyframes glassBlur {
          from {
            backdrop-filter: blur(0px);
          }
          to {
            backdrop-filter: blur(16px);
          }
        }
      `,
    },
    glassShimmer: {
      name: 'glassShimmer',
      frames: `
        @keyframes glassShimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
      `,
    },

    // Glow pulse
    glowPulse: {
      name: 'glowPulse',
      frames: `
        @keyframes glowPulse {
          0%, 100% {
            opacity: 1;
            filter: brightness(1);
          }
          50% {
            opacity: 0.8;
            filter: brightness(1.2);
          }
        }
      `,
    },

    // Ripple effect (for glass interactions)
    ripple: {
      name: 'ripple',
      frames: `
        @keyframes ripple {
          from {
            transform: scale(0);
            opacity: 0.6;
          }
          to {
            transform: scale(2);
            opacity: 0;
          }
        }
      `,
    },

    // Float (for floating elements)
    float: {
      name: 'float',
      frames: `
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `,
    },

    // Rotate (for loading states)
    rotate: {
      name: 'rotate',
      frames: `
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `,
    },
  },

  // Preset animation combinations
  presets: {
    // Modal/Dialog entrance
    modalEnter: {
      animation: 'scaleIn 300ms cubic-bezier(0, 0, 0.2, 1)',
    },
    modalExit: {
      animation: 'scaleOut 200ms cubic-bezier(0.4, 0, 1, 1)',
    },

    // Card/Element entrance
    cardEnter: {
      animation: 'slideUp 400ms cubic-bezier(0, 0, 0.2, 1)',
    },

    // Fade transitions
    fadeEnter: {
      animation: 'fadeIn 200ms cubic-bezier(0, 0, 0.2, 1)',
    },
    fadeExit: {
      animation: 'fadeOut 200ms cubic-bezier(0.4, 0, 1, 1)',
    },

    // Glass blur effect
    glassReveal: {
      animation: 'glassBlur 400ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    },

    // Shimmer (for loading states on glass)
    shimmer: {
      animation: 'glassShimmer 2s ease-in-out infinite',
    },

    // Glow pulse
    pulse: {
      animation: 'glowPulse 2s ease-in-out infinite',
    },

    // Float
    float: {
      animation: 'float 3s ease-in-out infinite',
    },

    // Rotate
    spin: {
      animation: 'rotate 1s linear infinite',
    },
  },

  // Transition presets (for hover/active states)
  transitions: {
    // All properties
    all: {
      fast: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      normal: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      slow: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
    },

    // Specific properties
    opacity: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    shadow: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    blur: 'backdrop-filter 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',

    // Glass-specific transitions
    glass: 'background-color 300ms cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 300ms cubic-bezier(0.25, 0.1, 0.25, 1), box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)',

    // Interactive element transition
    interactive: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export default liquidGlassAnimations;

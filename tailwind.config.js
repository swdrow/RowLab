/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ========================================
      // ROWLAB Design System
      // Deep slate + Green accent + Water/Dawn tones
      // Evokes: Early morning on the water, technical precision
      // ========================================

      colors: {
        // ============================================
        // PRECISION INSTRUMENT DESIGN SYSTEM
        // Void + Neon (Raycast/Linear aesthetic)
        // ============================================

        // Void Scale - Warm black backgrounds
        'void': {
          'deep': '#08080A',      // Main app background
          'surface': '#0c0c0e',   // Input backgrounds
          'elevated': '#121214',  // Card surfaces
        },

        // Text Hierarchy
        'text': {
          'primary': '#F4F4F5',   // Headlines (zinc-100)
          'secondary': '#A1A1AA', // Body text (zinc-400)
          'muted': '#52525B',     // Captions, placeholders (zinc-600)
          'disabled': '#3F3F46',  // Disabled states (zinc-700)
        },

        // Neon Accents
        'blade': {
          'green': '#00E599',     // Primary action, safe zones
        },
        'coxswain': {
          'violet': '#7C3AED',    // Leadership accent
        },
        'warning': {
          'orange': '#F59E0B',    // High drag factor
        },
        'danger': {
          'red': '#EF4444',       // Error states
        },

        // Semantic aliases
        'success': '#00E599',
        'warning': '#F59E0B',
        'error': '#EF4444',
        'info': '#7C3AED',

        // Rowing-specific
        'port': '#EF4444',        // Port side (red)
        'starboard': '#00E599',   // Starboard (green)

        // Border colors (legacy support)
        'border': {
          'subtle': 'rgba(255, 255, 255, 0.06)',
          'default': 'rgba(255, 255, 255, 0.08)',
          'strong': 'rgba(255, 255, 255, 0.12)',
          'active': 'rgba(255, 255, 255, 0.15)',
          'accent': 'rgba(0, 229, 153, 0.4)',
        },
      },

      // Background gradients - Water/Dawn system
      backgroundImage: {
        // Hero gradient - subtle water glow
        'hero-gradient': 'linear-gradient(180deg, #0a0c10 0%, #12161c 100%)',
        'hero-glow': 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(21, 37, 53, 0.5) 0%, transparent 60%)',

        // Atmosphere gradients (replaces violet)
        'mist-glow': 'linear-gradient(180deg, rgba(30, 40, 56, 0.3) 0%, transparent 100%)',
        'water-radial': 'radial-gradient(ellipse 60% 40% at 50% 20%, rgba(21, 37, 53, 0.25) 0%, transparent 70%)',

        // Card gradients
        'card-gradient': 'linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, transparent 100%)',

        // Glass effect
        'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',

        // Grid pattern for technical feel
        'grid-pattern': `
          linear-gradient(rgba(39, 39, 42, 0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(39, 39, 42, 0.2) 1px, transparent 1px)
        `,

        // Green accent gradients
        'green-glow': 'radial-gradient(ellipse 50% 30% at 50% 50%, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
        'green-gradient': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      },

      // Box shadows - Glow system
      boxShadow: {
        // Elevation system
        'sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'DEFAULT': '0 2px 4px rgba(0, 0, 0, 0.25)',
        'md': '0 4px 8px rgba(0, 0, 0, 0.25)',
        'lg': '0 8px 16px rgba(0, 0, 0, 0.3)',
        'xl': '0 16px 32px rgba(0, 0, 0, 0.35)',

        // Glow effects
        'glow-green': '0 0 20px rgba(0, 229, 153, 0.4)',
        'glow-green-lg': '0 0 40px rgba(0, 229, 153, 0.3)',
        'glow-violet': '0 0 20px rgba(124, 58, 237, 0.4)',

        // Glass effects
        'inner-highlight': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
        'inset-depth': 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',

        // Card shadows
        'card': '0 1px 3px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.03)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',

        // Focus rings
        'focus-green': '0 0 0 3px rgba(0, 229, 153, 0.15)',
        'focus-error': '0 0 0 2px rgba(239, 68, 68, 0.5)',
      },

      // Border radius - Subtle, professional
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
        '2xl': '16px',
      },

      // Animations - Minimal, functional
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
        'slide-in-left': 'slideInLeft 0.25s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },

      // Transition timing
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'snap': 'cubic-bezier(0.4, 0, 0, 1)',
      },

      // Typography - Blade Green system
      fontFamily: {
        // Display font for hero headlines - Fraunces serif
        'display': [
          'Fraunces',
          'Georgia',
          'serif',
        ],
        // Body font - Inter
        'sans': [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        // Monospace for times, stats, data
        'mono': [
          '"JetBrains Mono"',
          '"SF Mono"',
          'ui-monospace',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },

      // Font sizes - Athletic scale
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],           // 12px
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }],      // 13px
        'base': ['0.9375rem', { lineHeight: '1.5rem' }],     // 15px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],       // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],        // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],           // 24px
        '3xl': ['2.25rem', { lineHeight: '2.5rem' }],        // 36px - H1
        '4xl': ['3rem', { lineHeight: '1.15' }],             // 48px - Display
        '5xl': ['4.5rem', { lineHeight: '1.1' }],            // 72px - Hero
      },

      // Spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
        'sidebar': '15rem',      // 240px
        'sidebar-sm': '4rem',    // 64px collapsed
      },

      // Width utilities
      width: {
        'sidebar': '15rem',
        'sidebar-sm': '4rem',
      },

      // Z-index scale
      zIndex: {
        'dropdown': '20',
        'sticky': '30',
        'banner': '40',
        'overlay': '50',
        'modal': '60',
        'popover': '70',
        'toast': '90',
        'tooltip': '100',
      },
    },
  },
  plugins: [],
}

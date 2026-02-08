/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ========================================
      // ROWLAB Design System
      // Deep slate + Blue accent + Water/Dawn tones
      // Evokes: Early morning on the water, technical precision
      // ========================================

      colors: {
        // ============================================
        // DARK EDITORIAL DESIGN SYSTEM
        // Inkwell Palette + Chromatic Data
        // "A rowing publication printed on obsidian paper"
        // ============================================

        // Inkwell Scale - Monochrome UI (CSS variable-backed)
        ink: {
          deep: 'var(--ink-deep)', // #0A0A0A - Void/base
          base: 'var(--ink-base)', // #121212 - Primary surface
          raised: 'var(--ink-raised)', // #1A1A1A - Elevated surfaces
          well: 'var(--ink-well)', // #0F0F0F - Inset/input backgrounds
          hover: 'var(--ink-hover)', // #242424 - Hover state surfaces
          float: 'var(--ink-float)', // #1F1F1F - Floating elements
          border: 'var(--ink-border)', // #262626 - Subtle borders
          'border-strong': 'var(--ink-border-strong)', // #333333 - Emphasized borders
          muted: 'var(--ink-muted)', // #404040 - Muted/disabled
          tertiary: 'var(--ink-tertiary)', // #525252 - Tertiary text
          secondary: 'var(--ink-secondary)', // #737373 - Secondary text
          body: 'var(--ink-body)', // #A3A3A3 - Body text
          primary: 'var(--ink-primary)', // #E5E5E5 - Primary text
          bright: 'var(--ink-bright)', // #FAFAFA - Headlines, emphasis
        },

        // Accent Colors - Primary actions and brand highlights
        accent: {
          primary: 'var(--accent-primary)', // #0070F3 - Primary action
          'primary-hover': 'var(--accent-primary-hover)', // #005FCC - Primary hover
          copper: 'var(--accent-copper)', // #B87333 - Warm brand accent
          'copper-hover': 'var(--accent-copper-hover)', // #A06228 - Copper hover
        },

        // Surface Colors - Layout backgrounds
        surface: {
          default: 'var(--color-bg-surface)',
          elevated: 'var(--color-bg-surface-elevated)',
          hover: 'var(--color-bg-hover)',
        },

        // Data Colors - The ONLY chromatic elements in the UI
        data: {
          excellent: 'var(--data-excellent)', // #22C55E - Above target
          good: 'var(--data-good)', // #3B82F6 - On target
          warning: 'var(--data-warning)', // #F59E0B - Below target
          poor: 'var(--data-poor)', // #EF4444 - Needs attention
        },

        // Chart Palette - Multi-series visualization
        chart: {
          1: 'var(--chart-1)', // Blue
          2: 'var(--chart-2)', // Purple
          3: 'var(--chart-3)', // Cyan
          4: 'var(--chart-4)', // Amber
          5: 'var(--chart-5)', // Pink
          6: 'var(--chart-6)', // Emerald
        },

        // Luminance hierarchy (Night Shift)
        lum: {
          glow: 'var(--lum-glow)', // Brightest - critical
          lit: 'var(--lum-lit)', // Important
          visible: 'var(--lum-visible)', // Normal
          receded: 'var(--lum-receded)', // Supporting
          shadow: 'var(--lum-shadow)', // Background
        },

        // Void Scale - Legacy aliases pointing to Inkwell
        void: {
          deep: 'var(--ink-deep)',
          surface: 'var(--ink-base)',
          elevated: 'var(--ink-raised)',
        },

        // Text Hierarchy (WCAG 2.1 AA compliant on void-deep)
        text: {
          primary: '#F4F4F5', // Headlines (zinc-100) - 16.8:1
          secondary: '#A1A1AA', // Body text (zinc-400) - 9.0:1
          muted: '#71717A', // Captions, placeholders (zinc-500) - 5.5:1 (was zinc-600)
          disabled: '#52525B', // Disabled states (zinc-600) - decorative only
        },

        // Neon Accents
        blade: {
          blue: '#0070F3', // Primary action
        },
        coxswain: {
          violet: '#7C3AED', // Leadership accent
        },
        warning: {
          orange: '#F59E0B', // High drag factor
        },
        danger: {
          red: '#EF4444', // Error states
        },

        // Spectrum Colors - Rainbow variety
        spectrum: {
          blue: '#4285F4',
          indigo: '#6366F1',
          violet: '#8B5CF6',
          purple: '#9B72CB',
          fuchsia: '#D946EF',
          pink: '#EC4899',
          rose: '#D96570',
          red: '#EF4444',
          orange: '#F97316',
          amber: '#F59E0B',
          yellow: '#EAB308',
          lime: '#84CC16',
          green: '#22C55E',
          emerald: '#10B981',
          teal: '#14B8A6',
          cyan: '#06B6D4',
        },

        // Pop Colors - Vibrant accents
        pop: {
          electric: '#00FFE5',
          neon: '#FF00FF',
          plasma: '#7B61FF',
          coral: '#FF6B6B',
          mint: '#00F5D4',
          solar: '#FFD600',
        },

        // Semantic aliases (warning uses object form above)
        success: '#22C55E', // UX convention green
        error: '#EF4444',
        info: '#7C3AED',

        // Rowing Semantic Colors (CSS variable-backed)
        rowing: {
          water: 'var(--palette-rowing-water)', // Blue for erg/water contexts
          starboard: 'var(--palette-rowing-starboard)', // Green (maritime starboard)
          port: 'var(--palette-rowing-port)', // Red (maritime port)
          gold: 'var(--palette-rowing-gold)', // Achievement/PR highlights
          premium: 'var(--palette-rowing-premium)', // Premium feature indicator
        },

        // Rowing-specific (legacy aliases using CSS variables)
        port: 'var(--palette-rowing-port)', // Port side (red)
        starboard: 'var(--palette-rowing-starboard)', // Starboard (green) - maritime convention

        // Warm Stone Neutrals (explicit warm palette access)
        warm: {
          950: 'var(--palette-stone-950)',
          900: 'var(--palette-stone-900)',
          800: 'var(--palette-stone-800)',
          700: 'var(--palette-stone-700)',
          600: 'var(--palette-stone-600)',
          500: 'var(--palette-stone-500)',
          400: 'var(--palette-stone-400)',
          300: 'var(--palette-stone-300)',
          200: 'var(--palette-stone-200)',
          100: 'var(--palette-stone-100)',
          50: 'var(--palette-stone-50)',
        },

        // Border colors (legacy support)
        border: {
          subtle: 'rgba(255, 255, 255, 0.06)',
          default: 'rgba(255, 255, 255, 0.08)',
          strong: 'rgba(255, 255, 255, 0.12)',
          active: 'rgba(255, 255, 255, 0.15)',
          accent: 'rgba(0, 112, 243, 0.4)',
        },

        // ============================================
        // V2 DESIGN TOKENS (CSS Variables from tokens.css)
        // These use CSS custom properties scoped to .v2
        // ============================================

        // V2 Background tokens
        bg: {
          base: 'var(--color-bg-base)',
          surface: 'var(--color-bg-surface)',
          'surface-elevated': 'var(--color-bg-surface-elevated)',
          overlay: 'var(--color-bg-overlay)',
          hover: 'var(--color-bg-hover)',
          active: 'var(--color-bg-active)',
        },

        // V2 Card tokens
        card: {
          bg: 'var(--color-card-bg)',
          border: 'var(--color-card-border)',
          hover: 'var(--color-card-hover)',
        },

        // V2 Button tokens
        button: {
          'primary-bg': 'var(--color-button-primary-bg)',
          'primary-hover': 'var(--color-button-primary-hover)',
          'primary-text': 'var(--color-button-primary-text)',
          'secondary-bg': 'var(--color-button-secondary-bg)',
          'secondary-hover': 'var(--color-button-secondary-hover)',
          'secondary-text': 'var(--color-button-secondary-text)',
        },

        // V2 Interactive tokens
        interactive: {
          primary: 'var(--color-interactive-primary)',
          hover: 'var(--color-interactive-hover)',
          active: 'var(--color-interactive-active)',
          disabled: 'var(--color-interactive-disabled)',
        },

        // V2 Input tokens
        input: {
          bg: 'var(--color-input-bg)',
          border: 'var(--color-input-border)',
          focus: 'var(--color-input-focus)',
          text: 'var(--color-input-text)',
          placeholder: 'var(--color-input-placeholder)',
        },

        // V2 Status tokens
        status: {
          success: 'var(--color-status-success)',
          warning: 'var(--color-status-warning)',
          error: 'var(--color-status-error)',
          info: 'var(--color-status-info)',
        },

        // V2 Field theme colors
        field: {
          sky: 'var(--color-field-sky)',
          grass: 'var(--color-field-grass)',
          weather: 'var(--color-field-weather)',
        },

        // V2 Text tokens (prefixed to avoid V1 conflict)
        // Usage: text-txt-primary, text-txt-secondary, etc.
        txt: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
          brand: 'var(--color-text-brand)',
        },

        // V2 Border tokens (prefixed to avoid V1 conflict)
        // Usage: border-bdr-default, border-bdr-subtle, etc.
        bdr: {
          default: 'var(--color-border-default)',
          subtle: 'var(--color-border-subtle)',
          strong: 'var(--color-border-strong)',
          brand: 'var(--color-border-brand)',
        },

        // V2 Focus ring tokens
        // Usage: ring-focus-ring, ring-focus-error
        focus: {
          ring: 'var(--color-focus-ring)',
          error: 'var(--color-focus-ring-error)',
        },
      },

      // Background gradients - Water/Dawn system
      backgroundImage: {
        // Hero gradient - subtle water glow
        'hero-gradient': 'linear-gradient(180deg, #0a0c10 0%, #12161c 100%)',
        'hero-glow':
          'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(21, 37, 53, 0.5) 0%, transparent 60%)',

        // Atmosphere gradients (replaces violet)
        'mist-glow': 'linear-gradient(180deg, rgba(30, 40, 56, 0.3) 0%, transparent 100%)',
        'water-radial':
          'radial-gradient(ellipse 60% 40% at 50% 20%, rgba(21, 37, 53, 0.25) 0%, transparent 70%)',

        // Card gradients
        'card-gradient': 'linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, transparent 100%)',

        // Glass effect
        glass:
          'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',

        // Grid pattern for technical feel
        'grid-pattern': `
          linear-gradient(rgba(39, 39, 42, 0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(39, 39, 42, 0.2) 1px, transparent 1px)
        `,

        // Blue accent gradients
        'blue-glow':
          'radial-gradient(ellipse 50% 30% at 50% 50%, rgba(0, 112, 243, 0.12) 0%, transparent 70%)',
        'blue-gradient': 'linear-gradient(135deg, #0070F3 0%, #0062D1 100%)',
      },

      // Box shadows - Multi-layer physical shadow system
      // Simulates ambient + direct light for realistic depth
      boxShadow: {
        none: 'none',
        ambient: '0 0 0 1px rgba(255,255,255,0.03)',

        // Card system - 3 layers for physical feel
        card: '0 0 0 1px rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)',
        'card-hover':
          '0 0 0 1px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.25)',

        // Elevated surfaces
        elevated:
          '0 0 0 1px rgba(255,255,255,0.08), 0 4px 8px rgba(0,0,0,0.3), 0 12px 32px rgba(0,0,0,0.2)',

        // Blue glow for primary actions (CTAs)
        'glow-blue': '0 0 0 1px rgba(0,112,243,0.3), 0 0 20px -5px rgba(0,112,243,0.4)',
        'glow-blue-lg': '0 0 0 1px rgba(0,112,243,0.4), 0 0 30px -5px rgba(0,112,243,0.5)',

        // Inset for inputs
        inner: 'inset 0 1px 2px rgba(0,0,0,0.2)',

        // 2xl for modals/dropdowns
        '2xl': '0 0 0 1px rgba(255,255,255,0.05), 0 25px 50px -12px rgba(0,0,0,0.5)',

        // Focus rings (keep for accessibility)
        'focus-blue': '0 0 0 2px rgba(0, 112, 243, 0.25)',
        'focus-error': '0 0 0 2px rgba(239, 68, 68, 0.3)',
      },

      // Border radius - Subtle, professional
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '16px',
      },

      // ============================================
      // PRECISION INSTRUMENT TRANSITIONS
      // Zero perceived latency - feels "wired" to data
      // ============================================
      transitionDuration: {
        fast: '100ms', // Hover states, instant feedback
        normal: '150ms', // Most transitions
        slow: '200ms', // Complex animations (max)
      },

      // Animations - Minimal, functional, FAST
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'fade-in-up': 'fadeInUp 0.15s ease-out',
        'slide-in-right': 'slideInRight 0.15s ease-out',
        'slide-in-left': 'slideInLeft 0.15s ease-out',
        'scale-in': 'scaleIn 0.1s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'data-flash': 'dataFlash 0.15s ease-out',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        dataFlash: {
          '0%': { backgroundColor: 'rgba(0, 112, 243, 0.2)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },

      // Transition timing - Precision Instrument: no bounce, pure ease-out
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)', // General purpose
        snap: 'cubic-bezier(0, 0, 0.2, 1)', // Instant feel, ease-out only
        precision: 'cubic-bezier(0.16, 1, 0.3, 1)', // Premium ease-out curve for UI
      },

      // Typography - Dark Editorial system (uses CSS variables from tokens.css)
      fontFamily: {
        // Display font for headlines - Fraunces serif (via CSS variable)
        display: ['var(--font-display)', 'Georgia', 'serif'],
        // Serif alias for headlines
        serif: ['var(--font-display)', 'Georgia', 'serif'],
        // Body font - Inter (via CSS variable)
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        // Monospace for times, stats, data - Geist Mono (via CSS variable)
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        // Metric font for large hero numbers - Geist Mono (via CSS variable)
        metric: ['var(--font-metric)', 'ui-monospace', 'monospace'],
      },

      // Font sizes - Athletic scale
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
        sm: ['0.8125rem', { lineHeight: '1.25rem' }], // 13px
        base: ['0.9375rem', { lineHeight: '1.5rem' }], // 15px
        lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
        '3xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px - H1
        '4xl': ['3rem', { lineHeight: '1.15' }], // 48px - Display
        '5xl': ['4.5rem', { lineHeight: '1.1' }], // 72px - Hero
      },

      // Spacing
      spacing: {
        18: '4.5rem',
        88: '22rem',
        112: '28rem',
        128: '32rem',
        sidebar: '15rem', // 240px
        'sidebar-sm': '4rem', // 64px collapsed
      },

      // Width utilities
      width: {
        sidebar: '15rem',
        'sidebar-sm': '4rem',
      },

      // Z-index scale
      zIndex: {
        dropdown: '20',
        sticky: '30',
        banner: '40',
        overlay: '50',
        modal: '60',
        popover: '70',
        toast: '90',
        tooltip: '100',
      },
    },
  },
  plugins: [],
};

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
      // NOIR SPECTRUM Design System
      // Deep blacks + Rainbow shimmer accents
      // Inspired by: Apple, Netflix, Stripe, Gemini, Tailwind
      // ========================================

      colors: {
        // Base Surface Palette - Deep charcoal/blacks (Netflix/Gemini inspired)
        'surface': {
          '950': '#000000',      // True black - modals backdrop
          '900': '#0a0a0a',      // Primary background - main app
          '850': '#0f0f0f',      // Elevated background
          '800': '#141414',      // Card background (Netflix style)
          '750': '#1a1a1a',      // Raised cards
          '700': '#212121',      // Interactive hover
          '650': '#2a2a2a',      // Active states
          '600': '#333333',      // Borders strong
          '500': '#404040',      // Borders default
          '400': '#525252',      // Borders subtle
        },

        // Spectrum Accent Colors - Rainbow shimmer palette (Gemini inspired)
        'spectrum': {
          blue: '#4285F4',       // Google blue - primary
          indigo: '#6366F1',     // Indigo - secondary
          violet: '#8B5CF6',     // Violet
          purple: '#9B72CB',     // Gemini purple
          fuchsia: '#D946EF',    // Fuchsia
          pink: '#EC4899',       // Pink
          rose: '#D96570',       // Gemini rose/coral
          red: '#EF4444',        // Red - errors
          orange: '#F97316',     // Orange - warnings
          amber: '#F59E0B',      // Amber - performance
          yellow: '#EAB308',     // Yellow
          lime: '#84CC16',       // Lime
          green: '#22C55E',      // Green - success
          emerald: '#10B981',    // Emerald
          teal: '#14B8A6',       // Teal
          cyan: '#06B6D4',       // Cyan - data/speed
        },

        // Primary accent (blue-to-purple gradient feel)
        'accent': {
          DEFAULT: '#6366F1',    // Indigo base
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },

        // Rowing-specific colors
        'port': '#D96570',       // Port side - Gemini rose
        'starboard': '#10B981',  // Starboard - emerald

        // Semantic colors
        'success': '#22C55E',
        'warning': '#F59E0B',
        'error': '#EF4444',
        'info': '#06B6D4',

        // Pop colors - Unexpected vibrant accents for delight
        'pop': {
          electric: '#00FFE5',    // Electric cyan - data highlights, special states
          neon: '#FF00FF',        // Neon magenta - rare special actions
          plasma: '#7B61FF',      // Plasma purple - premium features
          coral: '#FF6B6B',       // Living coral - notifications
          mint: '#00F5D4',        // Fresh mint - success with personality
          solar: '#FFD600',       // Solar yellow - attention grabbers
        },

        // Aurora colors - For morphing background gradients
        'aurora': {
          1: 'rgba(99, 102, 241, 0.15)',    // Indigo
          2: 'rgba(139, 92, 246, 0.12)',    // Purple
          3: 'rgba(236, 72, 153, 0.10)',    // Pink
          4: 'rgba(6, 182, 212, 0.10)',     // Cyan
        },

        // Text colors
        'text': {
          primary: 'rgba(255, 255, 255, 0.95)',
          secondary: 'rgba(255, 255, 255, 0.70)',
          tertiary: 'rgba(255, 255, 255, 0.50)',
          muted: 'rgba(255, 255, 255, 0.35)',
          disabled: 'rgba(255, 255, 255, 0.25)',
        },

        // Border colors
        'border': {
          subtle: 'rgba(255, 255, 255, 0.06)',
          default: 'rgba(255, 255, 255, 0.10)',
          strong: 'rgba(255, 255, 255, 0.15)',
          accent: 'rgba(99, 102, 241, 0.40)',
        },
      },

      // Background gradients
      backgroundImage: {
        // Gemini-style rainbow shimmer gradient (74deg angle, 10 stops)
        'shimmer': 'linear-gradient(74deg, #4285F4 0%, #9B72CB 15%, #D96570 30%, #4285F4 45%, #9B72CB 60%, #D96570 75%, #4285F4 90%, #9B72CB 100%)',
        'shimmer-subtle': 'linear-gradient(74deg, rgba(66, 133, 244, 0.15) 0%, rgba(155, 114, 203, 0.15) 25%, rgba(217, 101, 112, 0.15) 50%, rgba(66, 133, 244, 0.15) 75%, rgba(155, 114, 203, 0.15) 100%)',

        // Full spectrum rainbow (for special effects)
        'rainbow': 'linear-gradient(90deg, #4285F4, #6366F1, #8B5CF6, #9B72CB, #D946EF, #EC4899, #D96570, #F97316, #F59E0B, #EAB308, #22C55E, #14B8A6, #06B6D4, #4285F4)',

        // Primary gradient (indigo to purple)
        'gradient-primary': 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #9B72CB 100%)',
        'gradient-primary-subtle': 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.10) 100%)',

        // Accent gradients for buttons/CTAs
        'gradient-accent': 'linear-gradient(135deg, #4285F4 0%, #6366F1 50%, #8B5CF6 100%)',
        'gradient-warm': 'linear-gradient(135deg, #D96570 0%, #EC4899 50%, #9B72CB 100%)',
        'gradient-cool': 'linear-gradient(135deg, #06B6D4 0%, #4285F4 50%, #6366F1 100%)',

        // Stripe-style mesh background
        'mesh': `
          radial-gradient(ellipse 80% 50% at 20% 30%, rgba(99, 102, 241, 0.08) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 20%, rgba(139, 92, 246, 0.06) 0%, transparent 60%),
          radial-gradient(ellipse 50% 50% at 60% 80%, rgba(217, 101, 112, 0.05) 0%, transparent 60%)
        `,

        // Hero glow
        'hero-glow': 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        'hero-glow-warm': 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(217, 101, 112, 0.12) 0%, transparent 70%)',

        // Card surface gradients
        'card-gradient': 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)',
        'card-hover': 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',

        // Noise texture overlay
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },

      // Backdrop blur levels (Apple style)
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },

      // Box shadows - Dark mode optimized
      boxShadow: {
        // Elevation system (Netflix/Apple style)
        'sm': '0 1px 2px rgba(0, 0, 0, 0.5)',
        'DEFAULT': '0 2px 4px rgba(0, 0, 0, 0.5)',
        'md': '0 4px 8px rgba(0, 0, 0, 0.5)',
        'lg': '0 8px 16px rgba(0, 0, 0, 0.5)',
        'xl': '0 16px 32px rgba(0, 0, 0, 0.6)',
        '2xl': '0 24px 48px rgba(0, 0, 0, 0.7)',

        // Glow effects (spectrum colors)
        'glow-blue': '0 0 20px rgba(66, 133, 244, 0.35), 0 0 40px rgba(66, 133, 244, 0.15)',
        'glow-indigo': '0 0 20px rgba(99, 102, 241, 0.35), 0 0 40px rgba(99, 102, 241, 0.15)',
        'glow-purple': '0 0 20px rgba(155, 114, 203, 0.35), 0 0 40px rgba(155, 114, 203, 0.15)',
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.35), 0 0 40px rgba(236, 72, 153, 0.15)',
        'glow-rose': '0 0 20px rgba(217, 101, 112, 0.35), 0 0 40px rgba(217, 101, 112, 0.15)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.35), 0 0 40px rgba(6, 182, 212, 0.15)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.35), 0 0 40px rgba(16, 185, 129, 0.15)',

        // Rainbow shimmer glow
        'glow-shimmer': '0 0 30px rgba(66, 133, 244, 0.25), 0 0 60px rgba(155, 114, 203, 0.15), 0 0 90px rgba(217, 101, 112, 0.10)',

        // Pop color glows - vibrant unexpected accents
        'glow-electric': '0 0 20px rgba(0, 255, 229, 0.4), 0 0 40px rgba(0, 255, 229, 0.2)',
        'glow-neon': '0 0 20px rgba(255, 0, 255, 0.4), 0 0 40px rgba(255, 0, 255, 0.2)',
        'glow-plasma': '0 0 20px rgba(123, 97, 255, 0.4), 0 0 40px rgba(123, 97, 255, 0.2)',
        'glow-coral': '0 0 20px rgba(255, 107, 107, 0.4), 0 0 40px rgba(255, 107, 107, 0.2)',
        'glow-mint': '0 0 20px rgba(0, 245, 212, 0.4), 0 0 40px rgba(0, 245, 212, 0.2)',

        // Card shadows
        'card': '0 1px 3px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.03)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        'card-active': '0 2px 8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.3)',

        // Inner shadows
        'inner-sm': 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
        'inner': 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
        'inner-lg': 'inset 0 4px 8px rgba(0, 0, 0, 0.4)',

        // Top highlight (glass effect)
        'highlight': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'highlight-strong': 'inset 0 1px 0 rgba(255, 255, 255, 0.10)',

        // Kanban specific
        'kanban-column': '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        'kanban-dragging': '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(99, 102, 241, 0.4)',
        'seat-drop-target': '0 0 0 2px rgba(99, 102, 241, 0.5), 0 0 12px rgba(99, 102, 241, 0.3)',

        // Floating elements
        'floating': '0 16px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'command-palette': '0 24px 80px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'dropdown': '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'tooltip': '0 4px 12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06)',

        // Rowing glows
        'glow-port': '0 0 20px rgba(217, 101, 112, 0.35), 0 0 40px rgba(217, 101, 112, 0.15)',
        'glow-starboard': '0 0 20px rgba(16, 185, 129, 0.35), 0 0 40px rgba(16, 185, 129, 0.15)',
        'glow-coxswain': '0 0 20px rgba(155, 114, 203, 0.35), 0 0 40px rgba(155, 114, 203, 0.15)',

        // Focus rings
        'focus-ring': '0 0 0 2px rgba(99, 102, 241, 0.5)',
        'focus-ring-error': '0 0 0 2px rgba(239, 68, 68, 0.5)',
        'focus-ring-success': '0 0 0 2px rgba(34, 197, 94, 0.5)',
      },

      // Border radius (Apple rounded aesthetic)
      borderRadius: {
        'sm': '6px',
        'DEFAULT': '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
      },

      // Animations
      animation: {
        // Fade animations
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-out': 'fadeOut 0.15s ease-in',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'fade-in-down': 'fadeInDown 0.3s ease-out',

        // Scale animations (Apple style)
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-out': 'scaleOut 0.15s ease-in',
        'pop': 'pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',

        // Shimmer animations (Gemini style)
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'shimmer-slow': 'shimmer 8s ease-in-out infinite',
        'shimmer-fast': 'shimmer 1.5s ease-in-out infinite',
        'shimmer-once': 'shimmerOnce 1s ease-out forwards',

        // Glow pulse
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',

        // Float
        'float': 'float 4s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',

        // Spin (for loading)
        'spin-slow': 'spin 2s linear infinite',

        // Slide
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'slide-in-down': 'slideInDown 0.3s ease-out',

        // Background shift (for gradient backgrounds)
        'bg-shift': 'bgShift 15s ease infinite',
        'bg-shift-fast': 'bgShift 8s ease infinite',

        // Aurora morphing background
        'aurora-morph': 'auroraMorph 30s ease-in-out infinite',
        'aurora-morph-fast': 'auroraMorph 15s ease-in-out infinite',

        // Prismatic shimmer (Gemini-style iridescent)
        'prismatic': 'prismatic 8s ease infinite',
        'prismatic-fast': 'prismatic 4s ease infinite',

        // Glow pulse for sidebar edge
        'edge-glow': 'edgeGlow 4s ease-in-out infinite',
      },

      // Keyframes
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },
        pop: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '40%': { transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        // Gemini-style shimmer - moves gradient position
        shimmer: {
          '0%': { backgroundPosition: '200% 50%' },
          '100%': { backgroundPosition: '-200% 50%' },
        },
        shimmerOnce: {
          '0%': { backgroundPosition: '200% 50%', opacity: '0.5' },
          '100%': { backgroundPosition: '-200% 50%', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.15)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bgShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        // Aurora morphing - 4 gradient layers shift positions
        auroraMorph: {
          '0%, 100%': {
            backgroundPosition: '0% 0%, 100% 100%, 50% 50%, 0% 100%',
          },
          '25%': {
            backgroundPosition: '100% 0%, 0% 100%, 100% 0%, 50% 50%',
          },
          '50%': {
            backgroundPosition: '100% 100%, 0% 0%, 0% 100%, 100% 0%',
          },
          '75%': {
            backgroundPosition: '0% 100%, 100% 0%, 50% 100%, 0% 0%',
          },
        },
        // Prismatic shimmer - iridescent color shift
        prismatic: {
          '0%': { backgroundPosition: '0% 50%', filter: 'hue-rotate(0deg)' },
          '50%': { backgroundPosition: '100% 50%', filter: 'hue-rotate(15deg)' },
          '100%': { backgroundPosition: '0% 50%', filter: 'hue-rotate(0deg)' },
        },
        // Edge glow for sidebar
        edgeGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },

      // Transition timing functions
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'snap': 'cubic-bezier(0.4, 0, 0, 1)',
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },

      // Font family - Retrofuturistic Modern
      fontFamily: {
        // Display font for headings, hero text, branding
        display: [
          '"Clash Display"',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
        // Body/UI font - clean but distinctive
        sans: [
          'Satoshi',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        // Monospace for code
        mono: [
          '"JetBrains Mono"',
          '"SF Mono"',
          'ui-monospace',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },

      // Font sizes (Apple-inspired scale)
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.15' }],
        '6xl': ['3.75rem', { lineHeight: '1.1' }],
        '7xl': ['4.5rem', { lineHeight: '1.05' }],
        '8xl': ['6rem', { lineHeight: '1' }],
      },

      // Spacing extensions (8px grid system)
      spacing: {
        '18': '4.5rem',      // 72px
        '88': '22rem',       // 352px
        '112': '28rem',      // 448px
        '128': '32rem',      // 512px
        // Sidebar dimensions
        'sidebar-collapsed': '4rem',    // 64px
        'sidebar-expanded': '15rem',    // 240px
        // Kanban dimensions
        'kanban-column': '18rem',       // 288px
        // Command palette
        'command-palette': '40rem',     // 640px
      },

      // Width utilities
      width: {
        'sidebar-collapsed': '4rem',
        'sidebar-expanded': '15rem',
        'kanban-column': '18rem',
        'command-palette': '40rem',
      },

      // Height utilities
      height: {
        'header': '3.5rem',        // 56px
        'kanban-header': '3rem',   // 48px
      },

      // Max width utilities
      maxWidth: {
        'command-palette': '40rem',
        'page': '90rem',           // 1440px
      },

      // Max height utilities
      maxHeight: {
        'command-palette': '70vh',
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
        'command-palette': '110',
      },

      // Ring utilities (focus states)
      ringWidth: {
        'DEFAULT': '2px',
      },
      ringColor: {
        'DEFAULT': 'rgba(99, 102, 241, 0.5)',
        'accent': 'rgba(99, 102, 241, 0.5)',
        'error': 'rgba(239, 68, 68, 0.5)',
        'success': 'rgba(34, 197, 94, 0.5)',
      },
    },
  },
  plugins: [],
}

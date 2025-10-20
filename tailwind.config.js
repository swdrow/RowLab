/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Liquid Glass Color System
      colors: {
        // Rowing-specific colors
        'rowing-blue': '#1e3a8a',
        'rowing-gold': '#fbbf24',
        'port': '#ef4444',
        'starboard': '#22c55e',

        // Dark mode base colors
        'dark-bg': '#0a0a0a',
        'dark-card': '#1c1c1e',
        'dark-elevated': '#2c2c2e',

        // Accent colors (iOS-inspired)
        'accent-blue': '#0a84ff',
        'accent-purple': '#bf5af2',
        'accent-teal': '#00C7BE',
        'accent-pink': '#FF2D55',
        'accent-amber': '#FFAB00',

        // Glass tint colors
        'glass-light': 'rgba(255, 255, 255, 0.6)',
        'glass-dark': 'rgba(28, 28, 40, 0.6)',
      },

      // Background gradients
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',

        // Glass surface gradients
        'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
        'glass-subtle': 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.2) 100%)',
        'glass-dark': 'linear-gradient(135deg, rgba(40, 40, 60, 0.9) 0%, rgba(20, 20, 35, 0.6) 100%)',
        'glass-dark-subtle': 'linear-gradient(135deg, rgba(35, 35, 50, 0.7) 0%, rgba(20, 20, 30, 0.4) 100%)',

        // Accent gradients (iOS Control Center style)
        'gradient-blue-violet': 'linear-gradient(135deg, #0A84FF 0%, #BF5AF2 100%)',
        'gradient-teal-blue': 'linear-gradient(135deg, #00C7BE 0%, #0A84FF 100%)',
        'gradient-pink-orange': 'linear-gradient(135deg, #FF2D55 0%, #FF9500 100%)',
        'gradient-purple-pink': 'linear-gradient(135deg, #BF5AF2 0%, #FF2D55 100%)',

        // Ambient mesh backgrounds
        'gradient-mesh': `
          radial-gradient(at 0% 0%, rgba(10, 132, 255, 0.08) 0px, transparent 50%),
          radial-gradient(at 100% 0%, rgba(191, 90, 242, 0.08) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(0, 199, 190, 0.08) 0px, transparent 50%),
          radial-gradient(at 0% 100%, rgba(255, 45, 85, 0.08) 0px, transparent 50%)
        `,
        'gradient-mesh-dark': `
          radial-gradient(at 0% 0%, rgba(10, 132, 255, 0.12) 0px, transparent 50%),
          radial-gradient(at 100% 0%, rgba(191, 90, 242, 0.12) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(0, 199, 190, 0.12) 0px, transparent 50%),
          radial-gradient(at 0% 100%, rgba(255, 45, 85, 0.12) 0px, transparent 50%)
        `,
      },

      // Backdrop blur levels
      backdropBlur: {
        xs: '2px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '40px',
      },

      // Box shadows (glass depth)
      boxShadow: {
        // Light mode shadows
        'glass-subtle': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'glass-base': '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
        'glass-elevated': '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
        'glass-strong': '0 16px 48px rgba(0, 0, 0, 0.16), 0 8px 16px rgba(0, 0, 0, 0.12)',
        'glass-floating': '0 24px 64px rgba(0, 0, 0, 0.2), 0 16px 32px rgba(0, 0, 0, 0.14)',

        // Glow effects
        'glow-blue': '0 0 20px rgba(10, 132, 255, 0.3), 0 0 40px rgba(10, 132, 255, 0.15)',
        'glow-purple': '0 0 20px rgba(191, 90, 242, 0.3), 0 0 40px rgba(191, 90, 242, 0.15)',
        'glow-teal': '0 0 20px rgba(0, 199, 190, 0.3), 0 0 40px rgba(0, 199, 190, 0.15)',
        'glow-pink': '0 0 20px rgba(255, 45, 85, 0.3), 0 0 40px rgba(255, 45, 85, 0.15)',
        'glow-white': '0 0 20px rgba(255, 255, 255, 0.2), 0 0 40px rgba(255, 255, 255, 0.1)',

        // Inner shadows for glass depth
        'inner-glass': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
      },

      // Border radius
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },

      // Animations
      animation: {
        'fade-in': 'fadeIn 0.2s cubic-bezier(0, 0, 0.2, 1)',
        'fade-out': 'fadeOut 0.2s cubic-bezier(0.4, 0, 1, 1)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0, 0, 0.2, 1)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0, 0, 0.2, 1)',
        'scale-out': 'scaleOut 0.2s cubic-bezier(0.4, 0, 1, 1)',
        'glass-blur': 'glassBlur 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
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
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.9)', opacity: '0' },
        },
        glassBlur: {
          '0%': { backdropFilter: 'blur(0px)' },
          '100%': { backdropFilter: 'blur(16px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },

      // Transition timing functions
      transitionTimingFunction: {
        'glass': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      // Font family (San Francisco style)
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}

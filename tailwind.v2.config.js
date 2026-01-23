/**
 * V2 Tailwind Configuration
 *
 * CRITICAL: This config uses the `important: '.v2'` selector strategy to scope
 * all Tailwind utilities under the .v2 class. This ensures complete CSS isolation
 * between V1 and V2 implementations.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  // Only process V2 files
  content: [
    "./src/v2/**/*.{js,ts,jsx,tsx}",
  ],

  // Scope all utilities under .v2 class for complete isolation
  important: '.v2',

  theme: {
    extend: {
      // ========================================
      // V2 DESIGN TOKENS
      // Maps CSS custom properties from tokens.css
      // ========================================

      colors: {
        // Background tokens
        'bg': {
          'base': 'var(--color-bg-base)',
          'surface': 'var(--color-bg-surface)',
          'surface-elevated': 'var(--color-bg-surface-elevated)',
          'overlay': 'var(--color-bg-overlay)',
          'hover': 'var(--color-bg-hover)',
          'active': 'var(--color-bg-active)',
        },

        // Text tokens
        'text': {
          'primary': 'var(--color-text-primary)',
          'secondary': 'var(--color-text-secondary)',
          'tertiary': 'var(--color-text-tertiary)',
          'muted': 'var(--color-text-muted)',
          'inverse': 'var(--color-text-inverse)',
          'brand': 'var(--color-text-brand)',
        },

        // Border tokens
        'border': {
          'default': 'var(--color-border-default)',
          'subtle': 'var(--color-border-subtle)',
          'strong': 'var(--color-border-strong)',
          'brand': 'var(--color-border-brand)',
        },

        // Interactive tokens
        'interactive': {
          'primary': 'var(--color-interactive-primary)',
          'hover': 'var(--color-interactive-hover)',
          'active': 'var(--color-interactive-active)',
          'disabled': 'var(--color-interactive-disabled)',
        },

        // Status tokens
        'status': {
          'success': 'var(--color-status-success)',
          'warning': 'var(--color-status-warning)',
          'error': 'var(--color-status-error)',
          'info': 'var(--color-status-info)',
        },

        // Component tokens
        'card': {
          'bg': 'var(--color-card-bg)',
          'border': 'var(--color-card-border)',
          'hover': 'var(--color-card-hover)',
        },

        'button': {
          'primary-bg': 'var(--color-button-primary-bg)',
          'primary-hover': 'var(--color-button-primary-hover)',
          'primary-text': 'var(--color-button-primary-text)',
          'secondary-bg': 'var(--color-button-secondary-bg)',
          'secondary-hover': 'var(--color-button-secondary-hover)',
          'secondary-text': 'var(--color-button-secondary-text)',
        },

        'input': {
          'bg': 'var(--color-input-bg)',
          'border': 'var(--color-input-border)',
          'focus': 'var(--color-input-focus)',
          'text': 'var(--color-input-text)',
          'placeholder': 'var(--color-input-placeholder)',
        },

        // Field theme colors
        'field': {
          'sky': 'var(--color-field-sky)',
          'grass': 'var(--color-field-grass)',
          'weather': 'var(--color-field-weather)',
        },
      },

      // Typography - Reuse V1 font stack for consistency
      fontFamily: {
        'display': [
          '"Space Grotesk"',
          'system-ui',
          'sans-serif',
        ],
        'sans': [
          '"DM Sans"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
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

      // Border radius - Subtle, professional
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
        '2xl': '16px',
      },

      // Transitions - Fast, responsive feel
      transitionDuration: {
        'fast': '100ms',
        'normal': '150ms',
        'slow': '200ms',
      },

      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'snap': 'cubic-bezier(0, 0, 0.2, 1)',
        'precision': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      // Spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
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

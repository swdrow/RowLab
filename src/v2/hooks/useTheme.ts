import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect } from 'react';

/**
 * Theme options
 * - dark: Standard dark theme (default)
 * - light: Light theme
 * - field: High-contrast theme for outdoor visibility
 */
export type Theme = 'dark' | 'light' | 'field';

/**
 * Get system color scheme preference
 */
function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

interface ThemeState {
  theme: Theme;
  isSystemDefault: boolean;
  setTheme: (theme: Theme) => void;
  clearThemePreference: () => void;
  _applySystemTheme: () => void;
}

/**
 * Theme store using Zustand
 *
 * Uses Zustand so all components share the same state.
 * Persists to localStorage with key 'v2-theme-store'.
 */
const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      isSystemDefault: false,

      setTheme: (newTheme: Theme) => {
        set({ theme: newTheme, isSystemDefault: false });
      },

      clearThemePreference: () => {
        set({ theme: getSystemTheme(), isSystemDefault: true });
      },

      _applySystemTheme: () => {
        if (get().isSystemDefault) {
          set({ theme: getSystemTheme() });
        }
      },
    }),
    {
      name: 'v2-theme-store',
      // On rehydrate, apply system theme if no manual preference
      onRehydrateStorage: () => (state) => {
        if (state?.isSystemDefault) {
          state.theme = getSystemTheme();
        }
      },
    }
  )
);

/**
 * Theme management hook
 *
 * Features:
 * - Respects system preference when no manual override exists
 * - Persists manual theme changes to localStorage
 * - Listens for system preference changes
 * - Only updates theme on system change if no manual override exists
 * - Uses Zustand store so all components share the same state
 *
 * @returns {object} Theme state and controls
 * @returns {Theme} theme - Current active theme
 * @returns {function} setTheme - Set theme manually (persists to localStorage)
 * @returns {boolean} isSystemDefault - True if using system preference (no manual override)
 * @returns {function} clearThemePreference - Remove manual override and use system preference
 */
export function useTheme() {
  const { theme, isSystemDefault, setTheme, clearThemePreference, _applySystemTheme } =
    useThemeStore();

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = () => {
      _applySystemTheme();
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [_applySystemTheme]);

  return {
    theme,
    setTheme,
    isSystemDefault,
    clearThemePreference,
  };
}

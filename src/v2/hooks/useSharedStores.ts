import { createContext, useContext } from 'react';
import useAuthStore from '../../store/authStore';
import useSettingsStore from '../../store/settingsStore';

/**
 * Shared Store Integration for V1/V2 Bridging
 *
 * This module enables V2 components to access V1 Zustand stores without causing
 * re-render loops. The key pattern is sharing store INSTANCES via React Context,
 * not store values.
 *
 * CRITICAL: Share store *instances*, NOT store values
 * - CORRECT: createContext(useAuthStore) - shares hook function
 * - WRONG: createContext(useAuthStore()) - shares current values (causes re-render loops)
 *
 * Usage in V2 components:
 *   const authStore = useV2Auth();
 *   const user = authStore((state) => state.user); // Use selectors as normal
 */

/**
 * Context for V1 Auth Store
 * Shares the store instance (hook function), not the store values
 */
export const AuthStoreContext = createContext(useAuthStore);

/**
 * Context for V1 Settings Store
 * Shares the store instance (hook function), not the store values
 */
export const SettingsStoreContext = createContext(useSettingsStore);

/**
 * Hook to access V1 Auth Store from V2 components
 *
 * @returns The Zustand store hook (use with selectors)
 * @example
 *   const authStore = useV2Auth();
 *   const user = authStore((state) => state.user);
 *   const isAuthenticated = authStore((state) => state.isAuthenticated);
 */
export function useV2Auth() {
  return useContext(AuthStoreContext);
}

/**
 * Hook to access V1 Settings Store from V2 components
 *
 * @returns The Zustand store hook (use with selectors)
 * @example
 *   const settingsStore = useV2Settings();
 *   const sidebarCollapsed = settingsStore((state) => state.sidebarCollapsed);
 *   const features = settingsStore((state) => state.features);
 */
export function useV2Settings() {
  return useContext(SettingsStoreContext);
}

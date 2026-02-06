import { createContext, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import useSettingsStore from '../../store/settingsStore';

/**
 * Shared Store Integration for V1/V2 Bridging
 *
 * DEPRECATED: Auth now uses AuthContext (useAuth from ../contexts/AuthContext)
 * This module exists only for Settings store bridging.
 *
 * Settings Store Pattern:
 * - Shares store INSTANCE via React Context, not store values
 * - CORRECT: createContext(useSettingsStore) - shares hook function
 * - WRONG: createContext(useSettingsStore()) - shares current values (causes re-render loops)
 *
 * Usage in V2 components:
 *   const settingsStore = useV2Settings();
 *   const sidebarCollapsed = settingsStore((state) => state.sidebarCollapsed);
 */

/**
 * Context for V1 Settings Store
 * Shares the store instance (hook function), not the store values
 */
export const SettingsStoreContext = createContext(useSettingsStore);

/**
 * Hook to access Auth from V2 components
 * @deprecated Use `useAuth()` from '../contexts/AuthContext' directly
 * This re-export exists for backward compatibility during migration
 */
export function useV2Auth() {
  return useAuth();
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

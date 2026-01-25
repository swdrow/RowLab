import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Context, ContextConfig } from '../types/context';

/**
 * Navigation configuration for each context
 * Defines the sidebar navigation items that appear based on active persona
 */
export const CONTEXT_CONFIGS: ContextConfig[] = [
  {
    id: 'me',
    label: 'Me',
    icon: 'user',
    shortcut: '⌘1',
    navItems: [
      { to: '/beta/dashboard', label: 'Dashboard', icon: 'home' },
      { to: '/beta/workouts', label: 'My Workouts', icon: 'activity' },
      { to: '/beta/progress', label: 'Progress', icon: 'trending-up' },
    ],
  },
  {
    id: 'coach',
    label: 'Coach',
    icon: 'users',
    shortcut: '⌘2',
    navItems: [
      { to: '/app/coach/whiteboard', label: 'Whiteboard', icon: 'clipboard' },
      { to: '/app/coach/fleet', label: 'Fleet', icon: 'boat' },
      { to: '/app/coach/availability', label: 'Availability', icon: 'calendar' },
      { to: '/app/coach/lineup-builder', label: 'Lineup Builder', icon: 'layout' },
      { to: '/app/coach/seat-racing', label: 'Seat Racing', icon: 'trophy' },
      { to: '/app/coach/training', label: 'Training', icon: 'activity' },
      { to: '/app/regattas', label: 'Regattas', icon: 'flag' },
      { to: '/app/rankings', label: 'Rankings', icon: 'bar-chart' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: 'shield',
    shortcut: '⌘3',
    navItems: [
      { to: '/beta/users', label: 'Users', icon: 'users' },
      { to: '/beta/teams', label: 'Teams', icon: 'team' },
      { to: '/beta/settings', label: 'Settings', icon: 'settings' },
    ],
  },
];

/**
 * Context Store State
 */
interface ContextStore {
  /** Currently active context */
  activeContext: Context;
  /** Set the active context */
  setActiveContext: (context: Context) => void;
  /** Get navigation config for current context */
  getActiveConfig: () => ContextConfig | undefined;
}

/**
 * Context Store
 * Manages the active persona/workspace context with persistence
 */
export const useContextStore = create<ContextStore>()(
  persist(
    (set, get) => ({
      // Default to 'me' context (athlete view)
      activeContext: 'me',

      setActiveContext: (context: Context) => {
        set({ activeContext: context });
      },

      getActiveConfig: () => {
        const { activeContext } = get();
        return CONTEXT_CONFIGS.find((config) => config.id === activeContext);
      },
    }),
    {
      name: 'v2-context', // localStorage key
    }
  )
);

// Re-export Context type for convenience
export type { Context };

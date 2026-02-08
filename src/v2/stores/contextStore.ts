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
      { to: '/app', label: 'Dashboard', icon: 'home' },
      { to: '/app/achievements', label: 'Achievements', icon: 'trophy' },
      { to: '/app/challenges', label: 'Challenges', icon: 'flag' },
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
      { to: '/app/attendance', label: 'Attendance', icon: 'user-check' },
      { to: '/app/regattas', label: 'Regattas', icon: 'flag' },
      { to: '/app/rankings', label: 'Rankings', icon: 'bar-chart' },
      { to: '/app/recruiting', label: 'Recruiting', icon: 'users' },
      { to: '/app/settings', label: 'Settings', icon: 'settings' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: 'shield',
    shortcut: '⌘3',
    navItems: [
      { to: '/app/users', label: 'Users', icon: 'users' },
      { to: '/app/teams', label: 'Teams', icon: 'team' },
      { to: '/app/settings', label: 'Settings', icon: 'settings' },
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

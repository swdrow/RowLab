/**
 * Keyboard shortcuts registry for the application
 * Defines all keyboard shortcuts with their bindings, labels, and categories
 */

export interface KeyboardShortcut {
  id: string;
  keys: string; // react-hotkeys-hook format: "mod+n", "mod+e"
  label: string; // Display label: "Create athlete"
  description?: string;
  displayKeys: string; // For rendering: "⌘ N" or "Ctrl N"
  category: 'navigation' | 'actions' | 'palette' | 'editing';
  scope?: string; // Optional scope for page-specific shortcuts
  action?: string; // Action ID for command palette integration
}

export const SHORTCUTS: KeyboardShortcut[] = [
  // Palette
  {
    id: 'open-palette',
    keys: 'mod+k',
    label: 'Open command palette',
    displayKeys: '⌘ K',
    category: 'palette',
  },
  {
    id: 'show-shortcuts',
    keys: 'shift+/',
    label: 'Show keyboard shortcuts',
    displayKeys: '?',
    category: 'palette',
  },

  // Actions
  {
    id: 'create-athlete',
    keys: 'mod+n',
    label: 'Create athlete',
    displayKeys: '⌘ N',
    category: 'actions',
    action: 'create_athlete',
  },
  {
    id: 'log-erg-test',
    keys: 'mod+e',
    label: 'Log erg test',
    displayKeys: '⌘ E',
    category: 'actions',
    action: 'log_erg_test',
  },
  {
    id: 'start-practice',
    keys: 'mod+p',
    label: 'Start practice',
    displayKeys: '⌘ P',
    category: 'actions',
    action: 'start_practice',
  },

  // Navigation - using mod+shift combinations to avoid conflicts
  {
    id: 'go-dashboard',
    keys: 'mod+shift+d',
    label: 'Go to dashboard',
    displayKeys: '⌘ ⇧ D',
    category: 'navigation',
  },
  {
    id: 'go-athletes',
    keys: 'mod+shift+a',
    label: 'Go to athletes',
    displayKeys: '⌘ ⇧ A',
    category: 'navigation',
  },
  {
    id: 'go-erg-tests',
    keys: 'mod+shift+e',
    label: 'Go to erg tests',
    displayKeys: '⌘ ⇧ E',
    category: 'navigation',
  },
  {
    id: 'go-lineups',
    keys: 'mod+shift+l',
    label: 'Go to lineup builder',
    displayKeys: '⌘ ⇧ L',
    category: 'navigation',
  },
  {
    id: 'go-training',
    keys: 'mod+shift+t',
    label: 'Go to training',
    displayKeys: '⌘ ⇧ T',
    category: 'navigation',
  },

  // Page-specific
  {
    id: 'athletes-search',
    keys: '/',
    label: 'Search athletes',
    displayKeys: '/',
    category: 'navigation',
    scope: 'athletes',
  },
];

/**
 * Get shortcuts grouped by category
 */
export function getShortcutsByCategory(): Record<KeyboardShortcut['category'], KeyboardShortcut[]> {
  return SHORTCUTS.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<KeyboardShortcut['category'], KeyboardShortcut[]>
  );
}

/**
 * Get display-friendly key representation
 */
export function getDisplayKey(keys: string): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');

  return keys
    .split('+')
    .map((key) => {
      switch (key.toLowerCase()) {
        case 'mod':
          return isMac ? '⌘' : 'Ctrl';
        case 'shift':
          return isMac ? '⇧' : 'Shift';
        case 'alt':
          return isMac ? '⌥' : 'Alt';
        case 'ctrl':
          return isMac ? '⌃' : 'Ctrl';
        default:
          return key.toUpperCase();
      }
    })
    .join(' ');
}

/**
 * Get shortcut by ID
 */
export function getShortcutById(id: string): KeyboardShortcut | undefined {
  return SHORTCUTS.find((s) => s.id === id);
}

/**
 * Get shortcut by action ID
 */
export function getShortcutByAction(action: string): KeyboardShortcut | undefined {
  return SHORTCUTS.find((s) => s.action === action);
}

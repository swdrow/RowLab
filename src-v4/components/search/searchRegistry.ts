/**
 * Search registry: static entries for pages and commands used in the Cmd+K palette.
 * Pages are derived from navigation config. Commands are action entries.
 */
import {
  IconLayout,
  IconDumbbell,
  IconCalendarDays,
  IconUsers,
  IconClipboardList,
  IconUserCheck,
  IconRows,
  IconSailboat,
  IconWarehouse,
  IconNotebook,
  IconUserPlus,
  IconSettings,
  IconUser,
  IconPlus,
  IconArrowLeftRight,
  IconLogOut,
} from '@/components/icons';
import type { IconComponent } from '@/types/icons';

export interface SearchEntry {
  type: 'page' | 'command';
  id: string;
  label: string;
  description?: string;
  icon: IconComponent;
  keywords: string[];
  path?: string;
  action?: () => void;
}

/* === PAGE ENTRIES === */

const pages: SearchEntry[] = [
  {
    type: 'page',
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Personal training overview',
    icon: IconLayout,
    keywords: ['home', 'dashboard', 'overview', 'main'],
    path: '/',
  },
  {
    type: 'page',
    id: 'workouts',
    label: 'Workouts',
    description: 'Training log and history',
    icon: IconDumbbell,
    keywords: ['workouts', 'training', 'log', 'exercise', 'erg'],
    path: '/workouts',
  },
  {
    type: 'page',
    id: 'team',
    label: 'Team Dashboard',
    description: 'Team overview',
    icon: IconUsers,
    keywords: ['team', 'squad', 'group', 'crew'],
    path: '/team',
  },
  {
    type: 'page',
    id: 'athletes',
    label: 'Athletes',
    description: 'Team roster',
    icon: IconClipboardList,
    keywords: ['athletes', 'roster', 'members', 'rowers'],
    path: '/athletes',
  },
  {
    type: 'page',
    id: 'attendance',
    label: 'Attendance',
    description: 'Practice attendance tracking',
    icon: IconUserCheck,
    keywords: ['attendance', 'check-in', 'practice', 'present'],
    path: '/attendance',
  },
  {
    type: 'page',
    id: 'lineup-builder',
    label: 'Lineup Builder',
    description: 'Create and manage boat lineups',
    icon: IconRows,
    keywords: ['lineup', 'builder', 'boats', 'seating', 'arrange'],
    path: '/lineup-builder',
  },
  {
    type: 'page',
    id: 'seat-racing',
    label: 'Seat Racing',
    description: 'Compare rower performance',
    icon: IconSailboat,
    keywords: ['seat', 'racing', 'compare', 'selection'],
    path: '/seat-racing',
  },
  {
    type: 'page',
    id: 'fleet',
    label: 'Fleet',
    description: 'Boat and equipment management',
    icon: IconWarehouse,
    keywords: ['fleet', 'boats', 'equipment', 'shells', 'oars'],
    path: '/fleet',
  },
  {
    type: 'page',
    id: 'training',
    label: 'Training',
    description: 'Training plans and sessions',
    icon: IconCalendarDays,
    keywords: ['training', 'plans', 'sessions', 'coach', 'program'],
    path: '/training',
  },
  {
    type: 'page',
    id: 'whiteboard',
    label: 'Whiteboard',
    description: 'Practice notes and announcements',
    icon: IconNotebook,
    keywords: ['whiteboard', 'notes', 'announcements', 'practice', 'board'],
    path: '/whiteboard',
  },
  {
    type: 'page',
    id: 'recruiting',
    label: 'Recruiting',
    description: 'Recruit visit tracking',
    icon: IconUserPlus,
    keywords: ['recruiting', 'visits', 'prospects', 'recruits'],
    path: '/recruiting',
  },
  {
    type: 'page',
    id: 'settings',
    label: 'Settings',
    description: 'App preferences',
    icon: IconSettings,
    keywords: ['settings', 'preferences', 'config', 'options'],
    path: '/settings',
  },
  {
    type: 'page',
    id: 'profile',
    label: 'Profile',
    description: 'Your account',
    icon: IconUser,
    keywords: ['profile', 'account', 'me', 'user'],
    path: '/profile',
  },
];

/* === COMMAND ENTRIES (populated with actions at runtime) === */

interface CommandTemplate {
  id: string;
  label: string;
  description?: string;
  icon: IconComponent;
  keywords: string[];
  /** 'navigate' commands use path; 'action' commands use the action callback */
  actionType: 'navigate' | 'action';
  path?: string;
  actionKey?: string;
}

const commandTemplates: CommandTemplate[] = [
  {
    id: 'cmd-log-workout',
    label: 'Log workout',
    description: 'Record a new training session',
    icon: IconPlus,
    keywords: ['log', 'add', 'workout', 'new', 'record', 'training'],
    actionType: 'action',
    actionKey: 'logWorkout',
  },
  {
    id: 'cmd-switch-team',
    label: 'Switch team',
    description: 'Change active team context',
    icon: IconArrowLeftRight,
    keywords: ['switch', 'team', 'change', 'swap'],
    actionType: 'action',
    actionKey: 'switchTeam',
  },
  {
    id: 'cmd-settings',
    label: 'Go to settings',
    icon: IconSettings,
    keywords: ['settings', 'preferences', 'config'],
    actionType: 'navigate',
    path: '/settings',
  },
  {
    id: 'cmd-profile',
    label: 'View profile',
    icon: IconUser,
    keywords: ['profile', 'account', 'me'],
    actionType: 'navigate',
    path: '/profile',
  },
  {
    id: 'cmd-logout',
    label: 'Logout',
    description: 'Sign out of oarbit',
    icon: IconLogOut,
    keywords: ['logout', 'sign out', 'exit', 'leave'],
    actionType: 'action',
    actionKey: 'logout',
  },
];

/**
 * Returns the full search registry with actions wired up.
 * Call this from the command palette component with navigate and action callbacks.
 */
export function getSearchRegistry(
  navigate: (path: string) => void,
  actions: Record<string, () => void>
): SearchEntry[] {
  const commands: SearchEntry[] = commandTemplates.map((tpl) => ({
    type: 'command' as const,
    id: tpl.id,
    label: tpl.label,
    description: tpl.description,
    icon: tpl.icon,
    keywords: tpl.keywords,
    action:
      tpl.actionType === 'navigate' && tpl.path
        ? () => navigate(tpl.path!)
        : tpl.actionKey && actions[tpl.actionKey]
          ? actions[tpl.actionKey]
          : undefined,
  }));

  return [...pages, ...commands];
}

/**
 * Returns only page entries (for recents / suggestions when no actions needed).
 */
export function getPageEntries(): SearchEntry[] {
  return pages;
}

/**
 * Navigation configuration: defines all nav items grouped by zone and section.
 * Zones filter visibility based on user role and team membership.
 *
 * - personal: always visible (workouts, profile)
 * - team: visible when user has an active team
 * - coach: visible when activeTeamRole is COACH, ADMIN, or OWNER (uppercase from backend)
 */
import {
  IconLayout,
  IconDumbbell,
  IconUsers,
  IconRows,
  IconSailboat,
  IconWarehouse,
  IconSettings,
  IconUser,
  IconCalendarDays,
  IconClipboardCheck,
  IconNotebook,
  IconUserPlus,
  IconMoreHorizontal,
} from '@/components/icons';
import { isCoachOrAbove } from '@/features/team/types';
import type { NavConfig, NavItem, NavSection } from '@/types/navigation';

/* === PERSONAL ZONE (always visible) === */

const trainingSection: NavSection = {
  id: 'training',
  label: 'Training',
  items: [
    { id: 'dashboard', label: 'Dashboard', icon: IconLayout, path: '/', zone: 'personal' },
    { id: 'workouts', label: 'Workouts', icon: IconDumbbell, path: '/workouts', zone: 'personal' },
    // Calendar nav item deferred to Phase 66 (CAL-01)
  ],
};

const profileSection: NavSection = {
  id: 'profile',
  label: 'You',
  items: [{ id: 'profile', label: 'Profile', icon: IconUser, path: '/profile', zone: 'personal' }],
};

/* === TEAM ZONE (visible with active team) === */

const teamSection: NavSection = {
  id: 'team',
  label: 'Team',
  items: [{ id: 'team-dashboard', label: 'Team', icon: IconUsers, path: '/team', zone: 'team' }],
};

/* === COACH ZONE (visible when coach or admin) === */

const coachSection: NavSection = {
  id: 'coach-tools',
  label: 'Coach Tools',
  items: [
    {
      id: 'lineup-builder',
      label: 'Lineup Builder',
      icon: IconRows,
      path: '/lineup-builder',
      zone: 'coach',
    },
    {
      id: 'seat-racing',
      label: 'Seat Racing',
      icon: IconSailboat,
      path: '/seat-racing',
      zone: 'coach',
    },
    { id: 'fleet', label: 'Fleet', icon: IconWarehouse, path: '/fleet', zone: 'coach' },
    {
      id: 'training',
      label: 'Training',
      icon: IconCalendarDays,
      path: '/training',
      zone: 'coach',
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: IconClipboardCheck,
      path: '/attendance',
      zone: 'coach',
    },
    {
      id: 'whiteboard',
      label: 'Whiteboard',
      icon: IconNotebook,
      path: '/whiteboard',
      zone: 'coach',
    },
    {
      id: 'recruiting',
      label: 'Recruiting',
      icon: IconUserPlus,
      path: '/recruiting',
      zone: 'coach',
    },
  ],
};

/* === ALL SECTIONS === */

const allSections: NavSection[] = [trainingSection, profileSection, teamSection, coachSection];

/* === BOTTOM TAB ITEMS (mobile, max 5) === */

const personalBottomTabs: NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: IconLayout, path: '/', zone: 'personal' },
  { id: 'workouts', label: 'Workouts', icon: IconDumbbell, path: '/workouts', zone: 'personal' },
];

const teamBottomTab: NavItem = {
  id: 'team-dashboard',
  label: 'Team',
  icon: IconUsers,
  path: '/team',
  zone: 'team',
};

const profileBottomTab: NavItem = {
  id: 'profile',
  label: 'Profile',
  icon: IconUser,
  path: '/profile',
  zone: 'personal',
};

/* === SIDEBAR FOOTER ITEMS === */

export const sidebarFooterItems: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: IconSettings, path: '/settings', zone: 'personal' },
  { id: 'profile', label: 'Profile', icon: IconUser, path: '/profile', zone: 'personal' },
];

/* === EXPORTS === */

/**
 * Returns the navigation config filtered by role and team membership.
 * Sections with no visible items after filtering are excluded.
 */
export function getNavConfig(role: string | null, hasTeam: boolean): NavConfig {
  const sections = allSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.zone === 'personal') return true;
        if (item.zone === 'team') return hasTeam;
        if (item.zone === 'coach') return hasTeam && isCoachOrAbove(role);
        return false;
      }),
    }))
    .filter((section) => section.items.length > 0);

  return {
    sections,
    bottomTabItems: getBottomTabItems(role, hasTeam),
  };
}

/**
 * Returns up to 5 bottom tab items for mobile navigation.
 * Dashboard and Workouts are always present.
 * Team tab appears if user has a team.
 * Coach users get a "More" tab for coach tools.
 * Profile is always last.
 */
export function getBottomTabItems(role: string | null, hasTeam: boolean): NavItem[] {
  const items = [...personalBottomTabs];

  if (hasTeam) {
    items.push(teamBottomTab);
  }

  if (hasTeam && isCoachOrAbove(role)) {
    items.push({
      id: 'more',
      label: 'More',
      icon: IconMoreHorizontal,
      path: '/__more__',
      zone: 'coach',
    });
  }

  items.push(profileBottomTab);

  return items.slice(0, 5);
}

/**
 * Returns coach tool items for the "More" sheet on mobile.
 */
export function getCoachToolItems(): NavItem[] {
  return coachSection.items;
}

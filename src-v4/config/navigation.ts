/**
 * Navigation configuration: defines all nav items grouped by zone and section.
 * Zones filter visibility based on user role and team membership.
 *
 * - personal: always visible (workouts, stats, profile)
 * - team: visible when user has an active team
 * - coach: visible when activeTeamRole is 'coach' or 'admin'
 */
import {
  LayoutDashboard,
  Dumbbell,
  Calendar,
  BarChart3,
  Trophy,
  Medal,
  Users,
  ClipboardList,
  UserCheck,
  Rows3,
  Sailboat,
  Warehouse,
  Settings,
  User,
} from 'lucide-react';
import type { NavConfig, NavItem, NavSection } from '@/types/navigation';

/* === PERSONAL ZONE (always visible) === */

const trainingSection: NavSection = {
  id: 'training',
  label: 'Training',
  items: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/', zone: 'personal' },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell, path: '/workouts', zone: 'personal' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/calendar', zone: 'personal' },
  ],
};

const statsSection: NavSection = {
  id: 'stats',
  label: 'Stats',
  items: [
    {
      id: 'personal-stats',
      label: 'Personal Stats',
      icon: BarChart3,
      path: '/stats',
      zone: 'personal',
    },
    { id: 'prs', label: 'PRs', icon: Trophy, path: '/prs', zone: 'personal' },
    {
      id: 'achievements',
      label: 'Achievements',
      icon: Medal,
      path: '/achievements',
      zone: 'personal',
    },
  ],
};

/* === TEAM ZONE (visible with active team) === */

const teamSection: NavSection = {
  id: 'team',
  label: 'Team',
  items: [
    { id: 'team-dashboard', label: 'Team Dashboard', icon: Users, path: '/team', zone: 'team' },
    { id: 'athletes', label: 'Athletes', icon: ClipboardList, path: '/athletes', zone: 'team' },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: UserCheck,
      path: '/team/attendance',
      zone: 'team',
    },
  ],
};

/* === COACH ZONE (visible when coach or admin) === */

const coachSection: NavSection = {
  id: 'coach-tools',
  label: 'Coach Tools',
  items: [
    {
      id: 'lineups',
      label: 'Lineup Builder',
      icon: Rows3,
      path: '/team/coach/lineups',
      zone: 'coach',
    },
    {
      id: 'seat-racing',
      label: 'Seat Racing',
      icon: Sailboat,
      path: '/team/coach/seat-racing',
      zone: 'coach',
    },
    { id: 'fleet', label: 'Fleet', icon: Warehouse, path: '/team/coach/fleet', zone: 'coach' },
  ],
};

/* === ALL SECTIONS === */

const allSections: NavSection[] = [trainingSection, statsSection, teamSection, coachSection];

/* === BOTTOM TAB ITEMS (mobile, max 5) === */

const personalBottomTabs: NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard, path: '/', zone: 'personal' },
  { id: 'workouts', label: 'Workouts', icon: Dumbbell, path: '/workouts', zone: 'personal' },
  { id: 'personal-stats', label: 'Stats', icon: BarChart3, path: '/stats', zone: 'personal' },
];

const teamBottomTab: NavItem = {
  id: 'team-dashboard',
  label: 'Team',
  icon: Users,
  path: '/team',
  zone: 'team',
};

const profileBottomTab: NavItem = {
  id: 'profile',
  label: 'Profile',
  icon: User,
  path: '/profile',
  zone: 'personal',
};

/* === SIDEBAR FOOTER ITEMS === */

export const sidebarFooterItems: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings', zone: 'personal' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile', zone: 'personal' },
];

/* === EXPORTS === */

/**
 * Returns the navigation config filtered by role and team membership.
 * Sections with no visible items after filtering are excluded.
 */
export function getNavConfig(role: string | null, hasTeam: boolean): NavConfig {
  const isCoach = role === 'coach' || role === 'admin';

  const sections = allSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.zone === 'personal') return true;
        if (item.zone === 'team') return hasTeam;
        if (item.zone === 'coach') return hasTeam && isCoach;
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
 * Dashboard, Workouts, Stats are always present.
 * Team tab appears if user has a team.
 * Profile is always last.
 */
export function getBottomTabItems(_role: string | null, hasTeam: boolean): NavItem[] {
  const items = [...personalBottomTabs];

  if (hasTeam) {
    items.push(teamBottomTab);
  }

  items.push(profileBottomTab);

  // Max 5 items
  return items.slice(0, 5);
}

/**
 * Widget Registry
 * Phase 27-01: Defines all available dashboard widgets with size presets
 */

import type { WidgetConfig, DashboardLayout, UserRole } from '../types';

// Widget components
import { TodaysPracticeSummary } from '../components/widgets/TodaysPracticeSummary';
import { AttendanceSummaryWidget } from '../components/widgets/AttendanceSummaryWidget';
import { UpcomingSessionsWidget } from '../components/widgets/UpcomingSessionsWidget';
import { RecentActivityWidget } from '../components/widgets/RecentActivityWidget';
import { PersonalStatsWidget } from '../components/widgets/PersonalStatsWidget';
import { ExceptionAlertsWidget } from '../components/widgets/ExceptionAlertsWidget';
import { ErgLeaderboardWidget } from '../components/widgets/ErgLeaderboardWidget';
import { PRsAchievementsWidget } from '../components/widgets/PRsAchievementsWidget';
import { NextWorkoutWidget } from '../components/widgets/NextWorkoutWidget';
import { TeamLeaderboardWidget } from '../components/widgets/TeamLeaderboardWidget';

/**
 * Widget Registry
 * Maps widget IDs to their configuration
 */
export const WIDGET_REGISTRY: Record<string, WidgetConfig> = {
  // COACH WIDGETS
  'todays-practice': {
    id: 'todays-practice',
    title: "Today's Practice",
    description: "Summary of today's training session with quick actions",
    icon: 'CalendarDot',
    category: 'overview',
    roles: ['coach', 'admin'],
    sizes: {
      compact: { w: 4, h: 3 },
      normal: { w: 6, h: 4 },
      expanded: { w: 8, h: 5 },
    },
    defaultSize: 'normal',
    component: TodaysPracticeSummary,
  },

  'attendance-summary': {
    id: 'attendance-summary',
    title: 'Attendance Summary',
    description: 'Recent attendance trends and alerts',
    icon: 'UserCheck',
    category: 'metrics',
    roles: ['coach', 'admin'],
    sizes: {
      compact: { w: 3, h: 3 },
      normal: { w: 4, h: 4 },
    },
    defaultSize: 'compact',
    component: AttendanceSummaryWidget,
  },

  'exception-alerts': {
    id: 'exception-alerts',
    title: 'Exception Alerts',
    description: 'Critical issues requiring immediate attention',
    icon: 'Warning',
    category: 'overview',
    roles: ['coach', 'admin'],
    sizes: {
      compact: { w: 3, h: 3 },
      normal: { w: 4, h: 4 },
    },
    defaultSize: 'compact',
    component: ExceptionAlertsWidget,
  },

  'upcoming-sessions': {
    id: 'upcoming-sessions',
    title: 'Upcoming Sessions',
    description: 'Next scheduled training sessions',
    icon: 'CalendarBlank',
    category: 'activity',
    roles: ['coach', 'admin'],
    sizes: {
      compact: { w: 4, h: 4 },
      normal: { w: 6, h: 4 },
    },
    defaultSize: 'compact',
    component: UpcomingSessionsWidget,
  },

  'recent-activity': {
    id: 'recent-activity',
    title: 'Recent Activity',
    description: 'Latest team activity and updates',
    icon: 'Activity',
    category: 'activity',
    roles: ['coach', 'athlete', 'admin'],
    sizes: {
      compact: { w: 4, h: 3 },
      normal: { w: 8, h: 4 },
      expanded: { w: 12, h: 5 },
    },
    defaultSize: 'compact',
    component: RecentActivityWidget,
  },

  'erg-leaderboard': {
    id: 'erg-leaderboard',
    title: 'Erg Leaderboard',
    description: 'Top erg test performances',
    icon: 'ChartBar',
    category: 'metrics',
    roles: ['coach', 'admin'],
    sizes: {
      compact: { w: 4, h: 3 },
      normal: { w: 6, h: 4 },
    },
    defaultSize: 'compact',
    component: ErgLeaderboardWidget,
  },

  // ATHLETE WIDGETS
  'personal-stats': {
    id: 'personal-stats',
    title: 'Personal Stats',
    description: 'Your performance overview and recent PRs',
    icon: 'TrendUp',
    category: 'overview',
    roles: ['athlete', 'admin'],
    sizes: {
      compact: { w: 4, h: 3 },
      normal: { w: 6, h: 4 },
      expanded: { w: 8, h: 5 },
    },
    defaultSize: 'normal',
    component: PersonalStatsWidget,
  },

  'prs-achievements': {
    id: 'prs-achievements',
    title: 'PRs & Achievements',
    description: 'Recent personal records and unlocked achievements',
    icon: 'Trophy',
    category: 'metrics',
    roles: ['athlete', 'admin'],
    sizes: {
      compact: { w: 3, h: 3 },
      normal: { w: 4, h: 4 },
    },
    defaultSize: 'compact',
    component: PRsAchievementsWidget,
  },

  'next-workout': {
    id: 'next-workout',
    title: 'Next Workout',
    description: 'Your next scheduled training session',
    icon: 'Clock',
    category: 'activity',
    roles: ['athlete', 'admin'],
    sizes: {
      compact: { w: 3, h: 3 },
      normal: { w: 4, h: 4 },
    },
    defaultSize: 'compact',
    component: NextWorkoutWidget,
  },

  'team-leaderboard': {
    id: 'team-leaderboard',
    title: 'Team Leaderboard',
    description: 'Your rank among team members',
    icon: 'Ranking',
    category: 'team',
    roles: ['athlete', 'admin'],
    sizes: {
      compact: { w: 6, h: 3 },
      normal: { w: 6, h: 4 },
    },
    defaultSize: 'compact',
    component: TeamLeaderboardWidget,
  },
};

/**
 * Get widget configuration by ID
 */
export function getWidgetConfig(widgetType: string): WidgetConfig | undefined {
  return WIDGET_REGISTRY[widgetType];
}

/**
 * Get available widgets for a specific role
 */
export function getAvailableWidgets(role: UserRole): WidgetConfig[] {
  return Object.values(WIDGET_REGISTRY).filter((widget) => widget.roles.includes(role));
}

/**
 * Get default dashboard layout for a role
 */
export function getDefaultLayout(role: 'coach' | 'athlete'): DashboardLayout {
  if (role === 'coach') {
    return {
      widgets: [
        {
          id: 'widget-1',
          widgetType: 'todays-practice',
          size: 'normal',
          position: { x: 0, y: 0, w: 6, h: 4 },
        },
        {
          id: 'widget-2',
          widgetType: 'attendance-summary',
          size: 'compact',
          position: { x: 6, y: 0, w: 3, h: 3 },
        },
        {
          id: 'widget-3',
          widgetType: 'exception-alerts',
          size: 'compact',
          position: { x: 9, y: 0, w: 3, h: 3 },
        },
        {
          id: 'widget-4',
          widgetType: 'upcoming-sessions',
          size: 'compact',
          position: { x: 0, y: 4, w: 4, h: 4 },
        },
        {
          id: 'widget-5',
          widgetType: 'recent-activity',
          size: 'compact',
          position: { x: 4, y: 4, w: 4, h: 3 },
        },
        {
          id: 'widget-6',
          widgetType: 'erg-leaderboard',
          size: 'compact',
          position: { x: 8, y: 4, w: 4, h: 3 },
        },
      ],
      version: 1,
    };
  } else {
    // athlete layout
    return {
      widgets: [
        {
          id: 'widget-1',
          widgetType: 'personal-stats',
          size: 'normal',
          position: { x: 0, y: 0, w: 6, h: 4 },
        },
        {
          id: 'widget-2',
          widgetType: 'prs-achievements',
          size: 'compact',
          position: { x: 6, y: 0, w: 3, h: 3 },
        },
        {
          id: 'widget-3',
          widgetType: 'next-workout',
          size: 'compact',
          position: { x: 9, y: 0, w: 3, h: 3 },
        },
        {
          id: 'widget-4',
          widgetType: 'team-leaderboard',
          size: 'compact',
          position: { x: 0, y: 4, w: 6, h: 3 },
        },
        {
          id: 'widget-5',
          widgetType: 'recent-activity',
          size: 'compact',
          position: { x: 6, y: 4, w: 4, h: 3 },
        },
      ],
      version: 1,
    };
  }
}

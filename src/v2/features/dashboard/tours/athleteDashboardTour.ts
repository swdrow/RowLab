/**
 * Athlete Dashboard Tour
 * Phase 27-07: Driver.js guided tour for athlete dashboard
 *
 * 4 steps covering key features for athletes
 */

import { DriveStep } from 'driver.js';

export const athleteDashboardTour: DriveStep[] = [
  {
    popover: {
      title: 'Welcome to Your Dashboard 🚣',
      description:
        'Track your progress, see team updates, and stay motivated. Let me show you the highlights.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="personal-stats"]',
    popover: {
      title: 'Your Personal Stats',
      description:
        'Your latest PRs are highlighted with gold badges. Track your attendance streak and recent performance here.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="team-context"]',
    popover: {
      title: 'Team Context',
      description:
        "See upcoming workouts, your team ranking, and recent activity. If you're on multiple teams, you'll see all of them here.",
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="edit-layout"]',
    popover: {
      title: 'Customize Your View',
      description:
        'Click "Edit Layout" to arrange your dashboard how you like it. Your preferences save automatically.',
      side: 'left',
      align: 'end',
    },
  },
];

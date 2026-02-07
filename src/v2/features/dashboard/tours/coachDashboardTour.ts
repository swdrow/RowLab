/**
 * Coach Dashboard Tour
 * Phase 27-07: Driver.js guided tour for coach dashboard
 *
 * 5 steps covering key features for coaches
 */

import { DriveStep } from 'driver.js';

export const coachDashboardTour: DriveStep[] = [
  {
    popover: {
      title: 'Welcome to Your Coach Dashboard 🚣',
      description:
        'Your command center for managing your team. Let me show you around the key features.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="exception-banner"]',
    popover: {
      title: 'Exception Banner',
      description:
        'Important issues that need your attention appear here. The banner auto-hides when everything is green.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="todays-practice"]',
    popover: {
      title: "Today's Practice",
      description:
        'Your hero card shows today\'s workout, attendance, and quick actions. Click "Add Workout" or "Mark Attendance" right from here.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="metric-cards"]',
    popover: {
      title: 'Team Metrics',
      description:
        'Track key metrics with sparkline charts. Each card shows trend data and lets you drill into details.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="edit-layout"]',
    popover: {
      title: 'Customize Your Layout',
      description:
        'Click "Edit Layout" to rearrange widgets with drag-and-drop, resize, or remove. Your layout saves automatically.',
      side: 'left',
      align: 'end',
    },
  },
];

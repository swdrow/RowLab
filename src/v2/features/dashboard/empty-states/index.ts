/**
 * Dashboard Empty States
 *
 * Pre-configured empty state components for each dashboard context.
 * Each variant provides: animation + explanation + CTA(s)
 *
 * Per CONTEXT.md: Every empty state has illustration + explanation + CTA
 */

import React from 'react';
import { EmptyStateAnimated } from './EmptyStateAnimated';

export { EmptyStateAnimated } from './EmptyStateAnimated';
export { GeometricAnimation } from './GeometricAnimation';

/**
 * EmptyRosterState - No athletes in roster
 */
export const EmptyRosterState: React.FC = () => {
  return React.createElement(EmptyStateAnimated, {
    animationType: 'roster',
    title: 'No Athletes Yet',
    description:
      'Start building your team by importing your roster or adding athletes one at a time.',
    action: {
      label: 'Import Roster',
      to: '/app/athletes?action=import',
    },
    secondaryAction: {
      label: 'Add Manually',
      to: '/app/athletes?action=create',
    },
  });
};

/**
 * EmptyPracticeState - No sessions scheduled
 */
export const EmptyPracticeState: React.FC = () => {
  return React.createElement(EmptyStateAnimated, {
    animationType: 'practice',
    title: 'No Sessions Scheduled',
    description: 'Create your first practice session to start tracking attendance and performance.',
    action: {
      label: 'Schedule Practice',
      to: '/app/training/sessions?action=create',
    },
  });
};

/**
 * EmptyErgState - No erg data
 */
export const EmptyErgState: React.FC = () => {
  return React.createElement(EmptyStateAnimated, {
    animationType: 'erg',
    title: 'No Erg Data',
    description: 'Log erg test results to track athlete progress and performance over time.',
    action: {
      label: 'Log Erg Test',
      to: '/app/erg-tests?action=create',
    },
    secondaryAction: {
      label: 'Import CSV',
      to: '/app/erg-tests?action=import',
    },
  });
};

/**
 * EmptyAttendanceState - No attendance data
 */
export const EmptyAttendanceState: React.FC = () => {
  return React.createElement(EmptyStateAnimated, {
    animationType: 'general',
    title: 'No Attendance Data',
    description:
      'Start tracking who shows up for practice to monitor team commitment and participation.',
    action: {
      label: 'Start Taking Attendance',
      to: '/app/attendance',
    },
  });
};

/**
 * EmptyAchievementState - No achievements yet
 */
export const EmptyAchievementState: React.FC = () => {
  return React.createElement(EmptyStateAnimated, {
    animationType: 'achievement',
    title: 'No Achievements Yet',
    description:
      'Achievements unlock as you and your team reach milestones. Keep training and racing to earn them.',
  });
};

/**
 * EmptyDashboardState - Welcome/onboarding state
 */
export const EmptyDashboardState: React.FC = () => {
  return React.createElement(EmptyStateAnimated, {
    animationType: 'onboarding',
    title: 'Welcome to RowLab',
    description:
      "Your rowing management platform is ready. Let's get started by setting up your team.",
    action: {
      label: 'Import Roster',
      to: '/app/athletes?action=import',
    },
  });
};

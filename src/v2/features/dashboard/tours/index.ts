/**
 * Tour Registry
 * Phase 27-07: Central registry for all driver.js tours
 *
 * Export TOUR_REGISTRY mapping tour IDs to step arrays
 */

import { DriveStep } from 'driver.js';
import { coachDashboardTour } from './coachDashboardTour';
import { athleteDashboardTour } from './athleteDashboardTour';

export const TOUR_REGISTRY: Record<string, DriveStep[]> = {
  'coach-dashboard': coachDashboardTour,
  'athlete-dashboard': athleteDashboardTour,
};

// Export individual tours for direct use if needed
export { coachDashboardTour, athleteDashboardTour };

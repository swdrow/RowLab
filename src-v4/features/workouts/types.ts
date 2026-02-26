/**
 * Workout feature types.
 * Re-exports base types from dashboard and adds workout-specific interfaces.
 */

export type { Workout, WorkoutSplit, WorkoutsData } from '@/features/dashboard/types';

import type { Workout } from '@/features/dashboard/types';

export interface WorkoutDetail extends Workout {
  prevWorkoutId: string | null;
  nextWorkoutId: string | null;
  c2LogbookId: string | null;
  telemetry: WorkoutTelemetry | null;
}

export interface WorkoutTelemetry {
  timeSeriesS: number[];
  wattsSeries: number[];
  heartRateSeries: number[];
  strokeRateSeries: number[];
  forceCurves: unknown;
}

export interface WorkoutFilters {
  type?: string;
  source?: 'manual' | 'concept2' | 'strava' | 'garmin';
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateWorkoutInput {
  type: string;
  machineType?: string | null;
  date: string;
  distanceM?: number;
  durationSeconds?: number;
  avgPace?: number;
  avgWatts?: number;
  notes?: string;
}

export interface UpdateWorkoutInput {
  type?: string;
  machineType?: string | null;
  date?: string;
  distanceM?: number;
  durationSeconds?: number;
  avgPace?: number;
  avgWatts?: number;
  notes?: string;
}

export interface WorkoutGroup {
  dateKey: string;
  label: string;
  workouts: Workout[];
}

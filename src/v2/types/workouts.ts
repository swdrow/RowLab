/**
 * Workout and WorkoutSplit types for erg workout data
 * (Not to be confused with PlannedWorkout from training plans)
 */

export interface WorkoutSplit {
  id: string;
  splitNumber: number;
  distanceM: number | null;
  timeSeconds: number | null;
  pace: number | null; // tenths of seconds per 500m
  watts: number | null;
  strokeRate: number | null;
  heartRate: number | null;
  dragFactor: number | null;
  calories: number | null;
}

export interface Workout {
  id: string;
  athleteId: string | null;
  userId: string | null;
  teamId: string;
  source: 'manual' | 'concept2';
  type: string | null; // on_water, erg, strength, etc.
  machineType: 'rower' | 'bikerg' | 'skierg' | null;
  c2LogbookId: string | null;
  date: string; // ISO date
  distanceM: number | null;
  durationSeconds: number | null;
  strokeRate: number | null;
  calories: number | null;
  dragFactor: number | null;
  avgPace: number | null; // tenths of seconds per 500m
  avgWatts: number | null;
  avgHeartRate: number | null;
  notes: string | null;
  athlete: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  splits: WorkoutSplit[];
  createdAt: string;
}

export const MACHINE_TYPE_LABELS: Record<string, string> = {
  rower: 'RowErg',
  bikerg: 'BikeErg',
  skierg: 'SkiErg',
};

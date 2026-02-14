/**
 * Dashboard data types.
 * Interfaces for stats, workouts, PRs, and team context.
 */

export interface StatsData {
  allTime: {
    totalMeters: number;
    workoutCount: number;
    activeDays: number;
    totalDurationSeconds: number;
    firstWorkoutDate: string | null;
  };
  range: {
    meters: number;
    workouts: number;
    activeDays: number;
    period: '7d' | '30d' | '90d' | '1y' | 'all';
  };
  streak: {
    current: number;
    longest: number;
    lastActivityDate: string | null;
  };
  byTeam?: Record<string, { totalMeters: number; workoutCount: number }>;
}

export interface WorkoutSplit {
  splitNumber: number;
  distanceM: number | null;
  timeSeconds: number | null;
  pace: number | null;
  watts: number | null;
  strokeRate: number | null;
  heartRate: number | null;
}

export interface Workout {
  id: string;
  date: string;
  source: 'manual' | 'concept2' | 'strava' | 'garmin';
  type: string | null;
  machineType: string | null;
  distanceM: number | null;
  durationSeconds: number | null;
  avgPace: number | null; // tenths of seconds per 500m
  avgWatts: number | null;
  strokeRate: number | null;
  avgHeartRate?: number | null;
  teamId: string | null;
  notes: string | null;
  splits?: WorkoutSplit[];
  createdAt?: string;
}

export interface WorkoutsData {
  items: Workout[];
  totalCount: number;
  totalMeters: number;
  cursor: string | null;
}

export interface PRRecord {
  testType: string;
  machineType: string;
  bestTime: number | null;
  bestDate: string | null;
  previousBest: number | null;
  improvement: number | null;
  recentAttempts: Array<{ time: number; date: string }>;
}

export interface PRsData {
  records: PRRecord[];
}

export interface TeamContextData {
  teamId: string;
  teamName: string;
  upcomingEvents: Array<{
    id: string;
    title: string;
    date: string;
    type: string;
  }>;
  notices: Array<{
    id: string;
    message: string;
    createdAt: string;
    author: string;
  }>;
}

export interface DashboardData {
  stats: StatsData;
  workouts: WorkoutsData;
  prs: PRsData;
  hasData: boolean;
}

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import type { ApiResponse } from '../types/settings';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Workout {
  id: string;
  athleteId: string | null;
  teamId: string;
  source: string;
  type: string | null;
  c2LogbookId: string | null;
  stravaActivityId: string | null;
  date: string;
  distanceM: number | null;
  durationSeconds: number | null;
  strokeRate: number | null;
  calories: number | null;
  dragFactor: number | null;
  machineType: string | null; // 'rower', 'bikerg', 'skierg'
  avgPace: number | null; // tenths of seconds per 500m
  avgWatts: number | null;
  avgHeartRate: number | null;
  notes: string | null;
  createdAt: string;
  athlete: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  splits?: WorkoutSplit[];
}

export interface WorkoutSplit {
  id: string;
  workoutId: string;
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

export interface WorkoutFilters extends Record<string, unknown> {
  athleteId?: string;
  source?: 'manual' | 'concept2_sync' | 'csv_import' | 'bluetooth';
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format pace value from tenths of seconds to "M:SS.T/500m" format
 * @param tenths Pace in tenths of seconds per 500m (from DB)
 * @param machineType Machine type for unit label ('bikerg' uses /1000m, others use /500m)
 * @returns Formatted pace string (e.g., "7:42.6/500m")
 */
export function formatPace(tenths: number | null | undefined, machineType?: string | null): string {
  if (tenths === null || tenths === undefined) return '—';

  const seconds = tenths / 10;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const unit = machineType === 'bikerg' ? '/1000m' : '/500m';

  return `${minutes}:${remainingSeconds.toFixed(1).padStart(4, '0')}${unit}`;
}

/**
 * Format duration in seconds to "HH:MM:SS" or "M:SS" format
 * @param seconds Total duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '—';

  const totalSeconds = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format distance in meters with commas
 * @param meters Distance in meters
 * @returns Formatted distance string (e.g., "2,000m")
 */
export function formatDistance(meters: number | null | undefined): string {
  if (meters === null || meters === undefined) return '—';

  return `${meters.toLocaleString('en-US')}m`;
}

/**
 * Get display label for machine type
 * @param machineType Machine type from workout
 * @returns Display label
 */
export function getMachineTypeLabel(machineType: string | null | undefined): string {
  if (!machineType) return 'Unknown';

  const labels: Record<string, string> = {
    rower: 'ROWER',
    bikerg: 'BIKE ERG',
    skierg: 'SKI ERG',
  };

  return labels[machineType.toLowerCase()] || machineType.toUpperCase();
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch workouts with optional filters
 */
async function fetchWorkouts(filters?: WorkoutFilters): Promise<Workout[]> {
  const params = new URLSearchParams();

  if (filters?.athleteId) params.append('athleteId', filters.athleteId);
  if (filters?.source) params.append('source', filters.source);
  if (filters?.fromDate) params.append('fromDate', filters.fromDate);
  if (filters?.toDate) params.append('toDate', filters.toDate);
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const url = `/api/v1/workouts${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await api.get<ApiResponse<{ workouts: Workout[] }>>(url);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch workouts');
  }

  return response.data.data.workouts;
}

/**
 * Fetch single workout with splits and telemetry
 */
async function fetchWorkoutDetail(workoutId: string): Promise<Workout> {
  const response = await api.get<ApiResponse<{ workout: Workout }>>(
    `/api/v1/workouts/${workoutId}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch workout detail');
  }

  return response.data.data.workout;
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to fetch workouts with optional filters
 * @param filters Optional filters (athleteId, source, date range)
 * @returns Workouts data, loading state, error, and refetch function
 */
export function useWorkoutHistory(filters?: WorkoutFilters) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.workouts.list(filters),
    queryFn: () => fetchWorkouts(filters),
    enabled: isInitialized && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    workouts: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to fetch single workout detail with splits
 * @param workoutId Workout ID to fetch
 * @returns Workout detail with splits, loading state, and error
 */
export function useWorkoutDetail(workoutId: string | null | undefined) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: [...queryKeys.workouts.all, 'detail', workoutId],
    queryFn: () => fetchWorkoutDetail(workoutId!),
    enabled: isInitialized && isAuthenticated && !!workoutId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    workout: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

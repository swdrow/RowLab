/**
 * React Query hooks for erg workout data (C2 sync and manual workouts)
 * Not to be confused with useWorkouts.ts which handles training plan workouts
 */

import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import type { Workout } from '@v2/types/workouts';

interface WorkoutApiResponse {
  success: boolean;
  data?: {
    workout: Workout;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Fetch a single workout by ID with splits
 */
export function useWorkoutDetail(workoutId: string | null) {
  return useQuery({
    queryKey: ['ergWorkout', workoutId],
    queryFn: async () => {
      if (!workoutId) return null;
      const res = await api.get<WorkoutApiResponse>(`/api/v1/workouts/${workoutId}`);

      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message || 'Failed to fetch workout');
      }

      return res.data.data.workout;
    },
    enabled: !!workoutId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

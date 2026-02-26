/**
 * Workout mutation hooks: create, update, delete.
 *
 * Each mutation invalidates both workouts and dashboard caches on success
 * so the feed, detail, stats, and recent-workouts views stay fresh.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { CreateWorkoutInput, UpdateWorkoutInput } from '../types';

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export function useCreateWorkout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkoutInput) => apiClient.post('/api/u/workouts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workouts.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export function useUpdateWorkout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkoutInput }) =>
      apiClient.patch('/api/u/workouts/' + id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workouts.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export function useDeleteWorkout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete('/api/u/workouts/' + id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workouts.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

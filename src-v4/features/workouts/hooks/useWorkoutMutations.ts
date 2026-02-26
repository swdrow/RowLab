/**
 * Workout mutation hooks: create, update, delete.
 *
 * Each mutation invalidates both workouts and dashboard caches on success
 * so the feed, detail, stats, and recent-workouts views stay fresh.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { CreateWorkoutInput, UpdateWorkoutInput } from '../types';

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export function useCreateWorkout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateWorkoutInput) => {
      const res = await api.post('/api/u/workouts', data);
      return res.data.data;
    },
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
    mutationFn: async ({ id, data }: { id: string; data: UpdateWorkoutInput }) => {
      const res = await api.patch('/api/u/workouts/' + id, data);
      return res.data.data;
    },
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
    mutationFn: async (id: string) => {
      const res = await api.delete('/api/u/workouts/' + id);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workouts.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

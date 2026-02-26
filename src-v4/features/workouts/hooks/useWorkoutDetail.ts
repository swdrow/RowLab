/**
 * Single workout detail hook.
 *
 * Returns a standard query result for one workout including splits,
 * adjacent workout IDs, and optional telemetry.
 */
import { useQuery } from '@tanstack/react-query';
import { workoutDetailOptions } from '../api';

export function useWorkoutDetail(workoutId: string) {
  return useQuery(workoutDetailOptions(workoutId));
}

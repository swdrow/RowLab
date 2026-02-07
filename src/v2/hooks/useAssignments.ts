// src/v2/hooks/useAssignments.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import type {
  WorkoutAssignment,
  PlannedWorkout,
  WorkoutCompletion,
  TrainingApiResponse,
} from '../types/training';

// ============================================
// API FUNCTIONS
// ============================================

interface AssignmentListOptions {
  planId?: string;
  athleteId?: string;
  status?: 'active' | 'completed' | 'cancelled';
}

async function fetchAssignments(options: AssignmentListOptions = {}): Promise<WorkoutAssignment[]> {
  // Fetch from training plans and aggregate assignments
  const params = new URLSearchParams();
  if (options.athleteId) params.append('athleteId', options.athleteId);
  if (options.status) params.append('status', options.status);

  // If planId specified, get assignments for that plan
  if (options.planId) {
    const response = await api.get<
      TrainingApiResponse<{ plan: { assignments: WorkoutAssignment[] } }>
    >(`/api/v1/training-plans/${options.planId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch assignments');
    }
    return response.data.data.plan.assignments || [];
  }

  // Otherwise, fetch all plans and aggregate assignments
  const response =
    await api.get<
      TrainingApiResponse<{ plans: { id: string; assignments: WorkoutAssignment[] }[] }>
    >('/api/v1/training-plans');
  if (!response.data.success || !response.data.data) {
    throw new Error('Failed to fetch assignments');
  }

  const allAssignments: WorkoutAssignment[] = [];
  for (const plan of response.data.data.plans) {
    if (plan.assignments) {
      allAssignments.push(...plan.assignments.map((a) => ({ ...a, planId: plan.id })));
    }
  }

  // Filter by athleteId if specified
  if (options.athleteId) {
    return allAssignments.filter((a) => a.athleteId === options.athleteId);
  }

  return allAssignments;
}

async function fetchAthleteWorkouts(
  athleteId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  assignments: WorkoutAssignment[];
  workouts: PlannedWorkout[];
  completions: WorkoutCompletion[];
}> {
  // Fetch athlete's assigned plans and their workouts
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', format(startDate, 'yyyy-MM-dd'));
  if (endDate) params.append('endDate', format(endDate, 'yyyy-MM-dd'));

  // Get athlete's load data which includes assignments
  const loadResponse = await api.get<
    TrainingApiResponse<{
      assignments: WorkoutAssignment[];
      workouts: PlannedWorkout[];
      completions: WorkoutCompletion[];
    }>
  >(`/api/v1/training-plans/athlete/${athleteId}/load?${params.toString()}`);

  if (!loadResponse.data.success || !loadResponse.data.data) {
    throw new Error('Failed to fetch athlete workouts');
  }

  return loadResponse.data.data;
}

interface CreateAssignmentInput {
  planId: string;
  athleteIds: string[];
  startDate: Date;
  endDate?: Date;
}

async function createAssignments(data: CreateAssignmentInput): Promise<WorkoutAssignment[]> {
  // Use the plan-specific assign endpoint
  const response = await api.post<TrainingApiResponse<{ assignments: WorkoutAssignment[] }>>(
    `/api/v1/training-plans/${data.planId}/assign`,
    {
      athleteIds: data.athleteIds,
      startDate: format(data.startDate, 'yyyy-MM-dd'),
      endDate: data.endDate ? format(data.endDate, 'yyyy-MM-dd') : undefined,
    }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to create assignments');
  }

  return response.data.data.assignments;
}

async function deleteAssignment(data: { planId: string; assignmentId: string }): Promise<void> {
  const response = await api.delete<TrainingApiResponse<void>>(
    `/api/v1/training-plans/${data.planId}/assignments/${data.assignmentId}`
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete assignment');
  }
}

async function markWorkoutComplete(data: {
  planId: string;
  workoutId: string;
  athleteId: string;
  actualWorkoutId?: string;
  compliance?: number;
  notes?: string;
}): Promise<WorkoutCompletion> {
  // Use the plan-specific completion endpoint
  const response = await api.post<TrainingApiResponse<{ completion: WorkoutCompletion }>>(
    `/api/v1/training-plans/${data.planId}/workouts/${data.workoutId}/complete`,
    {
      athleteId: data.athleteId,
      actualWorkoutId: data.actualWorkoutId,
      compliance: data.compliance,
      notes: data.notes,
    }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to mark workout complete');
  }

  return response.data.data.completion;
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Hook for fetching assignments (for coaches)
 */
export function useAssignments(options?: AssignmentListOptions) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: ['assignments', options],
    queryFn: () => fetchAssignments(options),
    enabled: isInitialized && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  return {
    assignments: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for fetching athlete's assigned workouts (for athlete view)
 */
export function useAthleteAssignments(athleteId: string | null, startDate?: Date, endDate?: Date) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: ['athleteWorkouts', athleteId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: () => fetchAthleteWorkouts(athleteId!, startDate, endDate),
    enabled: isInitialized && isAuthenticated && !!athleteId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    assignments: query.data?.assignments || [],
    workouts: query.data?.workouts || [],
    completions: query.data?.completions || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Hook for creating assignments
 */
export function useCreateAssignment() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createAssignments,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['athleteWorkouts'] });
      queryClient.invalidateQueries({ queryKey: ['trainingPlan'] });
    },
  });

  return {
    createAssignment: mutation.mutate,
    createAssignmentAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    createError: mutation.error,
  };
}

/**
 * Hook for deleting assignment
 */
export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['athleteWorkouts'] });
      queryClient.invalidateQueries({ queryKey: ['trainingPlan'] });
    },
  });

  return {
    deleteAssignment: mutation.mutate,
    deleteAssignmentAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    deleteError: mutation.error,
  };
}

/**
 * Hook for marking workout as complete
 */
export function useMarkWorkoutComplete() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: markWorkoutComplete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athleteWorkouts'] });
      queryClient.invalidateQueries({ queryKey: ['ncaaCompliance'] });
      queryClient.invalidateQueries({ queryKey: ['trainingLoad'] });
    },
  });

  return {
    markComplete: mutation.mutate,
    markCompleteAsync: mutation.mutateAsync,
    isMarking: mutation.isPending,
    markError: mutation.error,
  };
}

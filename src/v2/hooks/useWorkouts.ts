import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { queryKeys } from '../lib/queryKeys';

// ============================================
// TYPES
// ============================================

interface PlannedWorkout {
  id: string;
  planId: string;
  name: string;
  type: 'erg' | 'row' | 'cross_train' | 'strength' | 'rest';
  description?: string;
  scheduledDate?: string;
  dayOfWeek?: number;
  weekNumber?: number;
  duration?: number;
  distance?: number;
  targetPace?: number;
  targetHeartRate?: number;
  intensity?: 'easy' | 'moderate' | 'hard' | 'max';
  order?: number;
  recurrenceRule?: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkoutFormData {
  name: string;
  type: 'erg' | 'row' | 'cross_train' | 'strength' | 'rest';
  description?: string;
  scheduledDate?: string;
  dayOfWeek?: number;
  weekNumber?: number;
  duration?: number;
  distance?: number;
  targetPace?: number;
  targetHeartRate?: number;
  intensity?: 'easy' | 'moderate' | 'hard' | 'max';
  order?: number;
  recurrenceRule?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    workoutId: string;
    planId: string;
    type: string;
    intensity?: string;
  };
}

interface TrainingApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

interface TrainingPlan {
  id: string;
  workouts?: PlannedWorkout[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function workoutToCalendarEvent(workout: PlannedWorkout): CalendarEvent | null {
  if (!workout.scheduledDate) return null;

  const start = new Date(workout.scheduledDate);
  const duration = workout.duration || 60; // default 60 minutes
  const end = new Date(start.getTime() + duration * 60 * 1000);

  return {
    id: workout.id,
    title: workout.name,
    start,
    end,
    resource: {
      workoutId: workout.id,
      planId: workout.planId,
      type: workout.type,
      intensity: workout.intensity,
    },
  };
}

function expandRecurringEvent(
  workout: PlannedWorkout,
  startDate: Date,
  endDate: Date
): CalendarEvent[] {
  // Simplified recurring event expansion
  // In a real implementation, this would parse recurrenceRule (RRULE format)
  // For now, return single event if it has a scheduled date
  const event = workoutToCalendarEvent(workout);
  if (!event) return [];

  // Check if event falls within the date range
  if (event.start >= startDate && event.start <= endDate) {
    return [event];
  }

  return [];
}

function formatISO(date: Date): string {
  return date.toISOString();
}

// ============================================
// API FUNCTIONS
// ============================================

interface WorkoutListOptions {
  planId?: string;
  startDate?: Date;
  endDate?: Date;
  type?: string;
}

async function fetchWorkouts(options: WorkoutListOptions = {}): Promise<PlannedWorkout[]> {
  // If planId specified, use the plan-specific endpoint
  if (options.planId) {
    const params = new URLSearchParams();
    if (options.startDate) params.append('startDate', formatISO(options.startDate));
    if (options.endDate) params.append('endDate', formatISO(options.endDate));
    if (options.type) params.append('type', options.type);

    const url = `/api/v1/training-plans/${options.planId}/workouts${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get<TrainingApiResponse<{ workouts: PlannedWorkout[] }>>(url);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to fetch workouts');
    }

    return response.data.data.workouts;
  }

  // For calendar view (all workouts across plans), fetch all plans and aggregate
  const plansResponse =
    await api.get<TrainingApiResponse<{ plans: TrainingPlan[] }>>('/api/v1/training-plans');

  if (!plansResponse.data.success || !plansResponse.data.data) {
    throw new Error('Failed to fetch workouts');
  }

  const allWorkouts: PlannedWorkout[] = [];
  for (const plan of plansResponse.data.data.plans) {
    if (plan.workouts) {
      allWorkouts.push(...plan.workouts);
    }
  }

  // Filter by date range if specified
  if (options.startDate || options.endDate) {
    return allWorkouts.filter((w) => {
      if (!w.scheduledDate) return false;
      const date = new Date(w.scheduledDate);
      if (options.startDate && date < options.startDate) return false;
      if (options.endDate && date > options.endDate) return false;
      return true;
    });
  }

  return allWorkouts;
}

async function fetchWorkout(planId: string, workoutId: string): Promise<PlannedWorkout> {
  const response = await api.get<TrainingApiResponse<{ workout: PlannedWorkout }>>(
    `/api/v1/training-plans/${planId}/workouts/${workoutId}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch workout');
  }

  return response.data.data.workout;
}

async function createWorkout(data: WorkoutFormData & { planId: string }): Promise<PlannedWorkout> {
  const { planId, ...workoutData } = data;
  const response = await api.post<TrainingApiResponse<{ workout: PlannedWorkout }>>(
    `/api/v1/training-plans/${planId}/workouts`,
    workoutData
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to create workout');
  }

  return response.data.data.workout;
}

async function updateWorkout(
  data: Partial<WorkoutFormData> & { id: string; planId: string }
): Promise<PlannedWorkout> {
  const { id, planId, ...updateData } = data;
  const response = await api.put<TrainingApiResponse<{ workout: PlannedWorkout }>>(
    `/api/v1/training-plans/${planId}/workouts/${id}`,
    updateData
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update workout');
  }

  return response.data.data.workout;
}

async function deleteWorkout(data: { id: string; planId: string }): Promise<void> {
  const response = await api.delete<TrainingApiResponse<void>>(
    `/api/v1/training-plans/${data.planId}/workouts/${data.id}`
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete workout');
  }
}

async function rescheduleWorkout(data: {
  id: string;
  planId: string;
  scheduledDate: Date;
}): Promise<PlannedWorkout> {
  const response = await api.put<TrainingApiResponse<{ workout: PlannedWorkout }>>(
    `/api/v1/training-plans/${data.planId}/workouts/${data.id}`,
    { scheduledDate: formatISO(data.scheduledDate) }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to reschedule workout');
  }

  return response.data.data.workout;
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Hook for fetching workouts (optionally filtered by plan or date range)
 */
export function useWorkouts(options?: WorkoutListOptions) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: ['workouts', options],
    queryFn: () => fetchWorkouts(options),
    enabled: isInitialized && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  return {
    workouts: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for fetching workouts as calendar events
 * Expands recurring workouts into individual calendar events
 */
export function useCalendarEvents(startDate: Date, endDate: Date, planId?: string) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: ['calendarEvents', formatISO(startDate), formatISO(endDate), planId],
    queryFn: async (): Promise<CalendarEvent[]> => {
      const workouts = await fetchWorkouts({ startDate, endDate, planId });

      const events: CalendarEvent[] = [];

      for (const workout of workouts) {
        if (workout.recurrenceRule) {
          // Expand recurring workout
          const expanded = expandRecurringEvent(workout, startDate, endDate);
          events.push(...expanded);
        } else {
          // Single workout
          const event = workoutToCalendarEvent(workout);
          if (event) events.push(event);
        }
      }

      return events;
    },
    enabled: isInitialized && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  return {
    events: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for fetching single workout
 */
export function useWorkout(planId: string | null, workoutId: string | null) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: ['workout', planId, workoutId],
    queryFn: () => fetchWorkout(planId!, workoutId!),
    enabled: isInitialized && isAuthenticated && !!planId && !!workoutId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    workout: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// ============================================
// MUTATION HOOKS
// ============================================

export function useCreateWorkout() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createWorkout,
    onSuccess: (newWorkout) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      queryClient.invalidateQueries({ queryKey: ['trainingPlan', newWorkout.planId] });
    },
  });

  return {
    createWorkout: mutation.mutate,
    createWorkoutAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    createError: mutation.error,
  };
}

export function useUpdateWorkout() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateWorkout,
    onSuccess: (updatedWorkout) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      queryClient.invalidateQueries({
        queryKey: ['workout', updatedWorkout.planId, updatedWorkout.id],
      });
    },
  });

  return {
    updateWorkout: mutation.mutate,
    updateWorkoutAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
  };
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    },
  });

  return {
    deleteWorkout: mutation.mutate,
    deleteWorkoutAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    deleteError: mutation.error,
  };
}

/**
 * Hook for rescheduling workout with optimistic update
 */
export function useRescheduleWorkout() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: rescheduleWorkout,
    onMutate: async (variables) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: ['calendarEvents'] });

      // Save previous state for rollback
      const previousEvents = queryClient.getQueriesData({ queryKey: ['calendarEvents'] });

      // Optimistic update - update the event date in cache
      queryClient.setQueriesData(
        { queryKey: ['calendarEvents'] },
        (old: CalendarEvent[] | undefined) => {
          if (!old) return old;
          return old.map((event) =>
            event.id === variables.id || event.resource?.workoutId === variables.id
              ? {
                  ...event,
                  start: variables.scheduledDate,
                  end: new Date(
                    variables.scheduledDate.getTime() +
                      (event.end.getTime() - event.start.getTime())
                  ),
                }
              : event
          );
        }
      );

      return { previousEvents };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousEvents) {
        for (const [queryKey, data] of context.previousEvents) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });

  return {
    rescheduleWorkout: mutation.mutate,
    rescheduleWorkoutAsync: mutation.mutateAsync,
    isRescheduling: mutation.isPending,
    rescheduleError: mutation.error,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

// ============================================
// TYPES
// ============================================

interface TrainingPlan {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  phase?: 'Base' | 'Build' | 'Peak' | 'Taper' | 'Recovery';
  isTemplate?: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  workouts?: any[];
}

interface TrainingPlanFormData {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  phase?: 'Base' | 'Build' | 'Peak' | 'Taper' | 'Recovery';
  isTemplate?: boolean;
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

// ============================================
// API FUNCTIONS
// ============================================

interface PlanListOptions {
  includeTemplates?: boolean;
  limit?: number;
  offset?: number;
}

async function fetchTrainingPlans(options: PlanListOptions = {}): Promise<TrainingPlan[]> {
  const params = new URLSearchParams();
  if (options.includeTemplates) params.append('includeTemplates', 'true');
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.offset) params.append('offset', options.offset.toString());

  // Use correct backend route
  const url = `/api/v1/training-plans${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await api.get<TrainingApiResponse<{ plans: TrainingPlan[] }>>(url);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch training plans');
  }

  return response.data.data.plans;
}

async function fetchTrainingPlan(planId: string): Promise<TrainingPlan> {
  const response = await api.get<TrainingApiResponse<{ plan: TrainingPlan }>>(
    `/api/v1/training-plans/${planId}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch training plan');
  }

  return response.data.data.plan;
}

async function createPlan(data: TrainingPlanFormData): Promise<TrainingPlan> {
  const response = await api.post<TrainingApiResponse<{ plan: TrainingPlan }>>(
    '/api/v1/training-plans',
    data
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to create training plan');
  }

  return response.data.data.plan;
}

async function updatePlan(data: TrainingPlanFormData & { id: string }): Promise<TrainingPlan> {
  const { id, ...updateData } = data;
  const response = await api.put<TrainingApiResponse<{ plan: TrainingPlan }>>(
    `/api/v1/training-plans/${id}`,
    updateData
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update training plan');
  }

  return response.data.data.plan;
}

async function deletePlan(id: string): Promise<void> {
  const response = await api.delete<TrainingApiResponse<void>>(`/api/v1/training-plans/${id}`);

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete training plan');
  }
}

async function duplicatePlan(id: string): Promise<TrainingPlan> {
  const response = await api.post<TrainingApiResponse<{ plan: TrainingPlan }>>(
    `/api/v1/training-plans/${id}/duplicate`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to duplicate training plan');
  }

  return response.data.data.plan;
}

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Hook for fetching all training plans for active team
 */
export function useTrainingPlans(options?: PlanListOptions) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: ['trainingPlans', options],
    queryFn: () => fetchTrainingPlans(options),
    enabled: isInitialized && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    plans: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for fetching single training plan with workouts
 */
export function useTrainingPlan(planId: string | null) {
  const { isAuthenticated, isInitialized } = useAuth();

  const query = useQuery({
    queryKey: ['trainingPlan', planId],
    queryFn: () => fetchTrainingPlan(planId!),
    enabled: isInitialized && isAuthenticated && !!planId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    plan: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// ============================================
// MUTATION HOOKS
// ============================================

export function useCreatePlan() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingPlans'] });
    },
  });

  return {
    createPlan: mutation.mutate,
    createPlanAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    createError: mutation.error,
  };
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updatePlan,
    onSuccess: (updatedPlan) => {
      queryClient.invalidateQueries({ queryKey: ['trainingPlans'] });
      queryClient.invalidateQueries({ queryKey: ['trainingPlan', updatedPlan.id] });
    },
  });

  return {
    updatePlan: mutation.mutate,
    updatePlanAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
  };
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deletePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingPlans'] });
    },
  });

  return {
    deletePlan: mutation.mutate,
    deletePlanAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    deleteError: mutation.error,
  };
}

export function useDuplicatePlan() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: duplicatePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingPlans'] });
    },
  });

  return {
    duplicatePlan: mutation.mutate,
    duplicatePlanAsync: mutation.mutateAsync,
    isDuplicating: mutation.isPending,
    duplicateError: mutation.error,
  };
}

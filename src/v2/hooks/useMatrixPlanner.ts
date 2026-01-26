import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import type {
  SwapSchedule,
  MatrixPlannerInput
} from '../types/advancedRanking';
import type { ApiResponse } from '../types/dashboard';
import { advancedRankingKeys } from './useAdvancedRankings';

// ============================================
// MUTATION FUNCTIONS
// ============================================

async function generateSchedule(input: MatrixPlannerInput): Promise<SwapSchedule> {
  const response = await api.post<ApiResponse<SwapSchedule>>(
    '/api/v1/advanced-ranking/matrix-planner/generate',
    input
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to generate schedule');
  }

  return response.data.data;
}

async function validateSchedule(schedule: SwapSchedule): Promise<{
  valid: boolean;
  issues: string[];
  statistics: SwapSchedule['statistics'];
}> {
  const response = await api.post<ApiResponse<{
    valid: boolean;
    issues: string[];
    statistics: SwapSchedule['statistics'];
  }>>('/api/v1/advanced-ranking/matrix-planner/validate', { schedule });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to validate schedule');
  }

  return response.data.data;
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Hook for generating optimal swap schedule
 *
 * @returns Mutation for generating schedules
 *
 * @example
 * const { generate, isGenerating, schedule } = useGenerateSchedule();
 *
 * const handleGenerate = () => {
 *   generate({
 *     athleteIds: ['id1', 'id2', 'id3', 'id4'],
 *     boatClass: '2-',
 *     pieceCount: 4
 *   });
 * };
 */
export function useGenerateSchedule() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: generateSchedule,
    onSuccess: () => {
      // Invalidate comparison graph as new schedule may affect it
      queryClient.invalidateQueries({ queryKey: advancedRankingKeys.all });
    },
  });

  return {
    generate: mutation.mutate,
    generateAsync: mutation.mutateAsync,
    isGenerating: mutation.isPending,
    schedule: mutation.data,
    error: mutation.error,
    reset: mutation.reset,
  };
}

/**
 * Hook for validating manually-created schedules
 *
 * @returns Mutation for validating schedules
 *
 * @example
 * const { validate, isValidating, validation } = useValidateSchedule();
 *
 * const handleValidate = (schedule) => {
 *   validate(schedule);
 * };
 */
export function useValidateSchedule() {
  const mutation = useMutation({
    mutationFn: validateSchedule,
  });

  return {
    validate: mutation.mutate,
    validateAsync: mutation.mutateAsync,
    isValidating: mutation.isPending,
    validation: mutation.data,
    error: mutation.error,
    reset: mutation.reset,
  };
}

/**
 * Combined hook for matrix planner state
 * Useful when component needs both generate and validate functionality
 */
export function useMatrixPlanner() {
  const generate = useGenerateSchedule();
  const validate = useValidateSchedule();

  return {
    // Generate
    generateSchedule: generate.generate,
    generateScheduleAsync: generate.generateAsync,
    isGenerating: generate.isGenerating,
    generatedSchedule: generate.schedule,
    generateError: generate.error,
    resetGenerate: generate.reset,

    // Validate
    validateSchedule: validate.validate,
    validateScheduleAsync: validate.validateAsync,
    isValidating: validate.isValidating,
    validationResult: validate.validation,
    validateError: validate.error,
    resetValidate: validate.reset,
  };
}

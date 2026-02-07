/**
 * Equipment Hooks - Phase 18 BOAT-03, BOAT-04
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import type {
  EquipmentAssignment,
  EquipmentAssignmentInput,
  EquipmentConflict,
  EquipmentAvailability,
} from '../types/equipment';

// Query key factory

/**
 * Get equipment availability for a date
 */
export function useEquipmentAvailability(date: string, excludeLineupId?: string) {
  const { isAuthenticated, isInitialized, activeTeamId } = useAuth();

  return useQuery({
    queryKey: queryKeys.equipment.availability(date, excludeLineupId),
    queryFn: async (): Promise<EquipmentAvailability> => {
      let url = `/api/v1/equipment/availability?date=${encodeURIComponent(date)}`;
      if (excludeLineupId) {
        url += `&excludeLineupId=${encodeURIComponent(excludeLineupId)}`;
      }
      const response = await api.get(url);
      if (!response.data.success)
        throw new Error(response.data.error?.message || 'Failed to fetch availability');
      return response.data.data;
    },
    enabled: isAuthenticated && isInitialized && !!activeTeamId && !!date,
    staleTime: 30 * 1000, // 30 seconds - equipment status can change frequently
  });
}

/**
 * Get assignments for a date
 */
export function useEquipmentAssignments(date: string) {
  const { isAuthenticated, isInitialized, activeTeamId } = useAuth();

  return useQuery({
    queryKey: queryKeys.equipment.assignments(date),
    queryFn: async (): Promise<EquipmentAssignment[]> => {
      const response = await api.get(
        `/api/v1/equipment/assignments?date=${encodeURIComponent(date)}`
      );
      if (!response.data.success)
        throw new Error(response.data.error?.message || 'Failed to fetch assignments');
      return response.data.data.assignments;
    },
    enabled: isAuthenticated && isInitialized && !!activeTeamId && !!date,
    staleTime: 30 * 1000,
  });
}

/**
 * Get assignments for a lineup
 */
export function useLineupEquipmentAssignments(lineupId: string | null) {
  const { isAuthenticated, isInitialized, activeTeamId } = useAuth();

  return useQuery({
    queryKey: queryKeys.equipment.lineupAssignments(lineupId || ''),
    queryFn: async (): Promise<EquipmentAssignment[]> => {
      const response = await api.get(`/api/v1/equipment/assignments/lineup/${lineupId}`);
      if (!response.data.success)
        throw new Error(response.data.error?.message || 'Failed to fetch assignments');
      return response.data.data.assignments;
    },
    enabled: isAuthenticated && isInitialized && !!activeTeamId && !!lineupId,
    staleTime: 30 * 1000,
  });
}

/**
 * Create equipment assignment
 */
export function useCreateEquipmentAssignment() {
  const { authenticatedFetch } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EquipmentAssignmentInput): Promise<EquipmentAssignment> => {
      const response = await api.get('/api/v1/equipment/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed to create assignment');
      return result.data.assignment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.availability(variables.assignedDate),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.assignments(variables.assignedDate),
      });
      if (variables.lineupId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.equipment.lineupAssignments(variables.lineupId),
        });
      }
    },
  });
}

/**
 * Delete equipment assignment
 */
export function useDeleteEquipmentAssignment() {
  const { authenticatedFetch } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string): Promise<void> => {
      const response = await api.get(`/api/v1/equipment/assignments/${assignmentId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed to delete assignment');
    },
    onSuccess: () => {
      // Invalidate all equipment queries since we don't know the date/lineup
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
    },
  });
}

/**
 * Check for equipment conflicts
 */
export function useCheckConflicts() {
  const { authenticatedFetch } = useAuth();

  return useMutation({
    mutationFn: async ({
      date,
      shellIds,
      oarSetIds,
      excludeLineupId,
    }: {
      date: string;
      shellIds?: string[];
      oarSetIds?: string[];
      excludeLineupId?: string;
    }): Promise<{ conflicts: EquipmentConflict[]; hasConflicts: boolean }> => {
      const response = await api.get('/api/v1/equipment/check-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, shellIds, oarSetIds, excludeLineupId }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed to check conflicts');
      return result.data;
    },
  });
}

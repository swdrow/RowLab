/**
 * Rigging Profile Hooks - Phase 18 BOAT-02
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import type { RiggingProfile, RiggingProfileInput, RiggingDefaults } from '../types/rigging';

// Query key factory

/**
 * Get default rigging values for all boat classes
 */
export function useDefaultRigging() {
  const { isAuthenticated, isInitialized, activeTeamId } = useAuth();

  return useQuery({
    queryKey: queryKeys.rigging.defaults(),
    queryFn: async (): Promise<Record<string, RiggingDefaults>> => {
      const response = await api.get('/api/v1/rigging/defaults');
      const data = await response.data;
      if (!data.success) throw new Error(data.error?.message || 'Failed to fetch defaults');
      return data.data.defaults;
    },
    enabled: isAuthenticated && isInitialized && !!activeTeamId,
    staleTime: Infinity, // Defaults never change
  });
}

/**
 * Get all team rigging profiles
 */
export function useTeamRiggingProfiles() {
  const { isAuthenticated, isInitialized, activeTeamId } = useAuth();

  return useQuery({
    queryKey: queryKeys.rigging.profiles(),
    queryFn: async (): Promise<RiggingProfile[]> => {
      const response = await api.get('/api/v1/rigging');
      const data = await response.data;
      if (!data.success) throw new Error(data.error?.message || 'Failed to fetch profiles');
      return data.data.profiles;
    },
    enabled: isAuthenticated && isInitialized && !!activeTeamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get rigging profile for a specific shell
 */
export function useRiggingProfile(shellId: string | null) {
  const { isAuthenticated, isInitialized, activeTeamId } = useAuth();

  return useQuery({
    queryKey: queryKeys.rigging.profile(shellId || ''),
    queryFn: async (): Promise<RiggingProfile & { isCustom: boolean }> => {
      const response = await api.get(`/api/v1/rigging/shell/${shellId}`);
      const data = await response.data;
      if (!data.success) throw new Error(data.error?.message || 'Failed to fetch profile');
      return data.data.profile;
    },
    enabled: isAuthenticated && isInitialized && !!activeTeamId && !!shellId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Save (create/update) rigging profile
 */
export function useSaveRiggingProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shellId,
      data,
    }: {
      shellId: string;
      data: RiggingProfileInput;
    }): Promise<RiggingProfile> => {
      const response = await api.put(`/api/v1/rigging/shell/${shellId}`, data);
      const result = response.data;
      if (!result.success) throw new Error(result.error?.message || 'Failed to save profile');
      return result.data.profile;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rigging.profile(variables.shellId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.rigging.profiles() });
    },
  });
}

/**
 * Delete rigging profile (revert to defaults)
 */
export function useDeleteRiggingProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shellId: string): Promise<void> => {
      const response = await api.delete(`/api/v1/rigging/shell/${shellId}`);
      const result = response.data;
      if (!result.success) throw new Error(result.error?.message || 'Failed to delete profile');
    },
    onSuccess: (_, shellId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rigging.profile(shellId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.rigging.profiles() });
    },
  });
}

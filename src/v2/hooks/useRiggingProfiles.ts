/**
 * Rigging Profile Hooks - Phase 18 BOAT-02
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import type { RiggingProfile, RiggingProfileInput, RiggingDefaults } from '../types/rigging';

// Query key factory
export const riggingKeys = {
  all: ['rigging'] as const,
  defaults: () => [...riggingKeys.all, 'defaults'] as const,
  profiles: () => [...riggingKeys.all, 'profiles'] as const,
  profile: (shellId: string) => [...riggingKeys.all, 'profile', shellId] as const,
};

/**
 * Get default rigging values for all boat classes
 */
export function useDefaultRigging() {
  const { authenticatedFetch, isAuthenticated, isInitialized, activeTeamId } =
    useAuthStore();

  return useQuery({
    queryKey: riggingKeys.defaults(),
    queryFn: async (): Promise<Record<string, RiggingDefaults>> => {
      const response = await authenticatedFetch('/api/v1/rigging/defaults');
      const data = await response.json();
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
  const { authenticatedFetch, isAuthenticated, isInitialized, activeTeamId } =
    useAuthStore();

  return useQuery({
    queryKey: riggingKeys.profiles(),
    queryFn: async (): Promise<RiggingProfile[]> => {
      const response = await authenticatedFetch('/api/v1/rigging');
      const data = await response.json();
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
  const { authenticatedFetch, isAuthenticated, isInitialized, activeTeamId } =
    useAuthStore();

  return useQuery({
    queryKey: riggingKeys.profile(shellId || ''),
    queryFn: async (): Promise<RiggingProfile & { isCustom: boolean }> => {
      const response = await authenticatedFetch(`/api/v1/rigging/shell/${shellId}`);
      const data = await response.json();
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
  const { authenticatedFetch } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shellId,
      data,
    }: {
      shellId: string;
      data: RiggingProfileInput;
    }): Promise<RiggingProfile> => {
      const response = await authenticatedFetch(`/api/v1/rigging/shell/${shellId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed to save profile');
      return result.data.profile;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: riggingKeys.profile(variables.shellId) });
      queryClient.invalidateQueries({ queryKey: riggingKeys.profiles() });
    },
  });
}

/**
 * Delete rigging profile (revert to defaults)
 */
export function useDeleteRiggingProfile() {
  const { authenticatedFetch } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shellId: string): Promise<void> => {
      const response = await authenticatedFetch(`/api/v1/rigging/shell/${shellId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed to delete profile');
    },
    onSuccess: (_, shellId) => {
      queryClient.invalidateQueries({ queryKey: riggingKeys.profile(shellId) });
      queryClient.invalidateQueries({ queryKey: riggingKeys.profiles() });
    },
  });
}

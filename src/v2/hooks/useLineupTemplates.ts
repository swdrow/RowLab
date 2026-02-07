/**
 * Lineup Template Hooks - Phase 18 LINEUP-03
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import type {
  LineupTemplate,
  LineupTemplateInput,
  LineupTemplateUpdateInput,
  AppliedTemplate,
} from '../types/lineupTemplate';

// Query key factory
export const templateKeys = {
  all: ['lineup-templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (boatClass?: string) => [...templateKeys.lists(), { boatClass }] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
};

/**
 * Get all templates, optionally filtered by boat class
 */
export function useLineupTemplates(boatClass?: string) {
  const { isAuthenticated, isInitialized, activeTeamId } = useAuth();

  return useQuery({
    queryKey: templateKeys.list(boatClass),
    queryFn: async (): Promise<LineupTemplate[]> => {
      const url = boatClass
        ? `/api/v1/lineup-templates?boatClass=${encodeURIComponent(boatClass)}`
        : '/api/v1/lineup-templates';
      const response = await api.get(url);
      const data = await response.data;
      if (!data.success) throw new Error(data.error?.message || 'Failed to fetch templates');
      return data.data.templates;
    },
    enabled: isAuthenticated && isInitialized && !!activeTeamId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get a single template
 */
export function useLineupTemplate(templateId: string | null) {
  const { isAuthenticated, isInitialized, activeTeamId } = useAuth();

  return useQuery({
    queryKey: templateKeys.detail(templateId || ''),
    queryFn: async (): Promise<LineupTemplate> => {
      const response = await api.get(`/api/v1/lineup-templates/${templateId}`);
      const data = await response.data;
      if (!data.success) throw new Error(data.error?.message || 'Failed to fetch template');
      return data.data.template;
    },
    enabled: isAuthenticated && isInitialized && !!activeTeamId && !!templateId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create a new template
 */
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LineupTemplateInput): Promise<LineupTemplate> => {
      const response = await api.post('/api/v1/lineup-templates', data);
      const result = await response.data;
      if (!result.success) throw new Error(result.error?.message || 'Failed to create template');
      return result.data.template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    },
  });
}

/**
 * Create template from existing lineup
 */
export function useCreateTemplateFromLineup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lineupId,
      name,
      isDefault,
    }: {
      lineupId: string;
      name: string;
      isDefault?: boolean;
    }): Promise<LineupTemplate> => {
      const response = await api.post('/api/v1/lineup-templates/from-lineup', {
        lineupId,
        name,
        isDefault,
      });
      const result = await response.data;
      if (!result.success) throw new Error(result.error?.message || 'Failed to create template');
      return result.data.template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    },
  });
}

/**
 * Update a template
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      data,
    }: {
      templateId: string;
      data: LineupTemplateUpdateInput;
    }): Promise<LineupTemplate> => {
      const response = await api.put(`/api/v1/lineup-templates/${templateId}`, data);
      const result = await response.data;
      if (!result.success) throw new Error(result.error?.message || 'Failed to update template');
      return result.data.template;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(variables.templateId) });
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    },
  });
}

/**
 * Delete a template
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string): Promise<void> => {
      const response = await api.delete(`/api/v1/lineup-templates/${templateId}`);
      const result = await response.data;
      if (!result.success) throw new Error(result.error?.message || 'Failed to delete template');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    },
  });
}

/**
 * Apply a template to get assignments
 */
export function useApplyTemplate() {
  return useMutation({
    mutationFn: async (templateId: string): Promise<AppliedTemplate> => {
      const response = await api.post(`/api/v1/lineup-templates/${templateId}/apply`);
      const result = await response.data;
      if (!result.success) throw new Error(result.error?.message || 'Failed to apply template');
      return result.data;
    },
  });
}

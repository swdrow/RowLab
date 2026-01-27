/**
 * Lineup Template Hooks - Phase 18 LINEUP-03
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
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
  const { authenticatedFetch, isAuthenticated, isInitialized, activeTeamId } =
    useAuthStore();

  return useQuery({
    queryKey: templateKeys.list(boatClass),
    queryFn: async (): Promise<LineupTemplate[]> => {
      const url = boatClass
        ? `/api/v1/lineup-templates?boatClass=${encodeURIComponent(boatClass)}`
        : '/api/v1/lineup-templates';
      const response = await authenticatedFetch(url);
      const data = await response.json();
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
  const { authenticatedFetch, isAuthenticated, isInitialized, activeTeamId } =
    useAuthStore();

  return useQuery({
    queryKey: templateKeys.detail(templateId || ''),
    queryFn: async (): Promise<LineupTemplate> => {
      const response = await authenticatedFetch(`/api/v1/lineup-templates/${templateId}`);
      const data = await response.json();
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
  const { authenticatedFetch } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LineupTemplateInput): Promise<LineupTemplate> => {
      const response = await authenticatedFetch('/api/v1/lineup-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
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
  const { authenticatedFetch } = useAuthStore();
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
      const response = await authenticatedFetch('/api/v1/lineup-templates/from-lineup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineupId, name, isDefault }),
      });
      const result = await response.json();
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
  const { authenticatedFetch } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      data,
    }: {
      templateId: string;
      data: LineupTemplateUpdateInput;
    }): Promise<LineupTemplate> => {
      const response = await authenticatedFetch(`/api/v1/lineup-templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
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
  const { authenticatedFetch } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string): Promise<void> => {
      const response = await authenticatedFetch(`/api/v1/lineup-templates/${templateId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
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
  const { authenticatedFetch } = useAuthStore();

  return useMutation({
    mutationFn: async (templateId: string): Promise<AppliedTemplate> => {
      const response = await authenticatedFetch(`/api/v1/lineup-templates/${templateId}/apply`, {
        method: 'POST',
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed to apply template');
      return result.data;
    },
  });
}

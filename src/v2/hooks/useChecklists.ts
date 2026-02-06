import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import type { ChecklistTemplate, ChecklistTemplateFormData, RaceChecklist } from '../types/regatta';

const API_URL = import.meta.env.VITE_API_URL || '';

export const checklistKeys = {
  all: ['checklists'] as const,
  templates: () => [...checklistKeys.all, 'templates'] as const,
  raceChecklist: (raceId: string) => [...checklistKeys.all, 'race', raceId] as const,
  progress: (raceId: string) => [...checklistKeys.all, 'progress', raceId] as const,
};

// API Functions
async function fetchTemplates(token: string): Promise<ChecklistTemplate[]> {
  const res = await fetch(`${API_URL}/api/v1/regattas/checklists/templates`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch templates');
  const data = await res.json();
  return data.data.templates;
}

async function createTemplate(
  token: string,
  template: ChecklistTemplateFormData
): Promise<ChecklistTemplate> {
  const res = await fetch(`${API_URL}/api/v1/regattas/checklists/templates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(template),
  });
  if (!res.ok) throw new Error('Failed to create template');
  const data = await res.json();
  return data.data.template;
}

async function updateTemplate(
  token: string,
  templateId: string,
  updates: Partial<ChecklistTemplateFormData>
): Promise<ChecklistTemplate> {
  const res = await fetch(`${API_URL}/api/v1/regattas/checklists/templates/${templateId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update template');
  const data = await res.json();
  return data.data.template;
}

async function deleteTemplate(token: string, templateId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/regattas/checklists/templates/${templateId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete template');
}

async function fetchRaceChecklist(
  token: string,
  raceId: string
): Promise<RaceChecklist | null> {
  const res = await fetch(`${API_URL}/api/v1/regattas/races/${raceId}/checklist`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch checklist');
  const data = await res.json();
  return data.data.checklist;
}

async function fetchChecklistProgress(
  token: string,
  raceId: string
): Promise<{ total: number; completed: number; percentage: number }> {
  const res = await fetch(`${API_URL}/api/v1/regattas/races/${raceId}/checklist/progress`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch progress');
  const data = await res.json();
  return data.data.progress;
}

async function createRaceChecklist(
  token: string,
  raceId: string,
  templateId: string
): Promise<RaceChecklist> {
  const res = await fetch(`${API_URL}/api/v1/regattas/races/${raceId}/checklist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ templateId }),
  });
  if (!res.ok) throw new Error('Failed to create checklist');
  const data = await res.json();
  return data.data.checklist;
}

async function toggleChecklistItem(
  token: string,
  itemId: string,
  completed: boolean
): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/regattas/checklists/items/${itemId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ completed }),
  });
  if (!res.ok) throw new Error('Failed to update item');
}

// ============================================
// Template Hooks
// ============================================

/**
 * Fetch all checklist templates
 */
export function useChecklistTemplates() {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: checklistKeys.templates(),
    queryFn: () => fetchTemplates(accessToken!),
    enabled: !!accessToken,
    staleTime: 10 * 60 * 1000, // Templates rarely change
  });
}

/**
 * Create a new checklist template
 */
export function useCreateChecklistTemplate() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (template: ChecklistTemplateFormData) =>
      createTemplate(accessToken!, template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.templates() });
    },
  });
}

/**
 * Update an existing checklist template
 */
export function useUpdateChecklistTemplate() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      updates,
    }: {
      templateId: string;
      updates: Partial<ChecklistTemplateFormData>;
    }) => updateTemplate(accessToken!, templateId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.templates() });
    },
  });
}

/**
 * Delete a checklist template
 */
export function useDeleteChecklistTemplate() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => deleteTemplate(accessToken!, templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.templates() });
    },
  });
}

// ============================================
// Race Checklist Hooks
// ============================================

/**
 * Fetch checklist for a specific race
 */
export function useRaceChecklist(raceId: string | undefined) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: checklistKeys.raceChecklist(raceId!),
    queryFn: () => fetchRaceChecklist(accessToken!, raceId!),
    enabled: !!accessToken && !!raceId,
    staleTime: 30 * 1000, // 30 seconds - checklists update frequently during race day
  });
}

/**
 * Fetch checklist progress for a specific race
 */
export function useChecklistProgress(raceId: string | undefined) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: checklistKeys.progress(raceId!),
    queryFn: () => fetchChecklistProgress(accessToken!, raceId!),
    enabled: !!accessToken && !!raceId,
    staleTime: 30 * 1000,
  });
}

/**
 * Create a race checklist from a template
 */
export function useCreateRaceChecklist() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ raceId, templateId }: { raceId: string; templateId: string }) =>
      createRaceChecklist(accessToken!, raceId, templateId),
    onSuccess: (_, { raceId }) => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.raceChecklist(raceId) });
      queryClient.invalidateQueries({ queryKey: checklistKeys.progress(raceId) });
    },
  });
}

/**
 * Toggle a checklist item
 */
export function useToggleChecklistItem() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      completed,
      raceId,
    }: {
      itemId: string;
      completed: boolean;
      raceId: string;
    }) => toggleChecklistItem(accessToken!, itemId, completed),
    onSuccess: (_, { raceId }) => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.raceChecklist(raceId) });
      queryClient.invalidateQueries({ queryKey: checklistKeys.progress(raceId) });
    },
  });
}

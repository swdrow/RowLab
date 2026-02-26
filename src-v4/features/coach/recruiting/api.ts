/**
 * Recruiting API functions and query option factories.
 *
 * All endpoints hit the existing /api/v1/recruit-visits backend.
 * Query keys scoped under ['recruitVisits', ...] for cache invalidation.
 */
import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { RecruitVisit, CreateVisitInput, UpdateVisitInput, VisitFilters } from './types';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const recruitKeys = {
  all: ['recruitVisits'] as const,
  lists: () => [...recruitKeys.all, 'list'] as const,
  list: (filters?: VisitFilters) => [...recruitKeys.lists(), { filters }] as const,
  details: () => [...recruitKeys.all, 'detail'] as const,
  detail: (id: string) => [...recruitKeys.details(), id] as const,
};

// ---------------------------------------------------------------------------
// API functions -- reads
// ---------------------------------------------------------------------------

interface VisitsListResponse {
  visits: RecruitVisit[];
  total: number;
}

async function fetchVisits(filters: VisitFilters = {}): Promise<VisitsListResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);

  const url = `/api/v1/recruit-visits${params.toString() ? `?${params}` : ''}`;
  return apiClient.get<VisitsListResponse>(url);
}

async function fetchVisit(id: string): Promise<RecruitVisit> {
  const data = await apiClient.get<{ visit: RecruitVisit }>(`/api/v1/recruit-visits/${id}`);
  return data.visit;
}

// ---------------------------------------------------------------------------
// API functions -- mutations
// ---------------------------------------------------------------------------

export async function createVisit(input: CreateVisitInput): Promise<RecruitVisit> {
  const data = await apiClient.post<{ visit: RecruitVisit }>('/api/v1/recruit-visits', input);
  return data.visit;
}

export async function updateVisit(args: {
  id: string;
  input: UpdateVisitInput;
}): Promise<RecruitVisit> {
  const data = await apiClient.patch<{ visit: RecruitVisit }>(
    `/api/v1/recruit-visits/${args.id}`,
    args.input
  );
  return data.visit;
}

export async function deleteVisit(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/recruit-visits/${id}`);
}

// ---------------------------------------------------------------------------
// Query option factories
// ---------------------------------------------------------------------------

export function recruitVisitsOptions(filters: VisitFilters = {}) {
  return queryOptions<VisitsListResponse>({
    queryKey: recruitKeys.list(filters),
    queryFn: () => fetchVisits(filters),
    staleTime: 120_000,
  });
}

export function visitDetailOptions(id: string) {
  return queryOptions<RecruitVisit>({
    queryKey: recruitKeys.detail(id),
    queryFn: () => fetchVisit(id),
    staleTime: 120_000,
    enabled: !!id,
  });
}

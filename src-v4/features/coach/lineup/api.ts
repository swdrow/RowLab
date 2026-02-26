/**
 * Lineup API functions and query option factories.
 *
 * Query keys follow ['lineup', teamId, ...] structure for easy invalidation.
 * Uses the v1 lineup API at /api/v1/lineups (team-scoped via auth header).
 * Mutations return React Query useMutation hooks with cache invalidation.
 */
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Lineup, SaveLineupInput, UpdateLineupInput, DuplicateLineupInput } from './types';

// ---------------------------------------------------------------------------
// Query key factory (team-scoped)
// ---------------------------------------------------------------------------

export const lineupKeys = {
  all: (teamId: string) => ['lineup', teamId] as const,
  list: (teamId: string) => ['lineup', teamId, 'list'] as const,
  detail: (teamId: string, lineupId: string) => ['lineup', teamId, 'detail', lineupId] as const,
};

// ---------------------------------------------------------------------------
// API functions -- reads
// ---------------------------------------------------------------------------

async function fetchLineups(teamId: string): Promise<Lineup[]> {
  const res = await api.get('/api/v1/lineups', {
    params: { includeAssignments: 'true' },
  });
  const lineups = res.data.data.lineups as Lineup[];
  // Normalize: ensure assignments is always an array (API may return null)
  return lineups.map((l) => ({
    ...l,
    assignments: l.assignments || [],
    teamId: l.teamId || teamId,
  }));
}

async function fetchLineupDetail(_teamId: string, lineupId: string): Promise<Lineup> {
  const res = await api.get(`/api/v1/lineups/${lineupId}`);
  const lineup = res.data.data.lineup as Lineup;
  return { ...lineup, assignments: lineup.assignments || [] };
}

// ---------------------------------------------------------------------------
// API functions -- mutations
// ---------------------------------------------------------------------------

async function saveLineup(input: SaveLineupInput): Promise<Lineup> {
  const res = await api.post('/api/v1/lineups', input);
  return res.data.data.lineup as Lineup;
}

async function updateLineup(input: UpdateLineupInput & { id: string }): Promise<Lineup> {
  const { id, ...data } = input;
  const res = await api.patch(`/api/v1/lineups/${id}`, data);
  return res.data.data.lineup as Lineup;
}

async function deleteLineup(id: string): Promise<void> {
  await api.delete(`/api/v1/lineups/${id}`);
}

async function duplicateLineup(input: DuplicateLineupInput & { id: string }): Promise<Lineup> {
  const { id, name } = input;
  const res = await api.post(`/api/v1/lineups/${id}/duplicate`, { name });
  return res.data.data.lineup as Lineup;
}

// ---------------------------------------------------------------------------
// Query option factories
// ---------------------------------------------------------------------------

export function lineupsOptions(teamId: string) {
  return queryOptions<Lineup[]>({
    queryKey: lineupKeys.list(teamId),
    queryFn: () => fetchLineups(teamId),
    staleTime: 120_000,
    enabled: !!teamId,
  });
}

export function lineupDetailOptions(teamId: string, lineupId: string) {
  return queryOptions<Lineup>({
    queryKey: lineupKeys.detail(teamId, lineupId),
    queryFn: () => fetchLineupDetail(teamId, lineupId),
    staleTime: 120_000,
    enabled: !!teamId && !!lineupId,
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

export function useSaveLineup(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveLineup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lineupKeys.all(teamId) });
    },
  });
}

export function useUpdateLineup(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLineup,
    onSuccess: (updated) => {
      // Update the detail cache optimistically
      queryClient.setQueryData(lineupKeys.detail(teamId, updated.id), updated);
      queryClient.invalidateQueries({ queryKey: lineupKeys.all(teamId) });
    },
  });
}

export function useDeleteLineup(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLineup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lineupKeys.all(teamId) });
    },
  });
}

export function useDuplicateLineup(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicateLineup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lineupKeys.all(teamId) });
    },
  });
}
